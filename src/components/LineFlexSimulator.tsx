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
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import { buildLineFlexMessage, generateLineNotifyText } from '../utils/lineFlexBuilder';
import { formatCurrency, formatThaiDate, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';

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
  const [testSent, setTestSent] = useState(false);

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

  const handleTestSend = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header & Job Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">LINE</span>
            <span>Flex Message Notification Center</span>
          </h2>
          <p className="text-xs text-slate-500">
            ตัวอย่างการแจ้งเตือนรูปแบบ Flex Message สวยงาม อ่านง่ายบนมือถือ พร้อมโค้ด JSON สำหรับเชื่อมต่อ AppSheet / Google Apps Script
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
                <div className="w-7 h-7 rounded-full bg-[#06C755] flex items-center justify-center font-bold text-xs shadow-xs">
                  💬
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>LINE Notify / Field Alert</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">การแจ้งเตือนงานอัตโนมัติ</div>
                </div>
              </div>
              <BellRing className="w-4 h-4 text-emerald-400" />
            </div>

            {/* LINE Chat Canvas */}
            <div className="bg-[#788896] p-3 min-h-[460px] max-h-[580px] overflow-y-auto rounded-b-2xl space-y-3">
              {/* Chat timestamp */}
              <div className="text-center">
                <span className="text-[10px] bg-black/20 text-white/90 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  วันนี้ 14:30 น.
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

                {/* Hero Photo Banner */}
                {heroImage && (
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img
                      src={heroImage}
                      alt={currentJob.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                      ภาพประกอบหน้างาน ({currentJob.photos.length} รูป)
                    </div>
                  </div>
                )}

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
                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 bg-[#0284C7] text-white text-[11px] font-bold rounded-lg text-center shadow-xs flex items-center justify-center gap-1 hover:bg-[#0369A1]"
                    >
                      <MapPin className="w-3 h-3" />
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

        {/* Right Column: Code Generator, AppSheet Integration & Actions */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          {/* Action Tabs */}
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
                  📱 สรุปฟังก์ชัน Flex
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
                  <span>JSON Payload (AppSheet / LINE API)</span>
                </button>
                <button
                  onClick={() => setActiveTab('notify_text')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    activeTab === 'notify_text'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  💬 LINE Notify Text
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
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>จุดเด่นของระบบแจ้งเตือน LINE Flex Message:</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-emerald-800">
                    <li>สี Header ปรับเปลี่ยนอัตโนมัติตามสถานะงาน (เขียว=เสร็จ, ฟ้า=กำลังทำ, ส้ม=รอตรวจ, แดง=มีปัญหา)</li>
                    <li>แสดงภาพหน้างานจริงแบบไฮเรสทันทีที่ช่างถ่ายรูป</li>
                    <li>มีปุ่มกด <strong>"แผนที่ GPS"</strong> เพื่อเปิด Google Maps นำทางได้ทันทีจากมือถือ</li>
                    <li>มีปุ่มกด <strong>"โทรออก"</strong> เพื่อโทรหาลูกค้าหรือโฟร์แมนได้ใน 1 คลิก</li>
                    <li>สรุปราคางาน แบรนด์สินค้า และสถานะการชำระเงิน (สด/เครดิต) ชัดเจน</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleTestSend}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 text-xs sm:text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{testSent ? '✅ ส่งข้อความทดสอบสำเร็จ!' : 'ทดสอบส่งการแจ้งเตือน (Test Dispatch)'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'json_code' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  นำ JSON นี้ไปใส่ใน <strong>AppSheet Automation (Webhook Call)</strong> หรือ <strong>LINE Messaging API POST /v2/bot/message/push</strong>
                </p>
                <div className="relative bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] max-h-96 overflow-y-auto">
                  <pre>{JSON.stringify(flexPayload, null, 2)}</pre>
                </div>
              </div>
            )}

            {activeTab === 'notify_text' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  ข้อความสำหรับส่งผ่าน <strong>LINE Notify Token</strong> ทั่วไป
                </p>
                <div className="bg-slate-50 text-slate-800 rounded-xl p-4 font-mono text-xs border border-slate-200 whitespace-pre-wrap">
                  {notifyText}
                </div>
              </div>
            )}
          </div>

          {/* Guide for AppSheet / Google Apps Script */}
          <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 text-xs text-sky-950 space-y-2">
            <h4 className="font-bold text-sky-900 flex items-center gap-1.5">
              <span>🚀 วิธีตั้งค่า Automation ใน AppSheet / Google Sheets:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sky-900">
              <li>สร้าง Table <strong>Jobs</strong> ใน AppSheet โดยดึงฐานข้อมูลจาก Google Sheet</li>
              <li>ไปที่เมนู <strong>Automation → Tasks</strong> ใน AppSheet</li>
              <li>เลือก Action Type เป็น <strong>Webhook</strong> ไปยัง LINE Messaging API หรือ Webhook URL</li>
              <li>วาง Body ด้วยรูปแบบ Flex Message JSON ข้างต้น</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
