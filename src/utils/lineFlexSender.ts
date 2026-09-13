import { JobItem } from '../types';
import { buildLineFlexMessage } from './lineFlexBuilder';
import { ensureJobPhotosPublicUrls } from './imageCdn';

export interface SendLineFlexOptions {
  targetId: string;
  channelAccessToken?: string;
  companyName?: string;
  eventLabel?: string;
  googleSheetUrl?: string;
}

export const DEFAULT_LINE_CONFIG = {
  channelAccessToken:
    'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
  targetGroupId: 'C341417bcb6e853c320eaf9d80963cda3',
  targetUserId: 'U54fd541a6cf7746b1b4f0219634c7a53',
  companyName: 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
};

/**
 * Direct Send LINE Flex Message to LINE Messaging API
 * 1. Ensures all job photos are converted to public HTTPS URLs
 * 2. Uses robust relay endpoints with credentials: 'include'
 * 3. Falls back to Google Apps Script Web App if provided
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

    // 2. Try Node.js Express server endpoints first
    const endpoints: string[] = ['/api/sync/send-line'];
    if (typeof window !== 'undefined' && window.location.origin) {
      endpoints.push(`${window.location.origin}/api/sync/send-line`);
    }

    let lastErrorMessage = '';

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let json: any = null;
        try {
          json = JSON.parse(responseText);
        } catch {
          // Response is not JSON (HTML error or redirect)
          continue;
        }

        if (response.ok && json?.success) {
          return {
            success: true,
            message: json.message || 'ส่ง LINE Flex Message เรียบร้อยแล้ว',
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

    // 3. Fallback: Dispatch via Google Apps Script Web App (if provided)
    const webAppUrl = (options?.googleSheetUrl || '').trim();
    if (webAppUrl && webAppUrl.startsWith('http')) {
      try {
        await fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'send_line',
            job: processedJob,
            targetId: target,
            channelAccessToken: token,
            companyName: company,
            eventLabel: label,
            sendLine: true,
          }),
        });

        return {
          success: true,
          message: 'ส่ง LINE Flex Message เข้ากลุ่มผ่าน Google Apps Script สำเร็จเรียบร้อย!',
          job: processedJob,
        };
      } catch (gasErr: any) {
        console.warn('Apps Script fallback sendLine failed:', gasErr);
      }
    }

    return {
      success: false,
      message: lastErrorMessage
        ? `ไม่สามารถส่ง LINE ได้: ${lastErrorMessage}`
        : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ กรุณาตรวจสอบ Channel Access Token, Group ID หรือระบุ Google Apps Script Web App URL ในหน้าตั้งค่า',
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
 * Test LINE Bot connection directly via backend server or Apps Script
 */
export async function testLineConnectionDirect(options: {
  targetId: string;
  channelAccessToken?: string;
  companyName?: string;
  googleSheetUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const token = (options.channelAccessToken || DEFAULT_LINE_CONFIG.channelAccessToken).trim();
  const target = (options.targetId || DEFAULT_LINE_CONFIG.targetGroupId).trim();
  const company = (options.companyName || DEFAULT_LINE_CONFIG.companyName).trim();

  if (!token) {
    return { success: false, message: 'กรุณากรอก LINE Channel Access Token ในหน้าตั้งค่า' };
  }
  if (!target) {
    return { success: false, message: 'กรุณากรอก LINE Group ID หรือ User ID' };
  }

  // 1. Try local server test endpoint with credentials: 'include'
  const endpoints = ['/api/sync/test-line'];
  if (typeof window !== 'undefined' && window.location.origin) {
    endpoints.push(`${window.location.origin}/api/sync/test-line`);
  }

  let serverFailure = '';

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
        credentials: 'include',
        body: JSON.stringify({ targetId: target, channelAccessToken: token, companyName: company }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON (HTML from redirect or gateway)
        serverFailure = `เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (HTTP ${res.status})`;
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
    } catch (err: any) {
      serverFailure = err?.message || String(err);
    }
  }

  // 2. Fallback via Google Apps Script Web App (if provided)
  const webAppUrl = (options.googleSheetUrl || '').trim();
  if (webAppUrl && webAppUrl.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'test_connection',
          targetId: target,
          channelAccessToken: token,
          companyName: company,
          sendLine: true,
          job: {
            jobCode: `TEST-${Date.now().toString().slice(-4)}`,
            title: 'ทดสอบการเชื่อมต่อระบบ LINE Bot',
            status: 'in_progress',
            contactPerson: 'ระบบทดสอบอัตโนมัติ',
            phoneNumber: '081-234-5678',
            productBrand: 'JobTracker',
            productDetails: 'ทดสอบการส่งการแจ้งเตือน LINE Bot สำเร็จ',
            price: 0,
            paymentType: 'ทดสอบระบบ',
            location: { address: 'กรุงเทพมหานคร' },
            date: new Date().toISOString().substring(0, 10),
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return {
        success: true,
        message: 'ส่งคำสั่งทดสอบไปยัง LINE ผ่าน Google Apps Script เรียบร้อยแล้ว! (กรุณาตรวจดูข้อความในกลุ่ม LINE)',
      };
    } catch (gasErr: any) {
      console.warn('Fallback test via Google Apps Script failed:', gasErr);
    }
  }

  // 3. Clear and friendly error message
  return {
    success: false,
    message: serverFailure
      ? `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้: ${serverFailure} (หากเปิดใน iFrame Preview แนะนำเปิดแอปในแท็บใหม่ หรือกรอก Google Apps Script Web App URL ในหน้าตั้งค่า)`
      : 'ไม่สามารถส่งข้อความทดสอบ LINE ได้ กรุณาตรวจสอบว่าบอทอยู่ในกลุ่ม และ Channel Access Token ถูกต้อง',
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
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่ง LINE ได้ (Network Error) กรุณาตรวจสอบอินเทอร์เน็ตหรือเปิดแอปในแท็บใหม่';
    }
    return `LINE API ตอบกลับ: ${msg}`;
  } catch {
    const str = String(rawError);
    if (str.includes('<html') || str.includes('<!DOCTYPE')) {
      return 'เซิร์ฟเวอร์ตอบกลับเป็นหน้าเว็บแทนที่จะเป็น API (กรุณารีเฟรชหน้าเว็บหรือเปิดในแท็บใหม่)';
    }
    if (str.includes('401')) return 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (401)';
    if (str.includes('400')) return 'Group ID ไม่ถูกต้อง หรือ LINE Bot ยังไม่ได้ถูกเชิญเข้าร่วมกลุ่ม (400)';
    return `LINE API: ${str}`;
  }
}
