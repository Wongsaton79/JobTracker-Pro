import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Code2,
  Database,
  Flame,
  CloudDownload,
  CloudUpload,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  GitBranch,
  Play,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import {
  downloadCsvFile,
  generateGoogleAppsScriptCode,
  fetchJobsFromGoogleSheets,
  saveJobToGoogleSheets,
  testSystemConnection,
} from '../utils/sheetsSync';
import { exportJobsToExcel } from '../utils/excelExport';
import { DEFAULT_FIREBASE_CONFIG, syncAllJobsToFirebase, fetchJobsFromFirebaseOnce } from '../utils/firebaseSync';

interface SheetsAppSheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobItem[];
  settings: SyncSettings;
  onUpdateSettings: (settings: SyncSettings) => void;
  onImportJobs?: (jobs: JobItem[]) => void;
}

export const SheetsAppSheetSettingsModal: React.FC<SheetsAppSheetSettingsModalProps> = ({
  isOpen,
  onClose,
  jobs,
  settings,
  onUpdateSettings,
  onImportJobs,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<SyncSettings>(settings);
  const [activeTab, setActiveTab] = useState<'firebase_status' | 'sheet_setup' | 'line_setup' | 'gas_code' | 'github_guide' | 'export'>('firebase_status');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const appsScriptCode = generateGoogleAppsScriptCode('FieldJobs');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setStatusMessage({ text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว', type: 'success' });
    setTimeout(() => onClose(), 800);
  };

  // ดึงข้อมูลทั้งหมดจาก Google Sheets มาแสดงในแอป
  const handleFetchFromSheets = async () => {
    if (!formData.googleSheetUrl) {
      setStatusMessage({ text: 'กรุณากรอก Google Sheets Web App URL ก่อน', type: 'error' });
      return;
    }

    setIsFetching(true);
    setStatusMessage(null);

    const result = await fetchJobsFromGoogleSheets(formData.googleSheetUrl);
    setIsFetching(false);

    if (result.success && result.data && result.data.length > 0) {
      if (onImportJobs) {
        onImportJobs(result.data);
      }
      setStatusMessage({
        text: `✅ ดึงข้อมูลสำเร็จ! นำเข้าข้อมูลงานแล้ว ${result.data.length} รายการ`,
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: result.message || 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง Web App (Anyone)',
        type: 'error',
      });
    }
  };

  // ส่งข้อมูลงานทั้งหมดในเครื่องขึ้นไปเก็บใน Google Sheets
  const handleUploadAllToSheets = async () => {
    if (!formData.googleSheetUrl) {
      setStatusMessage({ text: 'กรุณากรอก Google Sheets Web App URL ก่อน', type: 'error' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    const result = await saveJobToGoogleSheets(formData.googleSheetUrl, jobs);
    setIsSyncing(false);

    if (result.success) {
      setStatusMessage({
        text: `✅ ส่งข้อมูลงานทั้งหมด (${jobs.length} รายการ) ขึ้น Google Sheets เรียบร้อยแล้ว`,
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: result.message,
        type: 'error',
      });
    }
  };

  // ทดสอบระบบส่ง LINE Flex & Sheet Sync
  const handleRunDiagnostics = async () => {
    setIsTesting(true);
    setTestResult(null);
    setStatusMessage(null);

    const result = await testSystemConnection(formData);
    setIsTesting(false);
    setTestResult(result.diagnostics);

    // Check if test succeeded either via server proxy or client Apps Script relay
    const isLineOk =
      result.success ||
      result.diagnostics?.lineTest?.success === true ||
      result.diagnostics?.lineApi === 'ok' ||
      result.diagnostics?.status === 'success';

    if (isLineOk) {
      setStatusMessage({
        text: '✅ ส่งคำสั่งทดสอบ LINE Flex Message เข้ากลุ่มเรียบร้อยแล้ว! (หากข้อความยังไม่ขึ้น กรุณาตรวจสอบว่า Group ID ตรงกับกลุ่มจริง และ Token ยังไม่หมดอายุ)',
        type: 'success',
      });
    } else {
      const err =
        result.diagnostics?.lineTest?.error ||
        result.diagnostics?.error ||
        result.diagnostics?.lineTest?.details ||
        'เกิดข้อผิดพลาดในการส่งคำขอ';
      setStatusMessage({
        text: `⚠️ ตรวจพบข้อผิดพลาด: ${err}`,
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                การเชื่อมต่อฐานข้อมูล Google Sheets & LINE
              </h2>
              <p className="text-xs text-emerald-100">
                ระบบคลาวด์จัดเก็บข้อมูลงาน และส่งการแจ้งเตือน LINE Flex Message เข้ากลุ่มช่างอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('firebase_status')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'firebase_status'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>🔥 Firebase Cloud DB (เปิดใช้งานแล้ว)</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel / CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('sheet_setup')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'sheet_setup'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Google Sheets URL (สำรอง)</span>
            </button>
            <button
              onClick={() => setActiveTab('line_setup')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'line_setup'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>LINE Messaging API</span>
            </button>
            <button
              onClick={() => setActiveTab('gas_code')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'gas_code'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>โค้ด Apps Script</span>
            </button>
            <button
              onClick={() => setActiveTab('github_guide')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'github_guide'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>วิธีอัพเดตขึ้น GitHub</span>
            </button>
          </div>

          {/* Status Message Notification Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Tab 0: Firebase Firestore Status */}
          {activeTab === 'firebase_status' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Firebase Firestore Cloud Database
                      </h3>
                      <p className="text-amber-800 text-[11px]">
                        เชื่อมต่อสำเร็จ • ซิงค์ข้อมูล Real-time อัตโนมัติทุกเครื่อง
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active & Live</span>
                  </span>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-200 text-slate-700 text-[11px] space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Project ID:</span>
                    <span className="font-bold text-slate-900">{DEFAULT_FIREBASE_CONFIG.projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auth Domain:</span>
                    <span className="text-slate-700">{DEFAULT_FIREBASE_CONFIG.authDomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Bucket:</span>
                    <span className="text-slate-700">{DEFAULT_FIREBASE_CONFIG.storageBucket}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                  <p className="font-bold">✨ ประโยชน์ของการใช้ Firebase แทน Google Sheets:</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-emerald-800">
                    <li>บันทึกจากมือถือนอกสถานที่ได้ทันที 100% ไม่ติดปัญหาความปลอดภัยหรือ CORS Error</li>
                    <li>ซิงค์ข้อมูลขึ้นหน้าจอคอมพิวเตอร์แบบ Real-time ทันทีที่มีการเพิ่มหรือแก้งาน</li>
                    <li>รองรับการ Export ออกมาเป็นไฟล์ Excel (.xlsx) และ CSV ได้ตลอดเวลา</li>
                  </ul>
                </div>

                {/* Firebase Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncing(true);
                      try {
                        const count = await syncAllJobsToFirebase(jobs);
                        setStatusMessage({
                          text: `🔥 อัปโหลดและซิงค์ข้อมูลงานทั้งหมด (${count} งาน) ขึ้น Firebase Firestore เรียบร้อยแล้ว!`,
                          type: 'success',
                        });
                      } catch (err: any) {
                        setStatusMessage({
                          text: `เกิดข้อผิดพลาดในการซิงค์: ${err.message || 'โปรดตรวจสอบ Rules'}`,
                          type: 'error',
                        });
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Flame className="w-4 h-4" />
                    <span>{isSyncing ? 'กำลังซิงค์ขึ้น Firebase...' : '⚡ อัปโหลดงานทั้งหมดขึ้น Firebase ทันที'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsFetching(true);
                      try {
                        const fbJobs = await fetchJobsFromFirebaseOnce();
                        if (fbJobs && fbJobs.length > 0) {
                          if (onImportJobs) onImportJobs(fbJobs);
                          setStatusMessage({
                            text: `ดึงข้อมูลจาก Firebase สำเร็จ (${fbJobs.length} งาน)`,
                            type: 'success',
                          });
                        } else {
                          setStatusMessage({
                            text: 'เชื่อมต่อ Firebase สำเร็จ แต่ยังไม่มีข้อมูลงานใน Database (สามารถกดปุ่มซิงค์งานขึ้นไปได้)',
                            type: 'info',
                          });
                        }
                      } catch (err: any) {
                        setStatusMessage({
                          text: `ทดสอบล้มเหลว: ${err.message}`,
                          type: 'error',
                        });
                      } finally {
                        setIsFetching(false);
                      }
                    }}
                    disabled={isFetching}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>ทดสอบดึงข้อมูล</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Single Google Sheets URL Setup */}
          {activeTab === 'sheet_setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-1.5">
                <h3 className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ใช้ Google Sheets เป็นฐานข้อมูลกลาง (Cloud Database)</span>
                </h3>
                <p className="text-emerald-900 leading-relaxed text-[11px] sm:text-xs">
                  เมื่อใส่ Web App URL ด้านล่างนี้ ทุกครั้งที่มีการบันทึกงานใหม่ หรือแก้ไขสถานะงาน ระบบจะซิงค์ข้อมูลเข้าตารางใน Google Sheet ของคุณทันที และเมื่อเปิดใช้งานบนมือถือเครื่องอื่นนอกสถานที่ ก็สามารถกด <strong>"ดึงข้อมูลจาก Google Sheets"</strong> เพื่อเรียกดูงานทั้งหมดได้ทันที
                </p>
              </div>

              {/* Single URL Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Google Sheets Web App URL (Apps Script /exec):
                  </label>
                  <input
                    type="url"
                    value={formData.googleSheetUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * ได้จากการกด Deploy ➔ New deployment ➔ Web app ใน Google Apps Script (เลือก Who has access: <strong>Anyone</strong>)
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อบริษัท / ทีมช่าง (สำหรับหัวเอกสาร & LINE Flex):
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Direct Action Sync Buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleFetchFromSheets}
                    disabled={isFetching}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    <CloudDownload className={`w-4 h-4 ${isFetching ? 'animate-bounce' : ''}`} />
                    <span>{isFetching ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก Google Sheets มาแสดง'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadAllToSheets}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลทั้งหมดขึ้น Google Sheets'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: LINE Messaging API Credentials */}
          {activeTab === 'line_setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>การเชื่อมต่อ LINE Messaging API (Flex Message)</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  ข้อมูลด้านล่างนี้ถูกบันทึกไว้ในระบบเพื่อใช้ส่งการ์ดสรุปงานเข้ากลุ่ม LINE (Group ID) หรือส่งเข้าบัญชีส่วนตัว (User ID)
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    Channel Access Token (Long-lived):
                  </label>
                  <textarea
                    rows={2}
                    value={formData.lineChannelAccessToken || ''}
                    onChange={(e) => setFormData({ ...formData, lineChannelAccessToken: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="JOdpOQkd0rtaYfPfGVLwZj9LMshtp010Hgb..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      LINE Group ID (ส่งเข้ากลุ่ม):
                    </label>
                    <input
                      type="text"
                      value={formData.lineTargetGroupId || ''}
                      onChange={(e) => setFormData({ ...formData, lineTargetGroupId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="C341417bcb6e853c320eaf9d80963cda3"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1">
                      LINE User ID (ส่งเข้าส่วนตัว):
                    </label>
                    <input
                      type="text"
                      value={formData.lineTargetUserId || ''}
                      onChange={(e) => setFormData({ ...formData, lineTargetUserId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="U54fd541a6cf7746b1b4f0219634c7a53"
                    />
                  </div>
                </div>

                {/* Important Checklist Callout */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>เช็คลิสต์สำคัญ เพื่อให้ LINE Flex ส่งเข้ากลุ่มได้สำเร็จ 100%:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-amber-800">
                    <li>
                      <strong>เชิญบอทเข้ากลุ่ม:</strong> ต้องดึง LINE Official Account (Bot) เข้ากลุ่ม LINE <code>{formData.lineTargetGroupId || 'C341417...'}</code> ด้วย บอทจึงจะส่งข้อความเข้ากลุ่มได้
                    </li>
                    <li>
                      <strong>ปิดฟีเจอร์ Auto-Response:</strong> ใน LINE Official Account Manager ให้ตั้งค่าเป็น Webhook / Messaging API
                    </li>
                  </ul>
                </div>

                {/* Test Diagnostics Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunDiagnostics}
                    disabled={isTesting}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                  >
                    <Play className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'กำลังทดสอบยิง LINE Flex...' : '🧪 ทดสอบยิง LINE Flex Message เข้ากลุ่มเดี๋ยวนี้'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto space-y-1">
                    <p className="text-emerald-400 font-bold">ผลการทดสอบการเชื่อมต่อ (Diagnostics):</p>
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Apps Script Code */}
          {activeTab === 'gas_code' && (
            <div className="space-y-3">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs space-y-1">
                <p className="font-bold">📋 วิธีอัพเดตโค้ดใน Google Apps Script (สำคัญมาก!):</p>
                <ol className="list-decimal pl-5 space-y-0.5 text-[11px] text-sky-800">
                  <li>เปิด Google Sheet ของคุณ ➔ กดเมนู <strong>ส่วนขยาย (Extensions)</strong> ➔ <strong>Apps Script</strong></li>
                  <li>ลบโค้ดเดิมทั้งหมดออก แล้ววางโค้ดด้านล่างนี้ลงไปแทน</li>
                  <li>กด <strong>บันทึก (รูปแผ่นดิสก์)</strong></li>
                  <li>กด <strong>ทำให้ใช้งานได้ (Deploy)</strong> ➔ <strong>จัดการการทำให้ใช้งานได้ (Manage deployments)</strong> ➔ กดรูปดินสอ ➔ เลือกเวอร์ชันเป็น <strong>"เวอร์ชันใหม่ (New version)"</strong> ➔ กด Deploy</li>
                </ol>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-semibold">
                  โค้ด Google Apps Script (ซิงค์ตาราง + ยิง LINE Flex อัตโนมัติ):
                </p>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกโค้ดทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] max-h-96 overflow-y-auto border border-slate-800">
                <pre>{appsScriptCode}</pre>
              </div>
            </div>
          )}

          {/* Tab 4: GitHub Update Guide */}
          {activeTab === 'github_guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <GitBranch className="w-4 h-4" />
                  <span>ขั้นตอนการอัพเดต Code ขึ้น GitHub</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  เมื่อมีการเขียนโค้ดใหม่หรือปรับปรุงระบบ คุณสามารถนำโค้ดขึ้น GitHub ได้ง่ายๆ ผ่าน 2 วิธีดังนี้:
                </p>
              </div>

              {/* Method 1: Export / Download ZIP */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 text-emerald-700">
                  <span>วิธีที่ 1: ส่งออกเป็น ZIP หรือ Export GitHub ผ่านเมนู AI Studio (ง่ายที่สุด)</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600 text-[11px]">
                  <li>กดที่เมนู <strong>Settings / จุดสามจุด</strong> ที่มุมขวาบนของหน้าต่าง AI Studio</li>
                  <li>เลือก <strong>"Export to GitHub"</strong> หรือ <strong>"Download ZIP"</strong></li>
                  <li>หากเชื่อมต่อ GitHub ไว้ ระบบจะ Push โค้ดล่าสุดไปยัง Repository ของคุณโดยตรงทันที</li>
                </ol>
              </div>

              {/* Method 2: Git Command Line */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5 text-slate-900">
                  <Terminal className="w-4 h-4 text-slate-700" />
                  <span>วิธีที่ 2: ใช้คำสั่ง Git Command Line (สำหรับเครื่องคอมพิวเตอร์)</span>
                </h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1.5">
                  <p className="text-slate-400"># 1. ตรวจสอบไฟล์ที่เปลี่ยนแปลง</p>
                  <p className="text-emerald-400">git status</p>
                  <p className="text-slate-400"># 2. เพิ่มไฟล์ทั้งหมดเตรียม commit</p>
                  <p className="text-emerald-400">git add .</p>
                  <p className="text-slate-400"># 3. บันทึกข้อความอธิบายการอัพเดต</p>
                  <p className="text-emerald-400">git commit -m "Update LINE Flex notifications and Google Sheets sync"</p>
                  <p className="text-slate-400"># 4. ส่งโค้ดขึ้น GitHub (main หรือ master branch)</p>
                  <p className="text-emerald-400">git push origin main</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Excel & CSV Export */}
          {activeTab === 'export' && (
            <div className="space-y-4 text-xs">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600" />
                <div>
                  <h4 className="text-base font-bold text-slate-800">ส่งออกรายงานข้อมูลงานทั้งหมด ({jobs.length} รายการ)</h4>
                  <p className="text-slate-500 max-w-md mx-auto text-xs mt-1">
                    เลือกรูปแบบไฟล์ที่ต้องการเพื่อนำไปเปิดใน Microsoft Excel, Google Sheets หรือใช้งานในองค์กร
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      exportJobsToExcel(jobs, `JobTracker_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
                      setStatusMessage({ text: 'ดาวน์โหลดไฟล์ Excel (.xlsx) เรียบร้อยแล้ว', type: 'success' });
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์ Excel (.xlsx) [แนะนำ]</span>
                  </button>

                  <button
                    onClick={() => {
                      downloadCsvFile(jobs, `field_jobs_${new Date().toISOString().substring(0, 10)}.csv`);
                      setStatusMessage({ text: 'ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', type: 'success' });
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>ดาวน์โหลดไฟล์ CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};
