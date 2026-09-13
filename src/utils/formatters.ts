import { JobStatus, PaymentType } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
};

export interface ParsedDateInfo {
  year: number;       // Gregorian/CE year (e.g. 2026)
  thaiYear: number;   // Buddhist year (e.g. 2569)
  month: number;      // 1-12
  day: number;        // 1-31
  standardDate: string; // YYYY-MM-DD
  yearMonth: string;    // YYYY-MM
}

/**
 * Universal Date Parser: Handles YYYY-MM-DD, DD/MM/YYYY, YYYY/MM/DD,
 * Buddhist years (2569), ISO strings, timestamps, and Firestore date formats.
 */
export const parseDateParts = (dateInput: any): ParsedDateInfo | null => {
  if (dateInput === null || dateInput === undefined || dateInput === '') return null;

  // 1. Date instance
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    let y = dateInput.getFullYear();
    if (y > 2400) y -= 543;
    return createParsedDateInfo(y, dateInput.getMonth() + 1, dateInput.getDate());
  }

  // 2. Firestore Timestamp object ({ seconds: number })
  if (typeof dateInput === 'object' && typeof dateInput.seconds === 'number') {
    const dObj = new Date(dateInput.seconds * 1000);
    if (!isNaN(dObj.getTime())) {
      let y = dObj.getFullYear();
      if (y > 2400) y -= 543;
      return createParsedDateInfo(y, dObj.getMonth() + 1, dObj.getDate());
    }
  }

  // 3. Number (ms timestamp)
  if (typeof dateInput === 'number' && !isNaN(dateInput) && dateInput > 0) {
    const dObj = new Date(dateInput);
    if (!isNaN(dObj.getTime())) {
      let y = dObj.getFullYear();
      if (y > 2400) y -= 543;
      return createParsedDateInfo(y, dObj.getMonth() + 1, dObj.getDate());
    }
  }

  if (typeof dateInput !== 'string') return null;
  const rawStr = dateInput.trim();
  if (!rawStr) return null;

  // Strip time part if present: '2026-09-10T14:30:00Z' or '2026-09-10 14:30:00'
  const dateOnlyStr = rawStr.split('T')[0].split(' ')[0].trim();

  // Check delimiter (-, /, .)
  const delimiter = dateOnlyStr.includes('-')
    ? '-'
    : dateOnlyStr.includes('/')
    ? '/'
    : dateOnlyStr.includes('.')
    ? '.'
    : null;

  if (delimiter) {
    const rawParts = dateOnlyStr.split(delimiter);
    
    // Case YYYY-MM or MM-YYYY (2 parts)
    if (rawParts.length === 2) {
      const p1 = parseInt(rawParts[0].trim(), 10);
      const p2 = parseInt(rawParts[1].trim(), 10);
      if (!isNaN(p1) && !isNaN(p2)) {
        let y = p1 > 1900 ? p1 : (p2 > 1900 ? p2 : 0);
        let m = p1 > 1900 ? p2 : p1;
        if (y > 2400) y -= 543;
        if (y > 1900 && m >= 1 && m <= 12) {
          return createParsedDateInfo(y, m, 1);
        }
      }
    }

    // Case 3 parts (Year, Month, Day in various orders)
    if (rawParts.length >= 3) {
      const parts = rawParts.slice(0, 3).map((p) => parseInt(p.trim(), 10));
      if (!parts.some(isNaN)) {
        let [p1, p2, p3] = parts;
        let y = 0, m = 0, d = 0;

        if (p1 > 1900) {
          // YYYY-MM-DD or YYYY/MM/DD
          y = p1;
          m = p2;
          d = p3;
        } else if (p3 > 1900) {
          // DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY
          y = p3;
          if (p1 > 12) {
            d = p1;
            m = p2;
          } else if (p2 > 12) {
            m = p1;
            d = p2;
          } else {
            // Standard in Thailand & ASEAN: DD/MM/YYYY
            d = p1;
            m = p2;
          }
        }

        if (y > 2400) y -= 543;

        if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return createParsedDateInfo(y, m, d);
        }
      }
    }
  }

  // Fallback to Javascript Date parser
  const nativeDate = new Date(rawStr);
  if (!isNaN(nativeDate.getTime())) {
    let y = nativeDate.getFullYear();
    if (y > 2400) y -= 543;
    return createParsedDateInfo(y, nativeDate.getMonth() + 1, nativeDate.getDate());
  }

  return null;
};

