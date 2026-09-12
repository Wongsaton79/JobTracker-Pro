import React, { useState } from 'react';
import {
  X,
  Database,
  Flame,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Sparkles,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { SyncSettings, JobItem } from '../types';
import { exportJobsToExcel } from '../utils/excelExport';
import {
  syncAllJobsToFirebase,
  fetchJobsFromFirebaseOnce,
  DEFAULT_FIREBASE_CONFIG,
} from '../utils/firebaseSync';
import { sendLineFlexDirect, testLineConnectionDirect } from '../utils/lineFlexSender';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSaveSettings: (newSettings: SyncSettings) => void;
  jobs: JobItem[];
  onRefreshJobs: (jobs: JobItem[]) => void;
}

export const FirebaseSettingsModal: React.FC<FirebaseSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  jobs,
  onRefreshJobs,
}) => {
  const [formData, setFormData] = useState<SyncSettings>(settings);
  const [activeTab, setActiveTab] = useState<'firebase' | 'line' | 'guide' | 'export'>('firebase');
  const [copied, setCopied] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Push all local jobs to Firebase Firestore
  const handleSyncAllToFirebase = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const count = await syncAllJobsToFirebase(jobs);
      setStatusMessage({
        text: `✅ อัพโหลดข้อมูลขึ้น Firebase Firestore สำเร็จ ${count}/${jobs.length} รายการ`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: `เกิดข้อผิดพลาดในการซิงค์: ${err.message || err}`,
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull all latest jobs from Firebase Firestore
  const handleFetchFromFirebase = async () => {
    setIsFetching(true);
    setStatusMessage(null);
    try {
      const fbJobs = await fetchJobsFromFirebaseOnce();
      if (fbJobs && fbJobs.length > 0) {
        onRefreshJobs(fbJobs);
        setStatusMessage({
          text: `⚡ ดึงข้อมูลงานล่าสุดจาก Firebase เรียบร้อย (${fbJobs.length} รายการ)`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: 'ยังไม่พบข้อมูลงานใน Firebase Firestore หรือตารางว่างเปล่า',
          type: 'info',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `ไม่สามารถดึงข้อมูลได้: ${err.message || err}`,
        type: 'error',
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Test LINE Bot Connection (Quick Ping)
  const [isTestingBot, setIsTestingBot] = useState(false);

  const handleTestLineBot = async () => {
    setIsTestingBot(true);
    setStatusMessage(null);

    const target = (formData.lineTargetGroupId || formData.lineTargetUserId || '').trim();
    const token = (formData.lineChannelAccessToken || '').trim();

    if (!token) {
      setStatusMessage({ text: 'กรุณากรอก LINE Channel Access Token ก่อนทดสอบ', type: 'error' });
      setIsTestingBot(false);
      return;
    }
    if (!target) {
      setStatusMessage({ text: 'กรุณากรอก LINE Group ID หรือ User ID ก่อนทดสอบ', type: 'error' });
      setIsTestingBot(false);
      return;
    }

    try {
      const res = await testLineConnectionDirect({
        targetId: target,
        channelAccessToken: token,
        companyName: formData.companyName,
      });

      if (res.success) {
        setStatusMessage({
          text: `✅ ${res.message}`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: `❌ ${res.message}`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `เกิดข้อผิดพลาด: ${err.message || err}`,
        type: 'error',
      });
    } finally {
      setIsTestingBot(false);
    }
  };

  // Test LINE Flex message
  const handleTestLineFlex = async () => {
    if (jobs.length === 0) {
      setStatusMessage({ text: 'ไม่มีรายการงานสำหรับทดสอบส่ง LINE', type: 'error' });
      return;
    }
    setIsTestingLine(true);
    setStatusMessage(null);

    const targetJob = jobs[0];
    const target = (formData.lineTargetGroupId || formData.lineTargetUserId || '').trim();
    const token = (formData.lineChannelAccessToken || '').trim();

    if (!token) {
      setStatusMessage({ text: 'กรุณากรอก LINE Channel Access Token ก่อนทดสอบ', type: 'error' });
      setIsTestingLine(false);
      return;
    }
    if (!target) {
      setStatusMessage({ text: 'กรุณากรอก LINE Group ID หรือ User ID ก่อนทดสอบ', type: 'error' });
      setIsTestingLine(false);
      return;
    }

    try {
      const res = await sendLineFlexDirect(targetJob, {
        targetId: target,
        channelAccessToken: token,
        companyName: formData.companyName,
        eventLabel: '🧪 ทดสอบการส่งข้อความ LINE Flex',
      });

      if (res.success) {
        setStatusMessage({
          text: `💬 ส่ง LINE Flex สำหรับงาน "${targetJob.title}" เข้ากลุ่ม (${target.substring(0, 10)}...) สำเร็จเรียบร้อย!`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: `❌ ${res.message || 'ส่งไม่สำเร็จ ตรวจสอบ Channel Access Token หรือ Group ID'}`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `เกิดข้อผิดพลาด: ${err.message || err}`,
        type: 'error',
      });
    } finally {
      setIsTestingLine(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ตั้งค่าระบบฐานข้อมูล Firebase & LINE
              </h2>
              <p className="text-xs text-slate-400">
                Cloud Real-time Firestore Database & Direct LINE Flex Notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'firebase'
                ? 'border-orange-500 text-orange-600 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Firebase Cloud DB</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('line')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'line'
                ? 'border-emerald-500 text-emerald-600 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>การแจ้งเตือน LINE</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-600 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>คู่มือการเชื่อมต่อ LINE</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-600 bg-white font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>ส่งออกข้อมูล (Excel)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: Firebase Firestore Status */}
          {activeTab === 'firebase' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">Firebase Cloud Firestore</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🟢 Realtime Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ซิงค์ข้อมูลงานหน้างานและรูปถ่ายอัตโนมัติแบบเรียลไทม์ข้ามทุกอุปกรณ์
                    </p>
                  </div>
                </div>
              </div>

              {/* Firestore Configuration Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Project ID</span>
                  <span className="font-mono font-semibold text-slate-800">{DEFAULT_FIREBASE_CONFIG.projectId}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Firestore Collection</span>
                  <span className="font-mono font-semibold text-slate-800">jobs ({jobs.length} รายการ)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  การจัดการข้อมูลคลาวด์
                </h5>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSyncAllToFirebase}
                    disabled={isSyncing}
                    className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <UploadIcon className="w-4 h-4" />
                    <span>{isSyncing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลทั้งหมดขึ้น Firebase Firestore'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFetchFromFirebase}
                    disabled={isFetching}
                    className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>{isFetching ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุดจาก Firebase'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  จุดเด่นของระบบ Firebase Firestore:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-1">
                  <li><strong>อัพเดททันที (Realtime):</strong> ไม่ว่าจะเปิดจากมือถือ ช่างหน้างาน หรือคอมพิวเตอร์สำนักงาน ข้อมูลจะเด้งตรงกันทันที</li>
                  <li><strong>เสถียรและรวดเร็ว:</strong> บันทึกข้อมูลได้ทันที ไม่มีอาการหน่วงหรือติดโควตาเหมือน Google Apps Script</li>
                  <li><strong>เก็บรูปภาพหน้างานความละเอียดสูง:</strong> รูปถ่ายจะถูกแปลงเป็น Direct Public HTTPS เพื่อส่งเข้า LINE Flex ได้ 100%</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: LINE Messaging API Setup */}
          {activeTab === 'line' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อบริษัท / องค์กรที่แสดงในการแจ้งเตือน:
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="เช่น บริษัท ฟิลด์ เซอร์วิส แทร็กเกอร์ จำกัด"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  LINE Group ID / Target ID (สำหรับส่งเข้ากลุ่มงาน):
                </label>
                <input
                  type="text"
                  value={formData.lineTargetGroupId || ''}
                  onChange={(e) => setFormData({ ...formData, lineTargetGroupId: e.target.value })}
                  placeholder="เช่น C341417bcb6e853c320eaf9d80963cda3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  รหัสกลุ่ม LINE ที่ต้องการให้ Bot ส่ง Flex Message เข้าไปแจ้งเตือน
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  LINE Channel Access Token (Long-lived):
                </label>
                <textarea
                  rows={3}
                  value={formData.lineChannelAccessToken || ''}
                  onChange={(e) => setFormData({ ...formData, lineChannelAccessToken: e.target.value })}
                  placeholder="ใส่ Channel access token จาก LINE Developers Console"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleTestLineBot}
                  disabled={isTestingBot || isTestingLine}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{isTestingBot ? 'กำลังทดสอบการเชื่อมต่อ...' : '1. ทดสอบเชื่อมต่อ LINE Bot'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleTestLineFlex}
                  disabled={isTestingLine || isTestingBot}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isTestingLine ? 'กำลังส่งการ์ด Flex...' : '2. ทดสอบส่ง LINE Flex Message'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  ขั้นตอนการเชื่อมต่อ LINE Messaging API & Bot เข้ากลุ่มงาน
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 leading-relaxed">
                  <li>
                    เข้าไปที่ <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-medium">LINE Developers Console</a> แล้วสร้าง <strong>Provider</strong> และ <strong>Messaging API Channel</strong>
                  </li>
                  <li>
                    ไปที่แท็บ <strong>Messaging API</strong> ➔ เลื่อนลงไปที่ <strong>Channel access token</strong> ➔ กดปุ่ม <strong>Issue</strong> เพื่อสร้าง Token ระยะยาว
                  </li>
                  <li>
                    คัดลอก Token มาวางในช่อง <strong>"LINE Channel Access Token"</strong> ในแท็บตั้งค่า
                  </li>
                  <li>
                    เชิญ LINE Bot (Official Account) ของคุณเข้ากลุ่ม LINE ที่ทีมงานทำงานอยู่
                  </li>
                  <li>
                    ใส่ Group ID (ขึ้นต้นด้วยตัว C) ในช่อง <strong>"LINE Group ID"</strong> แล้วกด <strong>"ทดสอบส่ง LINE Flex"</strong>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: Export Data */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                ส่งออกข้อมูลงานทั้งหมด ({jobs.length} รายการ) ออกมาเป็นไฟล์เพื่อจัดทำรายงาน
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => exportJobsToExcel(jobs, `JobTracker_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block">ดาวน์โหลด Microsoft Excel</span>
                    <span className="text-[11px] text-slate-500">ไฟล์ .xlsx พร้อมจัดรูปแบบตารางสวยงาม</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jobs, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `JobTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block">สำรองข้อมูล JSON</span>
                    <span className="text-[11px] text-slate-500">ไฟล์ Backup ทั้งหมดของระบบ</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};

function UploadIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
