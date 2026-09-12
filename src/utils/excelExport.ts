import * as XLSX from 'xlsx';
import { JobItem } from '../types';
import { getStatusConfig, getPaymentTypeConfig } from './formatters';

/**
 * Export all jobs to a clean Microsoft Excel (.xlsx) workbook
 */
export const exportJobsToExcel = (jobs: JobItem[], filename = 'JobTracker_Report.xlsx') => {
  if (!jobs || jobs.length === 0) {
    throw new Error('ไม่มีข้อมูลงานสำหรับ Export');
  }

  // 1. Prepare Main Data Table
  const rows = jobs.map((job, index) => {
    const mapsLink =
      job.location?.lat && job.location?.lng
        ? `https://www.google.com/maps/search/?api=1&query=${job.location.lat},${job.location.lng}`
        : '';

    const photoUrls = (job.photos || [])
      .map((p) => p.url)
      .filter((url) => url && (url.startsWith('http://') || url.startsWith('https://')))
      .join(' \n');

    return {
      'ลำดับ (No.)': index + 1,
      'รหัสงาน (Job Code)': job.jobCode || '',
      'ชื่องาน / สถานที่': job.title || '',
      'สถานะงาน': getStatusConfig(job.status).label,
      'ผู้ติดต่อ': job.contactPerson || '',
      'เบอร์โทรศัพท์': job.phoneNumber || '',
      'วันที่': job.date || '',
      'เวลา': job.time || '',
      'ช่างผู้รับผิดชอบ': job.assignedTo || '-',
      'แบรนด์สินค้า': job.productBrand || '-',
      'รายละเอียดสินค้า/รุ่น': job.productDetails || '-',
      'ยอดเงิน (บาท)': job.price || 0,
      'การชำระเงิน': getPaymentTypeConfig(job.paymentType).label,
      'ที่อยู่หน้างาน': job.location?.address || '-',
      'พิกัด Google Maps': mapsLink,
      'จำนวนรูปถ่าย': (job.photos || []).length,
      'ลิงก์รูปถ่าย': photoUrls || '-',
      'หมายเหตุเพิ่มเติม': job.notes || '-',
      'สร้างเมื่อ': job.createdAt ? new Date(job.createdAt).toLocaleString('th-TH') : '-',
      'อัปเดตล่าสุด': job.updatedAt ? new Date(job.updatedAt).toLocaleString('th-TH') : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 14 }, // รหัสงาน
    { wch: 28 }, // ชื่องาน
    { wch: 16 }, // สถานะ
    { wch: 18 }, // ผู้ติดต่อ
    { wch: 15 }, // เบอร์โทร
    { wch: 12 }, // วันที่
    { wch: 10 }, // เวลา
    { wch: 18 }, // ช่าง
    { wch: 16 }, // แบรนด์
    { wch: 24 }, // รายละเอียด
    { wch: 14 }, // ยอดเงิน
    { wch: 16 }, // ชำระเงิน
    { wch: 32 }, // ที่อยู่
    { wch: 35 }, // พิกัด Maps
    { wch: 12 }, // จำนวนรูป
    { wch: 40 }, // ลิงก์รูป
    { wch: 25 }, // หมายเหตุ
    { wch: 20 }, // สร้างเมื่อ
    { wch: 20 }, // อัพเดท
  ];

  // 2. Prepare Summary Sheet
  const totalAmount = jobs.reduce((sum, j) => sum + (j.price || 0), 0);
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const inProgressCount = jobs.filter((j) => j.status === 'in_progress').length;
  const pendingCount = jobs.filter((j) => j.status === 'pending').length;
  const issueCount = jobs.filter((j) => j.status === 'issue').length;

  const summaryRows = [
    { 'หัวข้อสรุปภาพรวม': 'จำนวนงานทั้งหมด', 'ค่า': `${jobs.length} งาน` },
    { 'หัวข้อสรุปภาพรวม': 'งานที่เสร็จสิ้นแล้ว', 'ค่า': `${completedCount} งาน` },
    { 'หัวข้อสรุปภาพรวม': 'งานที่กำลังดำเนินการ', 'ค่า': `${inProgressCount} งาน` },
    { 'หัวข้อสรุปภาพรวม': 'งานรอดำเนินการ', 'ค่า': `${pendingCount} งาน` },
    { 'หัวข้อสรุปภาพรวม': 'งานที่มีปัญหา/ต้องแก้ไข', 'ค่า': `${issueCount} งาน` },
    { 'หัวข้อสรุปภาพรวม': 'ยอดรวมมูลค่างานทั้งหมด (บาท)', 'ค่า': `${totalAmount.toLocaleString('th-TH')} บาท` },
    { 'หัวข้อสรุปภาพรวม': 'วันที่ Export ข้อมูล', 'ค่า': new Date().toLocaleString('th-TH') },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];

  // 3. Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการงานทั้งหมด (Jobs)');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปภาพรวม (Summary)');

  // 4. Download file
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};
