import React from 'react';
import { SalesEvaluation } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Award,
  TrendingUp,
  Star,
  Users,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface EvaluationAnalyticsProps {
  evaluations: SalesEvaluation[];
  onBackToList: () => void;
  onExportExcel: () => void;
}

export const EvaluationAnalytics: React.FC<EvaluationAnalyticsProps> = ({
  evaluations,
  onBackToList,
  onExportExcel,
}) => {
  const total = evaluations.length;

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
        <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          ยังไม่มีข้อมูลแบบประเมินสำหรับวิเคราะห์สถิติ
        </h4>
        <button
          onClick={onBackToList}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการ</span>
        </button>
      </div>
    );
  }

  // 1. Category averages (หมวด 1 เต็ม 20, หมวด 2 เต็ม 5, หมวด 3 เต็ม 5, และคิดเป็นคะแนนเต็ม 20)
  const avgSec1 =
    evaluations.reduce((sum, e) => sum + (e.section1Score || 0), 0) / total;
  const avgSec2 =
    evaluations.reduce((sum, e) => sum + (e.section2Score || 0), 0) / total;
  const avgSec3 =
    evaluations.reduce((sum, e) => sum + (e.section3Score || 0), 0) / total;
  const avgScore20 =
    evaluations.reduce((sum, e) => sum + (e.scoreOutOf20 || 0), 0) / total;

  const categoryData = [
    {
      name: '1. การสื่อสาร & บริการ',
      score: Number(avgSec1.toFixed(2)),
      maxMark: 20,
      pct: Math.round((avgSec1 / 20) * 100),
    },
    {
      name: '2. การรับผิดชอบหน้าที่',
      score: Number(avgSec2.toFixed(2)),
      maxMark: 5,
      pct: Math.round((avgSec2 / 5) * 100),
    },
    {
      name: '3. ความประทับใจ',
      score: Number(avgSec3.toFixed(2)),
      maxMark: 5,
      pct: Math.round((avgSec3 / 5) * 100),
    },
  ];

  // 2. Sales Rep Leaderboard (เต็ม 20 คะแนน)
  const repStatsMap = new Map<string, { count: number; totalScore20: number; totalRaw: number }>();
  evaluations.forEach((ev) => {
    const rep = ev.salesRepName || 'ไม่ระบุ';
    const curr = repStatsMap.get(rep) || { count: 0, totalScore20: 0, totalRaw: 0 };
    curr.count += 1;
    curr.totalScore20 += ev.scoreOutOf20 || 0;
    curr.totalRaw += ev.rawTotalScore || 0;
    repStatsMap.set(rep, curr);
  });

  const repLeaderboard = Array.from(repStatsMap.entries())
    .map(([rep, st]) => ({
      name: rep,
      count: st.count,
      avgScore20: Number((st.totalScore20 / st.count).toFixed(2)),
      pct: Math.round(((st.totalScore20 / st.count) / 20) * 100),
    }))
    .sort((a, b) => b.avgScore20 - a.avgScore20);

  // 3. Competitor price perception distribution (ส่วนที่ 2: ข้อ 1)
  const priceLower = evaluations.filter((e) => e.feedbackPriceAndPromo === 'lower').length;
  const priceSimilar = evaluations.filter((e) => e.feedbackPriceAndPromo === 'similar').length;
  const priceHigher = evaluations.filter((e) => e.feedbackPriceAndPromo === 'higher').length;
  const priceUncertain = evaluations.filter((e) => e.feedbackPriceAndPromo === 'uncertain').length;
  const priceUndisclosed = evaluations.filter((e) => e.feedbackPriceAndPromo === 'undisclosed').length;

  const priceChartData = [
    { name: 'ต่ำกว่า', value: priceLower, color: '#10b981' },
    { name: 'ใกล้เคียง', value: priceSimilar, color: '#3b82f6' },
    { name: 'สูงกว่า', value: priceHigher, color: '#f59e0b' },
    { name: 'ไม่แน่ใจ', value: priceUncertain, color: '#94a3b8' },
    { name: 'ไม่สามารถเปิดเผยได้', value: priceUndisclosed, color: '#a855f7' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToList}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการแบบประเมิน</span>
        </button>

        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ส่งออกสรุปสถิติ (Excel)</span>
        </button>
      </div>

      {/* KPI Overview Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-100 font-bold block">
            ⭐ คะแนนเฉลี่ยรวมทุกพนักงานขาย (คิดเป็นคะแนนเต็ม 20 คะแนน)
          </span>
          <div className="text-2xl sm:text-3xl font-black mt-1">
            {avgScore20.toFixed(2)} <span className="text-sm font-normal text-emerald-100">/ 20.00 คะแนน</span>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            คำนวณจากแบบประเมินทั้งหมด {total} ฉบับ (แปลงจากคะแนนดิบ 30 คะแนน)
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/30 text-center">
          <span className="text-[10px] text-emerald-100 block">ร้อยละความพึงพอใจเฉลี่ย</span>
          <span className="text-2xl font-black">{Math.round((avgScore20 / 20) * 100)}%</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Averages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>คะแนนเฉลี่ยแยกตาม 3 หมวด</span>
              </h3>
              <p className="text-xs text-slate-500">
                หมวด 1 (เต็ม 20), หมวด 2 (เต็ม 5), หมวด 3 (เต็ม 5)
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} / ${item.payload.maxMark} คะแนน (${item.payload.pct}%)`,
                    'คะแนนเฉลี่ย',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="score" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Competitor Price Perception (ส่วนที่ 2 ข้อ 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>ราคาสินค้า & Feedback โปรโมชั่น เทียบกับคู่แข่ง</span>
              </h3>
              <p className="text-xs text-slate-500">
                เกณฑ์: ต่ำกว่า, ใกล้เคียง, สูงกว่า, ไม่แน่ใจ, ไม่สามารถเปิดเผยได้ (ส่วนที่ 2 ข้อ 1)
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {priceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} ร้าน`, 'จำนวน']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Rep Leaderboard Table (เต็ม 20 คะแนน) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>อันดับคะแนนความพึงพอใจรายพนักงานขาย (เต็ม 20 คะแนน)</span>
            </h3>
            <p className="text-xs text-slate-500">
              จัดอันดับตามสัดส่วนคะแนนเต็ม 20 คะแนน
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-12 text-center">อันดับ</th>
                <th className="p-3">พนักงานขาย / เซลล์</th>
                <th className="p-3 text-center w-28">จำนวนแบบประเมิน</th>
                <th className="p-3 text-right w-36">คะแนนเฉลี่ย (เต็ม 20 คะแนน)</th>
                <th className="p-3 text-right w-28">ร้อยละ (%)</th>
                <th className="p-3 text-center w-36">ระดับผลงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {repLeaderboard.map((item, idx) => {
                const isTop1 = idx === 0;
                return (
                  <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-center font-bold">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 text-xs shadow-xs">
                          🥇
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs">
                          🥈
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-400">{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                      {item.count} ใบ
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {item.avgScore20} / 20.00
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {item.pct}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.avgScore20 >= 18
                          ? 'ดีมาก ⭐'
                          : item.avgScore20 >= 16
                          ? 'ดี 👍'
                          : item.avgScore20 >= 12
                          ? 'ปานกลาง'
                          : 'ควรปรับปรุง'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
