import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_LINE_TOKEN =
  'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=';
const DEFAULT_LINE_GROUP = 'C341417bcb6e853c320eaf9d80963cda3';

// Helper function to build LINE Flex Bubble JSON
function buildLineFlexPayload(job: any, companyName: string, eventLabel: string) {
  const statusColors: Record<string, string> = {
    completed: '#059669',
    in_progress: '#0284C7',
    review: '#D97706',
    pending: '#475569',
    issue: '#E11D48',
  };

  const statusLabels: Record<string, string> = {
    completed: 'เสร็จสมบูรณ์ 100%',
    in_progress: 'กำลังดำเนินการ',
    review: 'รอตรวจรับมอบงาน',
    pending: 'รอดำเนินการ',
    issue: 'มีปัญหา/ต้องแก้ไข',
  };

  const status = (job.status || 'pending').toLowerCase();
  const color = statusColors[status] || '#0284C7';
  const statusBadge = statusLabels[status] || 'อัพเดทงาน';
  const topHeader = eventLabel || '🔔 อัพเดทสถานะงานหน้างาน';

  const heroImage =
    job.photos && job.photos.length > 0 && job.photos[0].url && job.photos[0].url.startsWith('http')
      ? job.photos[0].url
      : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';

  const mapUrl = job.location
    ? `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`
    : 'https://maps.google.com';
  const phoneUri = `tel:${String(job.phoneNumber || '').replace(/[^0-9]/g, '')}`;

  return {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: color,
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: topHeader, weight: 'bold', color: '#FFFFFF', size: 'sm', flex: 1, wrap: true },
            { type: 'text', text: statusBadge, weight: 'bold', color: '#FFFFFF', size: 'xs', align: 'end' },
          ],
        },
        {
          type: 'text',
          text: String(job.title || 'งานหน้างาน'),
          weight: 'bold',
          color: '#FFFFFF',
          size: 'lg',
          wrap: true,
          margin: 'md',
        },
        {
          type: 'text',
          text: `รหัสงาน: ${job.jobCode || '-'} • ${job.date || ''} ${job.time || ''}`,
          color: '#E0E7FF',
          size: 'xs',
          margin: 'xs',
        },
      ],
    },
    hero: {
      type: 'image',
      url: heroImage,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: { type: 'uri', label: 'ดูรูปภาพ', uri: heroImage },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      spacing: 'md',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: '👤 ผู้ติดต่อ', size: 'xs', color: '#64748B', flex: 3 },
            {
              type: 'text',
              text: `${job.contactPerson || '-'} (${job.phoneNumber || '-'})`,
              size: 'xs',
              color: '#1E293B',
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
            { type: 'text', text: '🏷️ แบรนด์/สินค้า', size: 'xs', color: '#64748B', flex: 3 },
            {
              type: 'text',
              text: `${job.productBrand || '-'} - ${job.productDetails || '-'}`,
              size: 'xs',
              color: '#1E293B',
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
            { type: 'text', text: '💰 ยอดเงิน & ชำระ', size: 'xs', color: '#64748B', flex: 3 },
            {
              type: 'text',
              text: `฿${Number(job.price || 0).toLocaleString()} (${job.paymentType || 'เงินสด'})`,
              size: 'xs',
              color: '#059669',
              weight: 'bold',
              flex: 7,
            },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: '📍 พิกัดหน้างาน', size: 'xs', color: '#64748B', flex: 3 },
            {
              type: 'text',
              text: (job.location && job.location.address) || 'พิกัด GPS',
              size: 'xs',
              color: '#0284C7',
              flex: 7,
              wrap: true,
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '14px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#0284C7',
              height: 'sm',
              action: { type: 'uri', label: '🗺️ แผนที่ GPS', uri: mapUrl },
            },
            {
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: { type: 'uri', label: '📞 โทรออก', uri: phoneUri },
            },
          ],
        },
        {
          type: 'text',
          text: `ระบบรายงานโดย ${companyName || 'JobTracker Pro'}`,
          size: 'xxs',
          color: '#94A3B8',
          align: 'center',
          margin: 'xs',
        },
      ],
    },
  };
}

