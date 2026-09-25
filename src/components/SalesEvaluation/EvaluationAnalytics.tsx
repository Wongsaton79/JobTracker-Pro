import React, { useState } from 'react';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Award,
  TrendingUp,
  Star,
  Users,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Search,
  MessageSquare,
  ShieldAlert,
  Target,
  ArrowUpRight,
  Truck,
  MapPin,
  Camera,
  Activity,
} from 'lucide-react';
import { formatPriceComparisonLabel, formatChannelText } from '../../utils/evaluationCalculator';

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
  const [customerSearch, setCustomerSearch] = useState('');
  const [copiedAi, setCopiedAi] = useState(false);
  // Smoothed Line Chart View Mode: 'rep' | 'branch' | 'customer'
  const [trendMode, setTrendMode] = useState<'rep' | 'branch' | 'customer'>('rep');

  const total = evaluations.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800">
          ยังไม่มีข้อมูลแบบประเมินสำหรับวิเคราะห์สถิติ
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          เมื่อมีการบันทึกแบบประเมินความพึงพอใจเข้ามา ระบบจะวิเคราะห์กราฟ Smoothed Line Chart สรุปผลรายร้านค้า และคำแนะนำ AI ให้อัตโนมัติทันที
        </p>
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

  // 1. Overall Category Averages (หมวด 1 เต็ม 20, หมวด 2 เต็ม 5, หมวด 3 เต็ม 5, รวมเต็ม 30)
  const avgSec1 = evaluations.reduce((sum, e) => sum + (e.section1Score || 0), 0) / total;
  const avgSec2 = evaluations.reduce((sum, e) => sum + (e.section2Score || 0), 0) / total;
  const avgSec3 = evaluations.reduce((sum, e) => sum + (e.section3Score || 0), 0) / total;
  const avgScore30 =
    evaluations.reduce((sum, e) => sum + (e.totalScore ?? e.rawTotalScore ?? 30), 0) / total;
  const avgPct = Math.round((avgScore30 / 30) * 100);

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
    {
      name: '⭐ คะแนนรวมทั้งหมด',
      score: Number(avgScore30.toFixed(2)),
      maxMark: 30,
      pct: avgPct,
    },
  ];

  // Detailed Question Averages
  const avgQ1_1 = evaluations.reduce((sum, e) => sum + (e.q1_1_score || 0), 0) / total; // เต็ม 10
  const avgQ1_2 = evaluations.reduce((sum, e) => sum + (e.q1_2_score || 0), 0) / total; // เต็ม 5
  const avgQ1_3 = evaluations.reduce((sum, e) => sum + (e.q1_3_score || 0), 0) / total; // เต็ม 2.5
  const avgQ1_4 = evaluations.reduce((sum, e) => sum + (e.q1_4_score || 0), 0) / total; // เต็ม 2.5

  const avgQ2_1 = evaluations.reduce((sum, e) => sum + (e.q2_1_score || 0), 0) / total; // เต็ม 2.5
  const avgQ2_2 = evaluations.reduce((sum, e) => sum + (e.q2_2_score || 0), 0) / total; // เต็ม 2.5

  const avgQ3_1 = evaluations.reduce((sum, e) => sum + (e.q3_1_score || 0), 0) / total; // เต็ม 2.5
  const avgQ3_2 = evaluations.reduce((sum, e) => sum + (e.q3_2_score || 0), 0) / total; // เต็ม 2.5

  // 2. Competitor Price Distribution
  const priceLower = evaluations.filter((e) => e.feedbackPriceAndPromo === 'lower').length;
  const priceSimilar = evaluations.filter((e) => e.feedbackPriceAndPromo === 'similar').length;
  const priceHigher = evaluations.filter((e) => e.feedbackPriceAndPromo === 'higher').length;
  const priceUncertain = evaluations.filter((e) => e.feedbackPriceAndPromo === 'uncertain').length;
  const priceUndisclosed = evaluations.filter((e) => e.feedbackPriceAndPromo === 'undisclosed').length;

  const priceChartData = [
    { name: 'ต่ำกว่าคู่แข่ง', value: priceLower, color: '#10b981' },
    { name: 'ใกล้เคียงคู่แข่ง', value: priceSimilar, color: '#3b82f6' },
    { name: 'สูงกว่าคู่แข่ง', value: priceHigher, color: '#f59e0b' },
    { name: 'ไม่แน่ใจ', value: priceUncertain, color: '#94a3b8' },
    { name: 'ไม่สามารถเปิดเผยได้', value: priceUndisclosed, color: '#a855f7' },
  ].filter((d) => d.value > 0);

  // 3. Customer Breakdown (สรุปผลแยกตามชื่อร้าน / ลูกค้า)
  const customerMap = new Map<
    string,
    {
      customerName: string;
      evaluations: SalesEvaluation[];
      totalScore30: number;
      sec1Total: number;
      sec2Total: number;
      sec3Total: number;
      salesReps: Set<string>;
      branches: Set<string>;
      evaluators: Set<string>;
      latestDate: string;
      latestPriceComparison: string;
      interestedProducts: Set<string>;
      feedbacks: string[];
      hasPhotos: boolean;
      hasCheckIn: boolean;
    }
  >();

  evaluations.forEach((ev) => {
    const custKey = ev.customerName.trim() || 'ไม่ระบุชื่อร้าน';
    const entry = customerMap.get(custKey) || {
      customerName: custKey,
      evaluations: [],
      totalScore30: 0,
      sec1Total: 0,
      sec2Total: 0,
      sec3Total: 0,
      salesReps: new Set<string>(),
      branches: new Set<string>(),
      evaluators: new Set<string>(),
      latestDate: ev.date,
      latestPriceComparison: ev.feedbackPriceAndPromo || 'similar',
      interestedProducts: new Set<string>(),
      feedbacks: [],
      hasPhotos: false,
      hasCheckIn: false,
    };

    entry.evaluations.push(ev);
    entry.totalScore30 += ev.totalScore ?? ev.rawTotalScore ?? 30;
    entry.sec1Total += ev.section1Score || 0;
    entry.sec2Total += ev.section2Score || 0;
    entry.sec3Total += ev.section3Score || 0;
    if (ev.salesRepName) entry.salesReps.add(ev.salesRepName);
    if (ev.branch) entry.branches.add(ev.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก');
    if (ev.evaluatorName) entry.evaluators.add(ev.evaluatorName);
    if (ev.date > entry.latestDate) {
      entry.latestDate = ev.date;
      entry.latestPriceComparison = ev.feedbackPriceAndPromo || 'similar';
    }
    if (ev.photos && ev.photos.length > 0) entry.hasPhotos = true;
    if (ev.checkInLocation) entry.hasCheckIn = true;

    (ev.interestedProducts || []).filter(Boolean).forEach((p) => entry.interestedProducts.add(p));
    if (ev.additionalFeedback) entry.feedbacks.push(ev.additionalFeedback);

    customerMap.set(custKey, entry);
  });

  const customerSummaries = Array.from(customerMap.values()).map((c) => {
    const count = c.evaluations.length;
    const avgScore = Number((c.totalScore30 / count).toFixed(2));
    const avgPctCust = Math.round((avgScore / 30) * 100);
    const avgS1 = Number((c.sec1Total / count).toFixed(2));
    const avgS2 = Number((c.sec2Total / count).toFixed(2));
    const avgS3 = Number((c.sec3Total / count).toFixed(2));
    return {
      ...c,
      count,
      avgScore,
      avgPctCust,
      avgS1,
      avgS2,
      avgS3,
    };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const filteredCustomers = customerSummaries.filter((c) =>
    !customerSearch.trim() ||
    c.customerName.toLowerCase().includes(customerSearch.toLowerCase().trim()) ||
    Array.from(c.salesReps).some((r) => r.toLowerCase().includes(customerSearch.toLowerCase().trim())) ||
    Array.from(c.branches).some((b) => b.toLowerCase().includes(customerSearch.toLowerCase().trim()))
  );

  // 4. Sales Rep Leaderboard (เต็ม 30 คะแนน)
  const repStatsMap = new Map<
    string,
    { count: number; totalScore30: number; sec1: number; sec2: number; sec3: number; branchSet: Set<string> }
  >();

  evaluations.forEach((ev) => {
    const rep = ev.salesRepName || 'ไม่ระบุ';
    const curr = repStatsMap.get(rep) || {
      count: 0,
      totalScore30: 0,
      sec1: 0,
      sec2: 0,
      sec3: 0,
      branchSet: new Set<string>(),
    };
    curr.count += 1;
    curr.totalScore30 += ev.totalScore ?? ev.rawTotalScore ?? 30;
    curr.sec1 += ev.section1Score || 0;
    curr.sec2 += ev.section2Score || 0;
    curr.sec3 += ev.section3Score || 0;
    curr.branchSet.add(ev.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก');
    repStatsMap.set(rep, curr);
  });

  const repLeaderboard = Array.from(repStatsMap.entries())
    .map(([rep, st]) => ({
      name: rep,
      count: st.count,
      avgScore30: Number((st.totalScore30 / st.count).toFixed(2)),
      avgSec1: Number((st.sec1 / st.count).toFixed(2)),
      avgSec2: Number((st.sec2 / st.count).toFixed(2)),
      avgSec3: Number((st.sec3 / st.count).toFixed(2)),
      pct: Math.round(((st.totalScore30 / st.count) / 30) * 100),
      branches: Array.from(st.branchSet).join(', '),
    }))
    .sort((a, b) => b.avgScore30 - a.avgScore30);

  // 5. Branch Comparison (สาขา ตาก vs สาขา แม่สอด)
  const branchStats = {
    tak: { count: 0, totalScore: 0, sec1: 0, sec2: 0, sec3: 0 },
    maesot: { count: 0, totalScore: 0, sec1: 0, sec2: 0, sec3: 0 },
  };

  evaluations.forEach((ev) => {
    const isMaesot = ev.branch === 'แม่สอด' || ev.branch === 'สาขา แม่สอด';
    const target = isMaesot ? branchStats.maesot : branchStats.tak;
    target.count += 1;
    target.totalScore += ev.totalScore ?? ev.rawTotalScore ?? 30;
    target.sec1 += ev.section1Score || 0;
    target.sec2 += ev.section2Score || 0;
    target.sec3 += ev.section3Score || 0;
  });

  const branchCompareData = [
    {
      name: 'สาขา ตาก',
      count: branchStats.tak.count,
      avgScore: branchStats.tak.count > 0 ? Number((branchStats.tak.totalScore / branchStats.tak.count).toFixed(2)) : 0,
      sec1: branchStats.tak.count > 0 ? Number((branchStats.tak.sec1 / branchStats.tak.count).toFixed(2)) : 0,
      sec2: branchStats.tak.count > 0 ? Number((branchStats.tak.sec2 / branchStats.tak.count).toFixed(2)) : 0,
      sec3: branchStats.tak.count > 0 ? Number((branchStats.tak.sec3 / branchStats.tak.count).toFixed(2)) : 0,
      pct: branchStats.tak.count > 0 ? Math.round((branchStats.tak.totalScore / branchStats.tak.count / 30) * 100) : 0,
    },
    {
      name: 'สาขา แม่สอด',
      count: branchStats.maesot.count,
      avgScore: branchStats.maesot.count > 0 ? Number((branchStats.maesot.totalScore / branchStats.maesot.count).toFixed(2)) : 0,
      sec1: branchStats.maesot.count > 0 ? Number((branchStats.maesot.sec1 / branchStats.maesot.count).toFixed(2)) : 0,
      sec2: branchStats.maesot.count > 0 ? Number((branchStats.maesot.sec2 / branchStats.maesot.count).toFixed(2)) : 0,
      sec3: branchStats.maesot.count > 0 ? Number((branchStats.maesot.sec3 / branchStats.maesot.count).toFixed(2)) : 0,
      pct: branchStats.maesot.count > 0 ? Math.round((branchStats.maesot.totalScore / branchStats.maesot.count / 30) * 100) : 0,
    },
  ];

  // 6. Smoothed Line Chart Data Generators
  // Mode A: By Sales Rep
  const smoothedRepData = repLeaderboard.map((r) => ({
    label: r.name,
    'คะแนนรวม (เต็ม 30)': r.avgScore30,
    'หมวด 1 สื่อสาร/บริการ (เต็ม 20)': r.avgSec1,
    'หมวด 2 รับผิดชอบ (เต็ม 5)': r.avgSec2,
    'หมวด 3 ประทับใจ (เต็ม 5)': r.avgSec3,
    'ความพึงพอใจ (%)': r.pct,
  }));

  // Mode B: By Branch (ตาก vs แม่สอด)
  const smoothedBranchData = branchCompareData.map((b) => ({
    label: b.name,
    'คะแนนรวม (เต็ม 30)': b.avgScore,
    'หมวด 1 สื่อสาร/บริการ (เต็ม 20)': b.sec1,
    'หมวด 2 รับผิดชอบ (เต็ม 5)': b.sec2,
    'หมวด 3 ประทับใจ (เต็ม 5)': b.sec3,
    'ความพึงพอใจ (%)': b.pct,
  }));

  // Mode C: By Customer / Store
  const smoothedCustomerData = customerSummaries.slice(0, 10).map((c) => ({
    label: c.customerName.length > 12 ? c.customerName.slice(0, 12) + '...' : c.customerName,
    fullName: c.customerName,
    'คะแนนรวม (เต็ม 30)': c.avgScore,
    'หมวด 1 สื่อสาร/บริการ (เต็ม 20)': c.avgS1,
    'หมวด 2 รับผิดชอบ (เต็ม 5)': c.avgS2,
    'หมวด 3 ประทับใจ (เต็ม 5)': c.avgS3,
    'ความพึงพอใจ (%)': c.avgPctCust,
  }));

  const activeSmoothedData =
    trendMode === 'rep'
      ? smoothedRepData
      : trendMode === 'branch'
      ? smoothedBranchData
      : smoothedCustomerData;

  // 7. Intelligent AI Advisor & Trend Diagnostic Calculation
  const sec1Pct = Math.round((avgSec1 / 20) * 100);
  const sec2Pct = Math.round((avgSec2 / 5) * 100);
  const sec3Pct = Math.round((avgSec3 / 5) * 100);

  const q2_1_pct = Math.round((avgQ2_1 / 2.5) * 100);
  const q1_3_pct = Math.round((avgQ1_3 / 2.5) * 100);
  const q1_4_pct = Math.round((avgQ1_4 / 2.5) * 100);

  const strengths: string[] = [];
  if (sec1Pct >= 85) strengths.push('ทักษะการสื่อสารกับลูกค้า การแจ้งราคา โปรโมชั่น และแคมเปญทำได้อย่างยอดเยี่ยม รวดเร็วและถูกต้อง');
  if (sec3Pct >= 85) strengths.push('ความสุภาพเรียบร้อย ความเป็นกันเอง และความใส่ใจบริการ สร้างความประทับใจให้ลูกค้าระดับสูงมาก');
  if (priceLower > 0) strengths.push(`มีร้านค้า ${priceLower} ร้านค้ายืนยันว่าราคาของเราถูกกว่าคู่แข่ง เสริมความได้เปรียบทางการแข่งขัน`);
  if (strengths.length === 0) strengths.push('ทีมขายมีความเอาใจใส่และเข้าพบลูกค้าอย่างต่อเนื่องสม่ำเสมอ');

  const weaknesses: string[] = [];
  if (priceHigher > 0) {
    weaknesses.push(`มีลูกค้า ${priceHigher} ร้านค้า ระบุว่าราคาสินค้าของบริษัท "สูงกว่าคู่แข่ง" เสี่ยงต่อการเสียยอดคำสั่งซื้อให้คู่แข่ง (เช่น ไทวัสดุ, โกลบอลเฮ้าส์)`);
  }
  if (q2_1_pct < 80) {
    weaknesses.push('การแจ้งเวลาการจัดส่งสินค้าล่วงหน้าและการอัพเดตสถานะขนส่งเมื่อเกิดความล่าช้า (ข้อ 2.1) ยังมีคะแนนต่ำกว่าเกณฑ์ ควรปรับปรุงการประสานงาน');
  }
  if (q1_3_pct < 80) {
    weaknesses.push('การผลักดันกลุ่มสินค้า HVA และ SVP พร้อมอุปกรณ์หลังคา ฝา ฝ้า ไม้ (ข้อ 1.3) ยังนำเสนอไม่เต็มที่ เซลล์มักเน้นเฉพาะสินค้าทั่วไป');
  }
  if (q1_4_pct < 80) {
    weaknesses.push('การเก็บราคาสินค้าคู่แข่งเชิงรุก (ข้อ 1.4) ยังขาดความต่อเนื่อง ทำให้ขาดข้อมูลในการปรับแผนราคา');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('รักษามาตรฐานการบริการอย่างสม่ำเสมอ และเพิ่มการสืบราคาสินค้าคู่แข่งเพื่อไม่ให้เสียส่วนแบ่งการตลาด');
  }

  // Aggregate All Interested Products
  const allInterestedProducts = Array.from(
    new Set(
      evaluations
        .flatMap((e) => e.interestedProducts || [])
        .map((p) => p.trim())
        .filter(Boolean)
    )
  );

  // Strategic Supervisor Action Plan
  const actionPlanItems = [
    {
      title: '1. จัดประชุม Co-Sales ทบทวนราคาสินค้าที่มีปัญหากับคู่แข่ง',
      desc: priceHigher > 0
        ? `ลูกค้าบางร้านสะท้อนว่าราคาสูงกว่าคู่แข่ง หัวหน้าควรเรียกทีมขายและฝ่ายจัดซื้อมาพิจารณาส่วนลดวอลุ่ม หรือจัดเซ็ตคู่สินค้าเพื่อดึงยอดขายกลับมา`
        : `มอนิเตอร์ราคาสินค้าหลักอย่างใกล้ชิด เทียบกับไทวัสดุและโกลบอลเฮ้าส์ ทั้งสาขาตากและสาขาแม่สอด`,
      icon: DollarSign,
    },
    {
      title: '2. เข้มงวดการแจ้งล่วงหน้าเรื่องการจัดส่งสินค้า (Logistics Notice)',
      desc: 'กำชับให้พนักงานขายทุกคนส่งพิกัดหรือแจ้งอัพเดตเวลารถส่งสินค้าล่วงหน้าอย่างน้อย 1-2 ชั่วโมง และโทรแจ้งทันทีหากขนส่งติดปัญหาหรือล่าช้า',
      icon: Truck,
    },
    {
      title: '3. Co-Visiting เข้าพบลูกค้ารายสำคัญร่วมกับหัวหน้าฝ่ายขาย',
      desc: customerSummaries.length > 0
        ? `กำหนดตารางให้หัวหน้าเข้าพบลูกค้า ${customerSummaries[0]?.customerName} และร้านค้าที่ให้คะแนนต่ำกว่า 24 คะแนน เพื่อรับฟังข้อเสนอแนะและปิดการขายสินค้า HVA`
        : `กำหนดตารางเข้าพบลูกค้ารายสัปดาห์ร่วมกับเซลล์`,
      icon: Users,
    },
    {
      title: '4. จัดทำใบเสนอราคาพิเศษสำหรับสินค้าที่ลูกค้าสนใจ',
      desc: allInterestedProducts.length > 0
        ? `เร่งทำราคาด่วนในกลุ่มสินค้าที่ลูกค้าเรียกร้อง: ${allInterestedProducts.slice(0, 3).join(', ')} เพื่อเปิดออเดอร์ใหม่`
        : 'ให้เซลล์สอบถามความต้องการสินค้าเพิ่มทุกครั้งที่เข้าพบ',
      icon: Target,
    },
  ];

  // Copy AI Advice
  const handleCopyAiAdvice = () => {
    const text = `📊 สรุปผลการวิเคราะห์และข้อเสนอแนะ AI สำหรับหัวหน้างาน\n` +
      `📅 ณ วันที่: ${new Date().toLocaleDateString('th-TH')}\n` +
      `⭐ คะแนนเฉลี่ยรวม: ${avgScore30.toFixed(2)} / 30.00 คะแนน (${avgPct}%)\n` +
      `🏢 สาขา ตาก: ${branchStats.tak.count} ใบ (เฉลี่ย ${branchCompareData[0].avgScore}/30) | สาขา แม่สอด: ${branchStats.maesot.count} ใบ (เฉลี่ย ${branchCompareData[1].avgScore}/30)\n` +
      `🏢 จำนวนแบบประเมินทั้งหมด: ${total} ฉบับ (${customerSummaries.length} ร้านค้า)\n\n` +
      `✅ จุดเด่นของทีมขาย:\n${strengths.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}\n\n` +
      `⚠️ จุดที่ต้องปรับปรุงเร่งด่วน:\n${weaknesses.map((w, i) => `  ${i + 1}. ${w}`).join('\n')}\n\n` +
      `📋 แผนปฏิบัติการที่แนะนำสำหรับหัวหน้า (Action Plan):\n` +
      actionPlanItems.map((a) => `  • ${a.title}\n    ${a.desc}`).join('\n') +
      `\n\n📌 สินค้าที่ลูกค้าต้องการให้ทำราคา: ${allInterestedProducts.join(', ') || 'ไม่มี'}`;

    navigator.clipboard.writeText(text);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToList}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการแบบประเมิน</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAiAdvice}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="คัดลอกข้อสรุปคำแนะนำ AI เพื่อส่ง LINE ให้ผู้บริหารหรือหัวหน้างาน"
          >
            {copiedAi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAi ? 'คัดลอกเรียบร้อย!' : 'คัดลอกสรุป AI'}</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ส่งออก Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Card (คะแนนเต็ม 30 คะแนน) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-100 font-bold block">
            ⭐ คะแนนเฉลี่ยรวมทุกพนักงานขาย (คะแนนเต็ม 30 คะแนน)
          </span>
          <div className="text-2xl sm:text-3xl font-black mt-1">
            {avgScore30.toFixed(2)} <span className="text-sm font-normal text-emerald-100">/ 30.00 คะแนน</span>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            หมวด 1: {avgSec1.toFixed(1)}/20 • หมวด 2: {avgSec2.toFixed(1)}/5 • หมวด 3: {avgSec3.toFixed(1)}/5 (ทั้งหมด {total} ฉบับ จาก {customerSummaries.length} ร้านค้า)
          </p>
        </div>

        {/* Branch Quick Comparison Pill */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] text-emerald-100 block">สาขา ตาก ({branchStats.tak.count})</span>
            <span className="text-base sm:text-lg font-black">{branchCompareData[0].avgScore} <span className="text-[10px] font-normal">/30</span></span>
          </div>

          <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <span className="text-[10px] text-emerald-100 block">สาขา แม่สอด ({branchStats.maesot.count})</span>
            <span className="text-base sm:text-lg font-black">{branchCompareData[1].avgScore} <span className="text-[10px] font-normal">/30</span></span>
          </div>

          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/30 text-center">
            <span className="text-[10px] text-emerald-100 block font-semibold">ความพึงพอใจรวม</span>
            <span className="text-xl sm:text-2xl font-black">{avgPct}%</span>
          </div>
        </div>
      </div>

      {/* 📈 Smoothed Line Chart: แสดงความพึงพอใจของลูกค้า (ตามคำขอ) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>แนวโน้มความพึงพอใจของลูกค้า (Smoothed Line Chart)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กราฟเส้นโค้งเรียบ (Smoothed Spline) แสดงระดับคะแนนเปรียบเทียบตามคะแนนเต็ม 30 คะแนน
            </p>
          </div>

          {/* Toggle 3 View Modes */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setTrendMode('rep')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendMode === 'rep'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👥 แยกตาม พนักงาน
            </button>
            <button
              onClick={() => setTrendMode('branch')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendMode === 'branch'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 แยกตาม สาขา
            </button>
            <button
              onClick={() => setTrendMode('customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                trendMode === 'customer'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏬 แยกตาม ชื่อร้าน / ลูกค้า
            </button>
          </div>
        </div>

        {/* Smoothed Line Chart Render */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activeSmoothedData}
              margin={{ top: 15, right: 25, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                angle={trendMode === 'customer' ? -15 : 0}
                textAnchor={trendMode === 'customer' ? 'end' : 'middle'}
              />
              <YAxis domain={[0, 30]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `${val} ${name.includes('%') ? '%' : 'คะแนน'}`,
                  name,
                ]}
                contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {/* Smoothed curves using type="monotone" */}
              <Line
                type="monotone"
                dataKey="คะแนนรวม (เต็ม 30)"
                stroke="#059669"
                strokeWidth={3.5}
                dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="หมวด 1 สื่อสาร/บริการ (เต็ม 20)"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3.5, fill: '#0284c7' }}
              />
              <Line
                type="monotone"
                dataKey="หมวด 2 รับผิดชอบ (เต็ม 5)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3.5, fill: '#6366f1' }}
              />
              <Line
                type="monotone"
                dataKey="หมวด 3 ประทับใจ (เต็ม 5)"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ r: 3.5, fill: '#14b8a6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>
            {trendMode === 'rep' && `แสดงคะแนนเฉลี่ยเปรียบเทียบของพนักงานขาย ${repLeaderboard.length} ท่าน`}
            {trendMode === 'branch' && 'เปรียบเทียบคะแนนความพึงพอใจระหว่าง สาขา ตาก และ สาขา แม่สอด'}
            {trendMode === 'customer' && `แสดงคะแนนความพึงพอใจของลูกค้า 10 ร้านค้าแรก (เรียงตามคะแนน)`}
          </span>
          <span className="font-semibold text-emerald-700">
            เส้นโค้ง Smoothed Spline ช่วยวิเคราะห์เสถียรภาพและแนวโน้มการบริการ
          </span>
        </div>
      </div>

      {/* 🤖 AI Advisor & Trend Diagnosis for Supervisors (AI ตัวช่วยแนะนำหัวหน้างาน) */}
      <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>AI ตัวช่วยแนะนำหัวหน้างาน</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  วิเคราะห์จากข้อมูลประเมินจริง
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ประมวลผลแนวโน้ม จุดแข็ง จุดอ่อน การแข่งขันด้านราคา และ Action Plan สำหรับหัวหน้าฝ่ายขาย
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyAiAdvice}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            {copiedAi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAi ? 'คัดลอกแล้ว' : 'คัดลอกคำแนะนำ'}</span>
          </button>
        </div>

        {/* AI Insight Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pillar 1: Strengths */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>จุดเด่นของทีมขายที่ลูกค้าพึงพอใจสูง</span>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pillar 2: Weaknesses & Alerts */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>จุดที่ต้องเฝ้าระวัง & ปรับปรุงเร่งด่วน</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {weaknesses.map((wk, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Plan for Supervisor */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>คำแนะนำเชิงกลยุทธ์สำหรับหัวหน้างาน (Supervisor Action Plan):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {actionPlanItems.map((act, i) => {
              const IconComp = act.icon;
              return (
                <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{act.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    {act.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interested Products Wanted by Customers */}
        {allInterestedProducts.length > 0 && (
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              <span>สินค้าที่ลูกค้าอยากให้ทำราคาเร่งด่วน:</span>
            </span>
            {allInterestedProducts.map((prod, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 bg-white text-purple-800 border border-purple-300 rounded-full font-medium shadow-2xs"
              >
                {prod}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 🏢 สรุปผลแยกตามรายชื่อร้าน / ลูกค้า (Customer & Store Performance Summary) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>สรุปผลสถิติแยกตามรายชื่อร้าน / ลูกค้า</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {customerSummaries.length} ร้านค้า
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              สรุปคะแนนประเมินเต็ม 30 คะแนน, สาขาที่ดูแล, การรับรู้ราคาคู่แข่ง และฟีดแบ็กแยกรายลูกค้ารายบุคคล
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="ค้นหาชื่อร้านค้า, เซลล์ หรือสาขา..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Customer Cards & Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold">ชื่อร้าน / ลูกค้า</th>
                <th className="p-3 font-bold">สาขา</th>
                <th className="p-3 font-bold">พนักงานขาย</th>
                <th className="p-3 font-bold">ผู้ให้ข้อมูล / เบอร์ติดต่อ</th>
                <th className="p-3 text-center font-bold">จำนวนครั้ง</th>
                <th className="p-3 text-right font-bold">คะแนนเฉลี่ย (เต็ม 30)</th>
                <th className="p-3 text-center font-bold">หมวด 1 (20)</th>
                <th className="p-3 text-center font-bold">หมวด 2 (5)</th>
                <th className="p-3 text-center font-bold">หมวด 3 (5)</th>
                <th className="p-3 text-center font-bold">ราคาเทียบคู่แข่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    ไม่พบข้อมูลร้านค้าตามคำค้นหา
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const priceInfo = formatPriceComparisonLabel(cust.latestPriceComparison);
                  return (
                    <tr key={cust.customerName} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cust.customerName}</span>
                          {cust.hasPhotos && (
                            <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200" title="มีภาพถ่ายหน้างาน">
                              📷
                            </span>
                          )}
                          {cust.hasCheckIn && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="มีการ Check-in พิกัด GPS">
                              📍
                            </span>
                          )}
                        </div>
                        {cust.feedbacks.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-1 italic">
                            "{cust.feedbacks[0]}"
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 border border-slate-200">
                          {Array.from(cust.branches).join(', ') || 'สาขา ตาก'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className="font-semibold text-blue-700">
                          {Array.from(cust.salesReps).join(', ') || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {Array.from(cust.evaluators).join(', ') || '-'}
                      </td>
                      <td className="p-3 text-center text-slate-700 font-medium">
                        {cust.count} ครั้ง
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-black text-sm text-emerald-700">
                          {cust.avgScore} <span className="text-[10px] font-normal text-slate-500">/ 30</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {cust.avgPctCust}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold text-sky-700">
                        {cust.avgS1} / 20
                      </td>
                      <td className="p-3 text-center font-semibold text-indigo-700">
                        {cust.avgS2} / 5
                      </td>
                      <td className="p-3 text-center font-semibold text-teal-700">
                        {cust.avgS3} / 5
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${priceInfo.badgeClass}`}>
                          {priceInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Averages */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>คะแนนเฉลี่ยแยกตามหมวดการประเมิน (เต็ม 30 คะแนน)</span>
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
                <YAxis domain={[0, 30]} tick={{ fontSize: 11, fill: '#64748b' }} />
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

        {/* Chart 2: Competitor Price Perception */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>ราคาสินค้า & Feedback โปรโมชั่น เทียบกับคู่แข่ง</span>
              </h3>
              <p className="text-xs text-slate-500">
                เกณฑ์: ต่ำกว่า, ใกล้เคียง, สูงกว่า, ไม่แน่ใจ, ไม่สามารถเปิดเผยได้ (ส่วนที่ 2 ข้อ 1)
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {priceChartData.length === 0 ? (
              <div className="text-xs text-slate-400">ยังไม่มีข้อมูลราคา</div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Sales Rep Leaderboard Table (เต็ม 30 คะแนน) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>อันดับคะแนนความพึงพอใจรายพนักงานขาย (เต็ม 30 คะแนน)</span>
            </h3>
            <p className="text-xs text-slate-500">
              จัดอันดับตามคะแนนรวมทั้ง 3 หมวด (คะแนนเต็ม 30 คะแนน)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="p-3 w-12 text-center">อันดับ</th>
                <th className="p-3">พนักงานขาย / เซลล์</th>
                <th className="p-3">สาขา</th>
                <th className="p-3 text-center w-28">จำนวนแบบประเมิน</th>
                <th className="p-3 text-right w-36">คะแนนเฉลี่ย (เต็ม 30 คะแนน)</th>
                <th className="p-3 text-right w-28">ร้อยละ (%)</th>
                <th className="p-3 text-center w-36">ระดับผลงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repLeaderboard.map((item, idx) => {
                const isTop1 = idx === 0;
                return (
                  <tr key={item.name} className="hover:bg-slate-50">
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
                    <td className="p-3 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="p-3 text-slate-600">
                      {item.branches || 'สาขา ตาก'}
                    </td>
                    <td className="p-3 text-center text-slate-600">
                      {item.count} ใบ
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 text-sm">
                      {item.avgScore30} / 30.00
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">
                      {item.pct}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {item.avgScore30 >= 27
                          ? 'ดีมาก ⭐'
                          : item.avgScore30 >= 24
                          ? 'ดี 👍'
                          : item.avgScore30 >= 18
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
