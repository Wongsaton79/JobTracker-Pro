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
  CloudDownload,
  CloudUpload,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import {
  downloadCsvFile,
  generateGoogleAppsScriptCode,
  fetchJobsFromGoogleSheets,
  saveJobToGoogleSheets,
} from '../utils/sheetsSync';

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
  const [activeTab, setActiveTab] = useState<'sheet_setup' | 'gas_code' | 'csv_export'>('sheet_setup');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
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
    onClose();
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
                การเชื่อมต่อฐานข้อมูล Google Sheets
              </h2>
              <p className="text-xs text-emerald-100">
                ใช้ Google Sheets เป็นฐานข้อมูลกลาง บันทึกและดึงข้อมูลมาแสดงผลได้ทุกที่ ทุกอุปกรณ์
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
          <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('sheet_setup')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'sheet_setup'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>ตั้งค่า Google Sheets URL</span>
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
              <span>โค้ด Apps Script พร้อมใช้</span>
            </button>
            <button
              onClick={() => setActiveTab('csv_export')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'csv_export'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออกไฟล์ CSV</span>
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
              <span>{statusMessage.text}</span>
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
                    * ได้จากการกด Deploy ➔ New deployment ➔ Web app ใน Google Apps Script
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

              {/* Quick 3-Step Guide */}
              <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-slate-700 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-800">📌 ขั้นตอนการเอา URL จาก Google Sheets:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>เปิด Google Sheet ของคุณ ➔ เมนู <strong>Extensions (ส่วนขยาย)</strong> ➔ <strong>Apps Script</strong></li>
                  <li>คัดลอกโค้ดจากแท็บ <strong>"โค้ด Apps Script พร้อมใช้"</strong> ไปวางแล้วกด Save</li>
                  <li>กดปุ่ม <strong>Deploy</strong> ➔ <strong>New deployment</strong> ➔ เลือก <strong>Web app</strong> ➔ ตรงช่อง Who has access ให้เลือก <strong>Anyone</strong></li>
                  <li>คัดลอก Web App URL ที่ได้มาใส่ในช่องด้านบนนี้</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 2: Apps Script Code */}
          {activeTab === 'gas_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  โค้ดนี้รองรับทั้งการ <strong>ดึงข้อมูล (doGet)</strong> และ <strong>บันทึกข้อมูล (doPost)</strong> อัตโนมัติ:
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

          {/* Tab 3: CSV Export */}
          {activeTab === 'csv_export' && (
            <div className="space-y-4 text-xs">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-emerald-600" />
                <h4 className="text-base font-bold text-slate-800">ส่งออกข้อมูลงานทั้งหมด ({jobs.length} รายการ)</h4>
                <p className="text-slate-500 max-w-md mx-auto">
                  ไฟล์ CSV รองรับภาษาไทยสมบูรณ์แบบ (UTF-8 with BOM) สามารถเปิดใน Excel, Google Sheets หรือนำเข้าตารางได้ทันที
                </p>
                <button
                  onClick={() => downloadCsvFile(jobs, `field_jobs_${new Date().toISOString().substring(0, 10)}.csv`)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ .CSV สำหรับ Google Sheets</span>
                </button>
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
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};
