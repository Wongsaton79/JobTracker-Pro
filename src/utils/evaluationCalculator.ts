import { CompetitorPriceItem, PriceComparisonOption } from '../types';

export const DEFAULT_COMPETITOR_ITEMS: CompetitorPriceItem[] = [
  {
    id: 'comp-1',
    productName: 'ปูน SCG เสือ ก่อ-ฉาบ-เท (50 กก.)',
    ourPrice: 135,
    competitorPrice: 138,
    comparison: 'lower',
    note: 'ถูกกว่าไทวัสดุ 3 บาท/ถุง',
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
    note: 'ลูกค้าแจ้งราคา 91, ฝ้าเงิน 142 B ไม่รับเข้าสต็อก',
  },
];

export interface EvaluationScoreResults {
  // Question individual scores
  q1_1_score: number; // เต็ม 10
  q1_2_score: number; // เต็ม 5
  q1_3_score: number; // เต็ม 2.5
  q1_4_score: number; // เต็ม 2.5

  q2_1_score: number; // เต็ม 2.5
  q2_2_score: number; // เต็ม 2.5

  q3_1_score: number; // เต็ม 2.5
  q3_2_score: number; // เต็ม 2.5

  // Section totals
  section1Score: number; // เต็ม 20
  section2Score: number; // เต็ม 5
  section3Score: number; // เต็ม 5

  rawTotalScore: number; // รวมดิบ (เต็ม 30)
  scoreOutOf20: number; // อัตราส่วนคะแนนเต็ม 20 = (rawTotalScore / 30) * 20
  percentageScore: number; // ร้อยละความพึงพอใจ
  gradeLabel: string;
  gradeColor: 'emerald' | 'blue' | 'amber' | 'rose';
}

