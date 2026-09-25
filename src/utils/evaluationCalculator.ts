import { CompetitorPriceItem, SalesEvaluation } from '../types';

export const DEFAULT_COMPETITOR_ITEMS: CompetitorPriceItem[] = [
  {
    id: 'comp-1',
    productName: 'ปูนซีเมนต์ผสม SCG เสือ ก่อ-ฉาบ-เท (50 กก.)',
    ourPrice: 135,
    competitorPrice: 138,
    comparison: 'lower',
    competitorSource: 'ไทวัสดุ บางนา',
    note: 'ราคาถูกกว่าไทวัสดุ 3 บาท/ถุง ลูกค้าพอใจมาก',
  },
  {
    id: 'comp-2',
    productName: 'เหล็กเส้นกลม ผิวเรียบ SR24 ขนาด 9 มม. (มอก.)',
    ourPrice: 168,
    competitorPrice: 165,
    comparison: 'higher',
    competitorSource: 'โกลบอลเฮ้าส์',
    note: 'ราคาสูงกว่าคู่แข่งเล็กน้อย แต่บริการส่งเร็วกว่า',
  },
  {
    id: 'comp-3',
    productName: 'สีน้ำทาภายนอก TOA SuperShield ชนิดกึ่งเงา (5 แกลลอน)',
    ourPrice: 2450,
    competitorPrice: 2490,
    comparison: 'similar',
    competitorSource: 'ร้านค้าวัสดุท้องถิ่น',
    note: 'ราคาใกล้เคียงกัน แต่แถมอุปกรณ์ลูกกลิ้ง',
  },
];

export interface ScoreBreakdown {
  serviceScore: number; // หมวด 1
  serviceAvg: number;
  productScore: number; // หมวด 2
  productAvg: number;
  speedScore: number; // หมวด 3
  speedAvg: number;
  paymentScore: number; // หมวด 4
  paymentAvg: number;
  totalScore: number;
  maxScore: number;
  averageScore: number;
  percentageScore: number;
  gradeLabel: string;
  gradeColor: 'emerald' | 'blue' | 'amber' | 'rose';
}

export function computeEvaluationScores(input: {
  scorePoliteness: number;
  scorePunctuality: number;
  scoreEnthusiasm: number;
  scoreProductKnowledge: number;
  scoreConsultation: number;
  scorePromotionUpdate: number;
  scoreQuotationSpeed: number;
  scoreFollowUp: number;
  scoreProblemSolving: number;
  scorePaymentTerms: number;
}): ScoreBreakdown {
  const serviceScore = (input.scorePoliteness || 5) + (input.scorePunctuality || 5) + (input.scoreEnthusiasm || 5);
  const serviceAvg = Number((serviceScore / 3).toFixed(2));

  const productScore = (input.scoreProductKnowledge || 5) + (input.scoreConsultation || 5) + (input.scorePromotionUpdate || 5);
  const productAvg = Number((productScore / 3).toFixed(2));

  const speedScore = (input.scoreQuotationSpeed || 5) + (input.scoreFollowUp || 5) + (input.scoreProblemSolving || 5);
  const speedAvg = Number((speedScore / 3).toFixed(2));

  const paymentScore = input.scorePaymentTerms || 5;
  const paymentAvg = Number(paymentScore.toFixed(2));

  const totalScore = serviceScore + productScore + speedScore + paymentScore;
  const maxScore = 50;
  const averageScore = Number((totalScore / 10).toFixed(2));
  const percentageScore = Math.round((totalScore / maxScore) * 100);

  let gradeLabel = 'ยอดเยี่ยม (90-100%)';
  let gradeColor: 'emerald' | 'blue' | 'amber' | 'rose' = 'emerald';

  if (percentageScore >= 90) {
    gradeLabel = 'ยอดเยี่ยม (90-100%)';
    gradeColor = 'emerald';
  } else if (percentageScore >= 80) {
    gradeLabel = 'ดีมาก (80-89%)';
    gradeColor = 'blue';
  } else if (percentageScore >= 70) {
    gradeLabel = 'ดี (70-79%)';
    gradeColor = 'blue';
  } else if (percentageScore >= 60) {
    gradeLabel = 'ปานกลาง (60-69%)';
    gradeColor = 'amber';
  } else {
    gradeLabel = 'ต้องปรับปรุงเร่งด่วน (<60%)';
    gradeColor = 'rose';
  }

  return {
    serviceScore,
    serviceAvg,
    productScore,
    productAvg,
    speedScore,
    speedAvg,
    paymentScore,
    paymentAvg,
    totalScore,
    maxScore,
    averageScore,
    percentageScore,
    gradeLabel,
    gradeColor,
  };
}

export function formatChannelLabel(channel: SalesEvaluation['contactChannel']): string {
  switch (channel) {
    case 'visit':
      return '🚗 เข้าพบหน้าร้าน/หน้างาน';
    case 'phone':
      return '📞 โทรศัพท์ติดต่อ';
    case 'line':
      return '💬 LINE Official / Chat';
    case 'email':
      return '✉️ อีเมล';
    default:
      return '🌐 ช่องทางอื่นๆ';
  }
}

export function formatPriceComparisonLabel(comp: 'higher' | 'similar' | 'lower' | 'unknown'): {
  label: string;
  badgeClass: string;
} {
  switch (comp) {
    case 'lower':
      return {
        label: 'ถูกกว่าคู่แข่ง (ได้เปรียบ)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'similar':
      return {
        label: 'ใกล้เคียงคู่แข่ง',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
      };
    case 'higher':
      return {
        label: 'สูงกว่าคู่แข่ง',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
      };
    default:
      return {
        label: 'ไม่แน่ใจ / ไม่ระบุ',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}

export function formatFutureIntent(intent: SalesEvaluation['futurePurchaseIntent']): {
  label: string;
  icon: string;
  color: string;
} {
  switch (intent) {
    case 'continuous':
      return {
        label: 'ยินดีสั่งซื้อต่อเนื่อง 100%',
        icon: '✅',
        color: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'compare_case_by_case':
      return {
        label: 'เปรียบเทียบโปรโมชั่น/ราคาเป็นครั้งคราว',
        icon: '⚖️',
        color: 'text-blue-600 dark:text-blue-400',
      };
    case 'pause':
      return {
        label: 'ชะลอการสั่งซื้อชั่วคราว',
        icon: '⏸️',
        color: 'text-amber-600 dark:text-amber-400',
      };
    case 'no':
      return {
        label: 'ยังไม่มีแผนการสั่งซื้อ',
        icon: '❌',
        color: 'text-rose-600 dark:text-rose-400',
      };
  }
}
