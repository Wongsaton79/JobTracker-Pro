import React, { useState } from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelText, formatPriceComparisonLabel } from '../../utils/evaluationCalculator';
import {
  Star,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Printer,
  Send,
  Edit2,
  Trash2,
  Award,
  TrendingUp,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  BarChart3,
  Image as ImageIcon,
  Share2,
  Link as LinkIcon,
} from 'lucide-react';

interface EvaluationListViewProps {
  evaluations: SalesEvaluation[];
  onAddNew: () => void;
  onEdit: (evaluation: SalesEvaluation) => void;
  onDelete: (id: string) => void;
  onPrint: (evaluation: SalesEvaluation) => void;
  onExportImage?: (evaluation: SalesEvaluation) => void;
  onShareLink?: (evaluation: SalesEvaluation) => void;
  onSendLine: (evaluation: SalesEvaluation) => void;
  onExportExcel: () => void;
  onViewStats: () => void;
}

export const EvaluationListView: React.FC<EvaluationListViewProps> = ({
  evaluations,
  onAddNew,
  onEdit,
  onDelete,
  onPrint,
  onExportImage,
  onShareLink,
  onSendLine,
  onExportExcel,
  onViewStats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');

  const salesReps = Array.from(new Set(evaluations.map((e) => e.salesRepName).filter(Boolean)));

  // Filter
  const filtered = evaluations.filter((ev) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      ev.customerName.toLowerCase().includes(q) ||
      ev.salesRepName.toLowerCase().includes(q) ||
      ev.evaluationCode.toLowerCase().includes(q) ||
      (ev.evaluatorName && ev.evaluatorName.toLowerCase().includes(q));

    const matchRep = selectedSalesRep === 'all' || ev.salesRepName === selectedSalesRep;
    const matchBranch = selectedBranch === 'all' || (ev.branch || 'ตาก') === selectedBranch;

    const currentScore = ev.totalScore ?? ev.rawTotalScore ?? 30;
    const matchGrade =
      selectedGrade === 'all' ||
      (selectedGrade === 'excellent' && currentScore >= 27) ||
      (selectedGrade === 'good' && currentScore >= 24 && currentScore < 27) ||
      (selectedGrade === 'average' && currentScore >= 18 && currentScore < 24) ||
      (selectedGrade === 'poor' && currentScore < 18);

    const matchPrice =
      selectedPriceFilter === 'all' || ev.feedbackPriceAndPromo === selectedPriceFilter;

    return matchQuery && matchRep && matchBranch && matchGrade && matchPrice;
  });

  // Calculate statistics (out of 30 points)
  const totalCount = evaluations.length;
  const avgScore30 =
    totalCount > 0
      ? Number(
          (
            evaluations.reduce(
              (sum, e) => sum + (e.totalScore ?? e.rawTotalScore ?? 30),
              0
            ) / totalCount
          ).toFixed(2)
        )
      : 0;
  const avgPercentage =
    totalCount > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + (e.percentageScore || 0), 0) / totalCount)
      : 0;

  const highPerformers = evaluations.filter(
    (e) => (e.totalScore ?? e.rawTotalScore ?? 30) >= 24
  ).length;
  const highRate = totalCount > 0 ? Math.round((highPerformers / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              แบบประเมินทั้งหมด
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalCount} <span className="text-xs font-normal text-slate-500">ใบ</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              🌱 ลดกระดาษ 100%
            </span>
          </div>
        </div>

        {/* Card 2: Average Score out of 30 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              คะแนนเฉลี่ย (เต็ม 30)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {avgScore30}{' '}
              <span className="text-xs font-normal text-slate-500">/ 30</span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              คิดเป็น {avgPercentage}%
            </span>
          </div>
        </div>

        {/* Card 3: High Performance Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              เกณฑ์ดีมาก-ดี (&ge;24 คะแนน)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {highRate}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {highPerformers} จาก {totalCount} ราย
            </span>
          </div>
        </div>

        {/* Card 4: Action Button */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-[11px] text-emerald-100 font-medium block">ทำรายการด่วน</span>
            <span className="text-xs font-bold">บันทึกแบบประเมินใหม่</span>
          </div>
          <button
            onClick={onAddNew}
            className="w-full mt-2 py-2 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ทำแบบประเมิน</span>
          </button>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อร้านค้า, ลูกค้า, เซลล์, รหัสเอกสาร..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onViewStats}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <span>สรุปสถิติ</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="ส่งออกรายงานแบบประเมินเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ แบบประเมินใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>กรองข้อมูล:</span>
          </span>

          <select
            value={selectedSalesRep}
            onChange={(e) => setSelectedSalesRep(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="all">พนักงานขายทั้งหมด ({salesReps.length})</option>
            {salesReps.map((rep) => (
              <option key={rep} value={rep}>
                {rep}
              </option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            <option value="all">🏢 สาขาทั้งหมด (ตาก & แม่สอด)</option>
            <option value="ตาก">🏢 สาขา ตาก</option>
            <option value="แม่สอด">🏢 สาขา แม่สอด</option>
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="all">ระดับคะแนนทั้งหมด (เต็ม 30)</option>
            <option value="excellent">ดีมาก (27 - 30 คะแนน)</option>
            <option value="good">ดี (24 - 26.9 คะแนน)</option>
            <option value="average">ปานกลาง (18 - 23.9 คะแนน)</option>
            <option value="poor">ควรปรับปรุง (&lt; 18 คะแนน)</option>
          </select>

          <select
            value={selectedPriceFilter}
            onChange={(e) => setSelectedPriceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="all">ระดับราคาคู่แข่งทั้งหมด</option>
            <option value="lower">🟢 ต่ำกว่าคู่แข่ง</option>
            <option value="similar">🔵 ใกล้เคียงคู่แข่ง</option>
            <option value="higher">🟠 สูงกว่าคู่แข่ง</option>
            <option value="uncertain">⚪ ไม่แน่ใจ</option>
            <option value="undisclosed">🟣 ไม่สามารถเปิดเผยได้</option>
          </select>

          {(searchQuery || selectedSalesRep !== 'all' || selectedGrade !== 'all' || selectedPriceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSalesRep('all');
                setSelectedGrade('all');
                setSelectedPriceFilter('all');
              }}
              className="text-xs text-rose-500 hover:underline ml-auto"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* List of Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Award className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {evaluations.length === 0
              ? 'ยังไม่มีข้อมูลแบบประเมินความพึงพอใจ'
              : 'ไม่พบข้อมูลตามเงื่อนไขการค้นหา'}
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            {evaluations.length === 0
              ? 'ระบบแบบประเมินดิจิทัล 100% Paperless เริ่มต้นบันทึกแบบประเมินความพึงพอใจการทำงานของทีมขายใบแรกได้ทันที'
              : 'ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={onAddNew}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกแบบประเมินใหม่</span>
            </button>
            {evaluations.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSalesRep('all');
                  setSelectedGrade('all');
                  setSelectedPriceFilter('all');
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => {
            const priceInfo = formatPriceComparisonLabel(
              ev.feedbackPriceAndPromo || (ev as any)?.overallPriceComparison
            ) || {
              label: 'ใกล้เคียง',
              badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
            };
            const channelText = formatChannelText(ev.contactChannel);

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                        {ev.evaluationCode}
                      </span>
                      <span className="text-xs text-slate-400">{ev.date}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {ev.branch === 'แม่สอด' ? '🏢 สาขา แม่สอด' : '🏢 สาขา ตาก'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {channelText}
                      </span>
                      {ev.jobCode && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                          อ้างอิง: {ev.jobCode}
                        </span>
                      )}
                      {ev.photos && ev.photos.length > 0 && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                          📷 {ev.photos.length} รูป
                        </span>
                      )}
                      {ev.checkInLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${ev.checkInLocation.lat},${ev.checkInLocation.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 transition-colors"
                          title={ev.checkInLocation.address ? `ที่อยู่: ${ev.checkInLocation.address}` : `พิกัด GPS: ${ev.checkInLocation.lat}, ${ev.checkInLocation.lng}`}
                        >
                          📍 GPS หน้างาน ({ev.checkInLocation.lat.toFixed(4)}, {ev.checkInLocation.lng.toFixed(4)})
                        </a>
                      )}
                    </div>

                    <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      {ev.customerName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">พนักงานขาย: </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {ev.salesRepName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">ผู้ให้ข้อมูล / เบอร์ติดต่อ: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {ev.evaluatorName || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">ราคาคู่แข่ง: </span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${priceInfo?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                          {priceInfo?.label || 'ใกล้เคียง'}
                        </span>
                      </div>
                    </div>

                    {/* Section score pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        หมวด 1 การสื่อสาร/บริการ: <strong>{ev.section1Score ?? 20}</strong>/20
                      </span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                        หมวด 2 รับผิดชอบ: <strong>{ev.section2Score ?? 5}</strong>/5
                      </span>
                      <span className="bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        หมวด 3 ประทับใจ: <strong>{ev.section3Score ?? 5}</strong>/5
                      </span>
                    </div>

                    {/* Additional Feedback note */}
                    {ev.additionalFeedback && (
                      <div className="mt-1 text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-amber-700 dark:text-amber-400">💬 ข้อเสนอแนะ: </span>
                        <span>{ev.additionalFeedback}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Score Badge (เต็ม 30 คะแนน) & Action Buttons */}
                  <div className="flex sm:flex-col lg:flex-row items-center justify-between sm:items-end lg:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-right">
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                          คะแนนเต็ม 30
                        </div>
                        <span className="text-2xl font-black">{ev.totalScore ?? ev.rawTotalScore ?? 30}</span>
                        <span className="text-xs font-bold text-emerald-700"> / 30.00</span>
                        <span className="block text-[11px] font-extrabold text-emerald-600">
                          {ev.percentageScore ?? 100}% • {(ev.gradeLabel || 'ดีมาก').split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {onShareLink && (
                        <button
                          onClick={() => onShareLink(ev)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-xs text-xs font-bold active:scale-95 cursor-pointer"
                          title="🔗 แชร์ลิงก์หน้ารายงานเข้ากลุ่ม LINE (สำหรับผู้บริหารและหัวหน้างานดูรูปภาพและพิกัด โดยไม่แสดงคะแนน)"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>แชร์ลิงก์ LINE</span>
                        </button>
                      )}

                      {onExportImage && (
                        <button
                          onClick={() => onExportImage(ev)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-xl transition-colors border border-purple-200 dark:border-purple-800 text-xs font-semibold cursor-pointer"
                          title="🖼️ บันทึก / แชร์เป็นรูปภาพเพื่อนำไปลงกลุ่ม LINE (ไม่แสดงคะแนน)"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>รูปภาพ</span>
                        </button>
                      )}

                      <button
                        onClick={() => onPrint(ev)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                        title="พิมพ์เอกสาร / บันทึก PDF (Print / PDF)"
                      >
                        <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>

                      <button
                        onClick={() => onSendLine(ev)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                        title="ส่งผลประเมินเข้ากลุ่ม LINE"
                      >
                        <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </button>

                      <button
                        onClick={() => onEdit(ev)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                        title="แก้ไขข้อมูลแบบประเมิน"
                      >
                        <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </button>

                      <button
                        onClick={() => onDelete(ev.id)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
                        title="ลบแบบประเมินนี้"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
