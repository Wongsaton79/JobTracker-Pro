import { JobItem } from '../types';
import {
  calculateJobFinancials,
  formatCurrency,
  formatThaiDate,
  getPaymentTypeConfig,
  getStatusConfig,
} from './formatters';

export const buildLineFlexMessage = (
  job: JobItem,
  companyName = 'JobTracker Pro',
  headerLabel = '🔔 อัพเดทสถานะงานหน้างาน'
) => {
  const statusCfg = getStatusConfig(job.status);
  const paymentCfg = getPaymentTypeConfig(job.paymentType);
  const fin = calculateJobFinancials(job);
  
  const mapUrl = `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`;
  const phoneUri = `tel:${job.phoneNumber.replace(/[^0-9]/g, '')}`;
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webAppUrl = origin ? `${origin}/?jobId=${encodeURIComponent(job.id || job.jobCode)}` : mapUrl;

  const flexJson: any = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: statusCfg.lineColor,
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: headerLabel,
              weight: 'bold',
              color: '#FFFFFF',
              size: 'sm',
              flex: 1,
            },
            {
              type: 'text',
              text: statusCfg.label,
              weight: 'bold',
              color: '#FFFFFF',
              size: 'xs',
              align: 'end',
            },
          ],
        },
        {
          type: 'text',
          text: job.title,
          weight: 'bold',
          color: '#FFFFFF',
          size: 'lg',
          wrap: true,
          margin: 'md',
        },
        {
          type: 'text',
          text: `รหัสงาน: ${job.jobCode} • ${formatThaiDate(job.date, 'short')} ${job.time}`,
          color: '#E0E7FF',
          size: 'xs',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      spacing: 'md',
      contents: [
        // Contact Person & Phone
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '👤 ผู้ติดต่อ',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: `${job.contactPerson} (${job.phoneNumber})`,
              size: 'xs',
              color: '#1E293B',
              weight: 'bold',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Brand & Item
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '🏷️ แบรนด์/สินค้า',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: `${job.productBrand} - ${job.productDetails || '-'}`,
              size: 'xs',
              color: '#1E293B',
              weight: 'bold',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Price & Payment
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '💰 ยอดเงิน & ชำระ',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'box',
              layout: 'vertical',
              flex: 7,
              contents: [
                {
                  type: 'text',
                  text: `${formatCurrency(fin.totalPrice)}`,
                  size: 'sm',
                  color: '#059669',
                  weight: 'bold',
                },
                {
                  type: 'text',
                  text: `${paymentCfg.label} • ${fin.statusLabel} (ชำระ ฿${fin.totalPaid.toLocaleString()}${fin.remaining > 0 ? ` / ค้าง ฿${fin.remaining.toLocaleString()}` : ''})`,
                  size: 'xxs',
                  color: fin.remaining > 0 ? '#D97706' : '#059669',
                  weight: 'bold',
                },
              ],
            },
          ],
        },
        // Location
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '📍 พิกัดหน้างาน',
              size: 'xs',
              color: '#64748B',
              flex: 3,
            },
            {
              type: 'text',
              text: job.location.address || `${job.location.lat.toFixed(5)}, ${job.location.lng.toFixed(5)}`,
              size: 'xs',
              color: '#0284C7',
              flex: 7,
              wrap: true,
            },
          ],
        },
        // Notes if any
        ...(job.notes
          ? [
              {
                type: 'box' as const,
                layout: 'vertical' as const,
                backgroundColor: '#F8FAFC',
                paddingAll: '8px',
                cornerRadius: '6px',
                contents: [
                  {
                    type: 'text' as const,
                    text: `📝 หมายเหตุ: ${job.notes}`,
                    size: 'xxs' as const,
                    color: '#475569',
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
      spacing: 'sm',
      paddingAll: '14px',
      contents: [
        // Main Action Button: Click to view details & photos on Web App
        {
          type: 'button',
          style: 'primary',
          color: '#059669',
          height: 'sm',
          action: {
            type: 'uri',
            label: '🌐 คลิกดูรูปและข้อมูลที่หน้าเว็บ',
            uri: webAppUrl,
          },
        },
        // Secondary row: Maps and Phone
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '🗺️ แผนที่ GPS',
                uri: mapUrl,
              },
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📞 โทรออก',
                uri: phoneUri,
              },
            },
          ],
        },
        {
          type: 'text',
          text: `ระบบรายงานโดย ${companyName}`,
          size: 'xxs',
          color: '#94A3B8',
          align: 'center',
          margin: 'xs',
        },
      ],
    },
  };

  return flexJson;
};

export const generateLineNotifyText = (job: JobItem): string => {
  const statusCfg = getStatusConfig(job.status);
  const paymentCfg = getPaymentTypeConfig(job.paymentType);
  const fin = calculateJobFinancials(job);
  const mapUrl = `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`;

  return `
🔔 แจ้งเตือนอัพเดทงาน: ${job.title}
━━━━━━━━━━━━━━━━━━
📌 รหัสงาน: ${job.jobCode}
📊 สถานะ: ${statusCfg.label}
👤 ผู้ติดต่อ: ${job.contactPerson} (${job.phoneNumber})
🏷️ แบรนด์สินค้า: ${job.productBrand}
🛠️ รายการ: ${job.productDetails || '-'}
💰 ราคา: ${formatCurrency(fin.totalPrice)} (${paymentCfg.label})
💳 การชำระเงิน: ${fin.statusLabel} (ชำระแล้ว ฿${fin.totalPaid.toLocaleString()}, ค้าง ฿${fin.remaining.toLocaleString()})
📅 วันที่-เวลา: ${formatThaiDate(job.date, 'short')} ${job.time}
📍 สถานที่: ${job.location.address || '-'}
🗺️ พิกัดแผนที่: ${mapUrl}
📝 หมายเหตุ: ${job.notes || '-'}
${job.photos.length > 0 ? `📷 รูปภาพประกอบ: ${job.photos.length} รูป` : ''}
`.trim();
};
