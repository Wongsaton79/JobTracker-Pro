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

// 🏷️ สถานะการเปรียบเทียบราคากับคู่แข่ง (ตามภาพที่ 2: สูงกว่า, ต่ำกว่า, ใกล้เคียง, ไม่แน่ใจ, ไม่สามารถเปิดเผยได้)
export type PriceComparisonOption =
  | 'higher' // สูงกว่า
  | 'lower' // ต่ำกว่า
  | 'similar' // ใกล้เคียง
  | 'uncertain' // ไม่แน่ใจ
  | 'undisclosed'; // ไม่สามารถเปิดเผยได้

export interface CompetitorPriceItem {
  id: string;
  productName: string; // รายการสินค้า เช่น "ปูน SCG เสือ", "ปูนปอร์ตแลนด์"
  ourPrice?: number; // ราคาบริษัท (บาท)
  competitorPrice?: number; // ราคาคู่แข่ง (บาท)
  comparison: PriceComparisonOption;
  note?: string; // หมายเหตุ เช่น "ถูกกว่าไทวัสดุ", "ซื้อผ่านไทวัสดุทั้งหมด"
}

// ⭐ ข้อมูลแบบประเมินความพึงพอใจ การทำงานของทีมขาย (ตรงตามแบบฟอร์มจริงจากรูปภาพ 100%)
export interface SalesEvaluation {
  id: string;
  evaluationCode: string; // รหัสใบประเมิน เช่น "EVAL-2026-001"
  date: string; // วันที่ประเมิน เช่น YYYY-MM-DD
  jobId?: string; // รหัสงานหน้างานที่เชื่อมโยง (ถ้ามี)
  jobCode?: string; // เช่น JOB-2026-001
  projectName?: string; // ชื่อโครงการ / หน้างาน

  // ข้อมูลลูกค้าและผู้ให้ข้อมูล
  customerName: string; // ชื่อร้านค้า / ลูกค้า เช่น "จิตต์สินโฮม"
  customerPhone?: string;
  evaluatorName: string; // ผู้ให้ข้อมูล / เบอร์ติดต่อ *
  salesRepName: string; // พนักงานขายที่ถูกประเมิน
  branch: 'ตาก' | 'แม่สอด' | string; // สาขา: "สาขา ตาก" หรือ "สาขา แม่สอด"
  contactChannel: 'onsite' | 'line' | 'phone'; // ช่องทางให้ข้อมูล: Onsite, Line, โทรศัพท์

  // ================= ภาพถ่ายหน้างาน & การเช็คอินพิกัด (ไม่บังคับ) =================
  photos?: string[]; // ภาพถ่ายหน้างาน (Base64 หรือ URL)
  checkInLocation?: {
    lat: number;
    lng: number;
    distanceKm?: number; // ระยะทางเทียบจุดอ้างอิงสาขา/หน้างาน (กม.)
    isWithinRange?: boolean; // ระยะไม่เกิน 5 กิโลเมตร
    targetName?: string; // เช่น "สาขา ตาก (ไม่เกิน 5 กม.)"
    timestamp?: string;
  };

  // ================= ส่วนที่ 1: การประเมินคะแนน =================
  // หมวดที่ 1: การสื่อสารกับลูกค้าและการบริการของเซลล์ (คะแนนเต็ม 20 คะแนน)
  // 1.1 เซลล์ให้ข้อมูลสินค้า ราคา และโปรโมชั่น แจ้งกิจกรรม แคมเปญได้ชัดเจน ถูกต้องและรวดเร็ว (คะแนนเต็ม 10 คะแนน)
  q1_1_rating: number; // 0 - 5
  q1_1_score: number; // คำนวณ (rating / 5) * 10 = เต็ม 10 คะแนน
  q1_1_note?: string;

  // 1.2 เซลล์มีความเอาใจใส่ ติดตามงาน เข้าเยี่ยมและติดตามการขายกับลูกค้าอย่างต่อเนื่อง (คะแนนเต็ม 5 คะแนน)
  q1_2_rating: number; // 0 - 5
  q1_2_score: number; // คำนวณ (rating / 5) * 5 = เต็ม 5 คะแนน
  q1_2_note?: string;

