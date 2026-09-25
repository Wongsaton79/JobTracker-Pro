import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// CORS Middleware to ensure requests from all devices/origins succeed
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
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

// 🌐 Public Image Serving & Public CDN Integration for LINE Messaging API
// LINE Messaging API requires images to be served via publicly accessible HTTPS URLs.
// We upload photos to high-availability public CDNs (ImgBB / FreeImage) and provide local caching.

async function uploadBase64ToPublicCdn(dataUrl: string): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (dataUrl.startsWith('https://i.ibb.co/') || dataUrl.startsWith('https://freeimage.host/')) {
    return dataUrl;
  }
  if (dataUrl.startsWith('https://') && !dataUrl.includes('localhost') && !dataUrl.includes('run.app')) {
    return dataUrl;
  }

  const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '');
  if (!cleanBase64 || cleanBase64.length < 50) return '';

  const imgbbKeys = [
    '2740a6b7e2898495aa97576403d1591f',
    'd84fbda79a4ec868aef2eb9d9b62a632',
    '2788f4b2383ce404ea2aa7742d4a5204',
  ];

  for (const key of imgbbKeys) {
    try {
      const form = new URLSearchParams();
      form.append('image', cleanBase64);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const finalUrl = json?.data?.image?.url || json?.data?.url || json?.data?.display_url;
        if (finalUrl && finalUrl.startsWith('https://')) {
          console.log('✅ Image uploaded to ImgBB CDN:', finalUrl);
          return finalUrl;
        }
      }
    } catch (err) {
      console.warn('ImgBB upload attempt error:', err);
    }
  }

  // Backup FreeImage.host
  try {
    const form = new URLSearchParams();
    form.append('key', '6d207e02198a847aa98d0a2a901485a5');
    form.append('action', 'upload');
    form.append('source', cleanBase64);
    form.append('format', 'json');
    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (res.ok) {
      const json = (await res.json()) as any;
      const finalUrl = json?.image?.image?.url || json?.image?.url || json?.image?.display_url;
      if (finalUrl && finalUrl.startsWith('https://')) {
        console.log('✅ Image uploaded to FreeImage CDN:', finalUrl);
        return finalUrl;
      }
    }
  } catch (err) {
    console.warn('FreeImage upload error:', err);
  }

  return '';
}

// Helper to save base64 to server storage
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

// 🌐 Public Image Serving Endpoint
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

