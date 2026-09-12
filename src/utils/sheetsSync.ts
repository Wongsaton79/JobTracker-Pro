import { JobItem, SyncSettings } from '../types';
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
// 🚀 Google Apps Script for JobTracker Pro (Google Sheets Database)
// วางโค้ดนี้ใน Google Sheet -> Extensions (ส่วนขยาย) -> Apps Script
// หลังจากวางแล้วให้กด Deploy -> New deployment -> Web app -> Who has access: Anyone
// ==========================================================

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("${sheetName}") || ss.getSheets()[0];
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var jobs = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // ข้ามแถวที่ไม่มีรหัสงาน
      
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
    
    // หากเป็นการส่งข้อมูลก้อนใหญ่ (Sync ทั้งหมด)
    if (Array.isArray(data)) {
      data.forEach(function(job) {
        appendOrUpdateJob(sheet, job);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    // หากเป็นการส่งทีละงาน (Real-time Save)
    else if (data && (data.jobCode || data.title)) {
      appendOrUpdateJob(sheet, data);
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
    // ใช้ application/x-www-form-urlencoded หรือ raw text payload เพื่อป้องกัน CORS preflight
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
      message: 'ส่งข้อมูลไปยัง Google Sheets สำเร็จเรียบร้อย',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `บันทึกลง Google Sheets ไม่สำเร็จ: ${err.message || err}`,
    };
  }
};
