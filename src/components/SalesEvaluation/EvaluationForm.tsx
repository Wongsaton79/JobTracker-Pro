import React, { useState, useEffect } from 'react';
import { JobItem, SalesEvaluation, CompetitorPriceItem } from '../../types';
import { computeEvaluationScores, DEFAULT_COMPETITOR_ITEMS } from '../../utils/evaluationCalculator';
import {
  Star,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Send,
  Building,
  User,
  Phone,
  Calendar,
  Layers,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  MessageSquare,
} from 'lucide-react';

interface EvaluationFormProps {
  jobs: JobItem[];
  preSelectedJobId?: string;
  initialEvaluation?: SalesEvaluation | null;
  onSave: (evaluation: SalesEvaluation, sendLine: boolean) => void;
  onCancel: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  jobs,
  preSelectedJobId,
  initialEvaluation,
  onSave,
  onCancel,
}) => {
  // Pre-fill from initial evaluation or selected job
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialEvaluation?.jobId || preSelectedJobId || ''
  );

  const [date, setDate] = useState<string>(
    initialEvaluation?.date || new Date().toISOString().slice(0, 10)
  );
  const [customerName, setCustomerName] = useState<string>(
    initialEvaluation?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialEvaluation?.customerPhone || ''
  );
  const [customerPosition, setCustomerPosition] = useState<string>(
    initialEvaluation?.customerPosition || 'เจ้าของกิจการ / ผู้ดูแลงาน'
  );
  const [evaluatorName, setEvaluatorName] = useState<string>(
    initialEvaluation?.evaluatorName || ''
  );
  const [salesRepName, setSalesRepName] = useState<string>(
    initialEvaluation?.salesRepName || ''
  );
  const [salesDepartment, setSalesDepartment] = useState<string>(
    initialEvaluation?.salesDepartment || 'ทีมงานขายและการตลาด'
  );
  const [contactChannel, setContactChannel] = useState<SalesEvaluation['contactChannel']>(
    initialEvaluation?.contactChannel || 'visit'
  );
  const [projectName, setProjectName] = useState<string>(
    initialEvaluation?.projectName || ''
  );

  // Scores state
  const [scorePoliteness, setScorePoliteness] = useState<number>(initialEvaluation?.scorePoliteness ?? 5);
  const [scorePunctuality, setScorePunctuality] = useState<number>(initialEvaluation?.scorePunctuality ?? 5);
  const [scoreEnthusiasm, setScoreEnthusiasm] = useState<number>(initialEvaluation?.scoreEnthusiasm ?? 5);

  const [scoreProductKnowledge, setScoreProductKnowledge] = useState<number>(initialEvaluation?.scoreProductKnowledge ?? 5);
  const [scoreConsultation, setScoreConsultation] = useState<number>(initialEvaluation?.scoreConsultation ?? 5);
  const [scorePromotionUpdate, setScorePromotionUpdate] = useState<number>(initialEvaluation?.scorePromotionUpdate ?? 5);

  const [scoreQuotationSpeed, setScoreQuotationSpeed] = useState<number>(initialEvaluation?.scoreQuotationSpeed ?? 5);
  const [scoreFollowUp, setScoreFollowUp] = useState<number>(initialEvaluation?.scoreFollowUp ?? 5);
  const [scoreProblemSolving, setScoreProblemSolving] = useState<number>(initialEvaluation?.scoreProblemSolving ?? 5);

  // Section 4: Price & Competitors
  const [overallPriceComparison, setOverallPriceComparison] = useState<SalesEvaluation['overallPriceComparison']>(
    initialEvaluation?.overallPriceComparison || 'similar'
  );
  const [scorePaymentTerms, setScorePaymentTerms] = useState<number>(initialEvaluation?.scorePaymentTerms ?? 5);
  const [competitorPriceItems, setCompetitorPriceItems] = useState<CompetitorPriceItem[]>(() => {
    if (initialEvaluation?.competitorPriceItems && initialEvaluation.competitorPriceItems.length > 0) {
      return initialEvaluation.competitorPriceItems;
    }
    return DEFAULT_COMPETITOR_ITEMS;
  });

  // Section 5: Future & Feedback
  const [futurePurchaseIntent, setFuturePurchaseIntent] = useState<SalesEvaluation['futurePurchaseIntent']>(
    initialEvaluation?.futurePurchaseIntent || 'continuous'
  );
  const [strengthsFeedback, setStrengthsFeedback] = useState<string>(
    initialEvaluation?.strengthsFeedback || ''
  );
  const [improvementFeedback, setImprovementFeedback] = useState<string>(
    initialEvaluation?.improvementFeedback || ''
  );
  const [signatureName, setSignatureName] = useState<string>(
    initialEvaluation?.signatureName || ''
  );

  // When job selection changes, auto-fill customer info if available
  useEffect(() => {
    if (selectedJobId && !initialEvaluation) {
      const foundJob = jobs.find((j) => j.id === selectedJobId);
      if (foundJob) {
        if (!customerName) setCustomerName(foundJob.contactPerson || foundJob.title);
        if (!customerPhone) setCustomerPhone(foundJob.phoneNumber || '');
        if (!projectName) setProjectName(foundJob.title);
        if (!evaluatorName) setEvaluatorName(foundJob.contactPerson || '');
        if (!salesRepName && foundJob.assignedTo) setSalesRepName(foundJob.assignedTo);
      }
    }
  }, [selectedJobId, jobs]);

  // Compute live scores
  const scoreResults = computeEvaluationScores({
    scorePoliteness,
    scorePunctuality,
    scoreEnthusiasm,
    scoreProductKnowledge,
    scoreConsultation,
    scorePromotionUpdate,
    scoreQuotationSpeed,
    scoreFollowUp,
    scoreProblemSolving,
    scorePaymentTerms,
  });

  // Quick fill all scores to 5
  const handleQuickFillAll5 = () => {
    setScorePoliteness(5);
    setScorePunctuality(5);
    setScoreEnthusiasm(5);
    setScoreProductKnowledge(5);
    setScoreConsultation(5);
    setScorePromotionUpdate(5);
    setScoreQuotationSpeed(5);
    setScoreFollowUp(5);
    setScoreProblemSolving(5);
    setScorePaymentTerms(5);
  };

  // Add competitor item row
  const handleAddCompetitorItem = () => {
    const newItem: CompetitorPriceItem = {
      id: `comp-${Date.now()}`,
      productName: '',
      ourPrice: undefined,
      competitorPrice: undefined,
      comparison: 'similar',
      competitorSource: 'ไทวัสดุ / โกลบอลเฮ้าส์',
      note: '',
    };
    setCompetitorPriceItems((prev) => [...prev, newItem]);
  };

  const handleUpdateCompetitorItem = (id: string, field: keyof CompetitorPriceItem, val: any) => {
    setCompetitorPriceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveCompetitorItem = (id: string) => {
    setCompetitorPriceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (sendLine: boolean = false) => {
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อลูกค้า / ร้านค้า');
      return;
    }
    if (!salesRepName.trim()) {
      alert('กรุณากรอกชื่อพนักงานขายที่ถูกประเมิน');
      return;
    }
    if (!evaluatorName.trim()) {
      alert('กรุณากรอกชื่อผู้ประเมิน');
      return;
    }

    const linkedJob = jobs.find((j) => j.id === selectedJobId);

    const newEval: SalesEvaluation = {
      id: initialEvaluation?.id || `eval-${Date.now()}`,
      evaluationCode: initialEvaluation?.evaluationCode || `EVAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      date,
      jobId: selectedJobId || undefined,
      jobCode: linkedJob?.jobCode,
      projectName: projectName || linkedJob?.title,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerPosition: customerPosition.trim(),
      evaluatorName: evaluatorName.trim(),
      salesRepName: salesRepName.trim(),
      salesDepartment: salesDepartment.trim(),
      contactChannel,

      scorePoliteness,
      scorePunctuality,
      scoreEnthusiasm,

      scoreProductKnowledge,
      scoreConsultation,
      scorePromotionUpdate,

      scoreQuotationSpeed,
      scoreFollowUp,
      scoreProblemSolving,

      overallPriceComparison,
      competitorPriceItems: competitorPriceItems.filter((i) => i.productName.trim() !== ''),
      scorePaymentTerms,

      futurePurchaseIntent,
      strengthsFeedback: strengthsFeedback.trim(),
      improvementFeedback: improvementFeedback.trim(),
      signatureName: signatureName.trim() || evaluatorName.trim(),

      totalScore: scoreResults.totalScore,
      maxPossibleScore: scoreResults.maxScore,
      averageScore: scoreResults.averageScore,
      percentageScore: scoreResults.percentageScore,
      gradeLabel: scoreResults.gradeLabel,
      gradeColor: scoreResults.gradeColor,

      createdAt: initialEvaluation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    onSave(newEval, sendLine);
  };

  // Reusable 1-5 Rating Selector
  const renderRatingGroup = (
    label: string,
    subtext: string,
    value: number,
    onChange: (val: number) => void
  ) => {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">{label}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{subtext}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
            {[1, 2, 3, 4, 5].map((num) => {
              const isSelected = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onChange(num)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-slate-600'
                  }`}
                  title={`${num} คะแนน`}
                >
                  <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-current' : 'text-slate-400'}`} />
                  <span className="ml-0.5">{num}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-medium mb-2 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>ระบบประเมินผลออนไลน์ 100% Paperless • ลดการใช้กระดาษ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {initialEvaluation ? '✏️ แก้ไขแบบประเมินความพึงพอใจทีมขาย' : '📝 บันทึกแบบประเมินความพึงพอใจ การทำงานของทีมขาย'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              ประเมินการบริการ ความรู้สินค้า ความรวดเร็วในการประสานงาน และวิเคราะห์ราคากับคู่แข่ง (ไทวัสดุ / โกลบอลเฮ้าส์)
            </p>
          </div>

          {/* Quick Score Live Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center shrink-0 w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block">คะแนนสด Real-time</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{scoreResults.averageScore}</span>
              <span className="text-xs text-emerald-100"> / 5.0</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white font-bold text-xs">
              {scoreResults.percentageScore}% • {scoreResults.gradeLabel.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Controls: Link Job & 1-Click Fill 5 Stars */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-blue-900/50">
          <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
              ดึงข้อมูลจากหน้างาน:
            </span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 w-full md:max-w-xs text-slate-800 dark:text-slate-100"
            >
              <option value="">-- ไม่เชื่อมโยง (กรอกข้อมูลอิสระ) --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  [{job.jobCode}] {job.title} ({job.contactPerson})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleQuickFillAll5}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="กดเพื่อให้คะแนนเต็ม 5 ทุกข้อทันที เพื่อความรวดเร็วในการบันทึก"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ เติมคะแนนเต็ม 5 ทุกข้อทันที</span>
          </button>
        </div>

        {/* Section: General Details */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>1. ข้อมูลลูกค้าและพนักงานขายที่รับการประเมิน</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อลูกค้า / ร้านค้า / โครงการ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น บจก. พัฒนาการก่อสร้าง, คุณสมชาย"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                พนักงานขายที่ถูกประเมิน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={salesRepName}
                onChange={(e) => setSalesRepName(e.target.value)}
                placeholder="เช่น ธนากร (ทีมขายตะวันออก)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่ประเมิน
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อผู้ประเมิน / ผู้ให้ข้อมูล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="เช่น คุณวิเชียร (ฝ่ายจัดซื้อ)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์ลูกค้า
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ช่องทางการติดต่อเข้าพบ
              </label>
              <select
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="visit">🚗 เข้าพบหน้าร้าน / หน้างานจริง</option>
                <option value="phone">📞 โทรศัพท์ติดต่อ</option>
                <option value="line">💬 LINE Official / Chat</option>
                <option value="email">✉️ อีเมล</option>
                <option value="other">🌐 ช่องทางอื่นๆ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Questions & Scores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>2. หัวข้อการประเมินความพึงพอใจ (เกณฑ์ 1 - 5 คะแนน)</span>
            </h3>
            <span className="text-xs text-slate-500">
              5=มากที่สุด, 4=มาก, 3=ปานกลาง, 2=น้อย, 1=น้อยที่สุด
            </span>
          </div>

          {/* Group 1: ด้านบุคลิกภาพและการให้บริการ */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800/50">
              หมวดที่ 1: ด้านบุคลิกภาพและการให้บริการ (Service & Personality)
            </h4>
            {renderRatingGroup(
              '1.1 ความสุภาพ อ่อนน้อม การแต่งกาย และกิริยามารยาทในการติดต่อประสานงาน',
              'พนักงานแต่งกายสุภาพ เรียบร้อย พูดจาไพเราะ และให้เกียรติลูกค้า',
              scorePoliteness,
              setScorePoliteness
            )}
            {renderRatingGroup(
              '1.2 ความตรงต่อเวลานัดหมาย และความสม่ำเสมอในการเข้าพบ/ติดตามงาน',
              'มาถึงหน้างานตรงเวลา มีการแจ้งล่วงหน้า และติดตามงานอย่างสม่ำเสมอ',
              scorePunctuality,
              setScorePunctuality
            )}
            {renderRatingGroup(
              '1.3 ความกระตือรือร้น ความใส่ใจ และความพร้อมในการให้บริการด้วยความเต็มใจ',
              'มีความกระตือรือร้น สนใจรับฟัง และพร้อมช่วยเหลืออย่างจริงใจ',
              scoreEnthusiasm,
              setScoreEnthusiasm
            )}
          </div>

          {/* Group 2: ด้านความรู้เกี่ยวกับสินค้าและคำแนะนำ */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
              หมวดที่ 2: ด้านความรู้เกี่ยวกับสินค้าและคำแนะนำ (Product Knowledge & Advice)
            </h4>
            {renderRatingGroup(
              '2.1 ความรู้ ความเข้าใจในรายละเอียด คุณสมบัติ และสเปกสินค้าเป็นอย่างดี',
              'อธิบายสเปกสินค้า วิธีใช้งาน และมาตรฐานสินค้าได้อย่างถูกต้องแม่นยำ',
              scoreProductKnowledge,
              setScoreProductKnowledge
            )}
            {renderRatingGroup(
              '2.2 ความสามารถในการให้คำแนะนำ ตอบข้อซักถาม และเสนอแนะสินค้าที่ตรงความต้องการ',
              'ช่วยเสนอโซลูชันที่ประหยัดงบประมาณและตรงตามวัตถุประสงค์ของลูกค้า',
              scoreConsultation,
              setScoreConsultation
            )}
            {renderRatingGroup(
              '2.3 การแจ้งข้อมูลข่าวสาร โปรโมชั่น สิทธิประโยชน์ และสินค้าใหม่ๆ อย่างครบถ้วน',
              'อัปเดตราคา โปรโมชั่นพิเศษ และแคมเปญส่งเสริมการขายให้ลูกค้าทราบทันที',
              scorePromotionUpdate,
              setScorePromotionUpdate
            )}
          </div>

          {/* Group 3: ด้านความรวดเร็วและการประสานงาน */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800/50">
              หมวดที่ 3: ด้านความรวดเร็วและการประสานงาน (Speed & Coordination)
            </h4>
            {renderRatingGroup(
              '3.1 ความรวดเร็วและถูกต้องในการจัดทำและส่งใบเสนอราคา (Quotation)',
              'จัดทำใบเสนอราคาได้รวดเร็ว ถูกต้องตามเงื่อนไขที่ตกลง',
              scoreQuotationSpeed,
              setScoreQuotationSpeed
            )}
            {renderRatingGroup(
              '3.2 การติดตามสถานะคำสั่งซื้อ การจัดส่งสินค้า และการรายงานความคืบหน้า',
              'อัปเดตสถานะการขนส่ง และแจ้งกำหนดการส่งมอบสินค้าอย่างชัดเจน',
              scoreFollowUp,
              setScoreFollowUp
            )}
            {renderRatingGroup(
              '3.3 การประสานงานแก้ไขปัญหาเฉพาะหน้า และการดูแลหลังการขายอย่างจริงใจ',
              'เมื่อเกิดปัญหา สามารถประสานงานแก้ไขและรับผิดชอบได้อย่างน่าประทับใจ',
              scoreProblemSolving,
              setScoreProblemSolving
            )}
          </div>
        </div>

        {/* Section 4: ตารางเปรียบเทียบราคาคู่แข่ง (Competitor Price Matrix) */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>3. การประเมินราคาและความสามารถในการแข่งขันในตลาด</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                วิเคราะห์ราคาสินค้าเทียบกับคู่แข่ง (ไทวัสดุ, โกลบอลเฮ้าส์, ร้านค้าวัสดุก่อสร้างในพื้นที่) เพื่อใช้วางกลยุทธ์การขาย
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCompetitorItem}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มสินค้าเปรียบเทียบ</span>
            </button>
          </div>

          {/* Overall Price Comparison Radio */}
          <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              ภาพรวมระดับราคาสินค้าของบริษัท เมื่อเทียบกับคู่แข่งในตลาด:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'lower', label: '🟢 ถูกกว่าคู่แข่ง (ได้เปรียบ)', sub: 'แข่งขันได้ดีมาก' },
                { value: 'similar', label: '🔵 ใกล้เคียงคู่แข่ง', sub: 'ราคาตลาดปกติ' },
                { value: 'higher', label: '🟠 สูงกว่าคู่แข่ง', sub: 'เน้นบริการ/คุณภาพ' },
                { value: 'unknown', label: '⚪ ไม่แน่ใจ / ไม่ระบุ', sub: 'ยังไม่ได้เทียบ' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    overallPriceComparison === opt.value
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="overallPrice"
                      value={opt.value}
                      checked={overallPriceComparison === opt.value}
                      onChange={(e) => setOverallPriceComparison(e.target.value as any)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 ml-5 mt-0.5">{opt.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Table: Products Price Comparison */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 w-8 text-center">#</th>
                  <th className="p-2.5 min-w-[180px]">รายการสินค้า</th>
                  <th className="p-2.5 w-28 text-right">ราคาเรา (฿)</th>
                  <th className="p-2.5 w-28 text-right">ราคาคู่แข่ง (฿)</th>
                  <th className="p-2.5 w-32 text-center">ผลการเปรียบเทียบ</th>
                  <th className="p-2.5 min-w-[140px]">คู่แข่งอ้างอิง (เช่น ไทวัสดุ)</th>
                  <th className="p-2.5 min-w-[160px]">หมายเหตุ/ข้อคิดเห็น</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {competitorPriceItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'productName', e.target.value)}
                        placeholder="เช่น ปูน SCG เสือ, เหล็กเส้น DB12"
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.ourPrice ?? ''}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'ourPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.competitorPrice ?? ''}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'competitorPrice', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-right text-xs text-slate-700 dark:text-slate-300"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={item.comparison}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'comparison', e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                      >
                        <option value="lower">ถูกกว่าคู่แข่ง</option>
                        <option value="similar">ใกล้เคียงกัน</option>
                        <option value="higher">สูงกว่าคู่แข่ง</option>
                        <option value="unknown">ไม่แน่ใจ</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.competitorSource || ''}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'competitorSource', e.target.value)}
                        placeholder="เช่น ไทวัสดุ, โกลบอลเฮ้าส์"
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleUpdateCompetitorItem(item.id, 'note', e.target.value)}
                        placeholder="ข้อสังเกตเรื่องราคา/ของแถม"
                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCompetitorItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Terms Satisfaction Score */}
          <div className="mt-4">
            {renderRatingGroup(
              '4.1 ความเหมาะสมของเงื่อนไขการชำระเงิน ความยืดหยุ่น และระยะเวลาเครดิตเทอม',
              'ความสะดวกในการวางบิล ชำระเงินสด โอนเงิน หรือระยะเวลาเครดิต (เช่น 7, 15, 30 วัน)',
              scorePaymentTerms,
              setScorePaymentTerms
            )}
          </div>
        </div>

        {/* Section 5: Suggestions & Future Purchase */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-sky-600" />
            <span>4. ข้อเสนอแนะและการตัดสินใจใช้บริการในอนาคต</span>
          </h3>

          {/* Future purchase intent */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              ความประสงค์ในการใช้บริการหรือสั่งซื้อสินค้าในครั้งถัดไป:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { val: 'continuous', title: '✅ สั่งซื้อต่อเนื่อง 100%', desc: 'ยินดีสั่งซื้อและใช้บริการต่อแน่นอน' },
                { val: 'compare_case_by_case', title: '⚖️ รอดูราคา/โปรโมชั่น', desc: 'เปรียบเทียบราคาเป็นครั้งคราว' },
                { val: 'pause', title: '⏸️ ชะลอการสั่งซื้อ', desc: 'ยังไม่มีงานหรือโครงการใหม่' },
                { val: 'no', title: '❌ ไม่มีความประสงค์สั่งซื้อ', desc: 'ต้องการเปลี่ยนผู้จำหน่าย' },
              ].map((opt) => (
                <label
                  key={opt.val}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    futurePurchaseIntent === opt.val
                      ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="futureIntent"
                      value={opt.val}
                      checked={futurePurchaseIntent === opt.val}
                      onChange={(e) => setFuturePurchaseIntent(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <span>{opt.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 ml-5 mt-1">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Strengths & Improvement text areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                👍 สิ่งที่ประทับใจเป็นพิเศษ / จุดเด่นของทีมขาย
              </label>
              <textarea
                value={strengthsFeedback}
                onChange={(e) => setStrengthsFeedback(e.target.value)}
                rows={3}
                placeholder="เช่น เซลส์บริการดีมาก ตอบคำถามรวดเร็ว อัธยาศัยดี ส่งของตรงเวลา..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                💡 สิ่งที่ต้องการให้ทีมขายปรับปรุง หรือสนับสนุนเพิ่มเติม
              </label>
              <textarea
                value={improvementFeedback}
                onChange={(e) => setImprovementFeedback(e.target.value)}
                rows={3}
                placeholder="เช่น อยากให้ส่งใบเสนอราคาเร็วกว่านี้, เพิ่มส่วนลดเงินสด, มีตัวอย่างสินค้า..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Digital Signature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ✍️ การลงนามรับรองแบบดิจิทัล (ชื่อผู้รับรอง / ผู้ประเมิน)
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="ระบุชื่อผู้รับรอง เช่น คุณชัยพร วงศ์สวัสดิ์"
              className="w-full sm:max-w-md text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              * ข้อมูลจะถูกจัดเก็บในระบบคลาวด์ ปลอดภัย และทดแทนเอกสารกระดาษ 100%
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              title="บันทึกข้อมูล พร้อมส่งการ์ดสรุปผลเข้า LINE Group ทันที"
            >
              <Send className="w-4 h-4" />
              <span>บันทึก & ส่งเข้า LINE</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกแบบประเมิน</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
