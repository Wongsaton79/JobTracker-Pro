import React, { useState } from 'react';
import { JobItem, SalesEvaluation, SyncSettings } from '../../types';
import { EvaluationListView } from './EvaluationListView';
import { EvaluationForm } from './EvaluationForm';
import { EvaluationAnalytics } from './EvaluationAnalytics';
import { EvaluationPrintModal } from './EvaluationPrintModal';
import { exportEvaluationsToExcel } from '../../utils/evaluationExcelExport';
import { sendEvaluationToLine } from '../../utils/evaluationLineNotify';
import { addAuditLog } from '../../utils/auditLogger';
import {
  Award,
  ListOrdered,
  PlusCircle,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
} from 'lucide-react';

interface SalesEvaluationViewProps {
  evaluations: SalesEvaluation[];
  jobs: JobItem[];
  settings: SyncSettings;
  onSaveEvaluation: (evaluation: SalesEvaluation) => void;
  onDeleteEvaluation: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const SalesEvaluationView: React.FC<SalesEvaluationViewProps> = ({
  evaluations,
  jobs,
  settings,
  onSaveEvaluation,
  onDeleteEvaluation,
  showToast,
}) => {
  const [subTab, setSubTab] = useState<'list' | 'form' | 'analytics'>('list');
  const [editingEvaluation, setEditingEvaluation] = useState<SalesEvaluation | null>(null);
  const [printingEvaluation, setPrintingEvaluation] = useState<SalesEvaluation | null>(null);

  // Handle Save from Form
  const handleSave = async (evaluation: SalesEvaluation, sendLine: boolean) => {
    onSaveEvaluation(evaluation);
    showToast(`✅ บันทึกแบบประเมิน "${evaluation.customerName}" เรียบร้อยแล้ว`, 'success');

    addAuditLog({
      userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
      action: 'sales_evaluation',
      actionLabel: 'บันทึกแบบประเมินทีมขาย',
      jobCode: evaluation.jobCode,
      jobTitle: evaluation.projectName || evaluation.customerName,
      details: `บันทึกแบบประเมินทีมขาย "${evaluation.salesRepName}" คะแนนเต็ม 20 ได้ ${evaluation.scoreOutOf20}/20 คะแนน (${evaluation.percentageScore}%)`,
    });

    if (sendLine) {
      showToast('กำลังส่งผลประเมินเข้ากลุ่ม LINE...', 'info');
      const lineRes = await sendEvaluationToLine(evaluation, settings);
      if (lineRes.success) {
        showToast(lineRes.message, 'success');
      } else {
        showToast(lineRes.message, 'error');
      }
    }

    setEditingEvaluation(null);
    setSubTab('list');
  };

  // Handle Direct Send LINE from list
  const handleDirectSendLine = async (evaluation: SalesEvaluation) => {
    showToast(`กำลังส่งผลประเมินรหัส ${evaluation.evaluationCode} เข้ากลุ่ม LINE...`, 'info');
    const lineRes = await sendEvaluationToLine(evaluation, settings);
    if (lineRes.success) {
      showToast(lineRes.message, 'success');
      addAuditLog({
        userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
        action: 'line_notify',
        actionLabel: 'ส่งผลประเมินเข้า LINE',
        jobCode: evaluation.jobCode,
        jobTitle: evaluation.projectName || evaluation.customerName,
        details: `ส่งสรุปคะแนนประเมินทีมขาย "${evaluation.salesRepName}" (${evaluation.scoreOutOf20}/20 คะแนน) เข้า LINE Group`,
      });
    } else {
      showToast(lineRes.message, 'error');
    }
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    const success = exportEvaluationsToExcel(evaluations, settings.companyName);
    if (success) {
      showToast('📊 ส่งออกข้อมูลแบบประเมินเป็นไฟล์ Excel เรียบร้อยแล้ว', 'success');
      addAuditLog({
        userName: settings.currentUser || 'เจ้าหน้าที่ระบบ',
        action: 'export_excel',
        actionLabel: 'ส่งออก Excel แบบประเมินทีมขาย',
        details: `ส่งออกข้อมูลแบบประเมินทีมขายจำนวน ${evaluations.length} รายการ`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Prominent Header Bar for Sales Evaluation */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <Award className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  แบบประเมินความพึงพอใจ การทำงานของทีมขาย
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Paperless Digital</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
                ระบบประเมินความพึงพอใจทีมขายออนไลน์ ลดการใช้กระดาษ วิเคราะห์ราคาสินค้าเทียบกับคู่แข่งในตลาด (ไทวัสดุ / โกลบอลเฮ้าส์) และส่งแจ้งเตือนเข้า LINE ทันที
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/20 self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              onClick={() => {
                setEditingEvaluation(null);
                setSubTab('list');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'list'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>รายการแบบประเมิน ({evaluations.length})</span>
            </button>

            <button
              onClick={() => {
                setEditingEvaluation(null);
                setSubTab('form');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'form'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>ทำแบบประเมิน</span>
            </button>

            <button
              onClick={() => setSubTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'analytics'
                  ? 'bg-white text-emerald-900 shadow-md scale-102'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>สถิติ & กราฟ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {subTab === 'list' && (
        <EvaluationListView
          evaluations={evaluations}
          onAddNew={() => {
            setEditingEvaluation(null);
            setSubTab('form');
          }}
          onEdit={(ev) => {
            setEditingEvaluation(ev);
            setSubTab('form');
          }}
          onDelete={onDeleteEvaluation}
          onPrint={(ev) => setPrintingEvaluation(ev)}
          onSendLine={handleDirectSendLine}
          onExportExcel={handleExportExcel}
          onViewStats={() => setSubTab('analytics')}
        />
      )}

      {subTab === 'form' && (
        <EvaluationForm
          jobs={jobs}
          initialEvaluation={editingEvaluation}
          onSave={handleSave}
          onCancel={() => {
            setEditingEvaluation(null);
            setSubTab('list');
          }}
        />
      )}

      {subTab === 'analytics' && (
        <EvaluationAnalytics
          evaluations={evaluations}
          onBackToList={() => setSubTab('list')}
          onExportExcel={handleExportExcel}
        />
      )}

      {/* Official Printable / PDF Modal */}
      <EvaluationPrintModal
        evaluation={printingEvaluation}
        companyName={settings.companyName || 'JobTracker Pro'}
        onClose={() => setPrintingEvaluation(null)}
      />
    </div>
  );
};
