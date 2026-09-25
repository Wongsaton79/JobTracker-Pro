import React, { useState } from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelText, formatPriceComparisonLabel } from '../../utils/evaluationCalculator';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Store,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  MessageCircle,
} from 'lucide-react';

interface EvaluationShareLinkModalProps {
  evaluation: SalesEvaluation | null;
  companyName: string;
  onClose: () => void;
  onOpenReportPage?: (evaluation: SalesEvaluation) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const EvaluationShareLinkModal: React.FC<EvaluationShareLinkModalProps> = ({
  evaluation,
  companyName,
  onClose,
  onOpenReportPage,
  showToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!evaluation) return null;

  const priceInfo = formatPriceComparisonLabel(evaluation.feedbackPriceAndPromo);
  const channelText = formatChannelText(evaluation.contactChannel);
  const branchText = evaluation.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก';

  // Construct absolute URL for the evaluation report
  const reportUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=report&id=${evaluation.id}`
      : `?view=report&id=${evaluation.id}`;

  const locText = evaluation.checkInLocation
    ? evaluation.checkInLocation.address || `${evaluation.checkInLocation.lat.toFixed(5)}, ${evaluation.checkInLocation.lng.toFixed(5)}`
    : 'ไม่ได้ระบุพิกัด GPS';

  const fullLineMessage = [
    `📋 รายงานเข้าพบลูกค้า / บันทึกหน้างาน`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🏪 ร้านค้า/ลูกค้า: ${evaluation.customerName}`,
    `👤 พนักงานขาย: ${evaluation.salesRepName} (${branchText})`,
    `📅 วันที่เข้าพบ: ${evaluation.date || '-'}`,
    `👥 ผู้ให้ข้อมูล: ${evaluation.evaluatorName || '-'}`,
    `📞 ช่องทาง: ${channelText}`,
    `📍 พิกัดหน้างาน: ${locText}`,
    `🏷️ ราคากับคู่แข่ง: ${priceInfo.label}`,
    `📷 ภาพถ่ายหน้างาน: ${evaluation.photos && evaluation.photos.length > 0 ? `${evaluation.photos.length} รูป` : 'ไม่มี'}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔗 คลิกลิงก์เปิดดูข้อมูลหน้างาน & ภาพถ่าย & แผนที่ Check-in (สำหรับผู้บริหารและหัวหน้างาน):`,
    reportUrl,
  ].join('\n');

  // Copy URL only
  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      showToast('คัดลอกลิงก์รายงานเรียบร้อยแล้ว', 'success');
    }
  };

  // Copy Full LINE Message
  const handleCopyMessage = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullLineMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3000);
      showToast('คัดลอกข้อความสรุปพร้อมลิงก์ สำหรับวางในกลุ่ม LINE เรียบร้อยแล้ว', 'success');
    }
  };

  // Direct share via Web Share API or LINE App
  const handleShareToLine = async () => {
    const shareTitle = `รายงานเข้าพบร้าน ${evaluation.customerName}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: fullLineMessage,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Open LINE app directly with encoded message
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(fullLineMessage)}`;
    window.open(lineUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-50 text-[11px] font-semibold backdrop-blur-xs">
              <Share2 className="w-3.5 h-3.5" />
              <span>แชร์ลิงก์รายงานเข้ากลุ่ม LINE</span>
            </div>
            <h2 className="text-xl font-black text-white">{evaluation.customerName}</h2>
            <p className="text-xs text-emerald-100">
              {evaluation.salesRepName} • {branchText} • รหัส {evaluation.evaluationCode}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">🔒 ลิงก์รายงานนี้ไม่แสดงผลคะแนนการประเมิน</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
              หัวหน้างานและผู้บริหารจะเห็นข้อมูลหน้างานจริงทั้งหมด ทั้งรูปถ่าย, พิกัด Check-in และราคาสินค้าคู่แข่ง แต่จะไม่เห็นคะแนนการประเมินผลงาน
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Link Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>🔗 ลิงก์หน้ารายงานสำหรับส่งในกลุ่ม LINE:</span>
              <span className="text-[10px] text-emerald-600 font-normal">เปิดดูได้ทั้งบนมือถือและคอม</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={reportUrl}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopyUrl}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="คัดลอกเฉพาะลิงก์"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>💬 ข้อความสรุปพร้อมส่งใน LINE (แนะนำ):</span>
              <button
                onClick={handleCopyMessage}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความนี้'}</span>
              </button>
            </label>
            <textarea
              readOnly
              rows={6}
              value={fullLineMessage}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-sans text-xs leading-relaxed select-all focus:outline-hidden"
            />
          </div>

          {/* Key Facts Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
            <div className="font-bold text-slate-700 dark:text-slate-300">สิ่งที่จะแสดงในหน้ารายงานผู้บริหาร:</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>แผนที่ Check-in + นำทาง Google Maps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                <span>ภาพถ่ายหน้างานจริง ({evaluation.photos?.length || 0} รูป)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-600" />
                <span>ข้อมูลร้านค้า & ผู้ให้ข้อมูล</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>ราคาสินค้าคู่แข่ง & ข้อเสนอแนะ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => {
              if (onOpenReportPage) {
                onOpenReportPage(evaluation);
              } else {
                window.open(reportUrl, '_blank');
              }
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>เปิดดูตัวอย่างหน้ารายงาน</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>คัดลอกข้อความ</span>
            </button>

            <button
              onClick={handleShareToLine}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์เข้า LINE ทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
