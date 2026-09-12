import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// CORS Middleware to ensure requests from all devices/origins succeed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_LINE_TOKEN =
  'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=';
const DEFAULT_LINE_GROUP = 'C341417bcb6e853c320eaf9d80963cda3';

// 📸 Directory and In-Memory Cache for uploaded photos
const IMAGES_DIR = path.join(os.tmpdir(), 'jobtracker_photos');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
const imageStore = new Map<string, { buffer: Buffer; contentType: string }>();

// Helper to save base64 to server storage and return a public HTTPS URL
function saveBase64ImageToServer(dataUrl: string, publicOrigin?: string): string {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (dataUrl.startsWith('https://')) {
    return dataUrl;
  }
  if (dataUrl.startsWith('http://')) {
    return dataUrl.replace(/^http:\/\//, 'https://');
  }

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return '';
    }

    const contentType = matches[1] || 'image/jpeg';
    const buffer = Buffer.from(matches[2], 'base64');
    const imageId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `${imageId}.${ext}`;

    // Store in memory
    imageStore.set(filename, { buffer, contentType });

    // Store on disk
    try {
      fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
    } catch (eDisk) {
      console.warn('Could not write image to disk:', eDisk);
    }

    // Determine clean public HTTPS origin
    let origin = (publicOrigin || '').trim().replace(/\/+$/, '');
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      origin = 'https://ais-pre-d2ekaehnc7t3li2cc3z2pg-941526555561.asia-southeast1.run.app';
    } else {
      if (!origin.startsWith('https://') && !origin.startsWith('http://')) {
        origin = `https://${origin}`;
      }
      origin = origin.replace(/^http:\/\//, 'https://');
    }

    return `${origin}/api/images/${filename}`;
  } catch (err) {
    console.error('saveBase64ImageToServer error:', err);
    return '';
  }
}

// 🌐 Public Image Serving Endpoint for LINE Flex and Google Sheets
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  // 1. From Memory
  const mem = imageStore.get(filename);
  if (mem) {
    res.setHeader('Content-Type', mem.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(mem.buffer);
  }

  // 2. From Disk
  const diskPath = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(diskPath)) {
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(diskPath);
  }

  return res.status(404).send('Image Not Found');
});

// Helper function to process photos inside a job object
function processJobPhotos(job: any, publicOrigin?: string) {
  if (!job) return job;
  const clonedJob = JSON.parse(JSON.stringify(job));

  if (clonedJob.photos && Array.isArray(clonedJob.photos)) {
    clonedJob.photos = clonedJob.photos.map((photo: any) => {
      const url = typeof photo === 'string' ? photo : photo?.url;
      if (url && typeof url === 'string' && url.startsWith('data:image/')) {
        const publicUrl = saveBase64ImageToServer(url, publicOrigin);
        if (publicUrl) {
          if (typeof photo === 'object') {
            return { ...photo, url: publicUrl };
          }
          return publicUrl;
        }
      }
      return photo;
    });
  }
  return clonedJob;
}

