import { SalesEvaluation, SyncSettings } from '../types';
import { formatChannelLabel, formatPriceComparisonLabel, formatFutureIntent } from './evaluationCalculator';

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

    const priceInfo = formatPriceComparisonLabel(evaluation.overallPriceComparison);
    const intentInfo = formatFutureIntent(evaluation.futurePurchaseIntent);
    const channelText = formatChannelLabel(evaluation.contactChannel);

    // Flex Bubble payload
    const flexBubble = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669', // Emerald
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '⭐ แบบประเมินความพึงพอใจทีมขาย',
            color: '#ffffff',
            weight: 'bold',
            size: 'md',
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
          // Score Highlight Box
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
                    text: 'คะแนนความพึงพอใจ',
                    size: 'xs',
                    color: '#065f46',
                  },
                  {
                    type: 'text',
                    text: `${evaluation.averageScore} / 5.0 (${evaluation.percentageScore}%)`,
                    size: 'lg',
                    weight: 'bold',
                    color: '#047857',
                  },
                ],
              },
              {
                type: 'text',
                text: evaluation.gradeLabel.split(' ')[0] || 'ยอดเยี่ยม',
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
                  { type: 'text', text: 'ลูกค้า/ร้านค้า:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: evaluation.customerName, size: 'xs', weight: 'bold', color: '#0f172a', flex: 6, wrap: true },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'วันที่ประเมิน:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: evaluation.date, size: 'xs', color: '#334155', flex: 6 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ช่องทางเข้าพบ:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: channelText, size: 'xs', color: '#334155', flex: 6 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ระดับราคาตลาด:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: priceInfo.label, size: 'xs', weight: 'bold', color: '#0f172a', flex: 6 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'การสั่งซื้อต่อไป:', size: 'xs', color: '#64748b', flex: 3 },
                  { type: 'text', text: intentInfo.label, size: 'xs', color: '#0f172a', flex: 6, wrap: true },
                ],
              },
            ],
          },
          // Feedback comment if any
          evaluation.strengthsFeedback
            ? {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#f8fafc',
                cornerRadius: 'sm',
                paddingAll: '8px',
                contents: [
                  { type: 'text', text: '💬 สิ่งที่ประทับใจ:', size: 'xxs', color: '#64748b', weight: 'bold' },
                  { type: 'text', text: evaluation.strengthsFeedback, size: 'xs', color: '#334155', wrap: true },
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
            text: `ผู้ประเมิน: ${evaluation.evaluatorName || 'ลูกค้า'} • ลดการใช้กระดาษ (Digital 100%)`,
            size: 'xxs',
            color: '#94a3b8',
            align: 'center',
          },
        ],
      },
    };

    const flexPayload = {
      type: 'flex',
      altText: `⭐ ผลการประเมินทีมขาย: ${evaluation.salesRepName} (${evaluation.averageScore}/5.0)`,
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
      message: `ส่งผลการประเมินรหัส ${evaluation.evaluationCode} เข้ากลุ่ม LINE เรียบร้อยแล้ว`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    };
  }
}
