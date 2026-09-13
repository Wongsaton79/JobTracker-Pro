export type JobStatus =
  | 'pending'
  | 'quotation'
  | 'follow_up'
  | 'closed_deal'
  | 'completed'
  | 'in_progress'
  | 'review'
  | 'issue';

export type PaymentType =
  | 'cash'
  | 'credit_7'
  | 'credit_15'
  | 'credit_30'
  | 'credit_45'
  | 'transfer'
  | 'credit_60'
  | 'credit_card';

export interface JobPhoto {
  id: string;
  url: string; // base64 or hosted URL
  caption?: string;
  tag?: 'before' | 'during' | 'after' | 'site_overview' | 'receipt';
  timestamp: string;
  source: 'camera' | 'gallery';
}

export interface JobLocation {
  address: string;
  lat: number;
  lng: number;
  placeName?: string;
}

// 📦 รายการสินค้าแต่ละชิ้น (บันทึกรายรอบ / พร้อมระบุสถานะขณะเพิ่ม)
export interface ProductItem {
  id: string;
  brand: string; // e.g. "SCG", "TOA", "Daikin", "Schneider"
  name: string; // ชื่อสินค้า / สเปก / รุ่น
  quantity: number; // จำนวน
  unit: string; // หน่วยนับ เช่น ชุด, ถุง, กล่อง, แผ่น, เมตร, ถัง
  unitPrice: number; // ราคาต่อหน่วย
  totalPrice: number; // ราคารวม = quantity * unitPrice
  addedAt: string; // วันที่และเวลาที่บันทึก
  statusAtAdd: JobStatus; // สถานะของงาน ณ เวลาที่เพิ่มสินค้านี้ (เช่น 'pending', 'quotation', 'follow_up', 'closed_deal')
  roundNumber?: number; // เข้าหน้างานรอบที่เท่าไหร่
  roundTitle?: string; // เช่น งานเทพื้น, งานโครงสร้าง, งานสี
  teamName?: string; // ทีมช่างที่รับผิดชอบในรอบนี้
  notes?: string;
}

// 👷 รอบการเข้าหน้างาน (แต่ละรอบเปลี่ยนทีมช่างได้ และมีสินค้ากลุ่มเฉพาะได้)
export interface WorkRound {
  id: string;
  roundNumber: number; // รอบที่ 1, 2, 3...
  title: string; // ชื่องานรอบนี้ เช่น "รอบที่ 1: งานเทพื้นและฐานราก", "รอบที่ 2: งานติดตั้งโครงสร้างเหล็ก"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  teamName: string; // ทีมช่างประจำรอบ เช่น "ทีมช่างปูน (ช่างวิทย์)", "ทีมโครงสร้าง (ช่างเอก)"
  status: JobStatus; // สถานะงานในรอบนี้
  description?: string; // บันทึกรายละเอียดการเข้าหน้างาน
  products: ProductItem[]; // รายการสินค้าที่ใช้ในรอบนี้ (มีกี่ชิ้นก็ได้ หรือไม่มีก็ได้)
  roundTotalCost: number; // ยอดรวมสินค้าในรอบนี้
  createdAt: string;
}

// 📋 บันทึก Log การทำงานของระบบ (Audit Log)
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO datetime
  userName: string; // ชื่อผู้ทำรายการ เช่น "ช่างสมหมาย", "Admin แอดมิน"
  userRole?: string;
  action:
    | 'create_job'
    | 'update_job'
    | 'status_change'
    | 'add_work_round'
    | 'add_product'
    | 'change_team'
    | 'line_notify'
    | 'export_excel'
    | 'delete_job';
  actionLabel: string; // ข้อความสรุปสั้นๆ เช่น "บันทึกงานใหม่", "เปลี่ยนสถานะงาน", "เพิ่มรอบงาน & สินค้า"
  jobId?: string;
  jobCode?: string;
  jobTitle?: string;
  details: string; // รายละเอียดการทำรายการ
  statusBefore?: string;
  statusAfter?: string;
}

export interface JobItem {
  id: string;
  jobCode: string;
  title: string; // ชื่อหน้างาน
  contactPerson: string; // ผู้ติดต่อ
  phoneNumber: string; // เบอร์ติดต่อ
  date: string; // วันที่ YYYY-MM-DD
  time: string; // เวลา HH:mm
  status: JobStatus; // สถานะงาน
  location: JobLocation; // พิกัดและที่อยู่
  photos: JobPhoto[]; // ภาพประกอบหน้างาน
  productBrand: string; // แบรนด์สินค้าหลัก
  productDetails: string; // สรุปสินค้า
  price: number; // ราคาเท่าไหร่ (บาท)
  paymentType: PaymentType; // เงินสด / เครดิต
  notes: string; // หมายเหตุเพิ่มเติม
  assignedTo?: string; // ทีมช่าง / ผู้รับผิดชอบปัจจุบัน
  workRounds?: WorkRound[]; // รอบการเข้าทำงานทั้งหมด (หลายรอบ พร้อมเปลี่ยนทีมช่างและสินค้าต่อรอบ)
  products?: ProductItem[]; // รายการสินค้าทั้งหมด
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export interface SyncSettings {
  googleSheetUrl?: string;
  appSheetWebhookUrl?: string;
  lineNotifyToken?: string;
  lineChannelAccessToken?: string;
  lineTargetUserId?: string;
  lineTargetGroupId?: string;
  autoSyncSheets: boolean;
  autoSendLineFlex: boolean;
  companyName: string;
  currentUser?: string; // ผู้ใช้งานปัจจุบันที่บันทึกข้อมูล
}

export interface LineFlexMessagePayload {
  type: 'flex';
  altText: string;
  contents: any;
}