// Helper function to build LINE Flex Bubble JSON
function buildLineFlexPayload(job: any, companyName: string, eventLabel: string, includeHero = true) {
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

  let heroImage = '';
  if (includeHero && job.photos && Array.isArray(job.photos) && job.photos.length > 0) {
    const firstP = job.photos[0];
    const rawUrl = typeof firstP === 'string' ? firstP : firstP?.url;
    if (rawUrl && typeof rawUrl === 'string') {
      if (rawUrl.startsWith('https://') || rawUrl.startsWith('http://')) {
        heroImage = rawUrl.replace(/^http:\/\//, 'https://');
      }
    }
  }

  const mapUrl = job.location
    ? `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`
    : 'https://maps.google.com';
  const phoneUri = `tel:${String(job.phoneNumber || '').replace(/[^0-9]/g, '')}`;

  const bubble: any = {
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

  // Attach hero image if available and valid HTTPS
  if (heroImage && heroImage.startsWith('https://')) {
    bubble.hero = {
      type: 'image',
      url: heroImage,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: { type: 'uri', label: 'ดูรูปภาพ', uri: heroImage },
    };
  }

  return bubble;
}

// Function to directly push message to LINE Messaging API with auto-fallback
async function directPushLineMessage(targetId: string, token: string, job: any, companyName: string, eventLabel: string) {
  const lineToken = token || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;

  try {
    // Attempt 1: Full Flex Bubble (with actual job photo if available)
    const flexBubble = buildLineFlexPayload(job, companyName, eventLabel, true);
    const linePayload = {
      to: lineTarget,
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
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify(linePayload),
    });

    const responseText = await response.text();
    if (response.ok) {
      console.log('✅ LINE Push Sent Successfully to', lineTarget);
      return { success: true, status: response.status };
    }

    console.warn('⚠️ LINE Push with hero image failed (HTTP', response.status, '):', responseText);

    // Attempt 2: If failed (e.g. 400 Bad Request on photo URL), retry without hero image
    const retryBubble = buildLineFlexPayload(job, companyName, eventLabel, false);
    const retryPayload = {
      to: lineTarget,
      messages: [
        {
          type: 'flex',
          altText: `[${eventLabel}] ${job.title || 'งานหน้างาน'} (${job.jobCode || ''})`,
          contents: retryBubble,
        },
      ],
    };

    const retryRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify(retryPayload),
    });

    const retryText = await retryRes.text();
    if (retryRes.ok) {
      console.log('✅ LINE Push Fallback Flex Succeeded');
      return { success: true, status: retryRes.status, fallbackUsed: true };
    }

    // Attempt 3: Final text fallback to guarantee message arrival
    const textMsg = `🔔 ${eventLabel}\n📌 งาน: ${job.title || 'งานหน้างาน'} (${job.jobCode || '-'})\n📊 สถานะ: ${job.status || 'รอดำเนินการ'}\n👤 ผู้ติดต่อ: ${job.contactPerson || '-'} (${job.phoneNumber || '-'})\n💰 ยอด: ฿${Number(job.price || 0).toLocaleString()}\n📍 สถานที่: ${(job.location && job.location.address) || '-'}`;
    
    const textRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${lineToken}`,
      },
      body: JSON.stringify({
        to: lineTarget,
        messages: [{ type: 'text', text: textMsg }],
      }),
    });

    if (textRes.ok) {
      console.log('✅ LINE Text Fallback Succeeded');
      return { success: true, status: textRes.status, fallbackUsed: true };
    }

    console.error('❌ LINE Push Error:', response.status, responseText);
    return {
      success: false,
      status: response.status,
      error: responseText,
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

// Persistent shared jobs storage on server (Cross-Device Sync)
const JOBS_FILE = path.join(os.tmpdir(), 'jobtracker_jobs.json');
let sharedJobs: any[] = [];
try {
  if (fs.existsSync(JOBS_FILE)) {
    sharedJobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read shared jobs file:', e);
}

// ==========================================
// 🌟 API ROUTE: Shared Jobs (Sync Mobile & PC)
// ==========================================
app.get('/api/jobs', (req, res) => {
  return res.json({ success: true, data: sharedJobs });
});

app.post('/api/jobs', (req, res) => {
  const { jobs } = req.body;
  if (Array.isArray(jobs)) {
    sharedJobs = jobs;
    try {
      fs.writeFileSync(JOBS_FILE, JSON.stringify(sharedJobs));
    } catch (e) {}
  }
  return res.json({ success: true, count: sharedJobs.length });
});

// ==========================================
// 🌟 API ROUTE 1: Save Job & Notify LINE
// ==========================================
app.post('/api/sync/save-and-notify', async (req, res) => {
  const { webAppUrl, job, triggerType, targetId, channelAccessToken, companyName, customEventLabel, sendLine, clientOrigin } = req.body;

  if (!job) {
    return res.status(400).json({ success: false, message: 'Missing job data' });
  }

  // 1. Resolve public HTTPS origin for permanent image hosting
  let publicOrigin = (clientOrigin || '').trim();
  if (!publicOrigin && req.get('origin')) {
    publicOrigin = req.get('origin')!;
  }
  if (!publicOrigin && req.get('referer')) {
    try {
      const u = new URL(req.get('referer')!);
      publicOrigin = `${u.protocol}//${u.host}`;
    } catch {}
  }
  if (!publicOrigin && req.get('x-forwarded-host')) {
    const proto = req.get('x-forwarded-proto') || 'https';
    publicOrigin = `${proto}://${req.get('x-forwarded-host')}`;
  }

  const processedJob = processJobPhotos(job, publicOrigin);

  // 2. Update server-side shared jobs list
  const existingIdx = sharedJobs.findIndex((j) => j.id === processedJob.id);
  if (existingIdx >= 0) {
    sharedJobs[existingIdx] = processedJob;
  } else {
    sharedJobs.unshift(processedJob);
  }
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(sharedJobs));
  } catch (e) {}

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

  // 3. Sync to Google Sheets (sending lightweight payload with public image URLs)
  if (webAppUrl && webAppUrl.startsWith('http')) {
    const gasPayload = {
      action: triggerType === 'manual_send' ? 'send_line' : 'save_and_notify',
      triggerType,
      job: processedJob,
      targetId: targetId || DEFAULT_LINE_GROUP,
      channelAccessToken: channelAccessToken || DEFAULT_LINE_TOKEN,
      companyName: companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
      eventLabel,
      sendLine: sendLine !== false,
    };

    results.sheetSync = await sendToGoogleAppsScript(webAppUrl, gasPayload);
  }

  // 4. Direct Push to LINE Messaging API with the real photo URL!
  if (sendLine !== false) {
    const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
    const lineTarget = targetId || DEFAULT_LINE_GROUP;
    results.lineSync = await directPushLineMessage(
      lineTarget,
      lineToken,
      processedJob,
      companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
      eventLabel
    );
  }

  return res.json({
    success: true,
    message: 'ดำเนินการบันทึกและส่งแจ้งเตือนเรียบร้อย',
    job: processedJob,
    details: results,
  });
});

// ==========================================
// 🌟 API ROUTE 2: Direct Send LINE Flex Message
// ==========================================
app.post('/api/sync/send-line', async (req, res) => {
  const { job, targetId, channelAccessToken, companyName, eventLabel, clientOrigin } = req.body;

  if (!job) {
    return res.status(400).json({ success: false, message: 'Missing job data' });
  }

  let publicOrigin = (clientOrigin || '').trim();
  if (!publicOrigin && req.get('origin')) {
    publicOrigin = req.get('origin')!;
  }
  if (!publicOrigin && req.get('referer')) {
    try {
      const u = new URL(req.get('referer')!);
      publicOrigin = `${u.protocol}//${u.host}`;
    } catch {}
  }
  if (!publicOrigin && req.get('x-forwarded-host')) {
    const proto = req.get('x-forwarded-proto') || 'https';
    publicOrigin = `${proto}://${req.get('x-forwarded-host')}`;
  }

  const processedJob = processJobPhotos(job, publicOrigin);

  const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;

  const result = await directPushLineMessage(
    lineTarget,
    lineToken,
    processedJob,
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
