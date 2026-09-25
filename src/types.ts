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

// 👷 รอบการเข้าหน้างาน (แต่ละรอบเปลี่ยนทีมช่างได้ มีสินค้ากลุ่มเฉพาะได้ และบันทึกการชำระเงินแยกแต่ละรอบได้)
export type RoundPaymentStatus = 'paid' | 'unpaid' | 'partial' | 'credit';

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
  // 💰 การชำระเงินประจำรอบนี้ (จ่ายเงินแยกรายรอบ)
  isPaid?: boolean; // ชำระเงินในรอบนี้แล้วหรือไม่
  paymentStatus?: RoundPaymentStatus; // 'paid' (ชำระแล้ว) | 'unpaid' (ยังไม่ชำระ) | 'partial' (ชำระบางส่วน) | 'credit' (เครดิต/วางบิล)
  paymentType?: PaymentType; // รูปแบบการชำระในรอบนี้ เช่น cash (เงินสด), transfer (เงินโอน), credit_7, credit_15, credit_30, credit_45
  paidAmount?: number; // ยอดเงินที่รับชำระในรอบนี้ (บาท)
  paidDate?: string; // วันที่ชำระเงิน (YYYY-MM-DD)
  paymentProofUrl?: string; // ลิงก์สลิปโอนเงิน หรือรูปถ่ายใบเสร็จ
  paymentNote?: string; // หมายเหตุการชำระเงิน เช่น "ชำระเงินสดหน้างานกับโฟร์แมน", "โอนเข้าบัญชี SCB เรียบร้อย"
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
    | 'delete_job'
    | 'sales_evaluation';
  actionLabel: string; // ข้อความสรุปสั้นๆ เช่น "บันทึกงานใหม่", "เปลี่ยนสถานะงาน", "ประเมินทีมขาย"
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
  totalPaidAmount?: number; // ยอดรวมที่ชำระแล้ว (รวมทุกรอบ)
  remainingAmount?: number; // ยอดคงค้างชำระ (บาท)
  overallPaymentStatus?: 'paid' | 'partial' | 'unpaid' | 'credit'; // สถานะการชำระภาพรวม
  paymentType: PaymentType; // เงินสด / เครดิต (ค่าเริ่มต้น/ภาพรวม)
  notes: string; // หมายเหตุเพิ่มเติม
  assignedTo?: string; // ทีมช่าง / ผู้รับผิดชอบปัจจุบัน
  workRounds?: WorkRound[]; // รอบการเข้าทำงานทั้งหมด (หลายรอบ พร้อมเปลี่ยนทีมช่างและสินค้าต่อรอบ)
  products?: ProductItem[]; // รายการสินค้าทั้งหมด
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

export interface SyncSettings {
  lineChannelAccessToken?: string;
  lineTargetUserId?: string;
  lineTargetGroupId?: string;
  lineRelayUrl?: string; // Cloudflare Worker or Backend Relay URL for GitHub Pages / Static hosting
  autoSendLineFlex: boolean;
  companyName: string;
  currentUser?: string; // ผู้ใช้งานปัจจุบันที่บันทึกข้อมูล
  firebaseProjectId?: string;
}

export interface LineFlexMessagePayload {
  type: 'flex';
  altText: string;
  contents: any;
}

// 🏷️ รายการเปรียบเทียบราคาสินค้ากับคู่แข่ง (ไทวัสดุ, โกลบอลเฮ้าส์, ร้านค้าท้องถิ่น)
export interface CompetitorPriceItem {
  id: string;
  productName: string; // เช่น "ปูนซีเมนต์ปอร์ตแลนด์", "เหล็กเส้นข้ออ้อย SD40", "สีกึ่งเงา TOA Supershield"
  ourPrice?: number; // ราคาของบริษัท (บาท)
  competitorPrice?: number; // ราคาคู่แข่ง (บาท)
  comparison: 'higher' | 'similar' | 'lower' | 'unknown'; // สูงกว่า / ใกล้เคียง / ถูกกว่า / ไม่แน่ใจ
  competitorSource?: string; // แหล่งอ้างอิง เช่น ไทวัสดุ, โกลบอลเฮ้าส์, ดูโฮม, ร้านค้าในพื้นที่
  note?: string; // หมายเหตุเพิ่มเติม
}

