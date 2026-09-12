export type JobStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'issue';

export type PaymentType = 'cash' | 'transfer' | 'credit_30' | 'credit_60' | 'credit_card';

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
  productBrand: string; // แบรนด์สินค้าที่ใช้
  productDetails: string; // ชื่อสินค้า / รุ่น
  price: number; // ราคาเท่าไหร่ (บาท)
  paymentType: PaymentType; // เงินสด / เครดิต
  notes: string; // หมายเหตุเพิ่มเติม
  assignedTo?: string; // ช่าง / ผู้รับผิดชอบ
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
}

export interface LineFlexMessagePayload {
  type: 'flex';
  altText: string;
  contents: any;
}