export function computeEvaluationScores(input: {
  q1_1_rating: number; // 0 - 5
  q1_2_rating: number; // 0 - 5
  q1_3_rating: number; // 0 - 5
  q1_4_rating: number; // 0 - 5

  q2_1_rating: number; // 0 - 5
  q2_2_rating: number; // 0 - 5

  q3_1_rating: number; // 0 - 5
  q3_2_rating: number; // 0 - 5
}): EvaluationScoreResults {
  // ข้อ 1.1: เต็ม 10 คะแนน
  const q1_1_score = Number(((Math.min(Math.max(input.q1_1_rating, 0), 5) / 5) * 10).toFixed(2));
  // ข้อ 1.2: เต็ม 5 คะแนน
  const q1_2_score = Number(((Math.min(Math.max(input.q1_2_rating, 0), 5) / 5) * 5).toFixed(2));
  // ข้อ 1.3: เต็ม 2.5 คะแนน
  const q1_3_score = Number(((Math.min(Math.max(input.q1_3_rating, 0), 5) / 5) * 2.5).toFixed(2));
  // ข้อ 1.4: เต็ม 2.5 คะแนน
  const q1_4_score = Number(((Math.min(Math.max(input.q1_4_rating, 0), 5) / 5) * 2.5).toFixed(2));

  // หมวดที่ 1: เต็ม 20 คะแนน
  const section1Score = Number((q1_1_score + q1_2_score + q1_3_score + q1_4_score).toFixed(2));

  // ข้อ 2.1: เต็ม 2.5 คะแนน
  const q2_1_score = Number(((Math.min(Math.max(input.q2_1_rating, 0), 5) / 5) * 2.5).toFixed(2));
  // ข้อ 2.2: เต็ม 2.5 คะแนน
  const q2_2_score = Number(((Math.min(Math.max(input.q2_2_rating, 0), 5) / 5) * 2.5).toFixed(2));

  // หมวดที่ 2: เต็ม 5 คะแนน
  const section2Score = Number((q2_1_score + q2_2_score).toFixed(2));

  // ข้อ 3.1: เต็ม 2.5 คะแนน
  const q3_1_score = Number(((Math.min(Math.max(input.q3_1_rating, 0), 5) / 5) * 2.5).toFixed(2));
  // ข้อ 3.2: เต็ม 2.5 คะแนน
  const q3_2_score = Number(((Math.min(Math.max(input.q3_2_rating, 0), 5) / 5) * 2.5).toFixed(2));

  // หมวดที่ 3: เต็ม 5 คะแนน
  const section3Score = Number((q3_1_score + q3_2_score).toFixed(2));

  // รวมคะแนนดิบ 3 หมวด (เต็ม 30)
  const rawTotalScore = Number((section1Score + section2Score + section3Score).toFixed(2));

  // ปรับอัตราส่วนคะแนนให้คิดเป็นคะแนนเต็ม 20 คะแนน (ตามที่ผู้ใช้ระบุ: "การประเมินนี้ จะแบ่งเป็นคะแนนเต็มคือ 20 คะแนน")
  const scoreOutOf20 = Number(((rawTotalScore / 30) * 20).toFixed(2));
  const percentageScore = Math.round((rawTotalScore / 30) * 100);

  let gradeLabel = 'ดีมาก (18.0 - 20.0 คะแนน)';
  let gradeColor: 'emerald' | 'blue' | 'amber' | 'rose' = 'emerald';

  if (scoreOutOf20 >= 18) {
    gradeLabel = 'ดีมาก (18.0 - 20.0 คะแนน)';
    gradeColor = 'emerald';
  } else if (scoreOutOf20 >= 16) {
    gradeLabel = 'ดี (16.0 - 17.9 คะแนน)';
    gradeColor = 'blue';
  } else if (scoreOutOf20 >= 12) {
    gradeLabel = 'ปานกลาง (12.0 - 15.9 คะแนน)';
    gradeColor = 'amber';
  } else {
    gradeLabel = 'ควรปรับปรุง (< 12.0 คะแนน)';
    gradeColor = 'rose';
  }

  return {
    q1_1_score,
    q1_2_score,
    q1_3_score,
    q1_4_score,
    q2_1_score,
    q2_2_score,
    q3_1_score,
    q3_2_score,
    section1Score,
    section2Score,
    section3Score,
    rawTotalScore,
    scoreOutOf20,
    percentageScore,
    gradeLabel,
    gradeColor,
  };
}

export function formatChannelText(channel: 'onsite' | 'line' | 'phone'): string {
  switch (channel) {
    case 'onsite':
      return '🚗 Onsite (เข้าพบหน้างานจริง)';
    case 'line':
      return '💬 Line';
    case 'phone':
      return '📞 โทรศัพท์';
    default:
      return 'Onsite';
  }
}

