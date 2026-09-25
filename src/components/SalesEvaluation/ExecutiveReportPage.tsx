import React, { useState, useEffect } from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelText, formatPriceComparisonLabel } from '../../utils/evaluationCalculator';
import { InteractiveMap } from '../InteractiveMap';
import {
  Store,
  User,
  Phone,
  Calendar,
  MapPin,
  ExternalLink,
  Share2,
  Copy,
  Printer,
  Check,
  ShieldCheck,
  Tag,
  Sparkles,
  FileText,
  Camera,
  ArrowLeft,
  Navigation,
  Clock,
  Layers,
  Maximize2,
  X,
  AlertCircle,
  Download,
} from 'lucide-react';

interface ExecutiveReportPageProps {
  evaluationId?: string;
  initialEvaluation?: SalesEvaluation | null;
  companyName?: string;
  onBackToMain?: () => void;
  showToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const ExecutiveReportPage: React.FC<ExecutiveReportPageProps> = ({
  evaluationId,
  initialEvaluation,
  companyName = 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด',
  onBackToMain,
  showToast,
}) => {
  const [evaluation, setEvaluation] = useState<SalesEvaluation | null>(initialEvaluation || null);
  const [isLoading, setIsLoading] = useState(!initialEvaluation && Boolean(evaluationId));
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Load evaluation by ID if not provided initially
  useEffect(() => {
    if (initialEvaluation) {
      setEvaluation(initialEvaluation);
      return;
    }

    if (!evaluationId) return;

    // 1. Try localStorage
    try {
      const saved = localStorage.getItem('sales_satisfaction_evaluations');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const found = list.find((e: any) => e.id === evaluationId || e.evaluationCode === evaluationId);
          if (found) {
            setEvaluation(found);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage lookup failed:', e);
    }

    // 2. Fetch from server API
    fetch(`/api/evaluations/${evaluationId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setEvaluation(data.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch evaluation from server:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [evaluationId, initialEvaluation]);

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">กำลังโหลดรายงานข้อมูลหน้างาน...</h2>
        <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่ ระบบกำลังดึงข้อมูลเข้าพบและพิกัด Check-in</p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">ไม่พบข้อมูลรายงานแบบประเมิน</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">
          ลิงก์นี้อาจไม่ถูกต้อง หรือรายการรายงานอาจถูกลบไปแล้ว รหัสที่ค้นหา: {evaluationId || '-'}
        </p>
        {onBackToMain && (
          <button
            onClick={onBackToMain}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลัก</span>
          </button>
        )}
      </div>
    );
  }

  const priceInfo = formatPriceComparisonLabel(evaluation.feedbackPriceAndPromo);
  const channelText = formatChannelText(evaluation.contactChannel);
  const branchText = evaluation.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก';

  const validCompetitorItems = (evaluation.competitorPriceItems || []).filter(
    (i) => i.productName && i.productName.trim() !== ''
  );

  const validInterestedProducts = (evaluation.interestedProducts || []).filter(
    (p) => p && p.trim() !== ''
  );

  const googleMapsUrl = evaluation.checkInLocation
    ? `https://www.google.com/maps?q=${evaluation.checkInLocation.lat},${evaluation.checkInLocation.lng}`
    : '';

  // Safe parse check-in timestamp to prevent "Invalid Date"
  const formatCheckInTime = (timestamp?: string | number) => {
    if (!timestamp) {
      return evaluation.date ? `${evaluation.date}` : '-';
    }
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) {
        return evaluation.date || '-';
      }
      return `${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. (${d.toLocaleDateString('th-TH')})`;
    } catch {
      return evaluation.date || '-';
    }
  };

  // Generate shareable link
  const currentUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=report&id=${evaluation.id}`
      : `?view=report&id=${evaluation.id}`;

  // Copy Link
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      notify('คัดลอกลิงก์รายงานสำหรับส่งในกลุ่ม LINE เรียบร้อยแล้ว', 'success');
    }
  };

  // Copy Formatted Message with Link for LINE
  const handleCopyLineSummary = () => {
    const loc = evaluation.checkInLocation
      ? evaluation.checkInLocation.address || `${evaluation.checkInLocation.lat.toFixed(5)}, ${evaluation.checkInLocation.lng.toFixed(5)}`
      : 'ไม่ได้ระบุพิกัด GPS';

    const text = [
      `📋 รายงานเข้าพบลูกค้า / บันทึกหน้างาน`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🏪 ร้านค้า/ลูกค้า: ${evaluation.customerName}`,
      `👤 พนักงานขาย: ${evaluation.salesRepName} (${branchText})`,
      `📅 วันที่เข้าพบ: ${evaluation.date || '-'}`,
      `👥 ผู้ให้ข้อมูล: ${evaluation.evaluatorName || '-'}`,
      `📞 ช่องทาง: ${channelText}`,
      `📍 พิกัดหน้างาน: ${loc}`,
      `🏷️ ราคากับคู่แข่ง: ${priceInfo.label}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔗 คลิกลิงก์เปิดดูข้อมูลหน้างาน & ภาพถ่าย & พิกัดแผนที่ (สำหรับผู้บริหารและหัวหน้างาน):`,
      currentUrl,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
      notify('คัดลอกข้อความสรุปพร้อมลิงก์ สำหรับวางในกลุ่ม LINE เรียบร้อยแล้ว', 'success');
    }
  };

  // Share via Web Share API or LINE URL scheme
  const handleShare = async () => {
    const shareTitle = `รายงานเข้าพบร้าน ${evaluation.customerName}`;
    const shareText = `รายงานข้อมูลเข้าพบร้าน ${evaluation.customerName} (พนักงานขาย: ${evaluation.salesRepName} • ${branchText})`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n`,
          url: currentUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // LINE Share URL scheme fallback
    const lineShareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(`${shareText}\n${currentUrl}`)}`;
    window.open(lineShareUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-4 sm:py-8 px-3 sm:px-6">
      {/* Top Floating Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          {onBackToMain && (
            <button
              onClick={onBackToMain}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>เข้าสู่ระบบหลัก</span>
            </button>
          )}
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>รายงานสำหรับผู้บริหาร & หัวหน้างาน (ไม่แสดงคะแนน)</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyLineSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            title="คัดลอกข้อความสรุปพร้อมลิงก์เพื่อนำไปวางในกลุ่ม LINE"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความสรุป LINE'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="คัดลอกลิงก์นี้ เพื่อส่งให้ผู้อื่นเปิดดูผ่านเว็บได้ทันที"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="แชร์ลิงก์เข้ากลุ่ม LINE ทันที"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>แชร์เข้ากลุ่ม LINE</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="พิมพ์หน้านี้ / บันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-50 text-xs font-semibold backdrop-blur-xs">
                <Store className="w-4 h-4" />
                <span>รายงานข้อมูลการเข้าพบลูกค้าหน้างาน (Executive Field Report)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {evaluation.customerName}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                {companyName} • {branchText}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3 sm:p-4 text-left sm:text-right shrink-0 w-full sm:w-auto">
              <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider block">
                รหัสแบบประเมิน
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {evaluation.evaluationCode}
              </span>
              <span className="text-xs text-emerald-100 block mt-0.5">
                📅 วันที่เข้าพบ: {evaluation.date || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Section 1: Overview Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" /> พนักงานขาย
              </span>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {evaluation.salesRepName}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-emerald-600" /> สาขาดูแล
              </span>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {branchText}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" /> ผู้ให้ข้อมูล
              </span>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {evaluation.evaluatorName || '-'}
              </p>
              {evaluation.customerPhone && (
                <span className="text-xs text-slate-500 block">📞 {evaluation.customerPhone}</span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> ช่องทางติดต่อ
              </span>
              <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {channelText}
              </p>
            </div>
          </div>

          {/* Section 2: Interactive Map & Check-in Coordinates */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  พิกัดสถานที่ & จุด Check-in หน้างานจริง
                </h3>
              </div>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 transition-colors w-fit"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>เปิด Google Maps (นำทาง)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {evaluation.checkInLocation ? (
              <div className="space-y-3">
                {/* Interactive Map view */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
                  <InteractiveMap
                    lat={evaluation.checkInLocation.lat}
                    lng={evaluation.checkInLocation.lng}
                    address={evaluation.checkInLocation.address}
                    isEditable={false}
                    height="280px"
                  />
                </div>

                {/* Location Details Card */}
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                        ที่อยู่ / สถานที่หน้างานจริง:
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                        {evaluation.checkInLocation.address || 'พิกัดตำแหน่งตาม GPS'}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] shrink-0 shadow-2xs">
                      พิกัด GPS ตรวจสอบแล้ว
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 gap-3 font-medium">
                    <span className="font-mono font-bold text-emerald-950 dark:text-emerald-200">
                      พิกัดละติจูด, ลองจิจูด: {evaluation.checkInLocation.lat.toFixed(6)}, {evaluation.checkInLocation.lng.toFixed(6)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>เวลา Check-in: {formatCheckInTime(evaluation.checkInLocation.timestamp)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
                <MapPin className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p>ไม่ได้บันทึกพิกัด GPS สำหรับการเข้าพบในครั้งนี้</p>
              </div>
            )}
          </div>

          {/* Section 3: On-site Photos (ภาพถ่ายหน้างานจริง) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  ภาพถ่ายหน้างานจริง (On-site Photos)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {evaluation.photos && evaluation.photos.length > 0
                  ? `แนบทั้งหมด ${evaluation.photos.length} รูป (กดคลิกเพื่อดูภาพขนาดใหญ่)`
                  : 'ไม่มีภาพถ่าย'}
              </span>
            </div>

            {evaluation.photos && evaluation.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {evaluation.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActivePhotoModal(photo)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-video sm:aspect-square cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={photo}
                      alt={`ภาพหน้างาน ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-6 h-6 drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-bold">
                      ภาพที่ {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
                <Camera className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs sm:text-sm">ไม่มีการแนบภาพถ่ายหน้างานในการเข้าพบครั้งนี้</p>
              </div>
            )}
          </div>

          {/* Section 4: Competitor Pricing & Market Feedback */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  ข้อมูลราคาและเปรียบเทียบกับคู่แข่ง (เช่น ไทวัสดุ)
                </h3>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                เกณฑ์ราคาโดยรวม: {priceInfo.label}
              </span>
            </div>

            {evaluation.feedbackPriceNote && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 italic text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                "{evaluation.feedbackPriceNote}"
              </div>
            )}

            {/* Competitor Items Table */}
            {validCompetitorItems.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3 w-10 text-center font-bold">#</th>
                        <th className="p-3 font-bold">รายการสินค้า</th>
                        <th className="p-3 w-32 text-center font-bold">ระดับราคาเทียบ</th>
                        <th className="p-3 font-bold">หมายเหตุ / ราคา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validCompetitorItems.map((item, idx) => {
                        const compLabel =
                          item.comparison === 'lower'
                            ? 'ต่ำกว่าคู่แข่ง'
                            : item.comparison === 'higher'
                            ? 'สูงกว่าคู่แข่ง'
                            : item.comparison === 'similar'
                            ? 'ใกล้เคียง'
                            : item.comparison === 'uncertain'
                            ? 'ไม่แน่ใจ'
                            : 'ไม่เปิดเผย';

                        const compBadge =
                          item.comparison === 'lower'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.comparison === 'higher'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                            <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                              {item.productName}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${compBadge}`}>
                                {compLabel}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{item.note || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                ไม่ได้ระบุรายการสินค้าเปรียบเทียบราคาเฉพาะ
              </div>
            )}
          </div>

          {/* Section 5: Interested Products */}
          {validInterestedProducts.length > 0 && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>สินค้าที่ลูกค้าสนใจให้ทำราคาเสนอเพิ่มเติม:</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {validInterestedProducts.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-300 dark:border-emerald-700 font-bold text-xs sm:text-sm shadow-2xs"
                  >
                    • {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Additional Customer Feedback */}
          {evaluation.additionalFeedback && (
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
              <span className="font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ข้อเสนอแนะเพิ่มเติม / ความคิดเห็นจากลูกค้า:</span>
              </span>
              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                {evaluation.additionalFeedback}
              </p>
            </div>
          )}

          {/* Footer Signature & System Notice */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                เอกสารรายงานผลการเข้าพบลูกค้าภาคสนาม • สำหรับผู้บริหารและหัวหน้างานตรวจสอบ
              </span>
            </div>
            <div className="text-right font-bold text-slate-700 dark:text-slate-300">
              ผู้บันทึกรายงาน: {evaluation.signatureName || evaluation.salesRepName}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Modal */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
          >
            <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300">ภาพถ่ายหน้างานจริง</span>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={activePhotoModal}
                alt="ภาพถ่ายหน้างานขนาดเต็ม"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
            <div className="p-3 bg-slate-950 flex items-center justify-end gap-2 border-t border-slate-800">
              <a
                href={activePhotoModal}
                download="job_photo.jpg"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดรูปนี้</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
