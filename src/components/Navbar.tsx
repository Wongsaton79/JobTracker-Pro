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
} from 'lucide-react';
import { JobItem, SyncSettings } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NavbarProps {
  activeTab: 'jobs' | 'dashboard' | 'map' | 'line_flex';
  onTabChange: (tab: 'jobs' | 'dashboard' | 'map' | 'line_flex') => void;
  onOpenNewJob: () => void;
  onOpenSheetsSettings: () => void;
  jobs: JobItem[];
  settings: SyncSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewJob,
  onOpenSheetsSettings,
  jobs,
  settings,
}) => {
  const pendingJobsCount = jobs.filter((j) => j.status === 'in_progress' || j.status === 'pending').length;
  const totalRevenue = jobs.reduce((sum, j) => sum + j.price, 0);
  const isSheetConnected = Boolean(settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http'));

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
                ระบบติดตามและอัพเดทสถานะหน้างาน • ฐานข้อมูล Google Sheets & LINE Flex
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Stats Pill */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
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

            {/* Discreet Settings Gear Button (Admin / Integration Settings) */}
            <button
              onClick={onOpenSheetsSettings}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                isSheetConnected
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="ตั้งค่าระบบ (Settings & Database)"
              aria-label="ตั้งค่าระบบ"
            >
              <Settings className="w-4 h-4 text-slate-400 hover:text-white transition-transform duration-300 hover:rotate-45" />
              {isSheetConnected && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900"
                  title="Google Sheets & LINE Connected"
                />
              )}
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
        </div>
      </div>
    </header>
  );
};
