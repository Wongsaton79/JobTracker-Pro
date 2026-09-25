import React, { useState } from 'react';
import { JobItem, SalesEvaluation, CompetitorPriceItem, PriceComparisonOption } from '../../types';
import {
  computeEvaluationScores,
  DEFAULT_COMPETITOR_ITEMS,
  formatPriceComparisonLabel,
} from '../../utils/evaluationCalculator';
import { InteractiveMap } from '../InteractiveMap';
import {
  Star,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Send,
  User,
  Phone,
  Calendar,
  Layers,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Camera,
  MapPin,
  Navigation,
  Crosshair,
  AlertCircle,
  Image as ImageIcon,
  MapPinned,
} from 'lucide-react';

interface EvaluationFormProps {
  jobs?: JobItem[];
  preSelectedJobId?: string;
  initialEvaluation?: SalesEvaluation | null;
  onSave: (evaluation: SalesEvaluation, sendLine: boolean, openImageModal?: boolean) => void;
  onCancel: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  jobs = [],
  preSelectedJobId,
  initialEvaluation,
  onSave,
  onCancel,
}) => {
  const [date, setDate] = useState<string>(
    initialEvaluation?.date || new Date().toISOString().slice(0, 10)
  );
  const [branch, setBranch] = useState<'ตาก' | 'แม่สอด'>(
    initialEvaluation?.branch === 'แม่สอด' ? 'แม่สอด' : 'ตาก'
  );
  const [customerName, setCustomerName] = useState<string>(
    initialEvaluation?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialEvaluation?.customerPhone || ''
  );
  const [evaluatorName, setEvaluatorName] = useState<string>(
    initialEvaluation?.evaluatorName || ''
  );
  const [salesRepName, setSalesRepName] = useState<string>(
    initialEvaluation?.salesRepName || ''
  );
  const [contactChannel, setContactChannel] = useState<'onsite' | 'line' | 'phone'>(
    initialEvaluation?.contactChannel || 'onsite'
  );
  const [projectName, setProjectName] = useState<string>(
    initialEvaluation?.projectName || ''
  );

  // ภาพถ่ายหน้างาน & พิกัด Check-in (ไม่บังคับ)
  const [photos, setPhotos] = useState<string[]>(initialEvaluation?.photos || []);
  const [checkInLocation, setCheckInLocation] = useState<SalesEvaluation['checkInLocation'] | null>(
    initialEvaluation?.checkInLocation || null
  );

  // ================= Ratings & Notes =================
  // หมวดที่ 1 (เต็ม 20)
  const [q1_1_rating, setQ1_1_rating] = useState<number>(initialEvaluation?.q1_1_rating ?? 5);
  const [q1_1_note, setQ1_1_note] = useState<string>(initialEvaluation?.q1_1_note || '');

  const [q1_2_rating, setQ1_2_rating] = useState<number>(initialEvaluation?.q1_2_rating ?? 5);
  const [q1_2_note, setQ1_2_note] = useState<string>(initialEvaluation?.q1_2_note || '');

  const [q1_3_rating, setQ1_3_rating] = useState<number>(initialEvaluation?.q1_3_rating ?? 5);
  const [q1_3_note, setQ1_3_note] = useState<string>(initialEvaluation?.q1_3_note || '');

  const [q1_4_rating, setQ1_4_rating] = useState<number>(initialEvaluation?.q1_4_rating ?? 5);
  const [q1_4_note, setQ1_4_note] = useState<string>(initialEvaluation?.q1_4_note || '');

  // หมวดที่ 2 (เต็ม 5)
  const [q2_1_rating, setQ2_1_rating] = useState<number>(initialEvaluation?.q2_1_rating ?? 5);
  const [q2_1_note, setQ2_1_note] = useState<string>(initialEvaluation?.q2_1_note || '');

  const [q2_2_rating, setQ2_2_rating] = useState<number>(initialEvaluation?.q2_2_rating ?? 5);
  const [q2_2_note, setQ2_2_note] = useState<string>(initialEvaluation?.q2_2_note || '');

  // หมวดที่ 3 (เต็ม 5)
  const [q3_1_rating, setQ3_1_rating] = useState<number>(initialEvaluation?.q3_1_rating ?? 5);
  const [q3_1_note, setQ3_1_note] = useState<string>(initialEvaluation?.q3_1_note || '');

  const [q3_2_rating, setQ3_2_rating] = useState<number>(initialEvaluation?.q3_2_rating ?? 5);
  const [q3_2_note, setQ3_2_note] = useState<string>(initialEvaluation?.q3_2_note || '');

  // ================= ส่วนที่ 2 (ตามภาพที่ 2) =================
  const [feedbackPriceAndPromo, setFeedbackPriceAndPromo] = useState<PriceComparisonOption>(
    initialEvaluation?.feedbackPriceAndPromo || 'lower'
  );
  const [feedbackPriceNote, setFeedbackPriceNote] = useState<string>(
    initialEvaluation?.feedbackPriceNote || ''
  );

  const [competitorPriceItems, setCompetitorPriceItems] = useState<CompetitorPriceItem[]>(() => {
    if (initialEvaluation?.competitorPriceItems && initialEvaluation.competitorPriceItems.length > 0) {
      return initialEvaluation.competitorPriceItems;
    }
    return DEFAULT_COMPETITOR_ITEMS;
  });

  const [interestedProducts, setInterestedProducts] = useState<string[]>(() => {
    if (initialEvaluation?.interestedProducts && initialEvaluation.interestedProducts.length > 0) {
      return initialEvaluation.interestedProducts;
    }
    return ['', '', '', '', ''];
  });

  const [additionalFeedback, setAdditionalFeedback] = useState<string>(
    initialEvaluation?.additionalFeedback || ''
  );
  const [signatureName, setSignatureName] = useState<string>(
    initialEvaluation?.signatureName || ''
  );

  // Compute live scores based on exact formula
  const scoreResults = computeEvaluationScores({
    q1_1_rating,
    q1_2_rating,
    q1_3_rating,
    q1_4_rating,
    q2_1_rating,
    q2_2_rating,
    q3_1_rating,
    q3_2_rating,
  });

  // Quick fill all scores to 5
  const handleQuickFillAll5 = () => {
    setQ1_1_rating(5);
    setQ1_2_rating(5);
    setQ1_3_rating(5);
    setQ1_4_rating(5);
    setQ2_1_rating(5);
    setQ2_2_rating(5);
    setQ3_1_rating(5);
    setQ3_2_rating(5);
  };

  // Add competitor item row
  const handleAddCompetitorItem = () => {
    const newItem: CompetitorPriceItem = {
      id: `comp-${Date.now()}`,
      productName: '',
      ourPrice: undefined,
      competitorPrice: undefined,
      comparison: 'lower',
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

  const handleInterestedProductChange = (index: number, val: string) => {
    setInterestedProducts((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Handlers for Photos & GPS Checkin
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEv) => {
        const base64 = uploadEv.target?.result as string;
        if (base64) {
          setPhotos((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddressChange = (addressText: string) => {
    setCheckInLocation((prev) => ({
      lat: prev?.lat || (branch === 'แม่สอด' ? 16.7167 : 16.8839),
      lng: prev?.lng || (branch === 'แม่สอด' ? 98.5667 : 99.1258),
      address: addressText,
      distanceKm: 0,
      isWithinRange: true,
      targetName: 'พิกัด GPS หน้างานจริง',
      timestamp: prev?.timestamp || new Date().toLocaleTimeString('th-TH'),
    }));
  };

  const handleMapLocationChange = (newLat: number, newLng: number, newAddress?: string) => {
    setCheckInLocation((prev) => ({
      lat: Number(newLat.toFixed(6)),
      lng: Number(newLng.toFixed(6)),
      address: newAddress || prev?.address || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
      distanceKm: 0,
      isWithinRange: true,
      targetName: 'พิกัด GPS หน้างานจริง',
      timestamp: prev?.timestamp || new Date().toLocaleTimeString('th-TH'),
    }));
  };

  const handleSubmit = (sendLine: boolean = false, openImageModal: boolean = false) => {
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อร้านค้า / ลูกค้า');
      return;
    }
    if (!salesRepName.trim()) {
      alert('กรุณากรอกชื่อพนักงานขายที่ถูกประเมิน');
      return;
    }
    if (!evaluatorName.trim()) {
      alert('กรุณากรอกผู้ให้ข้อมูล / เบอร์ติดต่อ');
      return;
    }

    const newEval: SalesEvaluation = {
      id: initialEvaluation?.id || `eval-${Date.now()}`,
      evaluationCode:
        initialEvaluation?.evaluationCode ||
        `EVAL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      date,
      branch,
      jobId: initialEvaluation?.jobId,
      jobCode: initialEvaluation?.jobCode,
      projectName: projectName.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      evaluatorName: evaluatorName.trim(),
      salesRepName: salesRepName.trim(),
      contactChannel,

      // ภาพถ่ายหน้างาน & พิกัด Check-in (ไม่บังคับ)
      photos,
      checkInLocation: checkInLocation || undefined,

      // ส่วนที่ 1: คะแนน
      q1_1_rating,
      q1_1_score: scoreResults.q1_1_score,
      q1_1_note: q1_1_note.trim(),

      q1_2_rating,
      q1_2_score: scoreResults.q1_2_score,
      q1_2_note: q1_2_note.trim(),

      q1_3_rating,
      q1_3_score: scoreResults.q1_3_score,
      q1_3_note: q1_3_note.trim(),

      q1_4_rating,
      q1_4_score: scoreResults.q1_4_score,
      q1_4_note: q1_4_note.trim(),

      q2_1_rating,
      q2_1_score: scoreResults.q2_1_score,
      q2_1_note: q2_1_note.trim(),

      q2_2_rating,
      q2_2_score: scoreResults.q2_2_score,
      q2_2_note: q2_2_note.trim(),

      q3_1_rating,
      q3_1_score: scoreResults.q3_1_score,
      q3_1_note: q3_1_note.trim(),

      q3_2_rating,
      q3_2_score: scoreResults.q3_2_score,
      q3_2_note: q3_2_note.trim(),

      // ส่วนที่ 2: ราคาและ Feedback
      feedbackPriceAndPromo,
      feedbackPriceNote: feedbackPriceNote.trim(),
      competitorPriceItems: competitorPriceItems.filter((i) => i.productName.trim() !== ''),
      interestedProducts: interestedProducts.map((p) => p.trim()),
      additionalFeedback: additionalFeedback.trim(),
      signatureName: signatureName.trim() || evaluatorName.trim(),

      // สรุปคะแนน (เต็ม 30 คะแนน)
      section1Score: scoreResults.section1Score,
      section2Score: scoreResults.section2Score,
      section3Score: scoreResults.section3Score,
      totalScore: scoreResults.totalScore,
      rawTotalScore: scoreResults.rawTotalScore,
      scoreOutOf20: scoreResults.scoreOutOf20,
      percentageScore: scoreResults.percentageScore,
      gradeLabel: scoreResults.gradeLabel,
      gradeColor: scoreResults.gradeColor,

      createdAt: initialEvaluation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    onSave(newEval, sendLine, openImageModal);
  };

  // Reusable Question Input Card with Rating (5, 4, 3, 2, 1, 0) + Note field
  const renderQuestionCard = (
    num: number,
    code: string,
    title: string,
    maxScore: number,
    rating: number,
    onRatingChange: (val: number) => void,
    score: number,
    note: string,
    onNoteChange: (val: string) => void
  ) => {
    return (
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <div>
                <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  {title}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                  คะแนนที่ได้: {score} / {maxScore} คะแนน (เลือกระดับ {rating})
                </div>
              </div>
            </div>
          </div>

          {/* Rating Buttons 5 to 1 (or 0) */}
          <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
            {[5, 4, 3, 2, 1, 0].map((numVal) => {
              const isSelected = rating === numVal;
              return (
                <button
                  key={numVal}
                  type="button"
                  onClick={() => onRatingChange(numVal)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-300'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-slate-600'
                  }`}
                  title={`ให้ระดับ ${numVal}`}
                >
                  <span>{numVal}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note Input */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2">
          <span className="text-[11px] text-slate-500 shrink-0">หมายเหตุ:</span>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="ระบุข้อสังเกตเพิ่มเติม (ถ้ามี)"
            className="flex-1 text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
          />
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
              <span>แบบประเมินความพึงพอใจ การทำงานของทีมขาย (คะแนนเต็ม 30 คะแนน)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {initialEvaluation ? '✏️ แก้ไขแบบประเมินทีมขาย' : '📝 บันทึกแบบประเมินความพึงพอใจ การทำงานของทีมขาย'}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              แบบฟอร์มประเมินตามมาตรฐานบริษัท 100% Paperless คะแนนเต็ม 30 คะแนน (หมวด 1: 20 คะแนน, หมวด 2: 5 คะแนน, หมวด 3: 5 คะแนน)
            </p>
          </div>

          {/* Quick Score Live Badge (เต็ม 30 คะแนน) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-4 text-center shrink-0 w-full sm:w-auto flex sm:flex-col items-center justify-between sm:justify-center gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 block font-bold">
                ⭐ คะแนนเต็ม 30 คะแนน
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">{scoreResults.totalScore}</span>
              <span className="text-xs text-emerald-100"> / 30.00</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white font-bold text-xs">
              {scoreResults.percentageScore}% • {scoreResults.gradeLabel.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Top Controls: Rating Scale Legend & 1-Click Fill 5 Stars */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              เกณฑ์ระดับคะแนน:
            </span>
            <span>5 = ดีมาก, 4 = ดี, 3 = ปานกลาง, 2 = ควรปรับปรุง, 1 = ไม่ผ่าน</span>
          </div>

          <button
            type="button"
            onClick={handleQuickFillAll5}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="กดเพื่อให้คะแนนระดับ 5 ทุกข้อทันที"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ เติมคะแนนเต็มทุกข้อ</span>
          </button>
        </div>

        {/* General Customer / Sales Rep Info */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>ข้อมูลร้านค้า ลูกค้า และช่องทางให้ข้อมูล</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* สาขา (ตาก / แม่สอด) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                สาขา <span className="text-rose-500">*</span>
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as 'ตาก' | 'แม่สอด')}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="ตาก">🏢 สาขา ตาก</option>
                <option value="แม่สอด">🏢 สาขา แม่สอด</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อร้าน / ลูกค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น ร้านจิตต์สินโฮม"
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
                placeholder="เช่น ธนากร (ทีมขาย)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ผู้ให้ข้อมูล / เบอร์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="เช่น คุณจิตต์สิน / 081-998-7766"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ช่องทางให้ข้อมูล
              </label>
              <select
                value={contactChannel}
                onChange={(e) => setContactChannel(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-800"
              >
                <option value="onsite">🚗 Onsite (เข้าพบหน้างานจริง)</option>
                <option value="line">💬 Line</option>
                <option value="phone">📞 โทรศัพท์</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= ส่วนที่ 1: การประเมินคะแนน ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>ส่วนที่ 1: หัวข้อการประเมินคะแนน (คะแนนเต็ม 30 คะแนน)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              คะแนนรวมทั้ง 3 หมวด: {scoreResults.totalScore} / 30.00 คะแนน ({scoreResults.percentageScore}%)
            </span>
          </div>

          {/* หมวดที่ 1: การสื่อสารกับลูกค้าและการบริการของเซลล์ (คะแนนเต็ม 20 คะแนน) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between bg-sky-100 dark:bg-sky-950/60 px-3.5 py-2 rounded-xl border border-sky-300 dark:border-sky-800">
              <span className="text-xs font-black text-sky-900 dark:text-sky-200">
                หมวดที่ 1: การสื่อสารกับลูกค้าและการบริการของเซลล์ (คะแนนเต็ม 20 คะแนน)
              </span>
              <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md">
                รวมหมวด 1: {scoreResults.section1Score} / 20 คะแนน
              </span>
            </div>

            {renderQuestionCard(
              1,
              '1.1',
              'เซลล์ให้ข้อมูลสินค้า ราคา และโปรโมชั่น แจ้งกิจกรรม แคมเปญได้ชัดเจน ถูกต้องและรวดเร็ว (คะแนนเต็ม 10 คะแนน)',
              10,
              q1_1_rating,
              setQ1_1_rating,
              scoreResults.q1_1_score,
              q1_1_note,
              setQ1_1_note
            )}

            {renderQuestionCard(
              2,
              '1.2',
              'เซลล์มีความเอาใจใส่ ติดตามงาน เข้าเยี่ยมและติดตามการขายกับลูกค้าอย่างต่อเนื่อง (คะแนนเต็ม 5 คะแนน)',
              5,
              q1_2_rating,
              setQ1_2_rating,
              scoreResults.q1_2_score,
              q1_2_note,
              setQ1_2_note
            )}

            {renderQuestionCard(
              3,
              '1.3',
              'เซลล์ผลักดันสินค้า HVA และ SVP พร้อมอุปกรณ์กลุ่มหลังคา ฝา , ฝ้า และกลุ่มไม้ต่างๆ (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q1_3_rating,
              setQ1_3_rating,
              scoreResults.q1_3_score,
              q1_3_note,
              setQ1_3_note
            )}

            {renderQuestionCard(
              4,
              '1.4',
              'มีการเก็บราคาสินค้าคู่แข่ง (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q1_4_rating,
              setQ1_4_rating,
              scoreResults.q1_4_score,
              q1_4_note,
              setQ1_4_note
            )}
          </div>

          {/* หมวดที่ 2: การรับผิดชอบในหน้าที่ (คะแนนเต็ม 5 คะแนน) */}
          <div className="space-y-2.5 pt-3">
            <div className="flex items-center justify-between bg-indigo-100 dark:bg-indigo-950/60 px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                หมวดที่ 2: การรับผิดชอบในหน้าที่ (คะแนนเต็ม 5 คะแนน)
              </span>
              <span className="text-xs font-extrabold text-indigo-800 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md">
                รวมหมวด 2: {scoreResults.section2Score} / 5 คะแนน
              </span>
            </div>

            {renderQuestionCard(
              5,
              '2.1',
              'มีการแจ้งล่วงหน้า ในการจัดส่งสินค้าตรงต่อเวลาตามที่นัดหมาย และอัพเดตเมื่อเกิดปัญหา เช่น ขนส่งอาจล่าช้า เป็นต้น (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q2_1_rating,
              setQ2_1_rating,
              scoreResults.q2_1_score,
              q2_1_note,
              setQ2_1_note
            )}

            {renderQuestionCard(
              6,
              '2.2',
              'มีความรับผิดชอบในการติดตามแก้ไขปัญหา และการจัดการปัญหาเฉพาะหน้าได้รวดเร็ว (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q2_2_rating,
              setQ2_2_rating,
              scoreResults.q2_2_score,
              q2_2_note,
              setQ2_2_note
            )}
          </div>

          {/* หมวดที่ 3: ความประทับใจ (คะแนนเต็ม 5 คะแนน) */}
          <div className="space-y-2.5 pt-3">
            <div className="flex items-center justify-between bg-teal-100 dark:bg-teal-950/60 px-3.5 py-2 rounded-xl border border-teal-300 dark:border-teal-800">
              <span className="text-xs font-black text-teal-900 dark:text-teal-200">
                หมวดที่ 3: ความประทับใจ (คะแนนเต็ม 5 คะแนน)
              </span>
              <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md">
                รวมหมวด 3: {scoreResults.section3Score} / 5 คะแนน
              </span>
            </div>

            {renderQuestionCard(
              7,
              '3.1',
              'เข้าพบอย่างสม่ำเสมอ เดือนละ 2-3 ครั้ง ติดตามอัพเดตยอดขายและสิทธิประโยชน์อย่างต่อเนื่อง (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q3_1_rating,
              setQ3_1_rating,
              scoreResults.q3_1_score,
              q3_1_note,
              setQ3_1_note
            )}

            {renderQuestionCard(
              8,
              '3.2',
              'ใส่ใจบริการ มีท่าทีสุภาพเรียบร้อย เป็นกันเอง (คะแนนเต็ม 2.5 คะแนน)',
              2.5,
              q3_2_rating,
              setQ3_2_rating,
              scoreResults.q3_2_score,
              q3_2_note,
              setQ3_2_note
            )}
          </div>

          {/* Real-time Score Summary Box */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                ⭐ สรุปผลคะแนนประเมิน (คะแนนเต็ม 30 คะแนน):
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                หมวด 1: {scoreResults.section1Score}/20 • หมวด 2: {scoreResults.section2Score}/5 • หมวด 3: {scoreResults.section3Score}/5 • ร้อยละความพึงพอใจ: {scoreResults.percentageScore}%
              </span>
            </div>
            <div className="text-right self-end sm:self-center">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {scoreResults.totalScore}
              </span>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200"> / 30.00 คะแนน</span>
              <div className="text-xs font-bold text-emerald-600">{scoreResults.gradeLabel}</div>
            </div>
          </div>
        </div>

        {/* ================= ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback (ตามภาพที่ 2) ================= */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback โปรโมชั่นต่างๆ (ตามภาพที่ 2)</span>
              </h3>
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

          {/* ข้อ 1: ข้อมูลราคาสินค้า & feedback โปรโมชั่นต่างๆ โดยรวมอยู่ในเกณฑ์ สูงกว่า,ต่ำกว่า,ใกล้เคียง,ไม่แน่ใจ,ไม่สามารถเปิดเผยได้ กับคู่แข่ง */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              1. ข้อมูลราคาสินค้า & feedback โปรโมชั่นต่างๆ โดยรวมอยู่ในเกณฑ์เปรียบเทียบกับของคู่แข่ง:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: 'lower', label: 'ต่ำกว่า', bg: 'hover:bg-emerald-50' },
                { value: 'similar', label: 'ใกล้เคียง', bg: 'hover:bg-blue-50' },
                { value: 'higher', label: 'สูงกว่า', bg: 'hover:bg-amber-50' },
                { value: 'uncertain', label: 'ไม่แน่ใจ', bg: 'hover:bg-slate-50' },
                { value: 'undisclosed', label: 'ไม่สามารถเปิดเผยได้', bg: 'hover:bg-purple-50' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    feedbackPriceAndPromo === opt.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs'
                      : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${opt.bg}`
                  }`}
                >
                  <input
                    type="radio"
                    name="feedbackPrice"
                    value={opt.value}
                    checked={feedbackPriceAndPromo === opt.value}
                    onChange={(e) => setFeedbackPriceAndPromo(e.target.value as any)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              value={feedbackPriceNote}
              onChange={(e) => setFeedbackPriceNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับราคาและโปรโมชั่น"
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* ตารางเก็บราคาสินค้า อย่างน้อย 3 รายการ */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                2. เก็บราคาสินค้า อย่างน้อย 3 รายการ (เทียบกับคู่แข่ง เช่น ไทวัสดุ):
              </span>
              <button
                type="button"
                onClick={handleAddCompetitorItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs w-fit cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มรายการสินค้า ({competitorPriceItems.length} รายการ)</span>
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2 w-8 text-center">#</th>
                    <th className="p-2 min-w-[180px]">รายการสินค้า</th>
                    <th className="p-2 w-44 text-center">เกณฑ์เทียบราคา</th>
                    <th className="p-2 min-w-[180px]">หมายเหตุ (เช่น ถูกกว่าไทวัสดุ)</th>
                    <th className="p-2 w-10 text-center"></th>
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
                          placeholder="เช่น ปูน SCG เสือ, ปูนปอร์ตแลนด์"
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.comparison}
                          onChange={(e) => handleUpdateCompetitorItem(item.id, 'comparison', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
                        >
                          <option value="lower">ต่ำกว่า</option>
                          <option value="similar">ใกล้เคียง</option>
                          <option value="higher">สูงกว่า</option>
                          <option value="uncertain">ไม่แน่ใจ</option>
                          <option value="undisclosed">ไม่สามารถเปิดเผยได้</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleUpdateCompetitorItem(item.id, 'note', e.target.value)}
                          placeholder="เช่น ถูกกว่าไทวัสดุ, ซื้อผ่านไทวัสดุ"
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
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

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddCompetitorItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มแถวสินค้าคู่แข่ง</span>
              </button>
              <span className="text-[11px] text-slate-500">
                * บันทึกรายการราคาเปรียบเทียบกับคู่แข่งได้ตามจริง
              </span>
            </div>
          </div>

          {/* สินค้าที่ลูกค้าสนใจ และอยากให้ทางบริษัทฯ ทำราคาให้คือ (5 รายการ ตามภาพที่ 2) */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              3. สินค้าที่ลูกค้าสนใจ และอยากให้ทางบริษัทฯ ทำราคาให้คือ:
            </span>
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-5 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={interestedProducts[i] || ''}
                    onChange={(e) => handleInterestedProductChange(i, e.target.value)}
                    placeholder={`สินค้าที่ลูกค้าอยากให้ทำราคา รายการที่ ${i + 1}`}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ข้อเสนอแนะเพิ่มเติม (ตามภาพที่ 2) */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              4. ข้อเสนอแนะเพิ่มเติม:
            </label>
            <textarea
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              rows={3}
              placeholder="ระบุข้อเสนอแนะเรื่องราคา, โปรโมชั่น, สต็อก หรือเรื่องคู่แข่ง..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ลายเซ็นผู้ให้ข้อมูล / ผู้ลงนาม */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                ✍️ ผู้ให้ข้อมูล / เบอร์ติดต่อ / ลงนามรับรองดิจิทัล:
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="ระบุผู้ให้ข้อมูล / เบอร์ติดต่อ เช่น คุณจิตต์สิน / 081-998-7766"
                className="w-full sm:max-w-md text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              วันที่ประเมิน: <span className="font-bold text-slate-800 dark:text-slate-200">{date}</span>
            </div>
          </div>
        </div>

        {/* ================= ส่วนสุดท้าย: ภาพถ่ายหน้างาน & การระบุพิกัดสถานที่ & แผนที่หน้างาน (ไม่บังคับ) ================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>ภาพถ่ายหน้างาน & การระบุพิกัดสถานที่ & แผนที่หน้างาน</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ยืนยันการเข้าพบหน้างานจริง พร้อมภาพถ่ายประกอบและพิกัด GPS อุปกรณ์ (รัศมีไม่เกิน 5 กม.)
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700 w-fit">
              ไม่บังคับการลงข้อมูล
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. ถ่ายภาพหน้างาน / แนบรูปภาพ (5 cols) */}
            <div className="lg:col-span-5 p-4 bg-white rounded-xl border border-slate-200 space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>1. ถ่ายภาพหน้างาน / ร้านค้า ({photos.length} รูป)</span>
                </span>
                <label
                  htmlFor="site-photo-upload"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ ถ่ายภาพ / แนบรูป</span>
                </label>
                <input
                  id="site-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length === 0 ? (
                <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-4">
                  <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500">ยังไม่มีภาพถ่ายหน้างาน</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    กดปุ่ม "+ ถ่ายภาพ / แนบรูป" ด้านบนเพื่อถ่ายภาพหรือเลือกรูปจากเครื่อง
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[300px]">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                      <img src={photo} alt={`Site photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        title="ลบรูปนี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. ระบุพิกัดสถานที่ & แผนที่หน้างาน (GPS Check-in เหมือน JobFormModal) (7 cols) */}
            <div className="lg:col-span-7 p-4 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>2. ระบุพิกัดสถานที่ & แผนที่หน้างาน (Check-in)</span>
                </span>
                <span className="text-[11px] text-sky-700 font-semibold bg-sky-100 px-2 py-0.5 rounded-full">
                  🔒 พิกัด GPS ปัจจุบันเท่านั้น (รัศมีไม่เกิน 5 กม.)
                </span>
              </div>

              {/* Address Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อสถานที่ / ที่อยู่หน้างาน
                </label>
                <input
                  type="text"
                  value={checkInLocation?.address || ''}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="ระบุชื่ออาคาร หมู่บ้าน ถนน ซอย หรือระบบจะระบุให้อัตโนมัติจาก GPS"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Interactive Leaflet GPS Map with 5KM Radius Restriction */}
              <InteractiveMap
                lat={checkInLocation?.lat || (branch === 'แม่สอด' ? 16.7167 : 16.8839)}
                lng={checkInLocation?.lng || (branch === 'แม่สอด' ? 98.5667 : 99.1258)}
                address={checkInLocation?.address}
                isEditable={true}
                height="280px"
                onLocationChange={handleMapLocationChange}
              />

              {checkInLocation && (
                <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      ยืนยันพิกัด GPS หน้างานจริงแล้ว • {checkInLocation.lat.toFixed(5)}, {checkInLocation.lng.toFixed(5)} ({checkInLocation.timestamp || 'เช็คอินแล้ว'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckInLocation(null)}
                    className="text-slate-400 hover:text-rose-600 underline cursor-pointer shrink-0 ml-2"
                  >
                    ล้างพิกัด
                  </button>
                </div>
              )}
            </div>
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

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleSubmit(false, true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              title="บันทึกข้อมูล พร้อมเปิดหน้าต่างรูปภาพสรุป (ไม่แสดงคะแนน) เพื่อคัดลอก/ลงโน้ตในกลุ่ม LINE ได้ทันที"
            >
              <ImageIcon className="w-4 h-4" />
              <span>บันทึก & สร้างรูปภาพ LINE</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true, false)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              title="บันทึกข้อมูล พร้อมส่งการ์ดสรุปผลเข้า LINE Group ทันที"
            >
              <Send className="w-4 h-4" />
              <span>บันทึก & ส่งเข้า LINE</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false, false)}
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