export function formatPriceComparisonLabel(opt?: PriceComparisonOption | string | null): {
  label: string;
  badgeClass: string;
} {
  switch (opt) {
    case 'lower':
      return {
        label: 'ต่ำกว่า',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'similar':
      return {
        label: 'ใกล้เคียง',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
      };
    case 'higher':
      return {
        label: 'สูงกว่า',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
      };
    case 'uncertain':
    case 'unknown':
      return {
        label: 'ไม่แน่ใจ',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'undisclosed':
      return {
        label: 'ไม่สามารถเปิดเผยได้',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
      };
    default:
      return {
        label: 'ใกล้เคียง',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
      };
  }
}

// 🛡️ ฟังก์ชันปรับข้อมูลแบบประเมินให้รองรับ Schema ล่าสุดและป้องกัน Error จากข้อมูลเก่าใน LocalStorage
export function normalizeEvaluation(item: any): any {
  if (!item) return null;

  const feedbackPrice =
    item.feedbackPriceAndPromo ||
    (item.overallPriceComparison === 'lower'
      ? 'lower'
      : item.overallPriceComparison === 'higher'
      ? 'higher'
      : 'similar');

  const channel =
    item.contactChannel === 'phone' || item.contactChannel === 'line' || item.contactChannel === 'onsite'
      ? item.contactChannel
      : 'onsite';

  let scoreOutOf20 = item.scoreOutOf20;
  let rawTotalScore = item.rawTotalScore;
  let section1Score = item.section1Score;
  let section2Score = item.section2Score;
  let section3Score = item.section3Score;
  let percentageScore = item.percentageScore;

  if (scoreOutOf20 === undefined || rawTotalScore === undefined) {
    if (item.q1_1_rating !== undefined) {
      const scores = computeEvaluationScores({
        q1_1_rating: item.q1_1_rating ?? 5,
        q1_2_rating: item.q1_2_rating ?? 5,
        q1_3_rating: item.q1_3_rating ?? 5,
        q1_4_rating: item.q1_4_rating ?? 5,
        q2_1_rating: item.q2_1_rating ?? 5,
        q2_2_rating: item.q2_2_rating ?? 5,
        q3_1_rating: item.q3_1_rating ?? 5,
        q3_2_rating: item.q3_2_rating ?? 5,
      });
      scoreOutOf20 = scores.scoreOutOf20;
      rawTotalScore = scores.rawTotalScore;
      section1Score = scores.section1Score;
      section2Score = scores.section2Score;
      section3Score = scores.section3Score;
      percentageScore = scores.percentageScore;
    } else {
      const legacyAvg = item.averageScore || 4.5;
      scoreOutOf20 = Number(((legacyAvg / 5) * 20).toFixed(2));
      rawTotalScore = Number(((legacyAvg / 5) * 30).toFixed(2));
      section1Score = Number(((legacyAvg / 5) * 20).toFixed(2));
      section2Score = Number(((legacyAvg / 5) * 5).toFixed(2));
      section3Score = Number(((legacyAvg / 5) * 5).toFixed(2));
      percentageScore = Math.round((legacyAvg / 5) * 100);
    }
  }

  return {
    ...item,
    contactChannel: channel,
    feedbackPriceAndPromo: feedbackPrice,
    q1_1_rating: item.q1_1_rating ?? 5,
    q1_1_score: item.q1_1_score ?? 10,
    q1_1_note: item.q1_1_note || '',
    q1_2_rating: item.q1_2_rating ?? 5,
    q1_2_score: item.q1_2_score ?? 5,
    q1_2_note: item.q1_2_note || '',
    q1_3_rating: item.q1_3_rating ?? 5,
    q1_3_score: item.q1_3_score ?? 2.5,
    q1_3_note: item.q1_3_note || '',
    q1_4_rating: item.q1_4_rating ?? 5,
    q1_4_score: item.q1_4_score ?? 2.5,
    q1_4_note: item.q1_4_note || '',
    q2_1_rating: item.q2_1_rating ?? 5,
    q2_1_score: item.q2_1_score ?? 2.5,
    q2_1_note: item.q2_1_note || '',
    q2_2_rating: item.q2_2_rating ?? 5,
    q2_2_score: item.q2_2_score ?? 2.5,
    q2_2_note: item.q2_2_note || '',
    q3_1_rating: item.q3_1_rating ?? 5,
    q3_1_score: item.q3_1_score ?? 2.5,
    q3_1_note: item.q3_1_note || '',
    q3_2_rating: item.q3_2_rating ?? 5,
    q3_2_score: item.q3_2_score ?? 2.5,
    q3_2_note: item.q3_2_note || '',
    section1Score: section1Score ?? 20,
    section2Score: section2Score ?? 5,
    section3Score: section3Score ?? 5,
    rawTotalScore: rawTotalScore ?? 30,
    scoreOutOf20: scoreOutOf20 ?? 20,
    percentageScore: percentageScore ?? 100,
    gradeLabel: item.gradeLabel || 'ดีมาก (18.0 - 20.0 คะแนน)',
    gradeColor: item.gradeColor || 'emerald',
    competitorPriceItems: item.competitorPriceItems || [],
    interestedProducts: item.interestedProducts || [],
    additionalFeedback: item.additionalFeedback || item.strengthsFeedback || '',
  };
}