// 🌐 Client Upload to Public CDN Endpoint
app.post('/api/images/upload-cdn', async (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }
  try {
    const cdnUrl = await uploadBase64ToPublicCdn(image);
    if (cdnUrl) {
      return res.json({ success: true, url: cdnUrl });
    }
    return res.status(500).json({ success: false, message: 'Upload failed' });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Helper function to process photos inside a job object asynchronously
async function processJobPhotosAsync(job: any, publicOrigin?: string) {
  if (!job) return job;
  const clonedJob = JSON.parse(JSON.stringify(job));

  if (clonedJob.photos && Array.isArray(clonedJob.photos)) {
    for (let i = 0; i < clonedJob.photos.length; i++) {
      const photo = clonedJob.photos[i];
      const rawUrl = typeof photo === 'string' ? photo : photo?.url;
      if (rawUrl && typeof rawUrl === 'string') {
        if (rawUrl.startsWith('data:image/')) {
          // 1. Try public CDN upload first so LINE can fetch it without login cookies
          let finalUrl = await uploadBase64ToPublicCdn(rawUrl);
          // 2. Fallback to local server hosting if CDN was unreachable
          if (!finalUrl) {
            finalUrl = saveBase64ImageToServer(rawUrl, publicOrigin);
          }
          if (finalUrl) {
            if (typeof photo === 'object') {
              clonedJob.photos[i].url = finalUrl;
            } else {
              clonedJob.photos[i] = finalUrl;
            }
          }
        }
      }
    }
  }
  return clonedJob;
}

// Helper function to build LINE Flex Bubble JSON
function buildLineFlexPayload(job: any, companyName: string, eventLabel: string) {
  const statusColors: Record<string, string> = {
    pending: '#64748B',
    quotation: '#D97706',
    follow_up: '#2563EB',
    closed_deal: '#059669',
    completed: '#059669',
    in_progress: '#0284C7',
    review: '#9333EA',
    issue: '#E11D48',
  };

  const statusLabels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    quotation: 'เสนอราคา',
    follow_up: 'ติดตามซ้ำ',
    closed_deal: 'ปิดการขาย',
    completed: 'ปิดการขาย',
    in_progress: 'กำลังดำเนินการ',
    review: 'รอตรวจงาน',
    issue: 'มีปัญหา / ต้องแก้ไข',
  };

  const paymentLabels: Record<string, string> = {
    cash: 'เงินสด',
    credit_7: 'เครดิต 7 วัน',
    credit_15: 'เครดิต 15 วัน',
    credit_30: 'เครดิต 30 วัน',
    credit_45: 'เครดิต 45 วัน',
    transfer: 'เงินโอน',
    credit_60: 'เครดิต 60 วัน',
    credit_card: 'บัตรเครดิต',
  };

  const status = (job.status || 'pending').toLowerCase();
  const color = statusColors[status] || '#0284C7';
  const statusBadge = statusLabels[status] || 'อัพเดทงาน';
  const topHeader = eventLabel || '🔔 อัพเดทสถานะงานหน้างาน';

  const mapUrl = job.location && job.location.lat
    ? `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`
    : 'https://maps.google.com';
  const phoneUri = `tel:${String(job.phoneNumber || '').replace(/[^0-9]/g, '')}`;
  const webAppUrl = job.webUrl || mapUrl;

  const paymentLabel = paymentLabels[job.paymentType] || job.paymentType || 'เงินสด';

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
              text: `฿${Number(job.price || 0).toLocaleString()} (${paymentLabel})`,
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
        // Primary Web View Button
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
        {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'secondary',
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

  return bubble;
}

// Function to directly push message to LINE Messaging API with auto-fallback
async function directPushLineMessage(targetId: string, token: string, job: any, companyName: string, eventLabel: string) {
  const lineToken = token || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;

  try {
    // Flex Bubble without heavy image requirement (ensures highest reliability & includes Web link)
    const flexBubble = buildLineFlexPayload(job, companyName, eventLabel);
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

    console.warn('⚠️ LINE Push Flex failed (HTTP', response.status, '):', responseText);

    // Attempt 2: Text fallback to guarantee message arrival
    const statusLabels: Record<string, string> = {
      pending: 'รอดำเนินการ',
      quotation: 'เสนอราคา',
      follow_up: 'ติดตามซ้ำ',
      closed_deal: 'ปิดการขาย',
      completed: 'ปิดการขาย',
      in_progress: 'กำลังดำเนินการ',
      review: 'รอตรวจงาน',
      issue: 'มีปัญหา / ต้องแก้ไข',
    };
    const statusText = statusLabels[job.status] || job.status || 'รอดำเนินการ';
    const textMsg = `🔔 ${eventLabel}\n📌 งาน: ${job.title || 'งานหน้างาน'} (${job.jobCode || '-'})\n📊 สถานะ: ${statusText}\n👤 ผู้ติดต่อ: ${job.contactPerson || '-'} (${job.phoneNumber || '-'})\n🏷️ แบรนด์: ${job.productBrand || '-'}\n💰 ยอด: ฿${Number(job.price || 0).toLocaleString()} (${job.paymentType || 'เงินสด'})\n📍 สถานที่: ${(job.location && job.location.address) || '-'}`;
    
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
// 🌟 API ROUTE: Shared Evaluations (Supervisor Report Link & Sync)
// ==========================================
const EVALUATIONS_FILE = path.join(os.tmpdir(), 'jobtracker_evaluations.json');
let sharedEvaluations: any[] = [];
try {
  if (fs.existsSync(EVALUATIONS_FILE)) {
    sharedEvaluations = JSON.parse(fs.readFileSync(EVALUATIONS_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read shared evaluations file:', e);
}

app.get('/api/evaluations', (req, res) => {
  return res.json({ success: true, data: sharedEvaluations });
});

app.get('/api/evaluations/:id', (req, res) => {
  const { id } = req.params;
  const found = sharedEvaluations.find((e) => e.id === id || e.evaluationCode === id);
  if (found) {
    return res.json({ success: true, data: found });
  }
  return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลแบบประเมิน' });
});

app.post('/api/evaluations', (req, res) => {
  const { evaluations, evaluation } = req.body;
  if (Array.isArray(evaluations)) {
    sharedEvaluations = evaluations;
  } else if (evaluation && evaluation.id) {
    const idx = sharedEvaluations.findIndex((e) => e.id === evaluation.id);
    if (idx >= 0) {
      sharedEvaluations[idx] = evaluation;
    } else {
      sharedEvaluations.unshift(evaluation);
    }
  }
  try {
    fs.writeFileSync(EVALUATIONS_FILE, JSON.stringify(sharedEvaluations));
  } catch (e) {}
  return res.json({ success: true, count: sharedEvaluations.length });
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

  const processedJob = await processJobPhotosAsync(job, publicOrigin);

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
    lineSync: null,
  };

  // Direct Push to LINE Messaging API with the real photo URL
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
  try {
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

    const processedJob = await processJobPhotosAsync(job, publicOrigin);

    const lineToken = (channelAccessToken || DEFAULT_LINE_TOKEN).trim();
    const lineTarget = (targetId || DEFAULT_LINE_GROUP).trim();

    const result = await directPushLineMessage(
      lineTarget,
      lineToken,
      processedJob,
      companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
      eventLabel || '📋 รายงานข้อมูลงานหน้างาน'
    );

    return res.json(result);
  } catch (err: any) {
    console.error('Server /api/sync/send-line Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
      message: `เซิร์ฟเวอร์เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    });
  }
});

// ==========================================
// 🌟 API ROUTE 2B: Generic LINE Relay / Evaluation Push
// ==========================================
app.post(['/api/line-relay', '/api/sync/send-evaluation-line'], async (req, res) => {
  try {
    const token = (
      req.body.channelAccessToken ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      DEFAULT_LINE_TOKEN
    ).trim();

    const target = (
      req.body.to ||
      req.body.targetId ||
      DEFAULT_LINE_GROUP
    ).trim();

    const rawMessages = req.body.messages || (req.body.payload ? (Array.isArray(req.body.payload) ? req.body.payload : [req.body.payload]) : []);

    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลข้อความ (messages)' });
    }

    const pushRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: target,
        messages: rawMessages.slice(0, 5),
      }),
    });

    const pushText = await pushRes.text();
    if (pushRes.ok) {
      console.log('✅ LINE Relay Push Sent Successfully to', target);
      return res.json({ success: true, message: 'ส่งข้อความเข้ากลุ่ม LINE สำเร็จเรียบร้อย' });
    }

    console.error('❌ LINE Relay Push Error:', pushRes.status, pushText);
    return res.status(pushRes.status).json({
      success: false,
      status: pushRes.status,
      message: `LINE API Error (${pushRes.status}): ${pushText}`,
    });
  } catch (err: any) {
    console.error('Server LINE Relay Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
      message: `เซิร์ฟเวอร์เกิดข้อผิดพลาดในการส่ง LINE: ${err.message || err}`,
    });
  }
});

// ==========================================
// 🌟 API ROUTE 3: Direct LINE Connection Test
// ==========================================
app.get('/api/sync/test-line', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LINE test endpoint is ready. Send POST with targetId and channelAccessToken to test delivery.',
  });
});

app.post('/api/sync/test-line', async (req, res) => {
  try {
    const { targetId, channelAccessToken, companyName } = req.body;
    const token = (channelAccessToken || DEFAULT_LINE_TOKEN).trim();
    const target = (targetId || DEFAULT_LINE_GROUP).trim();
    const company = (companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด').trim();

    if (!token) {
      return res.json({ success: false, message: 'กรุณากรอก LINE Channel Access Token' });
    }
    if (!target) {
      return res.json({ success: false, message: 'กรุณากรอก LINE Group ID หรือ User ID' });
    }

    const testTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const textMsg = `🧪 ทดสอบการเชื่อมต่อ LINE Messaging API สำเร็จ!\n🏢 บริษัท: ${company}\n⏰ เวลา: ${testTime}\n📱 รหัสผู้รับ: ${target}\n✨ ระบบพร้อมส่งการแจ้งเตือนงานหน้างาน (Flex Message & Photos) เรียบร้อยแล้วครับ`;

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: target,
        messages: [{ type: 'text', text: textMsg }],
      }),
    });

    const responseText = await response.text();
    if (response.ok) {
      return res.json({
        success: true,
        status: 200,
        message: `ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว (${target.substring(0, 10)}...)`,
      });
    } else {
      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {}
      return res.json({
        success: false,
        status: response.status,
        error: responseText,
        message: parsed?.message || responseText,
      });
    }
  } catch (err: any) {
    console.error('Server /api/sync/test-line Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || String(err),
      message: `ไม่สามารถส่งข้อความทดสอบได้: ${err.message || err}`,
    });
  }
});

// ==========================================
// 🌟 API ROUTE 3: Test LINE Bot Connection Diagnostics
// ==========================================
app.post('/api/sync/test-connection', async (req, res) => {
  const { targetId, channelAccessToken, companyName } = req.body;

  const testJob = {
    jobCode: 'TEST-' + Date.now().toString().slice(-4),
    title: 'ทดสอบการเชื่อมต่อระบบ JobTracker Pro',
    status: 'in_progress',
    contactPerson: 'ระบบทดสอบอัตโนมัติ',
    phoneNumber: '081-234-5678',
    productBrand: 'JobTracker',
    productDetails: 'ทดสอบการเชื่อมต่อ LINE Messaging API สำเร็จ',
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

  const lineToken = channelAccessToken || DEFAULT_LINE_TOKEN;
  const lineTarget = targetId || DEFAULT_LINE_GROUP;
  const lineResult = await directPushLineMessage(
    lineTarget,
    lineToken,
    testJob,
    companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
    '🧪 ทดสอบการเชื่อมต่อระบบ LINE Bot'
  );

  return res.json({
    success: lineResult.success,
    message: lineResult.success
      ? 'ทดสอบเชื่อมต่อ LINE Bot สำเร็จ ข้อความถูกส่งเข้ากลุ่มแล้ว'
      : (lineResult.error || 'ไม่สามารถส่งข้อความทดสอบ LINE ได้'),
    diagnostics: { lineTest: lineResult },
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
