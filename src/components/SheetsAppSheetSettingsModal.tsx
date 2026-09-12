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
  Layers,
  Save,
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import { downloadCsvFile, generateGoogleAppsScriptCode } from '../utils/sheetsSync';

interface SheetsAppSheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobItem[];
  settings: SyncSettings;
  onUpdateSettings: (settings: SyncSettings) => void;
}

export const SheetsAppSheetSettingsModal: React.FC<SheetsAppSheetSettingsModalProps> = ({
  isOpen,
  onClose,
  jobs,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<SyncSettings>(settings);
  const [activeTab, setActiveTab] = useState<'appsheet_guide' | 'gas_code' | 'csv_export'>('appsheet_guide');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

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

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1200);
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
                การเชื่อมต่อ Google Sheets & AppSheet
              </h2>
              <p className="text-xs text-emerald-100">
                ตั้งค่าฐานข้อมูล บันทึก/ดึงข้อมูลแบบ Real-time และส่งออกไฟล์
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
          {/* Quick Tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('appsheet_guide')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'appsheet_guide'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>วิธีเชื่อมต่อกับ AppSheet</span>
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
              <span>Apps Script Webhook Code</span>
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

          {/* Tab 1: AppSheet & Google Sheets Setup Guide */}
          {activeTab === 'appsheet_guide' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>โครงสร้างตารางข้อมูลใน Google Sheets สำหรับ AppSheet:</span>
                </h3>
                <p className="text-emerald-900">
                  ระบบนี้ออกแบบโครงสร้างข้อมูล (Columns) ให้ตรงตามมาตรฐานของ Google Sheets และ AppSheet โดยมีคอลัมน์สำคัญดังนี้:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-1.5 rounded border border-emerald-200">1. Job_Code (รหัสงาน)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">2. Date (วันที่)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">3. Time (เวลา)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">4. Title (ชื่อหน้างาน)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">5. Status (สถานะงาน)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">6. Contact (ผู้ติดต่อ)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">7. Phone (เบอร์โทร)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">8. Brand (แบรนด์สินค้า)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">9. Price_THB (ราคา)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">10. Payment_Type (การชำระ)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">11. Lat & Lng (พิกัด GPS)</div>
                  <div className="bg-white p-1.5 rounded border border-emerald-200">12. Photos (ลิงก์ภาพ)</div>
                </div>
              </div>

              {/* Endpoint Configuration Form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">การตั้งค่า URL ปลายทาง (Webhook Endpoints)</h4>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Google Sheets Webhook / Apps Script Web App URL:
                  </label>
                  <input
                    type="url"
                    value={formData.googleSheetUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    AppSheet API / Webhook Action URL:
                  </label>
                  <input
                    type="url"
                    value={formData.appSheetWebhookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, appSheetWebhookUrl: e.target.value })}
                    placeholder="https://api.appsheet.com/api/v2/apps/.../tables/Jobs/Action"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    ชื่อบริษัท / ทีมช่าง สำหรับหัวรายงาน:
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'กำลังซิงค์ข้อมูล...' : syncSuccess ? '✅ ซิงค์สำเร็จแล้ว!' : 'ทดสอบซิงค์ข้อมูลเดี๋ยวนี้'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400">ข้อมูลปัจจุบัน: {jobs.length} งาน</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Apps Script Code */}
          {activeTab === 'gas_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  คัดลอกโค้ดนี้ไปวางใน Google Sheet → <strong>Extensions (ส่วนขยาย) → Apps Script</strong> เพื่อสร้าง Webhook อัตโนมัติ:
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
                      <span>คัดลอกโค้ด Apps Script</span>
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
                  ไฟล์ CSV รองรับภาษาไทยสมบูรณ์แบบ (UTF-8 with BOM) สามารถเปิดใน Excel, Google Sheets, หรือนำเข้าสู่ AppSheet ได้ทันที
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
