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
  const csvContent = '\uFEFF' + exportJobsToCsv(jobs); // Add UTF-8 BOM for Excel/Google Sheets Thai encoding support
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
  return `// ==========================================
// 🚀 Google Apps Script for AppSheet & JobTracker Pro
// วางโค้ดนี้ใน Google Sheet -> ส่วนขยาย (Extensions) -> Apps Script
// ==========================================

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

    var data = JSON.parse(e.postData.contents);
    
    // หากเป็นการส่งข้อมูลก้อนใหญ่ (Sync ทั้งหมด)
    if (Array.isArray(data)) {
      data.forEach(function(job) {
        appendOrUpdateJob(sheet, job);
      });
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: data.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    // หากเป็นการส่งทีละงาน (Real-time Webhook)
    else if (data && data.jobCode) {
      appendOrUpdateJob(sheet, data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", jobCode: data.jobCode }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid payload" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appendOrUpdateJob(sheet, job) {
  var data = sheet.getDataRange().getValues();
  var jobCode = job.jobCode;
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == jobCode) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    job.jobCode,
    job.date,
    job.time,
    job.title,
    job.status,
    job.contactPerson,
    job.phoneNumber,
    job.productBrand,
    job.productDetails || "",
    job.price,
    job.paymentType,
    (job.location && job.location.address) || "",
    (job.location && job.location.lat) || "",
    (job.location && job.location.lng) || "",
    job.location ? ("https://www.google.com/maps?q=" + job.location.lat + "," + job.location.lng) : "",
    (job.photos ? job.photos.length : 0),
    (job.photos ? job.photos.map(function(p){ return p.url; }).join(" | ") : ""),
    job.notes || "",
    job.assignedTo || "",
    new Date().toISOString()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}
`;
};

export const syncWithEndpoint = async (
  endpointUrl: string,
  payload: any
): Promise<{ success: boolean; message: string }> => {
  if (!endpointUrl) {
    return { success: false, message: 'ไม่ได้ระบุ URL ปลายทาง' };
  }

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true, message: 'ส่งข้อมูลไปยังระบบเรียบร้อยแล้ว' };
    } else {
      return {
        success: false,
        message: `ส่งข้อมูลไม่สำเร็จ (HTTP ${response.status})`,
      };
    }
  } catch (err: any) {
    // Note: Due to CORS or Webhook constraints, we catch and report clearly
    console.warn('Sync dispatch error:', err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย หรือติดสิทธิ์ CORS: ${err.message || err}`,
    };
  }
};
