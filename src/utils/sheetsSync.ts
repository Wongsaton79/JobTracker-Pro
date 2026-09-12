import { JobItem, JobStatus, SyncSettings } from '../types';
import { formatThaiDate } from './formatters';

export const exportJobsToCsv = (jobs: JobItem[]): string => {
  const headers = [
    'Job_Code',
    'Date',
    'Time',
    'Job_Title',
    'Status',
    'Contact_Person',
    'Phone_Number',
    'Product_Brand',
    'Product_Details',
    'Price_THB',
    'Payment_Type',
    'Address',
    'Latitude',
    'Longitude',
    'Google_Maps_URL',
    'Photo_Count',
    'Photo_URLs',
    'Notes',
    'Assigned_To',
    'Updated_At'
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = jobs.map((job) => [
    escapeCell(job.jobCode),
    escapeCell(job.date),
    escapeCell(job.time),
    escapeCell(job.title),
    escapeCell(job.status),
    escapeCell(job.contactPerson),
    escapeCell(job.phoneNumber),
    escapeCell(job.productBrand),
    escapeCell(job.productDetails),
    escapeCell(job.price),
    escapeCell(job.paymentType),
    escapeCell(job.location.address),
    escapeCell(job.location.lat),
    escapeCell(job.location.lng),
    escapeCell(`https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`),
    escapeCell(job.photos.length),
    escapeCell(job.photos.map((p) => p.url).join(' | ')),
    escapeCell(job.notes),
    escapeCell(job.assignedTo || ''),
    escapeCell(job.updatedAt),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

export const downloadCsvFile = (jobs: JobItem[], filename = 'field_jobs_data.csv') => {
  const csvContent = '\uFEFF' + exportJobsToCsv(jobs); // Add UTF-8 BOM for Thai encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateGoogleAppsScriptCode = (sheetName = 'FieldJobs') => {
  return `// ==========================================================
// 🚀 Google Apps Script for JobTracker Pro (Google Sheets Database + LINE Flex Message)
// วางโค้ดนี้ใน Google Sheet -> Extensions (ส่วนขยาย) -> Apps Script
// หลังจากวางแล้วให้กด Deploy -> New deployment -> Web app -> Who has access: Anyone
// ==========================================================

// 🔑 การตั้งค่า LINE Messaging API
var LINE_CHANNEL_ACCESS_TOKEN = "JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=";
var LINE_TARGET_GROUP_ID = "C341417bcb6e853c320eaf9d80963cda3"; // กลุ่ม LINE
var LINE_TARGET_USER_ID = "U54fd541a6cf7746b1b4f0219634c7a53";   // ผู้ใช้ LINE

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("${sheetName}") || ss.getSheets()[0];
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var jobs = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      
      var photoUrls = row[16] ? String(row[16]).split(' | ').filter(Boolean) : [];
      var photos = photoUrls.map(function(u, idx) {
        return {
          id: 'photo_' + idx + '_' + Date.now(),
          url: u,
          timestamp: String(row[19] || new Date().toISOString()),
          source: 'gallery'
        };
      });
      
      var job = {
        id: 'job_' + String(row[0]).replace(/[^a-zA-Z0-9]/g, '_'),
        jobCode: String(row[0]),
        date: String(row[1] || '').substring(0, 10),
        time: String(row[2] || '09:00'),
        title: String(row[3] || 'ไม่มีชื่อหน้างาน'),
        status: String(row[4] || 'pending').toLowerCase(),
        contactPerson: String(row[5] || ''),
        phoneNumber: String(row[6] || ''),
        productBrand: String(row[7] || 'SCG'),
        productDetails: String(row[8] || ''),
        price: Number(row[9]) || 0,
        paymentType: String(row[10] || 'cash'),
        location: {
          address: String(row[11] || ''),
          lat: Number(row[12]) || 13.7563,
          lng: Number(row[13]) || 100.5018
        },
        photos: photos,
        notes: String(row[17] || ''),
        assignedTo: String(row[18] || ''),
        updatedAt: String(row[19] || new Date().toISOString()),
        createdAt: String(row[19] || new Date().toISOString())
      };
      
      jobs.push(job);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: jobs }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("${sheetName}") || ss.getSheets()[0];
    
    // ตรวจสอบและสร้าง Header อัตโนมัติหากยังไม่มี
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "รหัสงาน (Job_Code)",
        "วันที่ (Date)",
        "เวลา (Time)",
        "ชื่อหน้างาน (Title)",
        "สถานะ (Status)",
        "ผู้ติดต่อ (Contact)",
        "เบอร์โทร (Phone)",
        "แบรนด์สินค้า (Brand)",
        "รายละเอียดสินค้า (Details)",
        "ราคา (Price_THB)",
        "การชำระเงิน (Payment_Type)",
        "สถานที่/ที่อยู่ (Address)",
        "ละติจูด (Latitude)",
        "ลองจิจูด (Longitude)",
        "ลิงก์ Google Maps",
        "จำนวนรูปภาพ (Photo_Count)",
        "ลิงก์รูปภาพ (Photos)",
        "หมายเหตุ (Notes)",
        "ผู้รับผิดชอบ (Assigned_To)",
        "เวลาอัพเดท (Updated_At)"
      ]);
      sheet.getRange(1, 1, 1, 20).setBackground("#1E293B").setFontColor("#FFFFFF").setFontWeight("bold");
    }

    var payloadStr = e.postData ? e.postData.contents : "";
    if (!payloadStr) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(payloadStr);

    // 1. ส่ง LINE Flex Message โดยเฉพาะ (กดส่งเอง หรือ Manual Send)
    if (data && data.action === 'send_line') {
      var target = data.targetId || LINE_TARGET_GROUP_ID || LINE_TARGET_USER_ID;
      var lineResult = pushLineFlex(target, data.job, data.companyName, data.eventLabel || '🔔 รายงานข้อมูลงาน');
      return ContentService.createTextOutput(JSON.stringify({ status: "success", lineResult: lineResult }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. บันทึกงาน + ส่ง LINE Flex แจ้งเตือน (สร้างงานใหม่ / เปลี่ยนสถานะ / แก้ไขงาน)
    if (data && data.action === 'save_and_notify') {
      appendOrUpdateJob(sheet, data.job);
      
      var target = data.targetId || LINE_TARGET_GROUP_ID || LINE_TARGET_USER_ID;
      var eventLabel = data.eventLabel;
      if (!eventLabel) {
        if (data.triggerType === 'new_job') {
          eventLabel = '🆕 บันทึกงานใหม่เข้าระบบ';
        } else if (data.triggerType === 'status_update') {
          eventLabel = '⚡ อัพเดทสถานะงานหน้างาน';
        } else {
          eventLabel = '📋 อัพเดทข้อมูลงาน';
        }
      }
      
      if (data.sendLine !== false) {
        try {
          pushLineFlex(target, data.job, data.companyName || "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", eventLabel);
        } catch (errLine) {
          Logger.log("LINE push err: " + errLine);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", jobCode: data.job.jobCode }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. ซิงค์ข้อมูลก้อนใหญ่ทั้งหมด (Bulk Sync)
    if (Array.isArray(data)) {
      data.forEach(function(job) {
        appendOrUpdateJob(sheet, job);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    // 4. บันทึกข้อมูลงานเดี่ยวแบบเดิม (Fallback Direct Job Object)
    else if (data && (data.jobCode || data.title)) {
      appendOrUpdateJob(sheet, data);
      
      try {
        pushLineFlex(LINE_TARGET_GROUP_ID || LINE_TARGET_USER_ID, data, "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🔔 อัพเดทสถานะงานหน้างาน");
      } catch (errLine) {
        Logger.log("LINE push err: " + errLine);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", jobCode: data.jobCode }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid payload format" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appendOrUpdateJob(sheet, job) {
  var data = sheet.getDataRange().getValues();
  var jobCode = job.jobCode || ("JOB-" + Date.now().toString().slice(-4));
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == jobCode) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    jobCode,
    job.date || new Date().toISOString().substring(0, 10),
    job.time || "09:00",
    job.title || "งานหน้างาน",
    job.status || "pending",
    job.contactPerson || "",
    job.phoneNumber || "",
    job.productBrand || "",
    job.productDetails || "",
    Number(job.price) || 0,
    job.paymentType || "cash",
    (job.location && job.location.address) || "",
    (job.location && job.location.lat) || "",
    (job.location && job.location.lng) || "",
    job.location ? ("https://www.google.com/maps?q=" + job.location.lat + "," + job.location.lng) : "",
    (job.photos ? job.photos.length : 0),
    (job.photos ? job.photos.map(function(p){ return p.url; }).join(" | ") : ""),
    job.notes || "",
    job.assignedTo || "",
    job.updatedAt || new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

// 💬 ฟังก์ชันส่ง LINE Flex Message เข้า Group หรือ User พร้อมแถบหัวข้อ Custom
function pushLineFlex(targetId, job, companyName, headerLabel) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !targetId) {
    return { error: "Missing LINE Token or Target ID" };
  }

  var statusColors = {
    'completed': '#059669',
    'in_progress': '#0284C7',
    'review': '#D97706',
    'pending': '#475569',
    'issue': '#E11D48'
  };

  var statusLabels = {
    'completed': 'เสร็จสมบูรณ์ 100%',
    'in_progress': 'กำลังดำเนินการ',
    'review': 'รอตรวจรับมอบงาน',
    'pending': 'รอดำเนินการ',
    'issue': 'มีปัญหา/ต้องแก้ไข'
  };

  var status = (job.status || 'pending').toLowerCase();
  var color = statusColors[status] || '#0284C7';
  var statusBadge = statusLabels[status] || 'อัพเดทงาน';
  var topHeader = headerLabel || '🔔 อัพเดทสถานะงานหน้างาน';

  var heroImage = (job.photos && job.photos.length > 0 && job.photos[0].url && job.photos[0].url.startsWith('http'))
    ? job.photos[0].url
    : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';

  var mapUrl = job.location ? ('https://www.google.com/maps?q=' + job.location.lat + ',' + job.location.lng) : 'https://maps.google.com';
  var phoneUri = 'tel:' + String(job.phoneNumber || '').replace(/[^0-9]/g, '');

  var flexBubble = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": color,
      "paddingAll": "16px",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": topHeader, "weight": "bold", "color": "#FFFFFF", "size": "sm", "flex": 1, "wrap": true },
            { "type": "text", "text": statusBadge, "weight": "bold", "color": "#FFFFFF", "size": "xs", "align": "end" }
          ]
        },
        { "type": "text", "text": String(job.title || "งานหน้างาน"), "weight": "bold", "color": "#FFFFFF", "size": "lg", "wrap": true, "margin": "md" },
        { "type": "text", "text": "รหัสงาน: " + (job.jobCode || "-") + " • " + (job.date || "") + " " + (job.time || ""), "color": "#E0E7FF", "size": "xs", "margin": "xs" }
      ]
    },
    "hero": {
      "type": "image",
      "url": heroImage,
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover",
      "action": { "type": "uri", "label": "ดูรูปภาพ", "uri": heroImage }
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "18px",
      "spacing": "md",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "👤 ผู้ติดต่อ", "size": "xs", "color": "#64748B", "flex": 3 },
            { "type": "text", "text": (job.contactPerson || "-") + " (" + (job.phoneNumber || "-") + ")", "size": "xs", "color": "#1E293B", "weight": "bold", "flex": 7, "wrap": true }
          ]
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "🏷️ แบรนด์/สินค้า", "size": "xs", "color": "#64748B", "flex": 3 },
            { "type": "text", "text": (job.productBrand || "-") + " - " + (job.productDetails || "-"), "size": "xs", "color": "#1E293B", "weight": "bold", "flex": 7, "wrap": true }
          ]
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "💰 ยอดเงิน & ชำระ", "size": "xs", "color": "#64748B", "flex": 3 },
            { "type": "text", "text": "฿" + Number(job.price || 0).toLocaleString() + " (" + (job.paymentType || "เงินสด") + ")", "size": "xs", "color": "#059669", "weight": "bold", "flex": 7 }
          ]
        },
        {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            { "type": "text", "text": "📍 พิกัดหน้างาน", "size": "xs", "color": "#64748B", "flex": 3 },
            { "type": "text", "text": (job.location && job.location.address) || "พิกัด GPS", "size": "xs", "color": "#0284C7", "flex": 7, "wrap": true }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "paddingAll": "14px",
      "contents": [
        {
          "type": "box",
          "layout": "horizontal",
          "spacing": "sm",
          "contents": [
            { "type": "button", "style": "primary", "color": "#0284C7", "height": "sm", "action": { "type": "uri", "label": "🗺️ แผนที่ GPS", "uri": mapUrl } },
            { "type": "button", "style": "secondary", "height": "sm", "action": { "type": "uri", "label": "📞 โทรออก", "uri": phoneUri } }
          ]
        },
        { "type": "text", "text": "ระบบรายงานโดย " + (companyName || "JobTracker Pro"), "size": "xxs", "color": "#94A3B8", "align": "center", "margin": "xs" }
      ]
    }
  };

  var payload = {
    "to": targetId,
    "messages": [
      {
        "type": "flex",
        "altText": "[" + statusBadge + "] " + (job.title || "งานหน้างาน"),
        "contents": flexBubble
      }
    ]
  };

  var options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_CHANNEL_ACCESS_TOKEN
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
  return response.getContentText();
}

// 🧪 ทดสอบส่ง Flex เข้า Group ได้ทันทีในหน้า Apps Script
function testLinePushToGroup() {
  var sampleJob = {
    jobCode: "JOB-2026-TEST",
    title: "ทดสอบการส่งการ์ด LINE Flex เข้ากลุ่ม",
    status: "in_progress",
    contactPerson: "คุณสมชาย",
    phoneNumber: "081-234-5678",
    productBrand: "SCG",
    productDetails: "งานติดตั้งสมาร์ทบอร์ด",
    price: 15500,
    paymentType: "เงินสด",
    location: { address: "กรุงเทพมหานคร", lat: 13.7563, lng: 100.5018 },
    date: "2026-09-12",
    time: "10:30"
  };
  var result = pushLineFlex(LINE_TARGET_GROUP_ID, sampleJob, "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🧪 ทดสอบส่ง Flex เข้ากลุ่ม");
  Logger.log("Result: " + result);
}
`;
};

/**
 * ดึงข้อมูลงานทั้งหมดจาก Google Sheets ผ่าน Apps Script Web App (doGet)
 */
export const fetchJobsFromGoogleSheets = async (webAppUrl: string): Promise<{ success: boolean; data?: JobItem[]; message: string }> => {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'กรุณาระบุ URL Google Apps Script ให้ถูกต้อง' };
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      return { success: false, message: `ไม่สามารถดึงข้อมูลได้ (HTTP ${response.status})` };
    }

    const result = await response.json();
    if (result.status === 'success' && Array.isArray(result.data)) {
      return {
        success: true,
        data: result.data,
        message: `ดึงข้อมูลจาก Google Sheets สำเร็จ (${result.data.length} รายการ)`,
      };
    } else {
      return {
        success: false,
        message: result.message || 'โครงสร้างข้อมูลตอบกลับจาก Google Sheet ไม่ถูกต้อง',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets: ${err.message || err}`,
    };
  }
};

/**
 * บันทึกงาน (1 งาน หรือ หลายงาน) ขึ้น Google Sheets ผ่าน Apps Script Web App (doPost)
 */
export const saveJobToGoogleSheets = async (
  webAppUrl: string,
  jobOrJobs: JobItem | JobItem[]
): Promise<{ success: boolean; message: string }> => {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'กรุณาระบุ URL Google Apps Script ให้ถูกต้อง' };
  }

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(jobOrJobs),
    });

    return {
      success: true,
      message: 'ส่งข้อมูลไปยัง Google Sheets เรียบร้อย',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกลง Google Sheets ไม่สำเร็จ: ${err.message || err}`,
    };
  }
};

export type JobTriggerType = 'new_job' | 'status_update' | 'edit_job' | 'manual_send';

/**
 * ฟังก์ชันหลัก: บันทึกลง Google Sheets และส่ง LINE Flex Message ตาม Trigger Type
 * 1. manual_send = กดส่งเอง
 * 2. new_job = เมื่อมีการบันทึกงานใหม่
 * 3. status_update = เมื่ออัพเดตสถานะของงาน
 * 4. edit_job = เมื่อแก้ไขรายละเอียดงาน
 */
export const saveAndNotifyJob = async (
  webAppUrl: string,
  job: JobItem,
  triggerType: JobTriggerType,
  options?: {
    targetId?: string;
    companyName?: string;
    customEventLabel?: string;
    sendLine?: boolean;
  }
): Promise<{ success: boolean; message: string }> => {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'กรุณาระบุ URL Google Apps Script ให้ถูกต้อง' };
  }

  let eventLabel = options?.customEventLabel;
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

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: triggerType === 'manual_send' ? 'send_line' : 'save_and_notify',
        triggerType: triggerType,
        job: job,
        targetId: options?.targetId || 'C341417bcb6e853c320eaf9d80963cda3',
        companyName: options?.companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
        eventLabel: eventLabel,
        sendLine: options?.sendLine !== false,
      }),
    });

    let successMsg = 'บันทึกข้อมูลเข้า Google Sheets และส่ง LINE Flex สำเร็จ!';
    if (triggerType === 'manual_send') {
      successMsg = 'ส่ง LINE Flex Message เข้ากลุ่มเรียบร้อยแล้ว!';
    } else if (triggerType === 'new_job') {
      successMsg = 'บันทึกงานใหม่ลง Google Sheets และส่งแจ้งเตือนเข้ากลุ่ม LINE เรียบร้อย!';
    } else if (triggerType === 'status_update') {
      successMsg = 'อัพเดทสถานะลง Google Sheets และส่ง LINE Flex แจ้งเตือนเข้ากลุ่มแล้ว!';
    }

    return {
      success: true,
      message: successMsg,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err.message || err}`,
    };
  }
};

/**
 * ส่ง LINE Flex Message ผ่าน Google Apps Script Web App (สำหรับกดส่งเอง)
 */
export const sendLineFlexViaAppsScript = async (
  webAppUrl: string,
  job: JobItem,
  targetId: string,
  companyName: string,
  customHeader?: string
): Promise<{ success: boolean; message: string }> => {
  return saveAndNotifyJob(webAppUrl, job, 'manual_send', {
    targetId,
    companyName,
    customEventLabel: customHeader || '📋 รายงานข้อมูลงานหน้างาน',
    sendLine: true,
  });
};