const createParsedDateInfo = (year: number, month: number, day: number): ParsedDateInfo => {
  const thaiYear = year > 2400 ? year : year + 543;
  const standardYear = year > 2400 ? year - 543 : year;
  const mm = month.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');

  return {
    year: standardYear,
    thaiYear,
    month,
    day,
    standardDate: `${standardYear}-${mm}-${dd}`,
    yearMonth: `${standardYear}-${mm}`,
  };
};

export const formatThaiMonthYear = (ymOrDate: any): string => {
  if (!ymOrDate || ymOrDate === 'all') return 'สรุปภาพรวมทั้งหมดทุกเดือน';

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  // Try direct regex on YYYY-MM
  if (typeof ymOrDate === 'string') {
    const match = ymOrDate.trim().match(/^(\d{4})[-/](\d{1,2})$/);
    if (match) {
      let y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (y > 2400) y -= 543;
      const thaiYear = y + 543;
      if (m >= 1 && m <= 12) {
        return `เดือน ${monthNames[m - 1]} ${thaiYear}`;
      }
    }
  }

  const parsed = parseDateParts(ymOrDate);
  if (parsed && parsed.month >= 1 && parsed.month <= 12) {
    return `เดือน ${monthNames[parsed.month - 1]} ${parsed.thaiYear}`;
  }

  return 'เดือน ไม่ระบุ';
};

export const formatThaiDate = (dateStr: string, format: 'short' | 'full' = 'full'): string => {
  if (!dateStr) return '-';
  try {
    const parsed = parseDateParts(dateStr);
    if (!parsed) return String(dateStr);

    const monthNamesShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const monthNamesFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const monthName = format === 'short' 
      ? monthNamesShort[parsed.month - 1] 
      : monthNamesFull[parsed.month - 1];

    return `${parsed.day} ${monthName} ${parsed.thaiYear}`;
  } catch {
    return String(dateStr);
  }
};

export const getStatusConfig = (status: JobStatus) => {
  switch (status) {
    case 'quotation':
      return {
        label: 'เสนอราคา',
        shortLabel: 'เสนอราคา',
        color: 'amber',
        bgClass: 'bg-amber-50 text-amber-800 border-amber-300',
        badgeBg: 'bg-amber-500',
        lineColor: '#D97706',
      };
    case 'follow_up':
      return {
        label: 'ติดตามซ้ำ',
        shortLabel: 'ติดตามซ้ำ',
        color: 'blue',
        bgClass: 'bg-blue-50 text-blue-800 border-blue-300',
        badgeBg: 'bg-blue-500',
        lineColor: '#2563EB',
      };
    case 'closed_deal':
    case 'completed':
      return {
        label: 'ปิดการขาย',
        shortLabel: 'ปิดการขาย',
        color: 'emerald',
        bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badgeBg: 'bg-emerald-600',
        lineColor: '#059669',
      };
    case 'in_progress':
      return {
        label: 'กำลังดำเนินการ',
        shortLabel: 'กำลังทำ',
        color: 'sky',
        bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
        badgeBg: 'bg-sky-500',
        lineColor: '#0284C7',
      };
    case 'review':
      return {
        label: 'รอตรวจสอบงาน',
        shortLabel: 'รอตรวจ',
        color: 'purple',
        bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeBg: 'bg-purple-500',
        lineColor: '#9333EA',
      };
    case 'issue':
      return {
        label: 'มีปัญหา / ต้องแก้ไข',
        shortLabel: 'มีปัญหา',
        color: 'rose',
        bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeBg: 'bg-rose-500',
        lineColor: '#EF4444',
      };
    case 'pending':
    default:
      return {
        label: 'รอดำเนินการ',
        shortLabel: 'รอดำเนินการ',
        color: 'slate',
        bgClass: 'bg-slate-100 text-slate-700 border-slate-300',
        badgeBg: 'bg-slate-500',
        lineColor: '#64748B',
      };
  }
};

