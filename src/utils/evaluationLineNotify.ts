import { SalesEvaluation, SyncSettings } from '../types';
import { formatChannelText, formatPriceComparisonLabel } from './evaluationCalculator';

export async function sendEvaluationToLine(
  evaluation: SalesEvaluation,
  settings: SyncSettings
): Promise<{ success: boolean; message: string }> {
  try {
    const token = settings.lineChannelAccessToken;
    const targetId = settings.lineTargetGroupId || settings.lineTargetUserId;

    if (!token || !targetId) {
      return {
        success: false,
        message: 'กรุณาตั้งค่า LINE Channel Access Token และ Target ID ในเมนูตั้งค่าก่อน',
      };
    }

    const priceInfo = formatPriceComparisonLabel(evaluation.feedbackPriceAndPromo);
    const channelText = formatChannelText(evaluation.contactChannel);

    // Flex Bubble payload
    const flexBubble = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '⭐ แบบประเมินความพึงพอใจการทำงานของทีมขาย',
            color: '#ffffff',
            weight: 'bold',
            size: 'md',
            wrap: true,
          },
          {
            type: 'text',
            text: `${settings.companyName || 'JobTracker Pro'} • รหัส ${evaluation.evaluationCode}`,
            color: '#a7f3d0',
            size: 'xs',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          // Score Highlight Box (เต็ม 20 คะแนน)
          {
            type: 'box',
            layout: 'horizontal',
            backgroundColor: '#ecfdf5',
            cornerRadius: 'md',
            paddingAll: '12px',
            alignItems: 'center',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'คะแนนการประเมิน (เต็ม 20 คะแนน)',
                    size: 'xs',
                    color: '#065f46',
                  },
                  {
                    type: 'text',
                    text: `${evaluation.scoreOutOf20} / 20.00 (${evaluation.percentageScore}%)`,
                    size: 'xl',
                    weight: 'bold',
                    color: '#047857',
                  },
                  {
                    type: 'text',
                    text: `คะแนนดิบ 3 หมวด: ${evaluation.rawTotalScore} / 30 คะแนน`,
                    size: 'xxs',
                    color: '#059669',
                  },
                ],
              },
              {
                type: 'text',
                text: evaluation.gradeLabel.split(' ')[0] || 'ดีมาก',
                size: 'xs',
                color: '#ffffff',
                weight: 'bold',
                align: 'center',
                gravity: 'center',
                backgroundColor: '#10b981',
                cornerRadius: 'xxl',
                paddingAll: '4px',
              },
            ],
          },
          // Section Breakdown
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            backgroundColor: '#f8fafc',
            cornerRadius: 'sm',
            paddingAll: '8px',
            contents: [
              {
                type: 'text',
                text: `1. การสื่อสารและการบริการ: ${evaluation.section1Score} / 20 คะแนน`,
                size: 'xxs',
                color: '#334155',
              },
              {
                type: 'text',
                text: `2. การรับผิดชอบในหน้าที่: ${evaluation.section2Score} / 5 คะแนน`,
                size: 'xxs',
                color: '#334155',
              },
              {
                type: 'text',
                text: `3. ความประทับใจ: ${evaluation.section3Score} / 5 คะแนน`,
                size: 'xxs',
                color: '#334155',
              },
            ],
          },
          // Key details
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'พนักงานขาย:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: evaluation.salesRepName, size: 'xs', weight: 'bold', color: '#0f172a', flex: 6 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ร้านค้า/ลูกค้า:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: evaluation.customerName, size: 'xs', weight: 'bold', color: '#0f172a', flex: 6, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ช่องทางให้ข้อมูล:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: channelText, size: 'xs', color: '#334155', flex: 6 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ราคากับคู่แข่ง:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: priceInfo.label, size: 'xs', weight: 'bold', color: '#0f172a', flex: 6 },
                ],
              },
            ],
          },
          // Additional Feedback note
          evaluation.additionalFeedback
            ? {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#fffbeb',
                cornerRadius: 'sm',
                paddingAll: '8px',
                contents: [
                  { type: 'text', text: '💬 ข้อเสนอแนะเพิ่มเติม:', size: 'xxs', color: '#92400e', weight: 'bold' },
                  { type: 'text', text: evaluation.additionalFeedback, size: 'xs', color: '#78350f', wrap: true },
                ],
              }
            : { type: 'separator' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: `ผู้ให้ข้อมูล: ${evaluation.evaluatorName || 'ร้านค้า'} • 100% Digital Paperless`,
            size: 'xxs',
            color: '#94a3b8',
            align: 'center',
          },
        ],
      },
    };

    const flexPayload = {
      type: 'flex',
      altText: `⭐ ผลการประเมินทีมขาย: ${evaluation.salesRepName} (${evaluation.scoreOutOf20}/20 คะแนน)`,
      contents: flexBubble,
    };

    const endpoint = settings.lineRelayUrl?.trim() || '/api/line-relay';
    const body = {
      channelAccessToken: token,
      to: targetId,
      targetId: targetId,
      messages: [flexPayload],
      payload: [flexPayload],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        message: `ส่ง LINE ไม่สำเร็จ (${response.status}): ${errText}`,
      };
    }

    return {
      success: true,
      message: `ส่งผลการประเมินรหัส ${evaluation.evaluationCode} (${evaluation.scoreOutOf20}/20 คะแนน) เข้า LINE เรียบร้อยแล้ว`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    };
  }
}
