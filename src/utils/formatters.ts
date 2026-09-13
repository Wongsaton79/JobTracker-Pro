import { JobStatus, PaymentType } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatThaiDate = (dateStr: string, format: 'short' | 'full' = 'full'): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const thaiYear = year > 2500 ? year : year + 543;
    
    const monthNamesShort = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const monthNamesFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const monthName = format === 'short' 
      ? monthNamesShort[month - 1] 
      : monthNamesFull[month - 1];

    return `${day} ${monthName} ${thaiYear}`;
  } catch {
    return dateStr;
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
    const timeStr = job.time || '00:00';
    const combined = `${job.date}T${timeStr.length === 5 ? timeStr : '00:00'}`;
    const t = new Date(combined).getTime();
    if (!isNaN(t) && t > 0) return t;
    const dateOnly = new Date(job.date).getTime();
    if (!isNaN(dateOnly) && dateOnly > 0) return dateOnly;
  }
  return 0;
};

export const sortJobsLatestFirst = <T extends { updatedAt?: string; createdAt?: string; date?: string; time?: string }>(jobsList: T[]): T[] => {
  return [...jobsList].sort((a, b) => getJobTimestamp(b) - getJobTimestamp(a));
};

