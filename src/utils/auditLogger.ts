import { AuditLogEntry } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'jobtracker_audit_logs_v1';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-12T09:15:00Z',
    userName: 'สมหมาย (หัวหน้าช่าง)',
    action: 'status_change',
    actionLabel: 'เปลี่ยนสถานะงาน',
    jobCode: 'JOB-2026-001',
    jobTitle: 'งานเทพื้นคอนกรีตเสริมเหล็กและปูกระเบื้อง โกดังบางนา',
    details: 'เปลี่ยนสถานะจาก "เสนอราคา" เป็น "ปิดการขาย" ยอดเงินรวม 88,500 บาท',
    statusBefore: 'quotation',
    statusAfter: 'closed_deal',
  },
  {
    id: 'log-2',
    timestamp: '2026-09-12T08:30:00Z',
    userName: 'วิทย์ (ช่างปูน)',
    action: 'add_work_round',
    actionLabel: 'เพิ่มรอบเข้าหน้างาน & สินค้า',
    jobCode: 'JOB-2026-001',
    jobTitle: 'งานเทพื้นคอนกรีตเสริมเหล็กและปูกระเบื้อง โกดังบางนา',
    details: 'เพิ่มรอบที่ 2 (งานปูกระเบื้องโถง) มอบหมายทีม "ช่างวิทย์ (ทีมงานช่างปูน)" พร้อมเพิ่มสินค้า COTTO 60x60 cm. (45 กล่อง) และปูนกาว SCG แดง (15 ถุง)',
    statusAfter: 'quotation',
  },
  {
    id: 'log-3',
    timestamp: '2026-09-11T16:45:00Z',
    userName: 'นพดล (วิศวกรไฟฟ้า)',
    action: 'add_product',
    actionLabel: 'เพิ่มรายการสินค้า',
    jobCode: 'JOB-2026-003',
    jobTitle: 'ติดตั้งตู้ไฟคอนซูเมอร์ 3 เฟส โรงงานแพรกษา',
    details: 'เพิ่มสินค้า "ตู้คอนซูเมอร์ Schneider Electric 3 Phase 100A + เบรกเกอร์ RCBO" (1 ชุด) ขณะสถานะ "ติดตามซ้ำ"',
    statusAfter: 'follow_up',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-11T14:20:00Z',
    userName: 'เอกชัย (Admin ระบบ)',
    action: 'create_job',
    actionLabel: 'สร้างงานใหม่',
    jobCode: 'JOB-2026-002',
    jobTitle: 'งานทาสีอาคารพาณิชย์ 3 ชั้น ถนนพหลโยธิน',
    details: 'บันทึกข้อมูลหน้างานใหม่ พร้อมพิกัด GPS และรูปถ่ายหน้างาน มอบหมาย "ทีมจัดส่ง สายเหนือ"',
    statusAfter: 'pending',
  },
  {
    id: 'log-5',
    timestamp: '2026-09-11T10:00:00Z',
    userName: 'เอกชัย (Admin ระบบ)',
    action: 'line_notify',
    actionLabel: 'ส่ง LINE Flex Message',
    jobCode: 'JOB-2026-001',
    jobTitle: 'งานเทพื้นคอนกรีตเสริมเหล็กและปูกระเบื้อง โกดังบางนา',
    details: 'ส่งแจ้งเตือนการ์ด Flex Message เข้ากลุ่ม LINE แผนกปฏิบัติการ',
  },
];

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch (err) {
    console.error('Error reading audit logs:', err);
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getAuditLogs();
      const updated = [newLog, ...current].slice(0, 200); // Keep last 200 logs
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving audit log:', err);
    }
  }

  return newLog;
}

export function clearAuditLogs(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  }
}
