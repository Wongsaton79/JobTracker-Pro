import React from 'react';
import {
  Briefcase,
  Plus,
  BarChart3,
  MapPin,
  Send,
  Settings,
  Smartphone,
  Tablet,
  Monitor,
  History,
  Award,
  Sparkles,
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NavbarProps {
  activeTab: 'jobs' | 'dashboard' | 'map' | 'line_flex' | 'sales_evaluation';
  onTabChange: (tab: 'jobs' | 'dashboard' | 'map' | 'line_flex' | 'sales_evaluation') => void;
  onOpenNewJob: () => void;
  onOpenSettings: () => void;
  onOpenAuditLogs: () => void;
  jobs: JobItem[];
  settings: SyncSettings;
  evaluationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewJob,
  onOpenSettings,
  onOpenAuditLogs,
  jobs,
  settings,
  evaluationsCount = 0,
}) => {
  const pendingJobsCount = jobs.filter((j) => j.status === 'in_progress' || j.status === 'pending').length;
  const totalRevenue = jobs.reduce((sum, j) => sum + j.price, 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Top bar row */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
                  JobTracker Pro
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full font-medium">
                  <Smartphone className="w-3 h-3" />
                  <Tablet className="w-3 h-3" />
                  <Monitor className="w-3 h-3" />
                  <span>Responsive Web</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                ระบบติดตามและอัพเดทสถานะหน้างาน • ฐานข้อมูล Cloud Firebase Firestore & LINE Flex
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prominent Quick Button: แบบประเมินทีมขาย */}
            <button
              onClick={() => onTabChange('sales_evaluation')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer active:scale-95 ${
                activeTab === 'sales_evaluation'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-900/40'
                  : 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-500/50 hover:border-emerald-400'
              }`}
              title="แบบประเมินความพึงพอใจ การทำงานของทีมขาย (ลดการใช้กระดาษ 100%)"
              aria-label="แบบประเมินทีมขาย"
            >
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold">⭐ แบบประเมินทีมขาย</span>
              <span className="hidden sm:inline-block bg-white/20 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                {evaluationsCount}
              </span>
            </button>

            {/* Quick Stats Pill */}
            <div className="hidden xl:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">งานค้าง/กำลังทำ</span>
                <span className="font-bold text-amber-400">{pendingJobsCount} งาน</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">ยอดรวมทั้งระบบ</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            {/* Audit Log Button */}
            <button
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600 shadow-xs"
              title="ดูประวัติการทำงานของระบบ (Audit Logs)"
              aria-label="ประวัติการทำงาน"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>

            {/* Settings Gear Button (Firebase & LINE Settings) */}
            <button
              onClick={onOpenSettings}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all border bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600"
              title="ตั้งค่าระบบฐานข้อมูล Firebase & LINE"
              aria-label="ตั้งค่าระบบ"
            >
              <Settings className="w-4 h-4 text-slate-400 hover:text-white transition-transform duration-300 hover:rotate-45" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"
                title="Firebase Firestore Connected"
              />
            </button>

            {/* Quick Add Job Button */}
            <button
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs row (Responsive Horizontal Scroll) */}
        <div className="flex items-center gap-1 border-t border-slate-800/80 py-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => onTabChange('jobs')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'jobs'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>📋 รายการงาน ({jobs.length})</span>
          </button>

          {/* ⭐ เมนูเห็นชัด: แบบประเมินความพึงพอใจ การทำงานของทีมขาย */}
          <button
            onClick={() => onTabChange('sales_evaluation')}
            className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'sales_evaluation'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md ring-2 ring-emerald-300/60'
                : 'bg-emerald-950/40 text-emerald-300 hover:text-white hover:bg-emerald-900/60 border border-emerald-500/40 font-bold'
            }`}
          >
            <Award className="w-4 h-4 text-amber-300 shrink-0" />
            <span>⭐ แบบประเมินความพึงพอใจทีมขาย ({evaluationsCount})</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
              <Sparkles className="w-2.5 h-2.5" />
              <span>ลดใช้กระดาษ</span>
            </span>
          </button>

          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 แดชบอร์ดสรุปผล</span>
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'map'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>🗺️ แผนที่พิกัดหน้างาน</span>
          </button>

          <button
            onClick={() => onTabChange('line_flex')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'line_flex'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>💬 LINE Flex & Notify</span>
          </button>

          <button
            onClick={onOpenAuditLogs}
            className="px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>📜 ประวัติการทำงาน (Audit Logs)</span>
          </button>
        </div>
      </div>
    </header>
  );
};

