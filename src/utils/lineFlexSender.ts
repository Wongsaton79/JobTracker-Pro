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

/**
 * Direct Send LINE Flex Message to LINE Messaging API
 * 1. Ensures all job photos are uploaded to public CDN HTTPS URLs
 * 2. Builds LINE Flex Bubble with exact coordinates, status, price, phone, and real photos
 * 3. Sends via server proxy or direct LINE Messaging API endpoint
 */
export async function sendLineFlexDirect(
  job: JobItem,
  options?: Partial<SendLineFlexOptions>
): Promise<{ success: boolean; message: string; data?: any; job?: JobItem }> {
  try {
    // 1. Convert any base64 photo to public HTTPS CDN url first
    const processedJob = await ensureJobPhotosPublicUrls(job);

    const token =
      options?.channelAccessToken ||
      DEFAULT_LINE_CONFIG.channelAccessToken;
    const target =
      options?.targetId ||
      DEFAULT_LINE_CONFIG.targetGroupId;
    const company =
      options?.companyName ||
      DEFAULT_LINE_CONFIG.companyName;
    const label =
      options?.eventLabel ||
      '📋 รายงานข้อมูลงานหน้างาน';

    // 2. Try sending through Express backend proxy (/api/sync/send-line)
    try {
      const response = await fetch('/api/sync/send-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: processedJob,
          targetId: target,
          channelAccessToken: token,
          companyName: company,
          eventLabel: label,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          return {
            success: true,
            message: json.message || 'ส่ง LINE Flex Message เรียบร้อยแล้ว',
            data: json,
            job: processedJob,
          };
        }
      }
    } catch (serverErr) {
      console.warn('Backend LINE proxy fetch failed, attempting client direct push...', serverErr);
    }

    // 3. Fallback direct client push to LINE Messaging API
    const flexPayload = buildLineFlexMessage(processedJob, company);

    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: target,
        messages: [flexPayload],
      }),
    });

    if (lineResponse.ok) {
      return {
        success: true,
        message: 'ส่ง LINE Flex Message สำเร็จเรียบร้อย!',
        job: processedJob,
      };
    } else {
      const errText = await lineResponse.text();
      return {
        success: false,
        message: `LINE API Error: ${errText || lineResponse.statusText}`,
        job: processedJob,
      };
    }
  } catch (err: any) {
    console.error('sendLineFlexDirect error:', err);
    return {
      success: false,
      message: `ไม่สามารถส่ง LINE ได้: ${err.message || err}`,
    };
  }
}
