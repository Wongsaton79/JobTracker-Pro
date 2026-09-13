import React, { useState } from 'react';
import {
  Send,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Code2,
  BellRing,
  Sparkles,
  Phone,
  MapPin,
  Tag,
  DollarSign,
  User,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import { buildLineFlexMessage, generateLineNotifyText } from '../utils/lineFlexBuilder';
import { formatCurrency, formatThaiDate, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';
import { sendLineFlexDirect } from '../utils/lineFlexSender';

interface LineFlexSimulatorProps {
  job: JobItem | null;
  allJobs: JobItem[];
  settings: SyncSettings;
  onSelectJob: (job: JobItem) => void;
}

export const LineFlexSimulator: React.FC<LineFlexSimulatorProps> = ({
  job,
  allJobs,
  settings,
  onSelectJob,
}) => {
  const currentJob = job || (allJobs.length > 0 ? allJobs[0] : null);
  const [activeTab, setActiveTab] = useState<'flex_preview' | 'json_code' | 'notify_text'>('flex_preview');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!currentJob) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        ยังไม่มีรายการงานสำหรับแสดงตัวอย่าง LINE Flex Message
      </div>
    );
  }

  const flexPayload = buildLineFlexMessage(currentJob, settings.companyName);
  const notifyText = generateLineNotifyText(currentJob);
  const statusCfg = getStatusConfig(currentJob.status);
  const paymentCfg = getPaymentTypeConfig(currentJob.paymentType);
  const heroImage = currentJob.photos.length > 0 ? currentJob.photos[0].url : null;
  const googleMapsUrl = `https://www.google.com/maps?q=${currentJob.location.lat},${currentJob.location.lng}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToGroup = async () => {
    const targetId = settings.lineTargetGroupId || settings.lineTargetUserId || 'C341417bcb6e853c320eaf9d80963cda3';

    setIsSending(true);
    setSendResult(null);

    const res = await sendLineFlexDirect(currentJob, {
      targetId,
      channelAccessToken: settings.lineChannelAccessToken,
      companyName: settings.companyName,
      eventLabel: '📋 รายงานข้อมูลงานหน้างาน',
    });

    setIsSending(false);
    if (res.success) {
      setSendResult({
        text: `✅ ส่ง LINE Flex Message เข้ากลุ่ม (${targetId.substring(0, 8)}...) สำเร็จเรียบร้อย!`,
        type: 'success',
      });
    } else {
      setSendResult({
        text: res.message,
        type: 'error',
      });
    }
  };

  const handleSendToUser = async () => {
    const targetId = settings.lineTargetUserId || 'U54fd541a6cf7746b1b4f0219634c7a53';

    setIsSending(true);
    setSendResult(null);

    const res = await sendLineFlexDirect(currentJob, {
      targetId,
      channelAccessToken: settings.lineChannelAccessToken,
      companyName: settings.companyName,
      eventLabel: '📋 รายงานข้อมูลงานส่วนบุคคล',
    });

    setIsSending(false);
    if (res.success) {
      setSendResult({
        text: `✅ ส่ง LINE Flex Message เข้า LINE ส่วนตัว (${targetId.substring(0, 8)}...) สำเร็จ!`,
        type: 'success',
      });
    } else {
      setSendResult({
        text: res.message,
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Job Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#06C755]/10 text-[#06C755] font-bold text-xs border border-[#06C755]/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Messaging API Connected</span>
            </span>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              Group: {settings.lineTargetGroupId ? `${settings.lineTargetGroupId.substring(0, 10)}...` : 'C341417b...'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mt-1">
            <span>LINE Flex Message Notification Center</span>
          </h2>
          <p className="text-xs text-slate-500">
            ระบบส่งการ์ดรายงานหน้างานเข้ากลุ่ม LINE อัตโนมัติ พร้อมปุ่มเปิด GPS แผนที่และโทรออก
          </p>
        </div>

        {/* Job selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">เลือกงาน:</span>
          <select
            value={currentJob.id}
            onChange={(e) => {
              const found = allJobs.find((j) => j.id === e.target.value);
              if (found) onSelectJob(found);
            }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none max-w-xs truncate"
          >
            {allJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.jobCode}: {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Mobile Phone Simulator + Code/Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Smartphone Mockup */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-slate-900 rounded-[42px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Phone Top Notch / Speaker */}
            <div className="flex justify-between items-center px-6 py-1 text-white text-[10px] mb-1">
              <span>09:41</span>
              <div className="w-16 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* LINE App Bar */}
            <div className="bg-[#1E232B] text-white px-3.5 py-2.5 rounded-t-2xl flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#06C755] flex items-center justify-center font-bold text-xs shadow-xs text-white">
                  💬
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>กลุ่มช่าง & หน้างาน</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">LINE Flex Notification</div>
                </div>
              </div>
              <BellRing className="w-4 h-4 text-emerald-400" />
            </div>

            {/* LINE Chat Canvas */}
            <div className="bg-[#788896] p-3 min-h-[460px] max-h-[580px] overflow-y-auto rounded-b-2xl space-y-3">
              {/* Chat timestamp */}
              <div className="text-center">
                <span className="text-[10px] bg-black/20 text-white/90 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  วันนี้ {currentJob.time} น.
                </span>
              </div>

              {/* Flex Message Bubble (Simulated Exactly as LINE standard) */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-black/10 text-slate-800 animate-fade-in">
                {/* Header with Status Color */}
                <div
                  className="p-3.5 text-white"
                  style={{ backgroundColor: statusCfg.lineColor }}
                >
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span>🔔</span>
                      <span>อัพเดทสถานะงานหน้างาน</span>
                    </span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                      {statusCfg.label}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm mt-1.5 leading-snug line-clamp-2">
                    {currentJob.title}
                  </h4>
                  <p className="text-[10px] text-white/80 mt-1">
                    รหัส: {currentJob.jobCode} • {formatThaiDate(currentJob.date, 'short')} {currentJob.time} น.
                  </p>
                </div>

                {/* Body Details Table */}
                <div className="p-3.5 space-y-2 text-xs">
                  {/* Contact */}
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-[11px] w-20 shrink-0 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>ผู้ติดต่อ</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-[11px] break-all">
                      {currentJob.contactPerson} ({currentJob.phoneNumber})
                    </span>
                  </div>

                  {/* Brand & Item */}
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-[11px] w-20 shrink-0 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>แบรนด์</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-[11px]">
                      {currentJob.productBrand} - {currentJob.productDetails || 'มาตรฐาน'}
                    </span>
                  </div>

                  {/* Price & Payment */}
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-[11px] w-20 shrink-0 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      <span>ยอดเงิน</span>
                    </span>
                    <div>
                      <span className="font-bold text-emerald-600 text-xs">
                        {formatCurrency(currentJob.price)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ({paymentCfg.label})
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 text-[11px] w-20 shrink-0 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>พิกัด</span>
                    </span>
                    <span className="text-sky-700 text-[11px] font-medium leading-tight">
                      {currentJob.location.address || `${currentJob.location.lat}, ${currentJob.location.lng}`}
                    </span>
                  </div>

                  {/* Notes */}
                  {currentJob.notes && (
                    <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-200">
                      📝 <strong>หมายเหตุ:</strong> {currentJob.notes}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1.5">
                  {/* Web View Button */}
                  <a
                    href={`/?jobId=${encodeURIComponent(currentJob.id || currentJob.jobCode)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.search = `?jobId=${encodeURIComponent(currentJob.id || currentJob.jobCode)}`;
                    }}
                    className="w-full py-1.5 bg-[#059669] text-white text-[11px] font-bold rounded-lg text-center shadow-xs flex items-center justify-center gap-1 hover:bg-[#047857]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>🌐 คลิกดูรูปและข้อมูลที่หน้าเว็บ</span>
                  </a>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg text-center shadow-xs flex items-center justify-center gap-1 hover:bg-slate-50"
                    >
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>แผนที่ GPS</span>
                    </a>
                    <a
                      href={`tel:${currentJob.phoneNumber}`}
                      className="py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg text-center shadow-xs flex items-center justify-center gap-1 hover:bg-slate-50"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>โทรออก</span>
                    </a>
                  </div>
                  <div className="text-center text-[9px] text-slate-400">
                    รายงานโดย {settings.companyName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Actions, Code Generator & API Info */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          {/* Send Status Banner */}
          {sendResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                sendResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {sendResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{sendResult.text}</span>
            </div>
          )}

          {/* Quick Push Actions Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-emerald-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>🚀 สั่งส่งการ์ด Flex Message เข้า LINE ทันที</span>
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed">
              คลิกปุ่มด้านล่างเพื่อส่งการ์ดสรุปงาน <strong>"{currentJob.title}"</strong> เข้ากลุ่ม LINE หรือ ผู้ใช้เป้าหมายทันที:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleSendToGroup}
                disabled={isSending}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs"
              >
                <Users className="w-4 h-4" />
                <span>{isSending ? 'กำลังส่ง...' : '💬 ส่งเข้ากลุ่ม LINE (Group)'}</span>
              </button>

              <button
                onClick={handleSendToUser}
                disabled={isSending}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs border border-white/20"
              >
                <User className="w-4 h-4" />
                <span>{isSending ? 'กำลังส่ง...' : '👤 ส่งเข้า LINE ส่วนตัว (User)'}</span>
              </button>
            </div>

            <div className="text-[10px] text-emerald-200/80 pt-1 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-1">
              <span>Group ID: {settings.lineTargetGroupId || 'C341417bcb6e853c320eaf9d80963cda3'}</span>
              <span>User ID: {settings.lineTargetUserId || 'U54fd541a6cf7746b1b4f0219634c7a53'}</span>
            </div>
          </div>

          {/* Action Tabs Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('flex_preview')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'flex_preview'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📱 สรุปการเชื่อมต่อ
                </button>
                <button
                  onClick={() => setActiveTab('json_code')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                    activeTab === 'json_code'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Flex Message JSON</span>
                </button>
                <button
                  onClick={() => setActiveTab('notify_text')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'notify_text'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💬 ข้อความตัวอักษร
                </button>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    activeTab === 'json_code'
                      ? JSON.stringify(flexPayload, null, 2)
                      : notifyText
                  )
                }
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกโค้ด</span>
                  </>
                )}
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'flex_preview' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">
                    💡 ข้อแนะนำสำหรับการส่งเข้ากลุ่ม LINE:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    <li><strong>อย่าลืมเชิญบอทเข้ากลุ่ม:</strong> ดึงบัญชี LINE Official Account (บอทที่คุณสร้าง) เข้าไปอยู่ในกลุ่ม <code>{settings.lineTargetGroupId}</code> ด้วย เพื่อให้บอทมีสิทธิ์ส่งข้อความในกลุ่ม</li>
                    <li><strong>ซิงค์เรียลไทม์:</strong> เมื่อคุณบันทึกงานใหม่ หรือเปลี่ยนสถานะงานในเว็บ ข้อมูลจะถูกบันทึกลง Firebase Cloud Database และส่ง LINE Flex Message แจ้งเตือนเข้ากลุ่มทันที</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'json_code' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  โครงสร้าง LINE Flex Message Bubble JSON มาตรฐาน:
                </p>
                <div className="relative bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] max-h-96 overflow-y-auto">
                  <pre>{JSON.stringify(flexPayload, null, 2)}</pre>
                </div>
              </div>
            )}

            {activeTab === 'notify_text' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  ข้อความสรุปงานแบบ Plain Text:
                </p>
                <div className="bg-slate-50 text-slate-800 rounded-xl p-4 font-mono text-xs border border-slate-200 whitespace-pre-wrap">
                  {notifyText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
