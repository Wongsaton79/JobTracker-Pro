import { SalesEvaluation } from '../types';
import { computeEvaluationScores } from '../utils/evaluationCalculator';

const eval1Scores = computeEvaluationScores({
  q1_1_rating: 5,
  q1_2_rating: 5,
  q1_3_rating: 4,
  q1_4_rating: 5,
  q2_1_rating: 4,
  q2_2_rating: 5,
  q3_1_rating: 5,
  q3_2_rating: 5,
});

const eval2Scores = computeEvaluationScores({
  q1_1_rating: 4,
  q1_2_rating: 4,
  q1_3_rating: 4,
  q1_4_rating: 4,
  q2_1_rating: 5,
  q2_2_rating: 4,
  q3_1_rating: 4,
  q3_2_rating: 5,
});

export const INITIAL_EVALUATIONS: SalesEvaluation[] = [
  {
    id: 'eval-2026-001',
    evaluationCode: 'EVAL-2026-001',
    date: '2026-09-14',
    jobId: 'job-1',
    jobCode: 'JOB-2026-001',
    projectName: 'ร้านจิตต์สินโฮม (ตัวแทนจำหน่ายวัสดุก่อสร้าง)',
    customerName: 'ร้านจิตต์สินโฮม',
    customerPhone: '081-998-7766',
    evaluatorName: 'คุณจิตต์สิน (เจ้าของร้าน)',
    salesRepName: 'ธนากร (ทีมขายวัสดุโครงการและร้านค้า)',
    contactChannel: 'onsite',

    // หมวดที่ 1: การสื่อสารกับลูกค้าและการบริการของเซลล์ (เต็ม 20 คะแนน)
    q1_1_rating: 5,
    q1_1_score: eval1Scores.q1_1_score,
    q1_1_note: 'แจ้งโปรโมชั่นและราคาได้ชัดเจน ครบถ้วน',

    q1_2_rating: 5,
    q1_2_score: eval1Scores.q1_2_score,
    q1_2_note: 'เข้ามาติดตามยอดขายสม่ำเสมอ',

    q1_3_rating: 4,
    q1_3_score: eval1Scores.q1_3_score,
    q1_3_note: 'กลุ่มหลังคา ฝา ฝ้า มีแนะนำต่อเนื่อง',

    q1_4_rating: 5,
    q1_4_score: eval1Scores.q1_4_score,
    q1_4_note: 'มีการสืบราคาคู่แข่งไทวัสดุเป็นประจำ',

    // หมวดที่ 2: การรับผิดชอบในหน้าที่ (เต็ม 5 คะแนน)
    q2_1_rating: 4,
    q2_1_score: eval1Scores.q2_1_score,
    q2_1_note: 'แจ้งเวลาขนส่งล่วงหน้า',

    q2_2_rating: 5,
    q2_2_score: eval1Scores.q2_2_score,
    q2_2_note: 'แก้ปัญหาเฉพาะหน้าหน้างานได้ดี',

    // หมวดที่ 3: ความประทับใจ (เต็ม 5 คะแนน)
    q3_1_rating: 5,
    q3_1_score: eval1Scores.q3_1_score,
    q3_1_note: 'เข้าพบเดือนละ 2-3 ครั้งตามนัด',

    q3_2_rating: 5,
    q3_2_score: eval1Scores.q3_2_score,
    q3_2_note: 'สุภาพ เรียบร้อย เป็นกันเอง',

    // ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback
    feedbackPriceAndPromo: 'lower',
    feedbackPriceNote: 'ราคาโปรโมชั่นบางกลุ่มสินค้าต่ำกว่าคู่แข่ง',
    competitorPriceItems: [
      {
        id: 'comp-1',
        productName: 'ปูน SCG เสือ ก่อ-ฉาบ-เท (50 กก.)',
        ourPrice: 135,
        competitorPrice: 138,
        comparison: 'lower',
        note: 'ถูกกว่าไทวัสดุ',
      },
      {
        id: 'comp-2',
        productName: 'ปูนปอร์ตแลนด์ Type 1',
        ourPrice: 155,
        competitorPrice: 158,
        comparison: 'lower',
        note: 'ซื้อผ่านไทวัสดุ',
      },
      {
        id: 'comp-3',
        productName: 'แผ่นฝ้าทีบาร์ ลายหยาดเพชร',
        ourPrice: 142,
        competitorPrice: 140,
        comparison: 'higher',
        note: 'ราคา 91, ฝ้าเงิน 142 B ไม่รับเข้าสต็อก',
      },
    ],
    interestedProducts: [
      'ปูน SCG เสือ และอุปกรณ์งานปูนสำหรับร้านค้าช่วง',
      'แผ่นฝ้า ฝ้าทีบาร์ ฝ้าฉาบเรียบ',
      'เหล็กเส้นกลมและเหล็กข้ออ้อย มอก.',
      'ไม้ฝาและไม้ระแนงกลุ่มตกแต่ง SCG',
      'กระเบื้องและอุปกรณ์มุงหลังคา',
    ],
    additionalFeedback:
      'ราคาคือ 91, ฝ้าเงิน 142 B จะไม่รับเข้าสต็อก / ควรนำในสต็อกมาปล่อยในราคาเทียบเท่า... แจ้งราคาไม่ปรับราคา ลูกค้าปรับตัวไม่ได้ ลูกค้าไม่ซื้อสต็อก... ซื้อผ่านไทวัสดุทั้งหมด... ปูนนก จากไทวัสดุ',
    signatureName: 'จิตต์สินโฮม (ลงนาม Onsite)',

    section1Score: eval1Scores.section1Score,
    section2Score: eval1Scores.section2Score,
    section3Score: eval1Scores.section3Score,
    rawTotalScore: eval1Scores.rawTotalScore,
    scoreOutOf20: eval1Scores.scoreOutOf20,
    percentageScore: eval1Scores.percentageScore,
    gradeLabel: eval1Scores.gradeLabel,
    gradeColor: eval1Scores.gradeColor,

    createdAt: '2026-09-14T10:30:00Z',
    updatedAt: '2026-09-14T10:30:00Z',
    syncStatus: 'synced',
  },
  {
    id: 'eval-2026-002',
    evaluationCode: 'EVAL-2026-002',
    date: '2026-09-20',
    jobId: 'job-2',
    jobCode: 'JOB-2026-002',
    projectName: 'งานทาสีอาคารพาณิชย์ 3 ชั้น ถนนพหลโยธิน',
    customerName: 'คุณศิริพร เจริญสุข',
    customerPhone: '089-778-9900',
    evaluatorName: 'คุณศิริพร',
    salesRepName: 'สมศักดิ์ (ทีมขายสายเหนือ)',
    contactChannel: 'phone',

    q1_1_rating: 4,
    q1_1_score: eval2Scores.q1_1_score,
    q1_1_note: 'ให้ข้อมูลราคาและโปรโมชั่นครบ',

    q1_2_rating: 4,
    q1_2_score: eval2Scores.q1_2_score,
    q1_2_note: 'ติดตามงานและเยี่ยมเยียน',

    q1_3_rating: 4,
    q1_3_score: eval2Scores.q1_3_score,
    q1_3_note: 'แนะนำกลุ่มไม้และหลังคา',

    q1_4_rating: 4,
    q1_4_score: eval2Scores.q1_4_score,
    q1_4_note: 'เปรียบเทียบราคาสีกับโมเดิร์นเทรด',

    q2_1_rating: 5,
    q2_1_score: eval2Scores.q2_1_score,
    q2_1_note: 'ส่งสินค้าตรงเวลาเป๊ะ',

    q2_2_rating: 4,
    q2_2_score: eval2Scores.q2_2_score,
    q2_2_note: 'แก้ปัญหาเฉดสีได้รวดเร็ว',

    q3_1_rating: 4,
    q3_1_score: eval2Scores.q3_1_score,
    q3_1_note: 'ติดต่อสม่ำเสมอ',

    q3_2_rating: 5,
    q3_2_score: eval2Scores.q3_2_score,
    q3_2_note: 'บริการดีมาก เป็นกันเอง',

    feedbackPriceAndPromo: 'similar',
    feedbackPriceNote: 'ราคาสีน้ำใกล้เคียงกับคู่แข่งโมเดิร์นเทรด',
    competitorPriceItems: [
      {
        id: 'comp-2-1',
        productName: 'สีน้ำทาภายนอก TOA SuperShield ชนิดกึ่งเงา (5 แกลลอน)',
        ourPrice: 2450,
        competitorPrice: 2490,
        comparison: 'similar',
        note: 'ราคาใกล้เคียงไทวัสดุ รังสิต',
      },
    ],
    interestedProducts: [
      'สีรองพื้นปูนเก่าและปูนใหม่',
      'อุปกรณ์ช่างทาสี',
      'ซิลิโคนและหมันโป๊ว',
    ],
    additionalFeedback: 'อยากให้มีรอบโปรโมชั่นสีเพิ่มเติมในไตรมาสหน้า',
    signatureName: 'ศิริพร เจริญสุข',

    section1Score: eval2Scores.section1Score,
    section2Score: eval2Scores.section2Score,
    section3Score: eval2Scores.section3Score,
    rawTotalScore: eval2Scores.rawTotalScore,
    scoreOutOf20: eval2Scores.scoreOutOf20,
    percentageScore: eval2Scores.percentageScore,
    gradeLabel: eval2Scores.gradeLabel,
    gradeColor: eval2Scores.gradeColor,

    createdAt: '2026-09-20T14:15:00Z',
    updatedAt: '2026-09-20T14:15:00Z',
    syncStatus: 'synced',
  },
];
