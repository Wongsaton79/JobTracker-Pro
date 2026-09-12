import { JobItem } from '../types';
import { buildLineFlexMessage } from './lineFlexBuilder';
import { ensureJobPhotosPublicUrls } from './imageCdn';

export interface SendLineFlexOptions {
  targetId: string;
  channelAccessToken?: string;
  companyName?: string;
  eventLabel?: string;
}

export const DEFAULT_LINE_CONFIG = {
  channelAccessToken:
    'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
  targetGroupId: 'C341417bcb6e853c320eaf9d80963cda3',
  targetUserId: 'U54fd541a6cf7746b1b4f0219634c7a53',
  companyName: 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
};

// List of backend relay endpoints to bypass browser CORS on LINE API
const RELAY_ENDPOINTS = [
  // 1. Local / Relative endpoint
  '/api/sync/send-line',
  // 2. Production Cloud Run backend
  'https://ais-pre-d2ekaehnc7t3li2cc3z2pg-941526555561.asia-southeast1.run.app/api/sync/send-line',
  // 3. Dev Cloud Run backend
  'https://ais-dev-d2ekaehnc7t3li2cc3z2pg-941526555561.asia-southeast1.run.app/api/sync/send-line',
];

/**
 * Direct Send LINE Flex Message to LINE Messaging API
 * 1. Ensures all job photos are uploaded to public CDN HTTPS URLs
 * 2. Sends via resilient multi-tier backend proxy to bypass browser CORS restrictions
 * 3. Supports fallbacks and clean error diagnostics
 */
export async function sendLineFlexDirect(
  job: JobItem,
  options?: Partial<SendLineFlexOptions>
): Promise<{ success: boolean; message: string; data?: any; job?: JobItem }> {
  try {
    // 1. Convert any base64 photo to public HTTPS CDN url first
    const processedJob = await ensureJobPhotosPublicUrls(job);

    const token = (options?.channelAccessToken || DEFAULT_LINE_CONFIG.channelAccessToken).trim();
    const target = (options?.targetId || DEFAULT_LINE_CONFIG.targetGroupId).trim();
    const company = (options?.companyName || DEFAULT_LINE_CONFIG.companyName).trim();
    const label = (options?.eventLabel || '📋 รายงานข้อมูลงานหน้างาน').trim();

    if (!token) {
      return {
        success: false,
        message: 'กรุณากรอก LINE Channel Access Token ในหน้าตั้งค่า',
        job: processedJob,
      };
    }

    if (!target) {
      return {
        success: false,
        message: 'กรุณากรอก LINE Group ID หรือ User ID ในหน้าตั้งค่า',
        job: processedJob,
      };
    }

    const payload = {
      job: processedJob,
      targetId: target,
      channelAccessToken: token,
      companyName: company,
      eventLabel: label,
      clientOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    };

    // 2. Multi-tier proxy dispatch (Bypasses browser CORS on api.line.me)
    for (const endpoint of RELAY_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            return {
              success: true,
              message: json.message || 'ส่ง LINE Flex Message เรียบร้อยแล้ว',
              data: json,
              job: processedJob,
            };
          } else if (json.error) {
            // LINE API specific error returned from backend
            return {
              success: false,
              message: formatLineApiError(json.error),
              data: json,
              job: processedJob,
            };
          }
        }
      } catch (endpointErr) {
        console.warn(`Relay endpoint ${endpoint} failed, trying next...`, endpointErr);
      }
    }

    // 3. Fallback: Public CORS Bridge for pure static deployments
    try {
      const flexPayload = buildLineFlexMessage(processedJob, company);
      const lineBody = JSON.stringify({
        to: target,
        messages: [flexPayload],
      });

      const corsProxyUrl = `https://corsproxy.io/?url=${encodeURIComponent('https://api.line.me/v2/bot/message/push')}`;
      const proxyRes = await fetch(corsProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: lineBody,
      });

      if (proxyRes.ok) {
        return {
          success: true,
          message: 'ส่ง LINE Flex Message สำเร็จเรียบร้อย!',
          job: processedJob,
        };
      } else {
        const errText = await proxyRes.text();
        return {
          success: false,
          message: formatLineApiError(errText || proxyRes.statusText),
          job: processedJob,
        };
      }
    } catch (corsErr: any) {
      console.warn('CORS bridge fallback failed:', corsErr);
    }

    return {
      success: false,
      message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      job: processedJob,
    };
  } catch (err: any) {
    console.error('sendLineFlexDirect critical error:', err);
    return {
      success: false,
      message: `ไม่สามารถส่ง LINE ได้: ${err.message || err}`,
    };
  }
}

/**
 * Formats LINE API error responses into user-friendly Thai explanations
 */
function formatLineApiError(rawError: string): string {
  try {
    const parsed = typeof rawError === 'string' ? JSON.parse(rawError) : rawError;
    const msg = parsed?.message || rawError;

    if (msg.includes('Invalid reply token') || msg.includes('authentication failed') || msg.includes('401')) {
      return 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401 Unauthorized)';
    }
    if (msg.includes('Failed to send message') || msg.includes('400')) {
      return 'รูปแบบข้อความ Flex หรือ Group ID ไม่ถูกต้อง กรุณาเชิญบอทเข้ากลุ่มก่อนส่ง';
    }
    if (msg.includes('Not found') || msg.includes('404')) {
      return 'ไม่พบห้องหรือผู้รับ (Group/User ID ไม่ถูกต้อง หรือยังไม่ได้เชิญ Bot เข้ากลุ่ม)';
    }
    return `LINE API ตอบกลับ: ${msg}`;
  } catch {
    if (rawError.includes('401')) return 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ';
    if (rawError.includes('400')) return 'ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบว่าเชิญบอทเข้ากลุ่มแล้วหรือยัง';
    return `LINE API: ${rawError}`;
  }
}