export const getPaymentTypeConfig = (type: PaymentType) => {
  switch (type) {
    case 'cash':
      return {
        label: 'เงินสด',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        isCredit: false,
      };
    case 'credit_7':
      return {
        label: 'เครดิต 7 วัน',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        isCredit: true,
      };
    case 'credit_15':
      return {
        label: 'เครดิต 15 วัน',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        isCredit: true,
      };
    case 'credit_30':
      return {
        label: 'เครดิต 30 วัน',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        isCredit: true,
      };
    case 'credit_45':
      return {
        label: 'เครดิต 45 วัน',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        isCredit: true,
      };
    case 'transfer':
      return {
        label: 'เงินโอน',
        badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        isCredit: false,
      };
    case 'credit_60':
      return {
        label: 'เครดิต 60 วัน',
        badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
        isCredit: true,
      };
    case 'credit_card':
      return {
        label: 'บัตรเครดิต',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
        isCredit: true,
      };
    default:
      return {
        label: type,
        badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
        isCredit: false,
      };
  }
};

export const getJobTimestamp = (job: { updatedAt?: string; createdAt?: string; date?: string; time?: string }): number => {
  if (job.updatedAt) {
    const t = new Date(job.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (job.createdAt) {
    const t = new Date(job.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (job.date) {
    const parsed = parseDateParts(job.date);
    if (parsed) {
      const timeStr = job.time && job.time.length === 5 ? job.time : '00:00';
      const combined = `${parsed.standardDate}T${timeStr}:00`;
      const t = new Date(combined).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    const dateOnly = new Date(job.date).getTime();
    if (!isNaN(dateOnly) && dateOnly > 0) return dateOnly;
  }
  return 0;
};

export const sortJobsLatestFirst = <T extends { updatedAt?: string; createdAt?: string; date?: string; time?: string }>(jobsList: T[]): T[] => {
  return [...jobsList].sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));
};

// 💰 คำนวณสรุปการเงินและการชำระเงินของงาน (รองรับทั้งชำระแยกรายรอบ และชำระรวม)
export interface JobFinancialSummary {
  totalPrice: number;
  totalPaid: number;
  remaining: number;
  status: 'paid' | 'partial' | 'unpaid' | 'credit';
  statusLabel: string;
  badgeClass: string;
  isFullyPaid: boolean;
  paidCount: number;
  totalRounds: number;
}

export const calculateJobFinancials = (job: {
  price?: number;
  totalPaidAmount?: number;
  remainingAmount?: number;
  overallPaymentStatus?: 'paid' | 'partial' | 'unpaid' | 'credit';
  paymentType?: PaymentType;
  workRounds?: import('../types').WorkRound[];
}): JobFinancialSummary => {
  const rounds = job.workRounds || [];
  const totalPrice = job.price !== undefined ? Number(job.price) : 0;

  // If work rounds exist, calculate based on round-level payments
  if (rounds.length > 0) {
    let sumPaid = 0;
    let paidRoundsCount = 0;

    rounds.forEach((r) => {
      if (r.isPaid || r.paymentStatus === 'paid') {
        const amt = r.paidAmount !== undefined ? Number(r.paidAmount) : Number(r.roundTotalCost || 0);
        sumPaid += amt;
        paidRoundsCount += 1;
      } else if (r.paymentStatus === 'partial') {
        const amt = Number(r.paidAmount || 0);
        sumPaid += amt;
      }
    });

    // If explicit totalPaidAmount exists and no round paid, fallback to job level
    if (sumPaid === 0 && job.totalPaidAmount !== undefined && job.totalPaidAmount > 0) {
      sumPaid = Number(job.totalPaidAmount);
    }

    const remaining = Math.max(0, totalPrice - sumPaid);
    const isFullyPaid = totalPrice > 0 ? remaining <= 0 : sumPaid > 0;

    let status: 'paid' | 'partial' | 'unpaid' | 'credit' = 'unpaid';
    let statusLabel = 'รอรับชำระ';
    let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

    if (isFullyPaid) {
      status = 'paid';
      statusLabel = 'ชำระครบแล้ว';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (sumPaid > 0) {
      status = 'partial';
      statusLabel = `ชำระบางส่วน (ค้าง ฿${remaining.toLocaleString()})`;
      badgeClass = 'bg-sky-100 text-sky-800 border-sky-300';
    } else if (job.paymentType && job.paymentType.startsWith('credit')) {
      status = 'credit';
      statusLabel = getPaymentTypeConfig(job.paymentType).label;
      badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }

    return {
      totalPrice,
      totalPaid: sumPaid,
      remaining,
      status,
      statusLabel,
      badgeClass,
      isFullyPaid,
      paidCount: paidRoundsCount,
      totalRounds: rounds.length,
    };
  }

  // Fallback if no rounds: based on job-level fields
  const totalPaid = Number(job.totalPaidAmount || 0);
  const remaining = job.remainingAmount !== undefined ? Number(job.remainingAmount) : Math.max(0, totalPrice - totalPaid);
  const isFullyPaid = totalPrice > 0 && remaining <= 0;

  let status: 'paid' | 'partial' | 'unpaid' | 'credit' = job.overallPaymentStatus || 'unpaid';
  let statusLabel = 'รอรับชำระ';
  let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

  if (isFullyPaid || status === 'paid') {
    status = 'paid';
    statusLabel = 'ชำระครบแล้ว';
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (totalPaid > 0 || status === 'partial') {
    status = 'partial';
    statusLabel = `ชำระบางส่วน (ค้าง ฿${remaining.toLocaleString()})`;
    badgeClass = 'bg-sky-100 text-sky-800 border-sky-300';
  } else if (job.paymentType && job.paymentType.startsWith('credit')) {
    status = 'credit';
    statusLabel = getPaymentTypeConfig(job.paymentType).label;
    badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }

  return {
    totalPrice,
    totalPaid,
    remaining,
    status,
    statusLabel,
    badgeClass,
    isFullyPaid,
    paidCount: isFullyPaid ? 1 : 0,
    totalRounds: 0,
  };
};

export const getRoundPaymentConfig = (round: {
  isPaid?: boolean;
  paymentStatus?: 'paid' | 'unpaid' | 'partial' | 'credit';
  paidAmount?: number;
  roundTotalCost?: number;
  paymentType?: PaymentType;
}) => {
  const isPaid = round.isPaid || round.paymentStatus === 'paid';
  const isPartial = round.paymentStatus === 'partial';
  const isCredit = round.paymentStatus === 'credit' || (round.paymentType && round.paymentType.startsWith('credit'));

  if (isPaid) {
    return {
      label: 'ชำระเงินแล้ว',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotClass: 'bg-emerald-500',
      status: 'paid' as const,
    };
  }

  if (isPartial) {
    return {
      label: `ชำระบางส่วน (฿${(round.paidAmount || 0).toLocaleString()})`,
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      dotClass: 'bg-sky-500',
      status: 'partial' as const,
    };
  }

  if (isCredit) {
    return {
      label: round.paymentType ? getPaymentTypeConfig(round.paymentType).label : 'เครดิต / วางบิล',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dotClass: 'bg-indigo-500',
      status: 'credit' as const,
    };
  }

  return {
    label: 'ยังไม่ชำระ / รอวางบิล',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    status: 'unpaid' as const,
  };
};

