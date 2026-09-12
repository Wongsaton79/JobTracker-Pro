import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobListView } from './components/JobListView';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { MapView } from './components/MapView';
import { LineFlexSimulator } from './components/LineFlexSimulator';
import { JobFormModal } from './components/JobFormModal';
import { JobDetailModal } from './components/JobDetailModal';
import { SheetsAppSheetSettingsModal } from './components/SheetsAppSheetSettingsModal';
import { INITIAL_JOBS, INITIAL_SETTINGS } from './data/initialData';
import { JobItem, JobStatus, SyncSettings } from './types';
import { downloadCsvFile, saveJobToGoogleSheets, fetchJobsFromGoogleSheets } from './utils/sheetsSync';
import { CheckCircle2, AlertCircle, Sparkles, Smartphone, Tablet, Monitor, RefreshCw } from 'lucide-react';

export default function App() {
  // Load saved jobs from localStorage or fallback to initial data
  const [jobs, setJobs] = useState<JobItem[]>(() => {
    try {
      const saved = localStorage.getItem('field_jobs_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage jobs:', e);
    }
    return INITIAL_JOBS;
  });

  // Load saved settings from localStorage
  const [settings, setSettings] = useState<SyncSettings>(() => {
    const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZGiyeLCwTUxLFG0NTrU2GFhz2kvmyS1BQaYqHil-jDpcnNwPtu1U8LPZtGmJypEHZ/exec';
    try {
      const saved = localStorage.getItem('field_tracker_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.googleSheetUrl || parsed.googleSheetUrl.includes('docs.google.com/spreadsheets/d/1Example')) {
          parsed.googleSheetUrl = DEFAULT_APPS_SCRIPT_URL;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse localStorage settings:', e);
    }
    return INITIAL_SETTINGS;
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'jobs' | 'dashboard' | 'map' | 'line_flex'>('jobs');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [viewingJob, setViewingJob] = useState<JobItem | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [linePreviewJob, setLinePreviewJob] = useState<JobItem | null>(null);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Save to localStorage whenever jobs change
  useEffect(() => {
    try {
      localStorage.setItem('field_jobs_data', JSON.stringify(jobs));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [jobs]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('field_tracker_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save settings failed:', e);
    }
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add or Update Job & Auto Sync to Google Sheets
  const handleSaveJob = async (savedJob: JobItem) => {
    const isEdit = jobs.some((j) => j.id === savedJob.id);

    if (isEdit) {
      setJobs((prev) => prev.map((j) => (j.id === savedJob.id ? savedJob : j)));
      showToast(`อัพเดทงาน "${savedJob.title}" เรียบร้อยแล้ว`, 'success');
    } else {
      setJobs((prev) => [savedJob, ...prev]);
      showToast(`บันทึกงานใหม่ "${savedJob.title}" สำเร็จ!`, 'success');
    }
    setEditingJob(null);

    // Auto sync to Google Sheets if Web App URL is configured
    if (settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http')) {
      try {
        await saveJobToGoogleSheets(settings.googleSheetUrl, savedJob);
      } catch (err) {
        console.warn('Auto sync to sheets failed:', err);
      }
    }
  };

  // Delete Job
  const handleDeleteJob = (id: string) => {
    const target = jobs.find((j) => j.id === id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    showToast(`ลบงาน "${target?.title || id}" เรียบร้อย`, 'info');
  };

  // Quick status change & sync
  const handleQuickStatusChange = async (id: string, newStatus: JobStatus) => {
    let updatedTarget: JobItem | null = null;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const updated = {
            ...j,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            syncStatus: 'synced' as const,
          };
          updatedTarget = updated;
          return updated;
        }
        return j;
      })
    );
    showToast('เปลี่ยนสถานะงานเรียบร้อยแล้ว', 'success');

    if (updatedTarget && settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http')) {
      try {
        await saveJobToGoogleSheets(settings.googleSheetUrl, updatedTarget);
      } catch (err) {
        console.warn('Quick status sync failed:', err);
      }
    }
  };

  // Quick fetch all from Google Sheets
  const handleQuickFetchFromSheets = async () => {
    if (!settings.googleSheetUrl || !settings.googleSheetUrl.startsWith('http')) {
      setIsSheetsModalOpen(true);
      return;
    }

    setIsQuickSyncing(true);
    const result = await fetchJobsFromGoogleSheets(settings.googleSheetUrl);
    setIsQuickSyncing(false);

    if (result.success && result.data && result.data.length > 0) {
      setJobs(result.data);
      showToast(`ดึงข้อมูลจาก Google Sheets สำเร็จ (${result.data.length} งาน)`, 'success');
    } else {
      showToast(result.message || 'ไม่สามารถดึงข้อมูลได้', 'error');
    }
  };

  // Open LINE Flex Preview
  const handleOpenLineFlex = (job: JobItem) => {
    setLinePreviewJob(job);
    setActiveTab('line_flex');
  };

  // Export CSV
  const handleExportCsv = () => {
    downloadCsvFile(jobs, `field_jobs_${new Date().toISOString().substring(0, 10)}.csv`);
    showToast('ดาวน์โหลดไฟล์ CSV สำหรับ Google Sheets สำเร็จ!', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewJob={() => {
          setEditingJob(null);
          setIsFormModalOpen(true);
        }}
        onOpenSheetsSettings={() => setIsSheetsModalOpen(true)}
        jobs={jobs}
        settings={settings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Quick Sync Banner if Google Sheets URL is set */}
        {settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http') && (
          <div className="bg-emerald-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium">
                เชื่อมต่อฐานข้อมูล Google Sheets เรียบร้อยแล้ว (ระบบบันทึกและซิงค์ข้อมูลอัตโนมัติ)
              </span>
            </div>
            <button
              onClick={handleQuickFetchFromSheets}
              disabled={isQuickSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isQuickSyncing ? 'animate-spin' : ''}`} />
              <span>{isQuickSyncing ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุดจาก Sheet'}</span>
            </button>
          </div>
        )}

        {/* Tab 1: Job List */}
        {activeTab === 'jobs' && (
          <JobListView
            jobs={jobs}
            onAddNew={() => {
              setEditingJob(null);
              setIsFormModalOpen(true);
            }}
            onEdit={(job) => {
              setEditingJob(job);
              setIsFormModalOpen(true);
            }}
            onDelete={handleDeleteJob}
            onViewDetails={(job) => setViewingJob(job)}
            onQuickStatusChange={handleQuickStatusChange}
            onSendLinePreview={handleOpenLineFlex}
            onExportCsv={handleExportCsv}
          />
        )}

        {/* Tab 2: Monthly Dashboard */}
        {activeTab === 'dashboard' && <MonthlyDashboard jobs={jobs} />}

        {/* Tab 3: Interactive Map */}
        {activeTab === 'map' && (
          <MapView
            jobs={jobs}
            onViewJobDetails={(job) => setViewingJob(job)}
          />
        )}

        {/* Tab 4: LINE Flex Simulator */}
        {activeTab === 'line_flex' && (
          <LineFlexSimulator
            job={linePreviewJob}
            allJobs={jobs}
            settings={settings}
            onSelectJob={(j) => setLinePreviewJob(j)}
          />
        )}
      </main>

      {/* Responsive Design Status Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.companyName}</span>
            <span>•</span>
            <span>ระบบติดตามงานและอัพเดทสถานะหน้างาน</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>Mobile Ready</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Tablet className="w-3.5 h-3.5 text-sky-600" />
              <span>Tablet Responsive</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-sky-600" />
              <span>Desktop Optimized</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[2000] flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 text-xs sm:text-sm animate-bounce">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Job Form Modal (Create / Edit) */}
      <JobFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
        editingJob={editingJob}
        settings={settings}
      />

      {/* Job Detail Modal */}
      <JobDetailModal
        job={viewingJob}
        onClose={() => setViewingJob(null)}
        onEdit={(job) => {
          setViewingJob(null);
          setEditingJob(job);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteJob}
        onQuickStatusChange={handleQuickStatusChange}
        onSendLinePreview={handleOpenLineFlex}
      />

      {/* Google Sheets Settings Modal */}
      <SheetsAppSheetSettingsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        jobs={jobs}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('บันทึกการตั้งค่า Google Sheets เรียบร้อยแล้ว', 'success');
        }}
        onImportJobs={(importedJobs) => {
          setJobs(importedJobs);
        }}
      />
    </div>
  );
}
