import React, { useRef, useState } from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelText, formatPriceComparisonLabel } from '../../utils/evaluationCalculator';
import { toPng, toBlob } from 'html-to-image';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  MapPin,
  Calendar,
  User,
  Store,
  Phone,
  Tag,
  FileText,
  Camera,
  ExternalLink,
  ShieldCheck,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';

interface EvaluationImageExportModalProps {
  evaluation: SalesEvaluation | null;
  companyName: string;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const EvaluationImageExportModal: React.FC<EvaluationImageExportModalProps> = ({
  evaluation,
  companyName,
  onClose,
  showToast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!evaluation) return null;

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

  const formatCheckInTime = (timestamp?: string | number) => {
    if (!timestamp) return evaluation.date || '-';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return evaluation.date || '-';
      return `${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;
    } catch {
      return evaluation.date || '-';
    }
  };

  // 1. Download as PNG image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      // Small pause to ensure layout is settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      const cleanCustomer = (evaluation.customerName || 'customer').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const cleanDate = (evaluation.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
      const link = document.createElement('a');
      link.download = `รายงานเข้าพบ_${cleanCustomer}_${cleanDate}.png`;
      link.href = dataUrl;
      link.click();

      showToast('ดาวน์โหลดรูปภาพรายงานเรียบร้อยแล้ว (สามารถนำไปส่งหรือโน้ตใน LINE ได้ทันที)', 'success');
    } catch (err: any) {
      console.error('Export image error:', err);
      showToast(`ไม่สามารถสร้างรูปภาพได้: ${err.message || err}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      if (!blob) throw new Error('Could not generate image blob');

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
        showToast('คัดลอกรูปภาพแล้ว! สามารถกด Ctrl+V หรือ Paste วางใน LINE ได้ทันที', 'success');
      } else {
        // Fallback: download instead
        handleDownloadImage();
      }
    } catch (err: any) {
      console.warn('Copy image clipboard not supported, fallback to download:', err);
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Share via Web Share API (Mobile friendly)
  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      if (!blob) throw new Error('Could not generate blob');

      const cleanCustomer = (evaluation.customerName || 'customer').replace(/[\s\/\\:*?"<>|]+/g, '_');
      const file = new File([blob], `รายงาน_${cleanCustomer}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `รายงานเข้าพบร้าน ${evaluation.customerName}`,
          text: `รายงานข้อมูลเข้าพบร้าน ${evaluation.customerName} (พนักงานขาย: ${evaluation.salesRepName})`,
        });
        showToast('แชร์รูปภาพสำเร็จ', 'success');
      } else {
        // Fallback: download
        handleDownloadImage();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Share error:', err);
        handleDownloadImage();
      }
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Copy Text Note (Clean summary without score for LINE note)
  const handleCopyTextNote = () => {
    const lines = [
      `📋 สรุปรายงานเข้าพบลูกค้า / บันทึกหน้างาน`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🏪 ร้านค้า/ลูกค้า: ${evaluation.customerName}`,
      `👤 พนักงานขาย: ${evaluation.salesRepName} (${branchText})`,
      `📅 วันที่: ${evaluation.date || '-'}`,
      `👥 ผู้ให้ข้อมูล: ${evaluation.evaluatorName || '-'}`,
      `📞 ช่องทาง: ${channelText}`,
    ];

    if (evaluation.checkInLocation) {
      const loc = evaluation.checkInLocation.address || `${evaluation.checkInLocation.lat.toFixed(5)}, ${evaluation.checkInLocation.lng.toFixed(5)}`;
      lines.push(`📍 พิกัดหน้างาน: ${loc}`);
      lines.push(`🗺️ แผนที่: https://www.google.com/maps?q=${evaluation.checkInLocation.lat},${evaluation.checkInLocation.lng}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🏷️ ราคากับคู่แข่ง: ${priceInfo.label}`);
    if (evaluation.feedbackPriceNote) {
      lines.push(`💬 บันทึกราคา: ${evaluation.feedbackPriceNote}`);
    }

    if (validCompetitorItems.length > 0) {
      lines.push(`📋 ราคาสินค้าคู่แข่ง (${validCompetitorItems.length} รายการ):`);
      validCompetitorItems.forEach((item, idx) => {
        const comp = item.comparison === 'lower' ? 'ต่ำกว่า' : item.comparison === 'higher' ? 'สูงกว่า' : item.comparison === 'similar' ? 'ใกล้เคียง' : 'เทียบราคา';
        lines.push(`  ${idx + 1}. ${item.productName} [${comp}]${item.note ? ` - ${item.note}` : ''}`);
      });
    }

    if (validInterestedProducts.length > 0) {
      lines.push(`💡 สินค้าที่ลูกค้าสนใจให้ทำราคา:`);
      validInterestedProducts.forEach((item) => {
        lines.push(`  • ${item}`);
      });
    }

    if (evaluation.additionalFeedback) {
      lines.push(`💬 ข้อเสนอแนะเพิ่มเติม: ${evaluation.additionalFeedback}`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`รหัสแบบประเมิน: ${evaluation.evaluationCode} • ${companyName || 'ระบบบันทึกงานขาย'}`);

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
    showToast('คัดลอกข้อความสรุปสำหรับวางในกลุ่ม LINE เรียบร้อยแล้ว', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>ส่งออกรูปภาพสำหรับลง LINE / โน้ตกลุ่ม</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  ไม่แสดงคะแนน (ความลับภายใน)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                รูปภาพสรุปข้อมูลเข้าพบลูกค้า พร้อมแชร์หรือบันทึกนำไปแปะในกลุ่ม LINE พร้อมรูปถ่ายหน้างาน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              ภาพนี้จะไม่แสดงคะแนนความพึงพอใจ เพื่อความเหมาะสมในการรายงานในกลุ่มไลน์
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTextNote}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="คัดลอกเฉพาะข้อความสรุป เพื่อนำไป Paste ใน LINE"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความ'}</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="คัดลอกรูปภาพ สามารถกด Ctrl+V ใน LINE ได้ทันที"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'คัดลอกรูปภาพแล้ว' : 'คัดลอกรูปภาพ'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="แชร์รูปภาพไปยัง LINE หรือแอพอื่นในมือถือ"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>แชร์รูปภาพ</span>
              </button>
            )}

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังสร้างรูป...' : 'บันทึกรูปภาพ (PNG)'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          {/* THE CARD TO EXPORT TO PNG */}
          <div
            ref={cardRef}
            className="w-full max-w-2xl bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200"
            style={{ fontFamily: 'sans-serif' }}
          >
            {/* Card Header (Branded Emerald Header) */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-5 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-50 text-[11px] font-semibold backdrop-blur-xs">
                    <Store className="w-3.5 h-3.5" />
                    <span>รายงานการเข้าพบลูกค้า / บันทึกข้อมูลหน้างาน</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                    {evaluation.customerName}
                  </h1>
                  <p className="text-xs text-emerald-100 font-medium">
                    {companyName || 'บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด'} • {branchText}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-right">
                    <span className="text-[10px] text-emerald-200 block uppercase font-bold tracking-wider">
                      รหัสแบบประเมิน
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white">
                      {evaluation.evaluationCode || 'EV-RECORD'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-100 mt-1 block">
                    📅 {evaluation.date || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Row 1: Key Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-600" /> พนักงานขาย
                  </span>
                  <p className="font-extrabold text-slate-800">{evaluation.salesRepName}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <Store className="w-3 h-3 text-emerald-600" /> สาขาดูแล
                  </span>
                  <p className="font-extrabold text-slate-800">{branchText}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-600" /> ผู้ให้ข้อมูล
                  </span>
                  <p className="font-extrabold text-slate-800">
                    {evaluation.evaluatorName || '-'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" /> ช่องทาง
                  </span>
                  <p className="font-extrabold text-slate-800">{channelText}</p>
                </div>
              </div>

              {/* Row 2: Location & GPS Check-in */}
              {evaluation.checkInLocation ? (
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>พิกัด Check-in ยืนยันหน้างานจริง:</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                      พิกัด GPS ตรวจสอบแล้ว
                    </span>
                  </div>

                  <p className="text-slate-800 font-semibold leading-relaxed">
                    {evaluation.checkInLocation.address || 'ระบุตำแหน่งตามพิกัดแผนที่'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-emerald-200/60 gap-2">
                    <span className="font-mono text-emerald-950 font-bold">
                      ละติจูด/ลองจิจูด: {evaluation.checkInLocation.lat.toFixed(6)}, {evaluation.checkInLocation.lng.toFixed(6)}
                    </span>
                    <span>
                      เวลา Check-in: {formatCheckInTime(evaluation.checkInLocation.timestamp)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>ไม่ได้บันทึกพิกัด GPS ในการเข้าพบครั้งนี้</span>
                </div>
              )}

              {/* Row 3: Competitor Pricing & Market Feedback */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>ข้อมูลราคาและเปรียบเทียบกับคู่แข่ง (เช่น ไทวัสดุ):</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {priceInfo.label}
                  </span>
                </div>

                {evaluation.feedbackPriceNote && (
                  <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                    "{evaluation.feedbackPriceNote}"
                  </p>
                )}

                {/* Competitor Items Table */}
                {validCompetitorItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-bold text-[11px] text-slate-700">
                      รายการสินค้าเปรียบเทียบ ({validCompetitorItems.length} รายการ):
                    </div>
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                            <th className="p-2 w-8 text-center font-bold">#</th>
                            <th className="p-2 font-bold">รายการสินค้า</th>
                            <th className="p-2 w-28 text-center font-bold">ระดับราคาเทียบ</th>
                            <th className="p-2 font-bold">หมายเหตุ / ราคา</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
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
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.comparison === 'higher'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200';

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 text-center text-slate-600 font-bold">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-800">{item.productName}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${compBadge}`}>
                                    {compLabel}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-600">{item.note || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Interested Products */}
              {validInterestedProducts.length > 0 && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>สินค้าที่ลูกค้าสนใจให้ทำราคาเสนอเพิ่มเติม:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {validInterestedProducts.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-300 font-bold text-[11px] shadow-2xs"
                      >
                        • {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 5: Additional Customer Feedback */}
              {evaluation.additionalFeedback && (
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <span>ข้อเสนอแนะเพิ่มเติม / ความต้องการพิเศษ:</span>
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-amber-200/60">
                    {evaluation.additionalFeedback}
                  </p>
                </div>
              )}

              {/* Row 6: On-site Photos (if any) */}
              {evaluation.photos && evaluation.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ภาพถ่ายหน้างานจริง ({evaluation.photos.length} รูป):</span>
                    </span>
                    <span className="text-[10px] text-slate-600">แนบพร้อมรายงาน</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {evaluation.photos.slice(0, 3).map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center"
                      >
                        <img
                          src={photo}
                          alt={`รูปหน้างาน ${idx + 1}`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                          ภาพที่ {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Footer: Sign & Confidentiality */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-600">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    เอกสารรายงานผลการเข้าพบลูกค้าภาคสนาม • ข้อมูลสำหรับการปฏิบัติงานภายใน
                  </span>
                </div>
                <div className="text-right self-end sm:self-auto font-bold text-slate-700">
                  ผู้บันทึก: {evaluation.signatureName || evaluation.salesRepName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            แนะนำ: กด <b>"บันทึกรูปภาพ (PNG)"</b> หรือ <b>"คัดลอกรูปภาพ"</b> แล้วนำไปลงโน้ตในกลุ่ม LINE ได้สะดวก
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              ปิด
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังประมวลผล...' : 'บันทึกรูปภาพ (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
