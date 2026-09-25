import { SalesEvaluation, SyncSettings } from '../types';
import { formatChannelText, formatPriceComparisonLabel } from './evaluationCalculator';
import { uploadBase64ToPublicCdn } from './imageCdn';

export const DEFAULT_LINE_CONFIG = {
  channelAccessToken:
    'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
  targetGroupId: 'C341417bcb6e853c320eaf9d80963cda3',
};

/**
 * ส่งข้อมูลการเข้าพบเก็บแบบสอบถามความพึงพอใจเข้า LINE Group
 * ⚠️ ตามนโยบาย: ส่งข้อมูลหน้างาน ร้านค้า พิกัด และ Feedback ทั้งหมด "ยกเว้น คะแนนการประเมิน"
 */
export async function sendEvaluationToLine(
  evaluation: SalesEvaluation,
  settings: SyncSettings
): Promise<{ success: boolean; message: string }> {
  try {
    const token = (settings.lineChannelAccessToken || DEFAULT_LINE_CONFIG.channelAccessToken).trim();
    const targetId = (settings.lineTargetGroupId || settings.lineTargetUserId || DEFAULT_LINE_CONFIG.targetGroupId).trim();

    if (!token || !targetId) {
      return {
        success: false,
        message: 'กรุณาตั้งค่า LINE Channel Access Token และ Target Group ID ก่อนส่งข้อมูล',
      };
    }

    const priceInfo = formatPriceComparisonLabel(evaluation.feedbackPriceAndPromo);
    const channelText = formatChannelText(evaluation.contactChannel);
    const branchText = evaluation.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก';

    const locationText = evaluation.checkInLocation
      ? (evaluation.checkInLocation.address || `${evaluation.checkInLocation.lat.toFixed(5)}, ${evaluation.checkInLocation.lng.toFixed(5)}`)
      : 'ไม่ได้ระบุพิกัด GPS';

    const googleMapsUrl = evaluation.checkInLocation
      ? `https://www.google.com/maps?q=${evaluation.checkInLocation.lat},${evaluation.checkInLocation.lng}`
      : '';

    // Convert photos to public CDN URLs if available
    const publicPhotoUrls: string[] = [];
    if (evaluation.photos && evaluation.photos.length > 0) {
      for (const p of evaluation.photos.slice(0, 4)) {
        try {
          if (p.startsWith('https://')) {
            publicPhotoUrls.push(p);
          } else if (p.startsWith('data:image')) {
            const uploadedUrl = await uploadBase64ToPublicCdn(p);
            if (uploadedUrl && uploadedUrl.startsWith('https://')) {
              publicPhotoUrls.push(uploadedUrl);
            }
          }
        } catch (e) {
          console.warn('Failed to upload evaluation photo to CDN:', e);
        }
      }
    }

    // Competitor Price Items list (up to 5 items)
    const validCompetitorItems = (evaluation.competitorPriceItems || []).filter(
      (i) => i.productName && i.productName.trim() !== ''
    );

    // Interested Products list
    const validInterestedProducts = (evaluation.interestedProducts || []).filter(
      (p) => p && p.trim() !== ''
    );

    // Flex Bubble payload (ออกแบบตามแบบจริงใน LINE - การ์ดสีเขียว ชัดเจน สวยงาม ไม่มีคะแนน)
    const flexBubble: any = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#16a34a',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${evaluation.customerName} เข้าพบเก็บแบบสอบถามความพึงพอใจ`,
            color: '#ffffff',
            weight: 'bold',
            size: 'md',
            wrap: true,
          },
          {
            type: 'text',
            text: `👤 พนักงานขาย: ${evaluation.salesRepName} • ${branchText}`,
            color: '#bbf7d0',
            size: 'xs',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          // พิกัด / ที่อยู่หน้างาน
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              {
                type: 'text',
                text: '📍',
                size: 'xs',
                flex: 1,
              },
              {
                type: 'text',
                text: locationText,
                size: 'xs',
                color: '#334155',
                weight: 'bold',
                wrap: true,
                flex: 11,
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
          },
          // ข้อมูลการเข้าพบ
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            margin: 'md',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '👤 ผู้ให้ข้อมูล:', size: 'xs', color: '#64748b', flex: 4 },
                  {
                    type: 'text',
                    text: `${evaluation.evaluatorName || '-'}${evaluation.customerPhone ? ` (${evaluation.customerPhone})` : ''}`,
                    size: 'xs',
                    color: '#0f172a',
                    weight: 'bold',
                    flex: 7,
                    wrap: true,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📞 ช่องทาง:', size: 'xs', color: '#64748b', flex: 4 },
                  { type: 'text', text: channelText, size: 'xs', color: '#334155', flex: 7 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📅 วันที่เข้าพบ:', size: 'xs', color: '#64748b', flex: 4 },
                  { type: 'text', text: evaluation.date || '-', size: 'xs', color: '#334155', flex: 7 },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '🏷️ ราคากับคู่แข่ง:', size: 'xs', color: '#64748b', flex: 4 },
                  {
                    type: 'text',
                    text: `${priceInfo.label}${evaluation.feedbackPriceNote ? ` (${evaluation.feedbackPriceNote})` : ''}`,
                    size: 'xs',
                    weight: 'bold',
                    color: '#047857',
                    flex: 7,
                    wrap: true,
                  },
                ],
              },
            ],
          },

          // รายการสินค้าคู่แข่งที่เก็บราคา (ถ้ามี)
          ...(validCompetitorItems.length > 0
            ? [
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'md',
                  paddingAll: '8px',
                  backgroundColor: '#f8fafc',
                  cornerRadius: 'md',
                  contents: [
                    {
                      type: 'text',
                      text: `📋 รายการราคาสินค้าคู่แข่ง (${validCompetitorItems.length} รายการ):`,
                      size: 'xxs',
                      color: '#475569',
                      weight: 'bold',
                    },
                    ...validCompetitorItems.slice(0, 4).map((item, idx) => ({
                      type: 'text',
                      text: `${idx + 1}. ${item.productName} [${item.comparison === 'lower' ? 'ต่ำกว่า' : item.comparison === 'higher' ? 'สูงกว่า' : item.comparison === 'similar' ? 'ใกล้เคียง' : 'เทียบราคา'}]${item.note ? ` - ${item.note}` : ''}`,
                      size: 'xxs',
                      color: '#334155',
                      wrap: true,
                    })),
                  ],
                },
              ]
            : []),

          // สินค้าที่สนใจให้ทำราคา (ถ้ามี)
          ...(validInterestedProducts.length > 0
            ? [
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'sm',
                  paddingAll: '8px',
                  backgroundColor: '#f0fdf4',
                  cornerRadius: 'md',
                  contents: [
                    {
                      type: 'text',
                      text: '💡 สินค้าที่ลูกค้าสนใจให้ทำราคา:',
                      size: 'xxs',
                      color: '#166534',
                      weight: 'bold',
                    },
                    ...validInterestedProducts.slice(0, 3).map((item, idx) => ({
                      type: 'text',
                      text: `• ${item}`,
                      size: 'xxs',
                      color: '#15803d',
                      wrap: true,
                    })),
                  ],
                },
              ]
            : []),

          // ข้อเสนอแนะเพิ่มเติม (ถ้ามี)
          ...(evaluation.additionalFeedback
            ? [
                {
                  type: 'box',
                  layout: 'vertical',
                  margin: 'sm',
                  paddingAll: '8px',
                  backgroundColor: '#fffbeb',
                  cornerRadius: 'md',
                  contents: [
                    {
                      type: 'text',
                      text: '💬 ข้อเสนอแนะเพิ่มเติม:',
                      size: 'xxs',
                      color: '#92400e',
                      weight: 'bold',
                    },
                    {
                      type: 'text',
                      text: evaluation.additionalFeedback,
                      size: 'xs',
                      color: '#78350f',
                      wrap: true,
                    },
                  ],
                },
              ]
            : []),
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'xs',
        contents: [
          ...(googleMapsUrl
            ? [
                {
                  type: 'button',
                  style: 'link',
                  height: 'sm',
                  action: {
                    type: 'uri',
                    label: '📍 ดูแผนที่หน้างาน Google Maps',
                    uri: googleMapsUrl,
                  },
                },
              ]
            : []),
          {
            type: 'text',
            text: `รหัสแบบประเมิน: ${evaluation.evaluationCode} • ${settings.companyName || 'ระบบบันทึกงานขาย'}`,
            size: 'xxs',
            color: '#94a3b8',
            align: 'center',
          },
        ],
      },
    };

    // First message: The Flex Bubble
    const flexPayload = {
      type: 'flex',
      altText: `📋 เข้าพบเก็บแบบสอบถามความพึงพอใจ: ${evaluation.customerName} (พนักงาน: ${evaluation.salesRepName})`,
      contents: flexBubble,
    };

    const messagesToSend: any[] = [flexPayload];

    // Additional messages: Direct photos if available on public CDN (up to 4 images)
    for (const imgUrl of publicPhotoUrls) {
      if (messagesToSend.length < 5) {
        messagesToSend.push({
          type: 'image',
          originalContentUrl: imgUrl,
          previewImageUrl: imgUrl,
        });
      }
    }

    const requestBody = {
      channelAccessToken: token,
      to: targetId,
      targetId: targetId,
      messages: messagesToSend,
      payload: messagesToSend,
    };

    // Candidate endpoints
    const endpoints: string[] = [];
    if (settings.lineRelayUrl && settings.lineRelayUrl.trim().startsWith('http')) {
      endpoints.push(settings.lineRelayUrl.trim());
    }
    endpoints.push('/api/line-relay');
    endpoints.push('/api/sync/send-evaluation-line');
    if (typeof window !== 'undefined' && window.location.origin) {
      endpoints.push(`${window.location.origin}/api/line-relay`);
    }

    let lastError = '';
    for (const ep of endpoints) {
      try {
        const response = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          return {
            success: true,
            message: `ส่งข้อมูลการเข้าพบร้าน "${evaluation.customerName}" เข้า LINE เรียบร้อยแล้ว`,
          };
        }

        const errText = await response.text();
        lastError = errText;
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    // Text fallback attempt in case Flex had issues
    try {
      const fallbackText = `📋 ข้อมูลเข้าพบเก็บแบบสอบถามความพึงพอใจ\n🏪 ร้านค้า/ลูกค้า: ${evaluation.customerName}\n👤 พนักงานขาย: ${evaluation.salesRepName} (${branchText})\n👥 ผู้ให้ข้อมูล: ${evaluation.evaluatorName || '-'}\n📞 ช่องทาง: ${channelText}\n📍 พิกัด/ที่อยู่: ${locationText}\n🏷️ ราคากับคู่แข่ง: ${priceInfo.label}${evaluation.feedbackPriceNote ? ` (${evaluation.feedbackPriceNote})` : ''}${evaluation.additionalFeedback ? `\n💬 ข้อเสนอแนะ: ${evaluation.additionalFeedback}` : ''}`;
      for (const ep of endpoints) {
        const fallbackRes = await fetch(ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channelAccessToken: token,
            to: targetId,
            messages: [{ type: 'text', text: fallbackText }],
          }),
        });
        if (fallbackRes.ok) {
          return {
            success: true,
            message: `ส่งข้อมูลการเข้าพบร้าน "${evaluation.customerName}" เข้า LINE สำเร็จ (ส่งแบบข้อความสรุป)`,
          };
        }
      }
    } catch {}

    return {
      success: false,
      message: `ไม่สามารถส่งเข้ากลุ่ม LINE ได้: ${lastError}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    };
  }
}
