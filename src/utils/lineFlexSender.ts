import { JobItem } from '../types';
import { buildLineFlexMessage } from './lineFlexBuilder';
import { ensureJobPhotosPublicUrls } from './imageCdn';
import { saveNotificationToFirebase } from './firebaseSync';

export interface SendLineFlexOptions {
  targetId: string;
  channelAccessToken?: string;
  companyName?: string;
  eventLabel?: string;
  relayUrl?: string; // Cloudflare Worker or custom backend relay URL
}

export const DEFAULT_LINE_CONFIG = {
  channelAccessToken:
    'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
  targetGroupId: 'C341417bcb6e853c320eaf9d80963cda3',
  targetUserId: 'U54fd541a6cf7746b1b4f0219634c7a53',
  companyName: 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
};

/**
 * Checks if the current environment is a static hosting platform (e.g. GitHub Pages)
 */
export function isStaticHosting(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('github.io') || host.includes('pages.dev') || host.includes('surge.sh') || window.location.protocol === 'file:';
}

/**
 * Send LINE Flex Message to LINE Messaging API
 * 1. Ensures job photos are converted to public HTTPS URLs
 * 2. Queues notification in Firebase Firestore ("line_notifications" collection)
 * 3. Dispatches message via configured Relay URL (Cloudflare Worker / Backend Server)
 */
export async function sendLineFlexDirect(
  job: JobItem,
  options?: Partial<SendLineFlexOptions>
): Promise<{ success: boolean; message: string; data?: any; job?: JobItem }> {
  try {
    // 1. Process photos
    const processedJob = await ensureJobPhotosPublicUrls(job);

    const token = (options?.channelAccessToken || DEFAULT_LINE_CONFIG.channelAccessToken).trim();
    const target = (options?.targetId || DEFAULT_LINE_CONFIG.targetGroupId).trim();
    const company = (options?.companyName || DEFAULT_LINE_CONFIG.companyName).trim();
    const label = (options?.eventLabel || '📋 รายงานข้อมูลงานหน้างาน').trim();
    const customRelay = (options?.relayUrl || '').trim();

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

    // Build the Flex message payload
    const flexMessage = buildLineFlexMessage(processedJob, company, label);

    // 2. Queue in Firebase Firestore "line_notifications" collection
    // This serves as an audit trail and triggers any Firebase Cloud Functions
    await saveNotificationToFirebase({
      jobId: processedJob.id,
      jobCode: processedJob.jobCode,
      jobTitle: processedJob.title,
      eventLabel: label,
      targetId: target,
      companyName: company,
      status: 'pending',
      payload: flexMessage,
    });

    const payload = {
      job: processedJob,
      targetId: target,
      channelAccessToken: token,
      companyName: company,
      eventLabel: label,
      payload: flexMessage,
      messages: [flexMessage],
      clientOrigin: typeof window !== 'undefined' ? window.location.origin : '',
    };

    // 3. Collect endpoints to try
    const endpoints: string[] = [];

    // Priority A: Custom Relay / Cloudflare Worker / Server URL specified by user
    if (customRelay && customRelay.startsWith('http')) {
      endpoints.push(customRelay);
    }

    // Priority B: Local server endpoint (active in development, container preview, or custom server hosting)
    if (!isStaticHosting()) {
      endpoints.push('/api/sync/send-line');
      if (typeof window !== 'undefined' && window.location.origin) {
        endpoints.push(`${window.location.origin}/api/sync/send-line`);
      }
    }

    let lastErrorMessage = '';

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let json: any = null;
        try {
          json = JSON.parse(responseText);
        } catch {
          // Non-JSON response (e.g., HTML 404 on static hosting)
          continue;
        }

        // Check if successful
        if (response.ok) {
          return {
            success: true,
            message: json?.message || 'ส่ง LINE Flex Message เข้ากลุ่มเรียบร้อยแล้ว',
            data: json,
            job: processedJob,
          };
        }

        if (json?.error || json?.message) {
          lastErrorMessage = formatLineApiError(json.error || json.message);
          return {
            success: false,
            message: lastErrorMessage,
            data: json,
            job: processedJob,
          };
        }
      } catch (endpointErr: any) {
        lastErrorMessage = endpointErr?.message || String(endpointErr);
      }
    }

    // 4. If on GitHub Pages without a Relay URL
    if (isStaticHosting() && !customRelay) {
      return {
        success: true, // Data is safely recorded in Firebase Firestore
        message:
          'บันทึกข้อมูลและเข้าคิวแจ้งเตือนใน Firebase แล้ว ✅ (เนื่องจากรันบน GitHub Pages หากต้องการส่งข้อความเข้า LINE กรุณาระบุ Cloudflare Worker URL ในหน้าตั้งค่า LINE)',
        job: processedJob,
      };
    }

    return {
      success: false,
      message: lastErrorMessage
        ? `ไม่สามารถส่ง LINE ได้: ${lastErrorMessage}`
        : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ กรุณาตรวจสอบ Channel Access Token, Group ID หรือใส่ LINE Relay URL ในหน้าตั้งค่า',
      job: processedJob,
    };
  } catch (err: any) {
    console.error('sendLineFlexDirect error:', err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    };
  }
}

/**
 * Test LINE Bot connection directly via Relay or Server
 */