// Function to directly push message to LINE Messaging API
async function directPushLineMessage(targetId: string, token: string, job: any, companyName: string, eventLabel: string) {
  try {
    const flexBubble = buildLineFlexPayload(job, companyName, eventLabel);
    const linePayload = {
      to: targetId || DEFAULT_LINE_GROUP,
      messages: [
        {
          type: 'flex',
          altText: `[${eventLabel}] ${job.title || 'งานหน้างาน'} (${job.jobCode || ''})`,
          contents: flexBubble,
        },
      ],
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || DEFAULT_LINE_TOKEN}`,
      },
      body: JSON.stringify(linePayload),
    });

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // not json
    }

    if (!response.ok) {
      console.error('LINE Push Error:', response.status, responseText);
      return {
        success: false,
        status: response.status,
        error: responseText,
        details: responseJson?.message || responseText,
      };
    }

    return {
      success: true,
      status: response.status,
      data: responseJson || responseText,
    };
  } catch (err: any) {
    console.error('LINE Push Exception:', err);
    return {
      success: false,
      error: err.message || String(err),
    };
  }
}

// Function to send data to Google Apps Script Web App
async function sendToGoogleAppsScript(url: string, payload: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // response might be html or text
    }

    return {
      success: response.ok,
      status: response.status,
      data: json || text,
    };
  } catch (err: any) {
    console.error('Google Apps Script Proxy Error:', err);
    return {
      success: false,
      error: err.message || String(err),
    };
  }
}

// ==========================================
// 🌟 API ROUTE 1: Save Job & Notify LINE
// ==========================================
app.post('/api/sync/save-and-notify', async (req, res) => {
  const { webAppUrl, job, triggerType, targetId, channelAccessToken, companyName, customEventLabel, sendLine } = req.body;

  if (!job) {
    return res.status(400).json({ success: false, message: 'Missing job data' });
  }

  let eventLabel = customEventLabel;
  if (!eventLabel) {
    switch (triggerType) {
      case 'new_job':
        eventLabel = '🆕 บันทึกงานใหม่เข้าระบบ';
        break;
      case 'status_update':
        eventLabel = '⚡ อัพเดทสถานะงานหน้างาน';
        break;
      case 'edit_job':
        eventLabel = '✏️ อัพเดทข้อมูลงาน';
        break;
      case 'manual_send':
      default:
        eventLabel = '📋 รายงานข้อมูลงานหน้างาน';
        break;
    }
  }

  const results: any = {
    success: true,
    sheetSync: null,
    lineSync: null,
  };

  // 1. Sync to Google Sheets (if webAppUrl is provided)
  if (webAppUrl && webAppUrl.startsWith('http')) {
    const gasPayload = {
      action: triggerType === 'manual_send' ? 'send_line' : 'save_and_notify',
      triggerType,
      job,
      targetId: targetId || DEFAULT_LINE_GROUP,
      companyName: companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
      eventLabel,
      sendLine: sendLine !== false,
    };

    results.sheetSync = await sendToGoogleAppsScript(webAppUrl, gasPayload);
  }

  // 2. Direct Push to LINE (Always ensure LINE message is dispatched directly)
  if (sendLine !== false) {
    const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
    const lineTarget = targetId || DEFAULT_LINE_GROUP;
    results.lineSync = await directPushLineMessage(
      lineTarget,
      lineToken,
      job,
      companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
      eventLabel
    );
  }

  return res.json({
    success: true,
    message: 'ดำเนินการบันทึกและส่งแจ้งเตือนเรียบร้อย',
    details: results,
  });
});

// ==========================================
// 🌟 API ROUTE 2: Direct Send LINE Flex Message
// ==========================================
app.post('/api/sync/send-line', async (req, res) => {
  const { job, targetId, channelAccessToken, companyName, eventLabel } = req.body;

  if (!job) {
    return res.status(400).json({ success: false, message: 'Missing job data' });
  }

  const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;

  const result = await directPushLineMessage(
    lineTarget,
    lineToken,
    job,
    companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
    eventLabel || '📋 รายงานข้อมูลงานหน้างาน'
  );

  return res.json(result);
});

// ==========================================
// 🌟 API ROUTE 3: Fetch latest jobs from Google Sheets
// ==========================================
app.get('/api/sync/fetch-jobs', async (req, res) => {
  const webAppUrl = req.query.url as string;

  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return res.status(400).json({ success: false, message: 'Invalid Google Apps Script URL' });
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `HTTP ${response.status}: Failed to fetch from Google Sheets`,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    console.error('Error fetching jobs via proxy:', err);
    return res.status(500).json({
      success: false,
      message: `ไม่สามารถดึงข้อมูลได้: ${err.message || err}`,
    });
  }
});

// ==========================================
// 🌟 API ROUTE 4: Test Connection Diagnostics
// ==========================================
app.post('/api/sync/test-connection', async (req, res) => {
  const { webAppUrl, targetId, channelAccessToken } = req.body;

  const testJob = {
    jobCode: 'TEST-' + Date.now().toString().slice(-4),
    title: 'ทดสอบการเชื่อมต่อระบบ JobTracker Pro',
    status: 'in_progress',
    contactPerson: 'ระบบทดสอบอัตโนมัติ',
    phoneNumber: '081-234-5678',
    productBrand: 'SCG',
    productDetails: 'ทดสอบการเชื่อมต่อ Google Sheets & LINE API',
    price: 9900,
    paymentType: 'เงินสด',
    location: {
      address: 'กรุงเทพมหานคร',
      lat: 13.7563,
      lng: 100.5018,
    },
    photos: [],
    date: new Date().toISOString().substring(0, 10),
    time: '12:00',
  };

  const diagnostics: any = {
    sheetTest: null,
    lineTest: null,
  };

  // Test LINE Push
  const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;
  diagnostics.lineTest = await directPushLineMessage(
    lineTarget,
    lineToken,
    testJob,
    'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
    '🧪 ทดสอบการเชื่อมต่อระบบ'
  );

  // Test Google Sheet Fetch / Ping
  if (webAppUrl && webAppUrl.startsWith('http')) {
    try {
      const sheetRes = await fetch(webAppUrl, { method: 'GET', redirect: 'follow' });
      const sheetText = await sheetRes.text();
      let sheetJson = null;
      try {
        sheetJson = JSON.parse(sheetText);
      } catch {}

      diagnostics.sheetTest = {
        success: sheetRes.ok,
        status: sheetRes.status,
        data: sheetJson || sheetText.substring(0, 200),
      };
    } catch (err: any) {
      diagnostics.sheetTest = {
        success: false,
        error: err.message || String(err),
      };
    }
  }

  return res.json({
    success: true,
    diagnostics,
  });
});

// Vite middleware & Static server setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
