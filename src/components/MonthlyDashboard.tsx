import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Building,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { JobItem } from '../types';
import { formatCurrency, formatThaiDate, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';

interface MonthlyDashboardProps {
  jobs: JobItem[];
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({ jobs }) => {
  // Extract all unique year-months from jobs
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.date) {
        const ym = j.date.substring(0, 7); // YYYY-MM
        set.add(ym);
      }
    });
    // Add current month if empty
    const currentYM = new Date().toISOString().substring(0, 7);
    set.add(currentYM);
    return Array.from(set).sort().reverse();
  }, [jobs]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || 'all');

  // Filter jobs by selected month
  const monthlyJobs = useMemo(() => {
    if (selectedMonth === 'all') return jobs;
    return jobs.filter((j) => j.date && j.date.startsWith(selectedMonth));
  }, [jobs, selectedMonth]);

  // Key performance indicators
  const kpi = useMemo(() => {
    const totalJobs = monthlyJobs.length;
    const completedJobs = monthlyJobs.filter((j) => j.status === 'completed').length;
    const inProgressJobs = monthlyJobs.filter((j) => j.status === 'in_progress').length;
    const reviewJobs = monthlyJobs.filter((j) => j.status === 'review').length;
    const issueJobs = monthlyJobs.filter((j) => j.status === 'issue').length;
    const pendingJobs = monthlyJobs.filter((j) => j.status === 'pending').length;

    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    const totalRevenue = monthlyJobs.reduce((sum, j) => sum + j.price, 0);
    const avgJobValue = totalJobs > 0 ? Math.round(totalRevenue / totalJobs) : 0;

    const cashJobs = monthlyJobs.filter((j) => j.paymentType === 'cash' || j.paymentType === 'transfer');
    const creditJobs = monthlyJobs.filter((j) => j.paymentType.startsWith('credit'));

    const cashValue = cashJobs.reduce((sum, j) => sum + j.price, 0);
    const creditValue = creditJobs.reduce((sum, j) => sum + j.price, 0);

    const cashRatio = totalRevenue > 0 ? Math.round((cashValue / totalRevenue) * 100) : 0;
    const creditRatio = totalRevenue > 0 ? Math.round((creditValue / totalRevenue) * 100) : 0;

    return {
      totalJobs,
      completedJobs,
      inProgressJobs,
      reviewJobs,
      issueJobs,
      pendingJobs,
      completionRate,
      totalRevenue,
      avgJobValue,
      cashValue,
      creditValue,
      cashRatio,
      creditRatio,
    };
  }, [monthlyJobs]);

  // Status Distribution Data for Pie Chart
  const statusChartData = useMemo(() => {
    const counts: Record<string, { name: string; value: number; color: string }> = {
      completed: { name: 'เสร็จสมบูรณ์', value: 0, color: '#10B981' },
      in_progress: { name: 'กำลังทำ', value: 0, color: '#3B82F6' },
      review: { name: 'รอตรวจงาน', value: 0, color: '#F59E0B' },
      issue: { name: 'มีปัญหา', value: 0, color: '#EF4444' },
      pending: { name: 'รอดำเนินการ', value: 0, color: '#94A3B8' },
    };

    monthlyJobs.forEach((j) => {
      if (counts[j.status]) {
        counts[j.status].value += 1;
      }
    });

    return Object.values(counts).filter((c) => c.value > 0);
  }, [monthlyJobs]);

  // Payment Type Chart Data
  const paymentChartData = useMemo(() => {
    const data: Record<string, { name: string; value: number; count: number; color: string }> = {
      cash: { name: 'เงินสด', value: 0, count: 0, color: '#10B981' },
      transfer: { name: 'เงินโอน', value: 0, count: 0, color: '#06B6D4' },
      credit_30: { name: 'เครดิต 30 วัน', value: 0, count: 0, color: '#6366F1' },
      credit_60: { name: 'เครดิต 60 วัน', value: 0, count: 0, color: '#A855F7' },
      credit_card: { name: 'บัตรเครดิต', value: 0, count: 0, color: '#F97316' },
    };

    monthlyJobs.forEach((j) => {
      if (data[j.paymentType]) {
        data[j.paymentType].value += j.price;
        data[j.paymentType].count += 1;
      }
    });

    return Object.values(data).filter((d) => d.count > 0);
  }, [monthlyJobs]);

  // Brand Performance Chart Data
  const brandChartData = useMemo(() => {
    const map: Record<string, { brand: string; count: number; totalAmount: number }> = {};

    monthlyJobs.forEach((j) => {
      const b = j.productBrand || 'อื่นๆ';
      if (!map[b]) {
        map[b] = { brand: b, count: 0, totalAmount: 0 };
      }
      map[b].count += 1;
      map[b].totalAmount += j.price;
    });

    return Object.values(map)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 7); // top 7
  }, [monthlyJobs]);

  // Daily Trend / Cumulative Revenue
  const dailyTrendData = useMemo(() => {
    const dayMap: Record<string, { date: string; day: string; count: number; amount: number }> = {};

    monthlyJobs.forEach((j) => {
      const day = j.date ? j.date.split('-')[2] : '01';
      const key = j.date;
      if (!dayMap[key]) {
        dayMap[key] = { date: key, day: `วันที่ ${parseInt(day)}`, count: 0, amount: 0 };
      }
      dayMap[key].count += 1;
      dayMap[key].amount += j.price;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [monthlyJobs]);

  const formatMonthTitle = (ym: string) => {
    if (ym === 'all') return 'สรุปภาพรวมทั้งหมดทุกเดือน';
    const [year, month] = ym.split('-').map(Number);
    const thaiYear = year + 543;
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `เดือน ${monthNames[month - 1]} ${thaiYear}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Month Selector & Controls Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>แดชบอร์ดสรุปผลรายเดือน (Monthly Performance)</span>
          </h2>
          <p className="text-xs text-slate-500">
            วิเคราะห์ประสิทธิภาพการดำเนินงาน อัตราสำเร็จ ยอดขาย และสัดส่วนเครดิต/เงินสด
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-sky-600 absolute left-3 top-2.5 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs sm:text-sm pl-9 pr-8 py-2 bg-sky-50 border border-sky-200 text-sky-950 font-semibold rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="all">📅 แสดงข้อมูลทั้งหมด (ทุกเดือน)</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  📅 {formatMonthTitle(ym)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-sky-700 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
            title="พิมพ์หน้ารายงาน"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">ยอดมูลค่างานรวม</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">
              {formatCurrency(kpi.totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>เฉลี่ย {formatCurrency(kpi.avgJobValue)} / งาน</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Jobs & Completion */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">จำนวนงาน & อัตราสำเร็จ</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-800">{kpi.totalJobs}</span>
              <span className="text-xs text-slate-500">งาน</span>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {kpi.completionRate}% สำเร็จ
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${kpi.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: In-Progress & Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">งานกำลังทำ / รอตรวจ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-lg sm:text-xl font-bold text-blue-600">{kpi.inProgressJobs}</span>
                <span className="text-[10px] text-slate-400 block">กำลังทำ</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200" />
              <div>
                <span className="text-lg sm:text-xl font-bold text-amber-600">{kpi.reviewJobs}</span>
                <span className="text-[10px] text-slate-400 block">รอตรวจ</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200" />
              <div>
                <span className="text-lg sm:text-xl font-bold text-rose-600">{kpi.issueJobs}</span>
                <span className="text-[10px] text-slate-400 block">มีปัญหา</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Cash vs Credit Split */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">สัดส่วน เงินสด vs เครดิต</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-emerald-700">สด {kpi.cashRatio}%</span>
              <span className="text-indigo-700">เครดิต {kpi.creditRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden">
              <div className="bg-emerald-500 h-2" style={{ width: `${kpi.cashRatio}%` }} />
              <div className="bg-indigo-500 h-2" style={{ width: `${kpi.creditRatio}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{formatCurrency(kpi.cashValue)}</span>
              <span>{formatCurrency(kpi.creditValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Status Distribution Donut */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-600" />
              <span>สัดส่วนสถานะการดำเนินงาน</span>
            </h3>
            <span className="text-xs text-slate-400">{monthlyJobs.length} รายการ</span>
          </div>

          <div className="h-64 w-full">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} งาน`, 'จำนวน']}
                    contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในเดือนนี้
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Payment Type Breakdown */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>มูลค่าตามประเภทการชำระ (สด vs เครดิต)</span>
            </h3>
            <span className="text-xs text-slate-400">รวม {formatCurrency(kpi.totalRevenue)}</span>
          </div>

          <div className="h-64 w-full">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val), 'มูลค่า']}
                    contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`pay-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในเดือนนี้
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Top Brand Used & Value */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span>แบรนด์สินค้าที่ใช้สูงสุด และมูลค่างานตามแบรนด์ (Top Brands)</span>
            </h3>
            <span className="text-xs text-slate-400">เรียงตามยอดเงิน</span>
          </div>

          <div className="h-64 w-full">
            {brandChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="brand"
                    type="category"
                    tick={{ fontSize: 11, fontWeight: 500 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'totalAmount' ? formatCurrency(val) : `${val} งาน`,
                      name === 'totalAmount' ? 'ยอดเงินรวม' : 'จำนวนงาน',
                    ]}
                    contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600">
                        {value === 'totalAmount' ? 'ยอดเงินรวม (บาท)' : 'จำนวนงาน'}
                      </span>
                    )}
                  />
                  <Bar dataKey="totalAmount" fill="#0284C7" name="totalAmount" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="count" fill="#38BDF8" name="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                ไม่มีข้อมูลในเดือนนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
