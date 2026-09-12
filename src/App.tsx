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
import {
  downloadCsvFile,
  saveJobToGoogleSheets,
  fetchJobsFromGoogleSheets,
  saveAndNotifyJob,
} from './utils/sheetsSync';
import { sortJobsLatestFirst } from './utils/formatters';
import { CheckCircle2, AlertCircle, Sparkles, Smartphone, Tablet, Monitor, RefreshCw, Radio } from 'lucide-react';

export default function App() {
  // Load saved jobs from localStorage or fallback to initial data
  const [jobs, setJobs] = useState<JobItem[]>(() => {
    try {
      const saved = localStorage.getItem('field_jobs_data');
      if (saved) {
        return sortJobsLatestFirst(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse localStorage jobs:', e);
    }
    return sortJobsLatestFirst(INITIAL_JOBS);
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
        if (!parsed.lineChannelAccessToken) {
          parsed.lineChannelAccessToken = INITIAL_SETTINGS.lineChannelAccessToken;
        }
        if (!parsed.lineTargetUserId) {
          parsed.lineTargetUserId = INITIAL_SETTINGS.lineTargetUserId;
        }
        if (!parsed.lineTargetGroupId) {
          parsed.lineTargetGroupId = INITIAL_SETTINGS.lineTargetGroupId;
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
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

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

  // 🔄 Automatic sync from Google Sheets (on mount + periodic + focus)
  const syncFromSheetsQuietly = async (isManual = false) => {
    if (!settings.googleSheetUrl || !settings.googleSheetUrl.startsWith('http')) return;
    if (isManual) setIsQuickSyncing(true);

    try {
      const result = await fetchJobsFromGoogleSheets(settings.googleSheetUrl);
      if (result.success && result.data && result.data.length > 0) {
        setJobs(sortJobsLatestFirst(result.data));
        setLastSyncedAt(new Date());
        if (isManual) {
          showToast(`ดึงข้อมูลจาก Google Sheets สำเร็จ (${result.data.length} งาน ล่าสุดขึ้นบน)`, 'success');
        }
      } else if (isManual) {
        showToast(result.message || 'ไม่สามารถดึงข้อมูลได้', 'error');
      }
    } catch (err: any) {
      if (isManual) {
        showToast(`เกิดข้อผิดพลาด: ${err.message || err}`, 'error');
      }
    } finally {
      if (isManual) setIsQuickSyncing(false);
    }
  };

  // Initial auto-fetch on mount & whenever URL changes
  useEffect(() => {
    if (settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http')) {
      syncFromSheetsQuietly(false);
    }
  }, [settings.googleSheetUrl]);

  // Background interval auto-sync every 25 seconds + tab focus trigger
  useEffect(() => {
    const interval = setInterval(() => {
      syncFromSheetsQuietly(false);
    }, 25000);

    const handleFocus = () => {
      syncFromSheetsQuietly(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncFromSheetsQuietly(false);
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [settings.googleSheetUrl]);

  // 1. ฟังก์ชันกดส่งเอง (Direct Manual Send LINE Flex Message เข้า Group)
  const handleDirectSendLineFlex = async (job: JobItem, customHeader?: string) => {
    showToast(`กำลังส่ง LINE Flex สำหรับ "${job.title}" เข้ากลุ่ม...`, 'info');
    try {
      const result = await saveAndNotifyJob(settings.googleSheetUrl || '', job, 'manual_send', {
        targetId: settings.lineTargetGroupId || settings.lineTargetUserId,
        channelAccessToken: settings.lineChannelAccessToken,
        companyName: settings.companyName,
        customEventLabel: customHeader || '📋 รายงานข้อมูลงานหน้างาน',
        sendLine: true,
      });
      if (result.success) {
        showToast(`💬 ส่ง LINE Flex เข้ากลุ่มเรียบร้อยแล้ว (${job.jobCode})`, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast(`ส่งไม่สำเร็จ: ${err.message || err}`, 'error');
    }
  };

  // 2. เมื่อมีการบันทึกงานใหม่ (Create New Job) หรือแก้ไขข้อมูลงาน (Edit Job)
  // บันทึกลง Google Sheet ทันที + ส่ง LINE Flex แจ้งเตือนเข้ากลุ่ม
  const handleSaveJob = async (savedJob: JobItem) => {
    const isEdit = jobs.some((j) => j.id === savedJob.id);

    if (isEdit) {
      setJobs((prev) => sortJobsLatestFirst(prev.map((j) => (j.id === savedJob.id ? savedJob : j))));
      showToast(`อัพเดทงาน "${savedJob.title}" เรียบร้อย`, 'success');
    } else {
      setJobs((prev) => sortJobsLatestFirst([savedJob, ...prev]));
      showToast(`🆕 บันทึกงานใหม่ "${savedJob.title}" สำเร็จ! ส่งแจ้งเตือน LINE แล้ว`, 'success');
    }
    setEditingJob(null);

    // Auto sync to Google Sheets & auto push LINE Flex message
    try {
      await saveAndNotifyJob(
        settings.googleSheetUrl || '',
        savedJob,
        isEdit ? 'edit_job' : 'new_job',
        {
          targetId: settings.lineTargetGroupId || settings.lineTargetUserId,
          channelAccessToken: settings.lineChannelAccessToken,
          companyName: settings.companyName,
          sendLine: true,
        }
      );
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Auto sync & notify failed:', err);
    }
  };

  // 3. เมื่ออัพเดตสถานะของงาน (Quick Status Change)
  // บันทึกสถานะใหม่ลง Google Sheet ทันที + ส่ง LINE Flex แจ้งเตือนเข้ากลุ่ม
  const handleQuickStatusChange = async (id: string, newStatus: JobStatus) => {
    let updatedTarget: JobItem | null = null;
    setJobs((prev) => {
      const updatedList = prev.map((j) => {
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
      });
      return sortJobsLatestFirst(updatedList);
    });

    // Update viewing modal state if currently open
    if (viewingJob && viewingJob.id === id) {
      setViewingJob((prev) => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null));
    }

    showToast('⚡ อัพเดทสถานะลง Sheet และส่ง LINE แจ้งเตือนแล้ว', 'success');

    if (updatedTarget) {
      try {
        await saveAndNotifyJob(
          settings.googleSheetUrl || '',
          updatedTarget,
          'status_update',
          {
            targetId: settings.lineTargetGroupId || settings.lineTargetUserId,
            channelAccessToken: settings.lineChannelAccessToken,
            companyName: settings.companyName,
            sendLine: true,
          }
        );
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Quick status sync failed:', err);
      }
    }
  };

  // Delete Job
  const handleDeleteJob = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    const updatedJobs = jobs.filter((j) => j.id !== id);
    setJobs(updatedJobs);
    showToast(`ลบงาน "${target?.title || id}" เรียบร้อย`, 'info');

    if (settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http')) {
      try {
        await saveJobToGoogleSheets(settings.googleSheetUrl, updatedJobs);
        setLastSyncedAt(new Date());
      } catch (err) {
        console.warn('Delete sync to sheets failed:', err);
      }
    }
  };

  // Quick fetch all from Google Sheets (Manual Trigger)
  const handleQuickFetchFromSheets = () => {
    if (!settings.googleSheetUrl || !settings.googleSheetUrl.startsWith('http')) {
      setIsSheetsModalOpen(true);
      return;
    }
    syncFromSheetsQuietly(true);
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
        {/* Real-time Auto-Sync Status Bar */}
        {settings.googleSheetUrl && settings.googleSheetUrl.startsWith('http') && (
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-emerald-400">ระบบดึงและซิงค์ Google Sheets อัตโนมัติ (เรียงงานล่าสุดขึ้นบน)</span>
                {lastSyncedAt && (
                  <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                    ซิงค์ล่าสุด: {lastSyncedAt.toLocaleTimeString('th-TH')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickFetchFromSheets}
                disabled={isQuickSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg font-medium transition-all cursor-pointer border border-slate-700"
                title="คลิกเพื่อรีเฟรชข้อมูลทันที"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isQuickSyncing ? 'animate-spin' : ''}`} />
                <span>{isQuickSyncing ? 'กำลังดึงข้อมูล...' : 'รีเฟรชข้อมูล'}</span>
              </button>
            </div>
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
            onDirectSendLine={handleDirectSendLineFlex}
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
        onDirectSendLine={handleDirectSendLineFlex}
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