  // 1.3 เซลล์ผลักดันสินค้า HVA และ SVP พร้อมอุปกรณ์กลุ่มหลังคา ฝา , ฝ้า และกลุ่มไม้ต่างๆ (คะแนนเต็ม 2.5 คะแนน)
  q1_3_rating: number; // 0 - 5
  q1_3_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q1_3_note?: string;

  // 1.4 มีการเก็บราคาสินค้าคู่แข่ง (คะแนนเต็ม 2.5 คะแนน)
  q1_4_rating: number; // 0 - 5
  q1_4_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q1_4_note?: string;

  // หมวดที่ 2: การรับผิดชอบในหน้าที่ (คะแนนเต็ม 5 คะแนน)
  // 2.1 มีการแจ้งล่วงหน้า ในการจัดส่งสินค้าตรงต่อเวลาตามที่นัดหมาย และอัพเดตเมื่อเกิดปัญหา เช่น ขนส่งอาจล่าช้า เป็นต้น (คะแนนเต็ม 2.5 คะแนน)
  q2_1_rating: number; // 0 - 5
  q2_1_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q2_1_note?: string;

  // 2.2 มีความรับผิดชอบในการติดตามแก้ไขปัญหา และการจัดการปัญหาเฉพาะหน้าได้รวดเร็ว (คะแนนเต็ม 2.5 คะแนน)
  q2_2_rating: number; // 0 - 5
  q2_2_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q2_2_note?: string;

  // หมวดที่ 3: ความประทับใจ (คะแนนเต็ม 5 คะแนน)
  // 3.1 เข้าพบอย่างสม่ำเสมอ เดือนละ 2-3 ครั้ง ติดตามอัพเดตยอดขายและสิทธิประโยชน์อย่างต่อเนื่อง (คะแนนเต็ม 2.5 คะแนน)
  q3_1_rating: number; // 0 - 5
  q3_1_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q3_1_note?: string;

  // 3.2 ใส่ใจบริการ มีท่าทีสุภาพเรียบร้อย เป็นกันเอง (คะแนนเต็ม 2.5 คะแนน)
  q3_2_rating: number; // 0 - 5
  q3_2_score: number; // คำนวณ (rating / 5) * 2.5 = เต็ม 2.5 คะแนน
  q3_2_note?: string;

  // ================= ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback (ตามภาพที่ 2) =================
  // 1. ข้อมูลราคาสินค้า & feedback โปรโมชั่นต่างๆ โดยรวมอยู่ในเกณฑ์ สูงกว่า, ต่ำกว่า, ใกล้เคียง, ไม่แน่ใจ, ไม่สามารถเปิดเผยได้ กับคู่แข่ง
  feedbackPriceAndPromo: PriceComparisonOption;
  feedbackPriceNote?: string;

  // 2. ตารางเก็บราคาสินค้า อย่างน้อย 3 รายการ (สูงสุด 10 รายการ)
  competitorPriceItems: CompetitorPriceItem[];

  // 3. สินค้าที่ลูกค้าสนใจ และอยากให้ทางบริษัทฯ ทำราคาให้คือ (5 รายการ)
  interestedProducts: string[];

  // 4. ข้อเสนอแนะเพิ่มเติม
  additionalFeedback?: string;

  // ผู้ให้ข้อมูลและลงนาม
  signatureName?: string; // ลายเซ็นผู้ให้ข้อมูล

  // ================= ผลการคำนวณคะแนน =================
  section1Score: number; // คะแนนหมวด 1: การสื่อสารและการบริการ (เต็ม 20)
  section2Score: number; // คะแนนหมวด 2: การรับผิดชอบในหน้าที่ (เต็ม 5)
  section3Score: number; // คะแนนหมวด 3: ความประทับใจ (เต็ม 5)
  rawTotalScore: number; // รวมคะแนนเต็ม 30 คะแนน
  totalScore: number; // คะแนนเต็ม 30 คะแนน = section1 + section2 + section3
  scoreOutOf20?: number; // คะแนนเทียบเต็ม 20 (สำรอง)
  percentageScore: number; // ร้อยละความพึงพอใจ = (totalScore / 30) * 100
  gradeLabel: string; // เช่น 'ดีมาก (27-30 คะแนน)', 'ดี (24-26.9 คะแนน)', 'ปานกลาง (18-23.9 คะแนน)', 'ควรปรับปรุง (<18 คะแนน)'
  gradeColor: 'emerald' | 'blue' | 'amber' | 'rose';

  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}
