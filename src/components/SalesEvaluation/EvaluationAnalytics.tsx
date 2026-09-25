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

  // 1. Category averages
  const avgService =
    evaluations.reduce(
      (sum, e) => sum + (e.scorePoliteness + e.scorePunctuality + e.scoreEnthusiasm) / 3,
      0
    ) / total;

  const avgProduct =
    evaluations.reduce(
      (sum, e) => sum + (e.scoreProductKnowledge + e.scoreConsultation + e.scorePromotionUpdate) / 3,
      0
    ) / total;

  const avgSpeed =
    evaluations.reduce(
      (sum, e) => sum + (e.scoreQuotationSpeed + e.scoreFollowUp + e.scoreProblemSolving) / 3,
      0
    ) / total;

  const avgPayment =
    evaluations.reduce((sum, e) => sum + (e.scorePaymentTerms || 5), 0) / total;

  const categoryData = [
    { name: '1. บริการ & มารยาท', score: Number(avgService.toFixed(2)), fullMark: 5 },
    { name: '2. ความรู้สินค้า', score: Number(avgProduct.toFixed(2)), fullMark: 5 },
    { name: '3. ความรวดเร็ว & ติดตาม', score: Number(avgSpeed.toFixed(2)), fullMark: 5 },
    { name: '4. เงื่อนไข & เครดิต', score: Number(avgPayment.toFixed(2)), fullMark: 5 },
  ];

  // 2. Sales Rep Leaderboard
  const repStatsMap = new Map<string, { count: number; totalScore: number; totalAvg: number }>();
  evaluations.forEach((ev) => {
    const rep = ev.salesRepName || 'ไม่ระบุ';
    const curr = repStatsMap.get(rep) || { count: 0, totalScore: 0, totalAvg: 0 };
    curr.count += 1;
    curr.totalScore += ev.totalScore;
    curr.totalAvg += ev.averageScore;
    repStatsMap.set(rep, curr);
  });

  const repLeaderboard = Array.from(repStatsMap.entries())
    .map(([rep, st]) => ({
      name: rep,
      count: st.count,
      avgScore: Number((st.totalAvg / st.count).toFixed(2)),
      pct: Math.round((st.totalScore / (st.count * 50)) * 100),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 3. Competitor price perception distribution
  const priceLower = evaluations.filter((e) => e.overallPriceComparison === 'lower').length;
  const priceSimilar = evaluations.filter((e) => e.overallPriceComparison === 'similar').length;
  const priceHigher = evaluations.filter((e) => e.overallPriceComparison === 'higher').length;
  const priceUnknown = evaluations.filter((e) => e.overallPriceComparison === 'unknown').length;

  const priceChartData = [
    { name: 'ถูกกว่าคู่แข่ง', value: priceLower, color: '#10b981' },
    { name: 'ใกล้เคียงคู่แข่ง', value: priceSimilar, color: '#3b82f6' },
    { name: 'สูงกว่าคู่แข่ง', value: priceHigher, color: '#f59e0b' },
    { name: 'ไม่แน่ใจ', value: priceUnknown, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  // 4. Intent to purchase
  const intentContinuous = evaluations.filter((e) => e.futurePurchaseIntent === 'continuous').length;
  const intentCompare = evaluations.filter((e) => e.futurePurchaseIntent === 'compare_case_by_case').length;
  const intentPause = evaluations.filter((e) => e.futurePurchaseIntent === 'pause').length;
  const intentNo = evaluations.filter((e) => e.futurePurchaseIntent === 'no').length;

  const intentChartData = [
    { name: 'สั่งซื้อต่อเนื่อง 100%', value: intentContinuous, color: '#10b981' },
    { name: 'รอดูราคา/โปรโมชั่น', value: intentCompare, color: '#3b82f6' },
    { name: 'ชะลอการสั่งซื้อ', value: intentPause, color: '#f59e0b' },
    { name: 'ไม่สั่งซื้อ', value: intentNo, color: '#ef4444' },
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Averages */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>คะแนนเฉลี่ยแยกตามหมวด (เต็ม 5.0)</span>
              </h3>
              <p className="text-xs text-slate-500">
                เปรียบเทียบคะแนนความพึงพอใจในแต่ละด้านของการทำงาน
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
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} / 5.0`, 'คะแนนเฉลี่ย']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="score" fill="#059669" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Competitor Price Perception */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>สัดส่วนระดับราคาเมื่อเทียบกับคู่แข่งในตลาด</span>
              </h3>
              <p className="text-xs text-slate-500">
                มุมมองของลูกค้าต่อระดับราคาสินค้าเทียบกับคู่แข่ง (เช่น ไทวัสดุ, โกลบอลเฮ้าส์)
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
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {priceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} ราย`, 'จำนวน']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Rep Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>อันดับคะแนนความพึงพอใจรายพนักงานขาย (Sales Leaderboard)</span>
            </h3>
            <p className="text-xs text-slate-500">
              วัดผลงานทีมขายจากคะแนนจริงของลูกค้า เพื่อสร้างแรงจูงใจและพัฒนาการทำงาน
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 w-12 text-center">อันดับ</th>
                <th className="p-3">พนักงานขาย / ทีมขาย</th>
                <th className="p-3 text-center w-28">จำนวนแบบประเมิน</th>
                <th className="p-3 text-right w-36">คะแนนเฉลี่ย (เต็ม 5.0)</th>
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
                      {item.count} ครั้ง
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {item.avgScore}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                      {item.pct}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {item.pct >= 90 ? 'ยอดเยี่ยม ⭐' : item.pct >= 80 ? 'ดีมาก 👍' : 'ดี'}
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