export async function testLineConnectionDirect(options: {
  targetId: string;
  channelAccessToken?: string;
  companyName?: string;
  relayUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const token = (options.channelAccessToken || DEFAULT_LINE_CONFIG.channelAccessToken).trim();
  const target = (options.targetId || DEFAULT_LINE_CONFIG.targetGroupId).trim();
  const company = (options.companyName || DEFAULT_LINE_CONFIG.companyName).trim();
  const customRelay = (options.relayUrl || '').trim();

  if (!token) {
    return { success: false, message: 'กรุณากรอก LINE Channel Access Token ในหน้าตั้งค่า' };
  }
  if (!target) {
    return { success: false, message: 'กรุณากรอก LINE Group ID หรือ User ID' };
  }

  // 1. Try Custom Relay URL first if provided
  if (customRelay && customRelay.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const testPayload = {
        targetId: target,
        to: target,
        channelAccessToken: token,
        companyName: company,
        messages: [
          {
            type: 'text',
            text: `🧪 [${company}]\nทดสอบการเชื่อมต่อระบบ LINE Bot ผ่าน Relay สำเร็จแล้ว!\n⏰ เวลา: ${new Date().toLocaleTimeString('th-TH')}`,
          },
        ],
      };

      const res = await fetch(customRelay, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (res.ok) {
        return {
          success: true,
          message: '✅ ทดสอบเชื่อมต่อผ่าน Relay สำเร็จ! ข้อความทดสอบถูกส่งเข้ากลุ่ม LINE เรียบร้อยแล้ว',
        };
      } else {
        return {
          success: false,
          message: formatLineApiError(data?.error || data?.message || text),
        };
      }
    } catch (relayErr: any) {
      return {
        success: false,
        message: `ไม่สามารถเชื่อมต่อ Relay URL (${customRelay}): ${relayErr.message || relayErr}`,
      };
    }
  }

  // 2. Try local server test endpoint (active in dev/preview)
  if (!isStaticHosting()) {
    const endpoints = ['/api/sync/test-line'];
    if (typeof window !== 'undefined' && window.location.origin) {
      endpoints.push(`${window.location.origin}/api/sync/test-line`);
    }

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ targetId: target, channelAccessToken: token, companyName: company }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          continue;
        }

        if (data && data.success) {
          return {
            success: true,
            message: data.message || 'ทดสอบเชื่อมต่อ LINE สำเร็จ ข้อความถูกส่งเข้ากลุ่มแล้ว!',
          };
        } else if (data && (data.error || data.message)) {
          return {
            success: false,
            message: formatLineApiError(data.error || data.message),
          };
        }
      } catch {
        // Try next endpoint
      }
    }
  }

  // 3. If running on GitHub Pages and no Relay URL is configured
  if (isStaticHosting()) {
    return {
      success: false,
      message:
        'เว็บไซต์นี้ทำงานอยู่บน GitHub Pages (Static Hosting) เบราว์เซอร์ไม่สามารถเรียก LINE API โดยตรงได้เนื่องจากนโยบาย CORS กรุณาระบุ Cloudflare Worker URL หรือ Backend Relay URL ในช่อง "LINE Relay / Proxy URL" ด้านล่างนี้ (คัดลอกโค้ดฟรีได้ในแท็บคู่มือ)',
    };
  }

  return {
    success: false,
    message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ กรุณาตรวจสอบว่าบอทอยู่ในกลุ่ม และ Channel Access Token ถูกต้อง',
  };
}

/**
 * Formats LINE API error responses into user-friendly Thai explanations
 */
export function formatLineApiError(rawError: any): string {
  if (!rawError) return 'เกิดข้อผิดพลาดในการส่งข้อความ LINE';
  try {
    const parsed = typeof rawError === 'string' ? JSON.parse(rawError) : rawError;
    const msg = parsed?.message || parsed?.error || (typeof rawError === 'string' ? rawError : JSON.stringify(rawError));

    if (
      msg.includes('Invalid reply token') ||
      msg.includes('authentication failed') ||
      msg.includes('401') ||
      msg.includes('Unauthorized')
    ) {
      return 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401 Unauthorized) กรุณาตรวจสอบหรือ Issue Token ใหม่ใน LINE Developers Console';
    }
    if (msg.includes("The property, 'to', in the request body is invalid") || msg.includes('Failed to send message')) {
      return 'Group ID หรือ User ID ไม่ถูกต้อง หรือ LINE Bot ยังไม่ได้ถูกเชิญเข้าร่วมกลุ่ม (400 Bad Request)';
    }
    if (msg.includes('Not found') || msg.includes('404')) {
      return 'ไม่พบห้องหรือผู้รับ (Group ID ไม่ถูกต้อง หรือ Bot ถูกเตะออกจากกลุ่มแล้ว)';
    }
    if (msg.includes('quota') || msg.includes('429')) {
      return 'ส่งข้อความเกินโควตาฟรีประจำเดือนของ LINE Official Account (429 Rate Limit)';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ (Network Error: ติด CORS หรือเซิร์ฟเวอร์ไม่ตอบสนอง)';
    }
    return `LINE API ตอบกลับ: ${msg}`;
  } catch {
    const str = String(rawError);
    if (str.includes('<html') || str.includes('<!DOCTYPE')) {
      return 'เซิร์ฟเวอร์ตอบกลับเป็นหน้าเว็บแทนที่จะเป็น API (กรุณาใช้ Cloudflare Worker หรือเปิดผ่านเซิร์ฟเวอร์)';
    }
    if (str.includes('401')) return 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401)';
    if (str.includes('400')) return 'Group ID ไม่ถูกต้อง หรือ LINE Bot ยังไม่ได้ถูกเชิญเข้าร่วมกลุ่ม (400)';
    return `LINE API: ${str}`;
  }
}
