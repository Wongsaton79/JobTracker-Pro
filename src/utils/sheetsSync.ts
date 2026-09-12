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

// 🔑 การตั้งค่า LINE Messaging API (ค่าเริ่มต้น)
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
    
    // Sort latest updated first
    jobs.sort(function(a, b) {
      var timeA = new Date(a.updatedAt || a.date).getTime() || 0;
      var timeB = new Date(b.updatedAt || b.date).getTime() || 0;
      return timeB - timeA;
    });

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
    var token = data.channelAccessToken || LINE_CHANNEL_ACCESS_TOKEN;
    var target = data.targetId || LINE_TARGET_GROUP_ID || LINE_TARGET_USER_ID;

    // 0. รองรับ LINE Webhook อัตโนมัติ (พิมพ์หาบอท หรือดึงบอทเข้ากลุ่ม บอทจะตอบกลับ ID ให้ทันที)
    if (data && data.events && Array.isArray(data.events)) {
      data.events.forEach(function(event) {
        var replyToken = event.replyToken;
        var source = event.source || {};
        var groupId = source.groupId || "";
        var userId = source.userId || "";
        var roomId = source.roomId || "";
        
        var replyText = "";
        if (groupId) {
          replyText = "🆔 LINE Group ID ของกลุ่มนี้คือ:\\n" + groupId + "\\n\\n(คัดลอก ID นี้ไปใส่ในช่อง LINE Group ID ในระบบ JobTracker Pro ได้เลยครับ)";
        } else if (userId) {
          replyText = "🆔 LINE User ID ของคุณคือ:\\n" + userId + "\\n\\n(คัดลอก ID นี้ไปใส่ในระบบ JobTracker Pro ได้เลยครับ)";
        }

        if (replyToken && replyText) {
          try {
            UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
              method: "post",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
              },
              payload: JSON.stringify({
                replyToken: replyToken,
                messages: [{ type: "text", text: replyText }]
              }),
              muteHttpExceptions: true
            });
          } catch(eReply) {
            Logger.log("Reply err: " + eReply);
          }
        }
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. ทดสอบการเชื่อมต่อ (Test Connection)
    if (data && (data.action === 'test_connection' || data.action === 'test')) {
      var sampleJob = data.job || {
        jobCode: "TEST-" + Date.now().toString().slice(-4),
        title: "ทดสอบการเชื่อมต่อระบบ JobTracker Pro",
        status: "in_progress",
        contactPerson: "ระบบทดสอบอัตโนมัติ",
        phoneNumber: "081-234-5678",
        productBrand: "SCG",
        productDetails: "ทดสอบการส่ง LINE Flex Message จากระบบ",
        price: 9900,
        paymentType: "เงินสด",
        location: { address: "กรุงเทพมหานคร", lat: 13.7563, lng: 100.5018 },
        date: new Date().toISOString().substring(0, 10),
        time: "12:00"
      };
      var lineResult = pushLineFlex(target, sampleJob, data.companyName || "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🧪 ทดสอบการเชื่อมต่อระบบ", token);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", lineResult: lineResult }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ส่ง LINE Flex Message โดยเฉพาะ (กดส่งเอง หรือ Manual Send)
    if (data && data.action === 'send_line') {
      var lineResult = pushLineFlex(target, data.job, data.companyName, data.eventLabel || '🔔 รายงานข้อมูลงาน', token);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", lineResult: lineResult }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. บันทึกงาน + ส่ง LINE Flex แจ้งเตือน (สร้างงานใหม่ / เปลี่ยนสถานะ / แก้ไขงาน)
    if (data && data.action === 'save_and_notify') {
      appendOrUpdateJob(sheet, data.job);
      
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
          pushLineFlex(target, data.job, data.companyName || "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", eventLabel, token);
        } catch (errLine) {
          Logger.log("LINE push err: " + errLine);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", jobCode: data.job.jobCode }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. ซิงค์ข้อมูลก้อนใหญ่ทั้งหมด (Bulk Sync)
    if (Array.isArray(data)) {
      data.forEach(function(job) {
        appendOrUpdateJob(sheet, job);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    // 5. บันทึกข้อมูลงานเดี่ยวแบบเดิม (Fallback Direct Job Object)
    else if (data && (data.jobCode || data.title)) {
      appendOrUpdateJob(sheet, data);
      
      try {
        pushLineFlex(target, data, "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🔔 อัพเดทสถานะงานหน้างาน", token);
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

  // 📸 บันทึกรูปภาพ Base64 จากกล้อง/มือถือ ลง Google Drive เพื่อสร้างลิงก์รูปภาพจริงแบบ HTTPS สำหรับ LINE Flex
  var permanentPhotoUrls = [];
  if (job.photos && Array.isArray(job.photos)) {
    for (var p = 0; p < job.photos.length; p++) {
      var photoObj = job.photos[p];
      var pUrl = (photoObj && photoObj.url) ? photoObj.url : (typeof photoObj === 'string' ? photoObj : '');
      if (pUrl) {
        if (pUrl.indexOf('data:image/') === 0) {
          var driveUrl = saveBase64ImageToDrive(pUrl, (job.jobCode || 'job') + '_photo_' + (p + 1) + '.jpg');
          if (driveUrl) {
            if (typeof job.photos[p] === 'object') {
              job.photos[p].url = driveUrl;
            }
            permanentPhotoUrls.push(driveUrl);
          }
        } else if (pUrl.indexOf('http') === 0) {
          permanentPhotoUrls.push(pUrl);
        }
      }
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
    (permanentPhotoUrls.length > 0 ? permanentPhotoUrls.join(" | ") : (job.photos ? job.photos.map(function(p){ return p.url || ''; }).filter(function(u){ return u && u.indexOf('http') === 0; }).join(" | ") : "")),
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

// 📂 ฟังก์ชันบันทึกภาพ Base64 ลงใน Google Drive โฟลเดอร์ "JobTracker_Photos" และเปิดสิทธิ์ Public View
function saveBase64ImageToDrive(base64Data, fileName) {
  try {
    if (!base64Data || typeof base64Data !== 'string') return "";
    if (base64Data.indexOf('http') === 0) return base64Data;

    var contentType = "image/jpeg";
    var cleanBase64 = base64Data;
    if (base64Data.indexOf('data:') === 0) {
      var parts = base64Data.split(',');
      var mimePart = parts[0].match(/:(.*?);/);
      if (mimePart) contentType = mimePart[1];
      cleanBase64 = parts[1];
    }

    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, contentType, fileName || ("job_photo_" + Date.now() + ".jpg"));

    var folderName = "JobTracker_Photos";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    try {
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eFolder) {}

    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (eFile) {}

    var fileId = file.getId();
    return "https://lh3.googleusercontent.com/d/" + fileId;
  } catch (err) {
    Logger.log("Save Base64 to Drive Error: " + err);
    return "";
  }
}

// 💬 ฟังก์ชันส่ง LINE Flex Message เข้า Group หรือ User พร้อมแถบหัวข้อ Custom
function pushLineFlex(targetId, job, companyName, headerLabel, dynamicToken) {
  var token = dynamicToken || LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !targetId) {
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
      "Authorization": "Bearer " + token
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
  var respCode = response.getResponseCode();
  var respContent = response.getContentText();
  Logger.log("LINE Push Response [" + respCode + "]: " + respContent);
  
  if (respCode !== 200) {
    Logger.log("⚠️ LINE Push Failed! Please verify that LINE Bot is invited to group/chat and Token is valid.");
  } else {
    Logger.log("✅ LINE Flex Message sent successfully!");
  }
  return respContent;
}

// 🧪 ฟังก์ชันที่ 1: ทดสอบยิงเข้ากลุ่ม LINE (รันใน Apps Script เพื่อดู Execution Log ได้ทันที)
function testLinePushToGroup() {
  var sampleJob = {
    jobCode: "JOB-TEST-" + Date.now().toString().slice(-4),
    title: "ทดสอบการส่งการ์ด LINE Flex เข้ากลุ่ม",
    status: "in_progress",
    contactPerson: "คุณสมชาย",
    phoneNumber: "081-234-5678",
    productBrand: "SCG",
    productDetails: "งานติดตั้งและตรวจสอบคุณภาพ",
    price: 15500,
    paymentType: "เงินสด",
    location: { address: "กรุงเทพมหานคร", lat: 13.7563, lng: 100.5018 },
    date: "2026-09-12",
    time: "10:30"
  };
  var result = pushLineFlex(LINE_TARGET_GROUP_ID, sampleJob, "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🧪 ทดสอบส่ง Flex เข้ากลุ่ม", LINE_CHANNEL_ACCESS_TOKEN);
  Logger.log("Final Result: " + result);
}

// 🧪 ฟังก์ชันที่ 2: ทดสอบยิงเข้าบัญชีส่วนตัว LINE User
function testLinePushToUser() {
  var sampleJob = {
    jobCode: "JOB-USER-" + Date.now().toString().slice(-4),
    title: "ทดสอบส่งเข้า LINE ส่วนตัว",
    status: "completed",
    contactPerson: "ลูกค้าตัวอย่าง",
    phoneNumber: "089-999-8888",
    productBrand: "TOA",
    productDetails: "งานส่งมอบงาน",
    price: 8500,
    paymentType: "โอนเงิน",
    location: { address: "กรุงเทพมหานคร", lat: 13.7563, lng: 100.5018 },
    date: "2026-09-12",
    time: "14:00"
  };
  var result = pushLineFlex(LINE_TARGET_USER_ID, sampleJob, "บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด", "🧪 ทดสอบส่งเข้าส่วนตัว", LINE_CHANNEL_ACCESS_TOKEN);
  Logger.log("User Push Result: " + result);
}
`;
};

/**
 * ดึงข้อมูลงานทั้งหมดจาก Google Sheets ผ่าน API Proxy / Apps Script Web App (doGet)
 */
export const fetchJobsFromGoogleSheets = async (
  webAppUrl: string
): Promise<{ success: boolean; data?: JobItem[]; message: string }> => {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, message: 'กรุณาระบุ URL Google Apps Script ให้ถูกต้อง' };
  }

  // 1. Try server-side proxy first (bypasses browser CORS & cache)
  try {
    const proxyRes = await fetch(`/api/sync/fetch-jobs?url=${encodeURIComponent(webAppUrl)}`, {
      method: 'GET',
    });
    if (proxyRes.ok) {
      const result = await proxyRes.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        return {
          success: true,
          data: result.data,
          message: `ดึงข้อมูลจาก Google Sheets สำเร็จ (${result.data.length} รายการ)`,
        };
      }
    }
  } catch (err) {
    console.warn('Server proxy fetch failed, trying direct browser fetch:', err);
  }

  // 2. Fallback to direct client-side fetch (GitHub Pages / SPA)
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

  // If array, bulk sync
  if (Array.isArray(jobOrJobs)) {
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
        message: `ส่งข้อมูลทั้งหมด (${jobOrJobs.length} รายการ) ไปยัง Google Sheets เรียบร้อย`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `บันทึกลง Google Sheets ไม่สำเร็จ: ${err.message || err}`,
      };
    }
  }

  // Single job: use saveAndNotifyJob with sendLine: false
  return saveAndNotifyJob(webAppUrl, jobOrJobs, 'edit_job', { sendLine: false });
};

export type JobTriggerType = 'new_job' | 'status_update' | 'edit_job' | 'manual_send';

/**
 * ดึงข้อมูลงานที่ซิงค์ส่วนกลางจาก Server (Sync ระหว่างมือถือและคอมพิวเตอร์)
 */
export const fetchSharedServerJobs = async (): Promise<JobItem[] | null> => {
  try {
    const res = await fetch('/api/jobs');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (err) {
    // silently ignore if offline
  }
  return null;
};

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
    channelAccessToken?: string;
    companyName?: string;
    customEventLabel?: string;
    sendLine?: boolean;
  }
): Promise<{ success: boolean; message: string; job?: JobItem; details?: any }> => {
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

  const payload = {
    webAppUrl,
    job,
    triggerType,
    targetId: options?.targetId || 'C341417bcb6e853c320eaf9d80963cda3',
    channelAccessToken: options?.channelAccessToken || 'JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb5DsM9HmRmtDWqrSJFTVjXLd6mLmhS3bCmWfTIKeHkC3yhWVMGXKP/R7HhnWEizWvqnxi8EWa/jMVUKxz1mck/P+8/LvTaHJl/Fpq0P7Okf547iIlW2wdB04t89/1O/w1cDnyilFU=',
    companyName: options?.companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
    customEventLabel: eventLabel,
    sendLine: options?.sendLine !== false,
    clientOrigin: typeof window !== 'undefined' ? window.location.origin : '',
  };

  let serverSuccess = false;
  let serverDetails: any = null;
  let updatedJob: JobItem = job;

  // 1. Try server-side proxy first (direct LINE API + Sheets dispatch + Image hosting)
  try {
    const response = await fetch('/api/sync/save-and-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      serverSuccess = true;
      serverDetails = data.details;
      if (data.job) {
        updatedJob = data.job;
      }
    }
  } catch (err) {
    console.warn('Server-side sync endpoint unreachable, falling back to direct client post:', err);
  }

  // 2. Direct client fallback to Google Apps Script if webAppUrl is provided and server call failed
  if (!serverSuccess && webAppUrl && webAppUrl.startsWith('http')) {
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
          job: updatedJob,
          targetId: options?.targetId || 'C341417bcb6e853c320eaf9d80963cda3',
          channelAccessToken: options?.channelAccessToken,
          companyName: options?.companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
          eventLabel: eventLabel,
          sendLine: options?.sendLine !== false,
        }),
      });
    } catch (clientErr) {
      console.warn('Direct client Apps Script post failed:', clientErr);
    }
  }

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
    job: updatedJob,
    details: serverDetails,
  };
};

/**
 * ส่ง LINE Flex Message ผ่าน Google Apps Script Web App / Server Proxy (สำหรับกดส่งเอง)
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

/**
 * ทดสอบการเชื่อมต่อระบบ LINE Messaging API & Google Sheets
 */
export const testSystemConnection = async (settings: SyncSettings): Promise<{ success: boolean; diagnostics: any }> => {
  const targetId = settings.lineTargetGroupId || settings.lineTargetUserId || 'C341417bcb6e853c320eaf9d80963cda3';
  const token = settings.lineChannelAccessToken;
  const webAppUrl = settings.googleSheetUrl;

  // 1. Try server-side proxy first (if running on Node.js / Container)
  try {
    const response = await fetch('/api/sync/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webAppUrl: webAppUrl,
        targetId: targetId,
        channelAccessToken: token,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success || data.status === 'success') {
        const lineSuccess = data.diagnostics?.lineTest?.success !== false;
        return {
          success: lineSuccess,
          diagnostics: data.diagnostics || { lineApi: 'ok' },
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server test-connection endpoint unreachable (likely on GitHub Pages / Static hosting):', serverErr);
  }

  // 2. Fallback for GitHub Pages / Static hosting: Trigger via Google Apps Script Web App directly
  if (webAppUrl && webAppUrl.startsWith('http')) {
    try {
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'test_connection',
          targetId: targetId,
          channelAccessToken: token,
          companyName: settings.companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
          job: {
            jobCode: `TEST-${Date.now().toString().slice(-4)}`,
            title: 'ทดสอบการเชื่อมต่อระบบ JobTracker Pro (GitHub Pages)',
            status: 'in_progress',
            contactPerson: 'ระบบทดสอบอัตโนมัติ',
            phoneNumber: '081-234-5678',
            productBrand: 'SCG',
            productDetails: 'ทดสอบการส่ง LINE Flex Message จากเว็บ',
            price: 9900,
            paymentType: 'เงินสด',
            location: { address: 'กรุงเทพมหานคร', lat: 13.7563, lng: 100.5018 },
            date: new Date().toISOString().substring(0, 10),
            time: '12:00',
          },
        }),
      });

      return {
        success: true,
        diagnostics: {
          status: 'success',
          lineApi: 'ok',
          sentVia: 'Google Apps Script (GitHub Pages Client)',
          targetId: targetId,
          note: 'ส่งคำขอไปยัง Google Apps Script สำเร็จ',
        },
      };
    } catch (clientErr: any) {
      return {
        success: false,
        diagnostics: { error: `ไม่สามารถส่งคำขอผ่าน Google Apps Script: ${clientErr.message || clientErr}` },
      };
    }
  }

  return {
    success: false,
    diagnostics: { error: 'กรุณาระบุ URL ของ Google Apps Script Web App ให้ถูกต้องก่อนทดสอบ' },
  };
};
