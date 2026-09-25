import React, { useState } from 'react';
import { SalesEvaluation } from '../../types';
import {
  formatChannelLabel,
  formatPriceComparisonLabel,
  formatFutureIntent,
} from '../../utils/evaluationCalculator';
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
} from 'lucide-react';

interface EvaluationListViewProps {
  evaluations: SalesEvaluation[];
  onAddNew: () => void;
  onEdit: (evaluation: SalesEvaluation) => void;
  onDelete: (id: string) => void;
  onPrint: (evaluation: SalesEvaluation) => void;
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
  onSendLine,
  onExportExcel,
  onViewStats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all');

  // Sales reps list
  const salesReps = Array.from(new Set(evaluations.map((e) => e.salesRepName).filter(Boolean)));

  // Filtered evaluations
  const filtered = evaluations.filter((ev) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      ev.customerName.toLowerCase().includes(q) ||
      ev.salesRepName.toLowerCase().includes(q) ||
      ev.evaluationCode.toLowerCase().includes(q) ||
      (ev.projectName && ev.projectName.toLowerCase().includes(q)) ||
      (ev.evaluatorName && ev.evaluatorName.toLowerCase().includes(q));

    // Sales Rep filter
    const matchRep = selectedSalesRep === 'all' || ev.salesRepName === selectedSalesRep;

    // Grade filter
    const matchGrade =
      selectedGrade === 'all' ||
      (selectedGrade === 'excellent' && ev.percentageScore >= 90) ||
      (selectedGrade === 'very_good' && ev.percentageScore >= 80 && ev.percentageScore < 90) ||
      (selectedGrade === 'good' && ev.percentageScore >= 70 && ev.percentageScore < 80) ||
      (selectedGrade === 'average' && ev.percentageScore < 70);

    // Price comparison filter
    const matchPrice =
      selectedPriceFilter === 'all' || ev.overallPriceComparison === selectedPriceFilter;

    return matchQuery && matchRep && matchGrade && matchPrice;
  });

  // Calculate statistics
  const totalCount = evaluations.length;
  const avgOverallScore =
    totalCount > 0
      ? Number((evaluations.reduce((sum, e) => sum + e.averageScore, 0) / totalCount).toFixed(2))
      : 0;
  const avgPercentage =
    totalCount > 0
      ? Math.round(evaluations.reduce((sum, e) => sum + e.percentageScore, 0) / totalCount)
      : 0;

  const continuousCount = evaluations.filter((e) => e.futurePurchaseIntent === 'continuous').length;
  const continuousRate = totalCount > 0 ? Math.round((continuousCount / totalCount) * 100) : 0;

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
              {totalCount} <span className="text-xs font-normal text-slate-500">ชุด</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              🌱 ประหยัดกระดาษ 100%
            </span>
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              คะแนนเฉลี่ยรวม
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {avgOverallScore}{' '}
              <span className="text-xs font-normal text-slate-500">/ 5.0</span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              คิดเป็น {avgPercentage}%
            </span>
          </div>
        </div>

        {/* Card 3: Repurchase Intent */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              ความประสงค์สั่งซื้อต่อ
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {continuousRate}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {continuousCount} จาก {totalCount} ราย
            </span>
          </div>
        </div>

        {/* Card 4: Action Buttons */}
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
              placeholder="ค้นหาลูกค้า, พนักงานขาย, รหัสเอกสาร, โครงการ..."
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

          {/* Sales Rep Filter */}
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

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="all">ระดับคะแนนทั้งหมด</option>
            <option value="excellent">ดีเยี่ยม (90% ขึ้นไป)</option>
            <option value="very_good">ดีมาก (80% - 89%)</option>
            <option value="good">ดี (70% - 79%)</option>
            <option value="average">ปานกลาง/ปรับปรุง (&lt;70%)</option>
          </select>

          {/* Price Comp Filter */}
          <select
            value={selectedPriceFilter}
            onChange={(e) => setSelectedPriceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="all">ระดับราคาทั้งหมด</option>
            <option value="lower">🟢 ถูกกว่าคู่แข่ง</option>
            <option value="similar">🔵 ใกล้เคียงคู่แข่ง</option>
            <option value="higher">🟠 สูงกว่าคู่แข่ง</option>
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

      {/* List of Evaluation Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            ไม่พบข้อมูลแบบประเมินความพึงพอใจ
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "ทำแบบประเมินใหม่" เพื่อบันทึกข้อมูลการประเมินชุดแรก
          </p>
          <button
            onClick={onAddNew}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกแบบประเมินใหม่</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => {
            const priceInfo = formatPriceComparisonLabel(ev.overallPriceComparison);
            const futureInfo = formatFutureIntent(ev.futurePurchaseIntent);
            const channelText = formatChannelLabel(ev.contactChannel);

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Code, Customer & Rep */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                        {ev.evaluationCode}
                      </span>
                      <span className="text-xs text-slate-400">
                        {ev.date}
                      </span>
                      <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {channelText}
                      </span>
                      {ev.jobCode && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                          งาน: {ev.jobCode}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      {ev.customerName}
                    </h4>

                    {ev.projectName && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        โครงการ: {ev.projectName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <div>
                        <span className="text-slate-400">พนักงานขาย: </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {ev.salesRepName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">ผู้ประเมิน: </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {ev.evaluatorName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">เทียบราคา: </span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${priceInfo.badgeClass}`}>
                          {priceInfo.label}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">ซื้อต่อ: </span>
                        <span className={`font-semibold ${futureInfo.color}`}>
                          {futureInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Customer Strengths or Note */}
                    {ev.strengthsFeedback && (
                      <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">💬 จุดเด่น: </span>
                        <span>{ev.strengthsFeedback}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Score Badge & Actions */}
                  <div className="flex sm:flex-col lg:flex-row items-center justify-between sm:items-end lg:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Score summary */}
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-right">
                          <span className="text-lg font-black">{ev.averageScore}</span>
                          <span className="text-xs font-normal"> / 5.0</span>
                          <span className="block text-[10px] font-bold text-emerald-600">
                            {ev.percentageScore}% ({ev.gradeLabel.split(' ')[0]})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
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
