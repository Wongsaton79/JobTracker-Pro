import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobListView } from './components/JobListView';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { MapView } from './components/MapView';
import { LineFlexSimulator } from './components/LineFlexSimulator';
import { JobFormModal } from './components/JobFormModal';
import { JobDetailModal } from './components/JobDetailModal';
import { FirebaseSettingsModal } from './components/FirebaseSettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { INITIAL_JOBS, INITIAL_SETTINGS } from './data/initialData';
import { JobItem, JobStatus, SyncSettings, SalesEvaluation } from './types';
import { SalesEvaluationView } from './components/SalesEvaluation/SalesEvaluationView';
import { INITIAL_EVALUATIONS } from './data/initialEvaluations';
import {
  subscribeToFirebaseJobs,
  saveJobToFirebase,
  deleteJobFromFirebase,
  fetchJobsFromFirebaseOnce,
} from './utils/firebaseSync';
import { sendLineFlexDirect } from './utils/lineFlexSender';
import { exportJobsToExcel } from './utils/excelExport';
import { sortJobsLatestFirst, getStatusConfig } from './utils/formatters';
import { addAuditLog } from './utils/auditLogger';
import {
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  Flame,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

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

  // Load saved evaluations from localStorage or fallback to initial evaluations
  const [evaluations, setEvaluations] = useState<SalesEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem('sales_satisfaction_evaluations');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage evaluations:', e);
    }
    return INITIAL_EVALUATIONS;
  });

  // Load saved settings from localStorage
  const [settings, setSettings] = useState<SyncSettings>(() => {
    try {
      const saved = localStorage.getItem('field_tracker_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
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
  const [activeTab, setActiveTab] = useState<'jobs' | 'dashboard' | 'map' | 'line_flex' | 'sales_evaluation'>('jobs');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [viewingJob, setViewingJob] = useState<JobItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [linePreviewJob, setLinePreviewJob] = useState<JobItem | null>(null);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

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

  // Save evaluations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sales_satisfaction_evaluations', JSON.stringify(evaluations));
    } catch (e) {
      console.warn('LocalStorage save evaluations failed:', e);
    }
  }, [evaluations]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Evaluation state handlers
  const handleSaveEvaluation = (savedEvaluation: SalesEvaluation) => {
    setEvaluations((prev) => {
      const index = prev.findIndex((e) => e.id === savedEvaluation.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedEvaluation;
        return updated;
      }
      return [savedEvaluation, ...prev];
    });
  };

  const handleDeleteEvaluation = (id: string) => {
    if (confirm('คุณต้องการลบแบบประเมินนี้ใช่หรือไม่?')) {
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      showToast('ลบแบบประเมินเรียบร้อยแล้ว', 'info');
      addAuditLog({
        userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
        action: 'sales_evaluation',
        actionLabel: 'ลบแบบประเมินทีมขาย',
        details: `ลบรายการแบบประเมินรหัส ${id}`,
      });
    }
  };

  // 🔥 Firebase Real-time Listener: Live Sync across all devices
  useEffect(() => {
    console.log('Connecting to Firebase Firestore Realtime Sync...');
    const unsubscribe = subscribeToFirebaseJobs((firebaseJobs) => {
      if (firebaseJobs && firebaseJobs.length > 0) {
        setJobs(sortJobsLatestFirst(firebaseJobs));
        setLastSyncedAt(new Date());
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 🔗 Auto-open Job Detail if jobId is in URL query parameters (e.g. from LINE button click)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlJobId = urlParams.get('jobId') || urlParams.get('job');
      if (urlJobId && jobs.length > 0) {
        const found = jobs.find((j) => j.id === urlJobId || j.jobCode === urlJobId);
        if (found) {
          setViewingJob(found);
        }
      }
    }
  }, [jobs]);

  // 🔄 Manual / Quick Fetch from Firebase
  const handleQuickFetchFromFirebase = async () => {
    setIsQuickSyncing(true);
    try {
      const fbJobs = await fetchJobsFromFirebaseOnce();
      if (fbJobs && fbJobs.length > 0) {
        setJobs(sortJobsLatestFirst(fbJobs));
        setLastSyncedAt(new Date());
        showToast(`⚡ ซิงค์ข้อมูลล่าสุดจาก Firebase Firestore เรียบร้อย (${fbJobs.length} งาน)`, 'success');
      } else {
        showToast('เชื่อมต่อ Firebase สำเร็จ (ยังไม่มีรายการงานใหม่)', 'info');
      }
    } catch (err: any) {
      showToast(`เกิดข้อผิดพลาด: ${err.message || err}`, 'error');
    } finally {
      setIsQuickSyncing(false);
    }
  };

  // 1. ฟังก์ชันกดส่งเอง (Direct Manual Send LINE Flex Message เข้า Group)
  const handleDirectSendLineFlex = async (job: JobItem, customHeader?: string) => {
    showToast(`กำลังส่ง LINE Flex สำหรับ "${job.title}" เข้ากลุ่ม...`, 'info');
    try {
      const targetId = settings.lineTargetGroupId || settings.lineTargetUserId || INITIAL_SETTINGS.lineTargetGroupId;
      const result = await sendLineFlexDirect(job, {
        targetId,
        channelAccessToken: settings.lineChannelAccessToken || INITIAL_SETTINGS.lineChannelAccessToken,
        companyName: settings.companyName || INITIAL_SETTINGS.companyName,
        relayUrl: settings.lineRelayUrl,
        eventLabel: customHeader || '📋 รายงานข้อมูลงานหน้างาน',
      });

      if (result.success) {
        if (result.job) {
          setJobs((prev) => sortJobsLatestFirst(prev.map((j) => (j.id === result.job!.id ? result.job! : j))));
        }
        showToast(`💬 ส่ง LINE Flex เข้ากลุ่มเรียบร้อยแล้ว (${job.jobCode})`, 'success');
        addAuditLog({
          userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
          action: 'line_notify',
          actionLabel: 'ส่ง LINE Flex',
          jobCode: job.jobCode,
          jobTitle: job.title,
          jobId: job.id,
          details: `ส่งการ์ด Flex Message เข้ากลุ่ม LINE (${targetId})`,
        });
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast(`ส่งไม่สำเร็จ: ${err.message || err}`, 'error');
    }
  };

  // 2. เมื่อมีการบันทึกงานใหม่ (Create New Job) หรือแก้ไขข้อมูลงาน (Edit Job)
  const handleSaveJob = async (savedJob: JobItem) => {
    const isEdit = jobs.some((j) => j.id === savedJob.id);

    if (isEdit) {
      setJobs((prev) => sortJobsLatestFirst(prev.map((j) => (j.id === savedJob.id ? savedJob : j))));
      showToast(`กำลังบันทึกและส่งข้อมูลงาน "${savedJob.title}"...`, 'info');
    } else {
      setJobs((prev) => sortJobsLatestFirst([savedJob, ...prev]));
      showToast(`กำลังบันทึกงานใหม่ "${savedJob.title}" และส่ง LINE...`, 'info');
    }
    setEditingJob(null);

    // 1. บันทึกลง Firebase Firestore ทันที (Real-time Database)
    try {
      await saveJobToFirebase(savedJob);
      setLastSyncedAt(new Date());
    } catch (fbErr) {
      console.warn('Firebase save failed:', fbErr);
    }

    // 2. Direct push LINE Flex message เข้ากลุ่ม
    try {
      const targetId = settings.lineTargetGroupId || settings.lineTargetUserId || INITIAL_SETTINGS.lineTargetGroupId;
      const result = await sendLineFlexDirect(savedJob, {
        targetId,
        channelAccessToken: settings.lineChannelAccessToken || INITIAL_SETTINGS.lineChannelAccessToken,
        companyName: settings.companyName || INITIAL_SETTINGS.companyName,
        relayUrl: settings.lineRelayUrl,
        eventLabel: isEdit ? '✏️ อัพเดทข้อมูลงาน' : '🆕 แจ้งเตือนงานใหม่',
      });

      if (result.job) {
        setJobs((prev) => sortJobsLatestFirst(prev.map((j) => (j.id === result.job!.id ? result.job! : j))));
      }
      setLastSyncedAt(new Date());
      showToast(
        result.message ||
          (isEdit
            ? `✏️ บันทึกลง Firebase Firestore & ส่งแจ้งเตือน LINE เรียบร้อย`
            : `🆕 บันทึกงานใหม่ลง Firebase & ส่ง LINE เรียบร้อย!`),
        result.success ? 'success' : 'info'
      );
    } catch (err) {
      console.warn('LINE notify failed:', err);
    }
  };

  // 3. เมื่ออัพเดตสถานะของงาน (Quick Status Change)
  const handleQuickStatusChange = async (id: string, newStatus: JobStatus) => {
    let updatedTarget: JobItem | null = null;
    let oldStatus: JobStatus | undefined;

    setJobs((prev) => {
      const updatedList = prev.map((j) => {
        if (j.id === id) {
          oldStatus = j.status;
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

    if (updatedTarget) {
      const tgt = updatedTarget as JobItem;
      // 📜 Audit Log
      addAuditLog({
        userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
        action: 'status_change',
        actionLabel: 'เปลี่ยนสถานะด่วน',
        jobCode: tgt.jobCode,
        jobTitle: tgt.title,
        jobId: tgt.id,
        details: `เปลี่ยนสถานะเป็น "${getStatusConfig(newStatus).label}"`,
        statusBefore: oldStatus,
        statusAfter: newStatus,
      });

      // 1. บันทึกลง Firebase Firestore
      try {
        await saveJobToFirebase(tgt);
        setLastSyncedAt(new Date());
      } catch (fbErr) {
        console.warn('Firebase status update failed:', fbErr);
      }

      // 2. ส่งแจ้งเตือน LINE
      try {
        const targetId = settings.lineTargetGroupId || settings.lineTargetUserId || INITIAL_SETTINGS.lineTargetGroupId;
        const lineRes = await sendLineFlexDirect(tgt, {
          targetId,
          channelAccessToken: settings.lineChannelAccessToken || INITIAL_SETTINGS.lineChannelAccessToken,
          companyName: settings.companyName || INITIAL_SETTINGS.companyName,
          relayUrl: settings.lineRelayUrl,
          eventLabel: '🔄 อัพเดทสถานะงาน',
        });
        setLastSyncedAt(new Date());
        showToast(
          lineRes.message || '⚡ อัพเดทสถานะลง Firebase และส่ง LINE แจ้งเตือนแล้ว',
          lineRes.success ? 'success' : 'info'
        );
      } catch (err) {
        console.warn('Quick status LINE send failed:', err);
        showToast('⚡ อัพเดทสถานะลง Firebase เรียบร้อยแล้ว', 'success');
      }
    }
  };

  // Delete Job
  const handleDeleteJob = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    const updatedJobs = jobs.filter((j) => j.id !== id);
    setJobs(updatedJobs);
    showToast(`ลบงาน "${target?.title || id}" เรียบร้อย`, 'info');

    if (target) {
      addAuditLog({
        userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
        action: 'delete_job',
        actionLabel: 'ลบงาน',
        jobCode: target.jobCode,
        jobTitle: target.title,
        jobId: target.id,
        details: `ลบข้อมูลงานออกจากระบบ (ยอดเงิน ฿${target.price.toLocaleString()})`,
        statusBefore: target.status,
      });
    }

    // ลบจาก Firebase Firestore
    try {
      await deleteJobFromFirebase(id);
      setLastSyncedAt(new Date());
    } catch (fbErr) {
      console.warn('Firebase delete failed:', fbErr);
    }
  };

  // Open LINE Flex Preview
  const handleOpenLineFlex = (job: JobItem) => {
    setLinePreviewJob(job);
    setActiveTab('line_flex');
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    exportJobsToExcel(jobs, `JobTracker_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
    showToast('ดาวน์โหลดไฟล์ Excel (.xlsx) พร้อมรายงานสรุปสำเร็จ!', 'success');
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      'รหัสงาน,ชื่องาน,ผู้ติดต่อ,เบอร์ติดต่อ,วันที่,เวลา,สถานะ,แบรนด์,สินค้า,ราคา,การชำระเงิน,ที่อยู่,ละติจูด,ลองจิจูด,หมายเหตุ\n' +
      jobs
        .map((j) =>
          [
            `"${j.jobCode}"`,
            `"${j.title}"`,
            `"${j.contactPerson}"`,
            `"${j.phoneNumber}"`,
            `"${j.date}"`,
            `"${j.time}"`,
            `"${j.status}"`,
            `"${j.productBrand}"`,
            `"${j.productDetails}"`,
            j.price,
            `"${j.paymentType}"`,
            `"${(j.location.address || '').replace(/"/g, '""')}"`,
            j.location.lat,
            j.location.lng,
            `"${(j.notes || '').replace(/"/g, '""')}"`,
          ].join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `field_jobs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ดาวน์โหลดไฟล์ CSV สำเร็จ!', 'success');
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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        jobs={jobs}
        settings={settings}
        evaluationsCount={evaluations.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {/* Real-time Cloud DB & Auto-Sync Status Bar */}
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Firebase Cloud Firestore Real-time DB</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-300 font-medium">เชื่อมต่อสด ทุกเครื่องเห็นข้อมูลตรงกันทันที</span>
              {lastSyncedAt && (
                <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                  อัพเดท: {lastSyncedAt.toLocaleTimeString('th-TH')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick prominent button to open Sales Evaluation */}
            <button
              onClick={() => setActiveTab('sales_evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 border cursor-pointer text-xs ${
                activeTab === 'sales_evaluation'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 ring-2 ring-emerald-400/30'
                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-600/50'
              }`}
              title="เปิดแบบประเมินความพึงพอใจ การทำงานของทีมขาย"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>⭐ แบบประเมินทีมขาย ({evaluations.length})</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all active:scale-95 border border-emerald-600/50 cursor-pointer shadow-xs"
              title="ส่งออกรายงาน Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={handleQuickFetchFromFirebase}
              disabled={isQuickSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg font-medium transition-all cursor-pointer border border-slate-700"
              title="คลิกเพื่อรีเฟรชข้อมูลจาก Firebase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isQuickSyncing ? 'animate-spin' : ''}`} />
              <span>{isQuickSyncing ? 'กำลังดึงข้อมูล...' : 'รีเฟรช'}</span>
            </button>
          </div>
        </div>

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
            onExportExcel={handleExportExcel}
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

        {/* Tab 5: Sales Satisfaction Evaluation (⭐ เมนูเห็นชัด: แบบประเมินความพึงพอใจ การทำงานของทีมขาย) */}
        {activeTab === 'sales_evaluation' && (
          <SalesEvaluationView
            evaluations={evaluations}
            jobs={jobs}
            settings={settings}
            onSaveEvaluation={handleSaveEvaluation}
            onDeleteEvaluation={handleDeleteEvaluation}
            showToast={showToast}
          />
        )}
      </main>

      {/* Responsive Design Status Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.companyName}</span>
            <span>•</span>
            <span>ระบบติดตามงานและอัพเดทสถานะหน้างาน (Firebase Cloud & LINE Flex)</span>
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
        onOpenEvaluation={(job) => {
          setActiveTab('sales_evaluation');
          showToast(`เปิดแบบประเมินทีมขายสำหรับงาน "${job.title}"`, 'info');
        }}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Firebase & LINE Settings Modal */}
      <FirebaseSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        jobs={jobs}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('บันทึกการตั้งค่า Firebase & LINE เรียบร้อยแล้ว', 'success');
        }}
        onRefreshJobs={(refreshedJobs) => {
          setJobs(refreshedJobs);
        }}
      />
    </div>
  );
}