// ⭐ ข้อมูลแบบประเมินความพึงพอใจ การทำงานของทีมขาย (Paperless Digital Evaluation Form)
export interface SalesEvaluation {
  id: string;
  evaluationCode: string; // รหัสใบประเมิน เช่น "EVAL-2026-001"
  date: string; // วันที่ประเมิน YYYY-MM-DD
  jobId?: string; // รหัสงานหน้างานที่เชื่อมโยง (ถ้ามี)
  jobCode?: string; // เช่น JOB-2026-001
  projectName?: string; // ชื่อโครงการ / สถานที่
  customerName: string; // ชื่อลูกค้า / ชื่อร้านค้า / บริษัทคู่ค้า
  customerPhone?: string; // เบอร์โทรศัพท์ลูกค้า
  customerPosition?: string; // ตำแหน่งของผู้ให้ข้อมูล (เช่น เจ้าของกิจการ, ผู้จัดการฝ่ายจัดซื้อ, โฟร์แมน)
  evaluatorName: string; // ชื่อผู้ประเมิน / ผู้ให้คะแนน
  salesRepName: string; // ชื่อพนักงานขาย / ทีมขายที่ถูกประเมิน
  salesDepartment?: string; // แผนก / โซนการขาย (เช่น ทีมขายกรุงเทพฯ-ปริมณฑล, ทีมขายต่างจังหวัด)
  contactChannel: 'visit' | 'phone' | 'line' | 'email' | 'other'; // ช่องทางการติดต่อเข้าพบ

  // หมวดที่ 1: ด้านบุคลิกภาพและการให้บริการ (1-5)
  scorePoliteness: number; // 1.1 ความสุภาพ อ่อนน้อม การแต่งกาย และกิริยามารยาท
  scorePunctuality: number; // 1.2 ความตรงต่อเวลา และความสม่ำเสมอในการเข้าพบ/ติดตามงาน
  scoreEnthusiasm: number; // 1.3 ความกระตือรือร้น ความใส่ใจ และความพร้อมในการให้บริการ

  // หมวดที่ 2: ด้านความรู้เกี่ยวกับสินค้าและคำแนะนำ (1-5)
  scoreProductKnowledge: number; // 2.1 ความรู้ ความเข้าใจในรายละเอียดและคุณสมบัติสินค้า
  scoreConsultation: number; // 2.2 ความสามารถในการให้คำแนะนำ ตอบข้อซักถาม และเสนอแนะสินค้าที่ตรงความต้องการ
  scorePromotionUpdate: number; // 2.3 การแจ้งข่าวสาร โปรโมชั่น สิทธิประโยชน์ และสินค้าใหม่ๆ

  // หมวดที่ 3: ด้านความรวดเร็วและการประสานงาน (1-5)
  scoreQuotationSpeed: number; // 3.1 ความรวดเร็วและถูกต้องในการจัดส่งใบเสนอราคา (Quotation)
  scoreFollowUp: number; // 3.2 การติดตามสถานะคำสั่งซื้อ การจัดส่งสินค้า และการอัพเดทความคืบหน้า
  scoreProblemSolving: number; // 3.3 การประสานงานแก้ไขปัญหาเฉพาะหน้า และบริการหลังการขาย

  // หมวดที่ 4: การประเมินด้านราคาและความสามารถในการแข่งขันในตลาด
  overallPriceComparison: 'higher' | 'similar' | 'lower' | 'unknown'; // ภาพรวมราคาเมื่อเทียบกับคู่แข่ง
  competitorPriceItems: CompetitorPriceItem[]; // ตารางเปรียบเทียบราคาสินค้าแต่ละรายการ
  scorePaymentTerms: number; // 4.1 ความพึงพอใจต่อเงื่อนไขการชำระเงินและเครดิตเทอม (1-5)

  // หมวดที่ 5: ข้อเสนอแนะและการตัดสินใจในอนาคต
  futurePurchaseIntent: 'continuous' | 'compare_case_by_case' | 'pause' | 'no'; // การสั่งซื้อในอนาคต
  strengthsFeedback?: string; // จุดเด่นที่ประทับใจของทีมขาย
  improvementFeedback?: string; // สิ่งที่ต้องการให้ปรับปรุง พัฒนา หรือสนับสนุนเพิ่มเติม
  signatureName?: string; // ชื่อผู้ลงนามรับรอง

  // ผลการคำนวณคะแนน
  totalScore: number; // คะแนนรวม (เต็ม 50: 10 ข้อ x 5)
  maxPossibleScore: number; // คะแนนเต็ม (50)
  averageScore: number; // คะแนนเฉลี่ย (เต็ม 5.0)
  percentageScore: number; // ร้อยละความพึงพอใจ (0 - 100%)
  gradeLabel: string; // เช่น 'ยอดเยี่ยม (90-100%)', 'ดีมาก (80-89%)', 'ดี (70-79%)', 'ปานกลาง (60-69%)', 'ต้องปรับปรุง (<60%)'
  gradeColor: 'emerald' | 'blue' | 'amber' | 'rose';

  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}
