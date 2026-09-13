import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Search,
  Filter,
  Trash2,
  Download,
  Calendar,
  User,
  Clock,
  Briefcase,
  Layers,
  ShoppingBag,
  Send,
  RefreshCw,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { getAuditLogs, clearAuditLogs } from '../utils/auditLogger';
import { formatThaiDate } from '../utils/formatters';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob?: (jobCode: string) => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, onSelectJob }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const loadLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    if (window.confirm('คุณต้องการล้างประวัติการทำงาน (Audit Logs) ทั้งหมดใช่หรือไม่?')) {
      clearAuditLogs();
      setLogs([]);
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['วันที่/เวลา', 'ผู้ทำรายการ', 'การกระทำ', 'รหัสงาน', 'ชื่องาน', 'รายละเอียด'];
    const rows = logs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString('th-TH')}"`,
      `"${l.userName || ''}"`,
      `"${l.actionLabel || l.action}"`,
      `"${l.jobCode || ''}"`,
      `"${(l.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      log.userName.toLowerCase().includes(query) ||
      (log.jobCode && log.jobCode.toLowerCase().includes(query)) ||
      (log.jobTitle && log.jobTitle.toLowerCase().includes(query)) ||
      log.details.toLowerCase().includes(query) ||
      log.actionLabel.toLowerCase().includes(query);

    return matchesAction && matchesQuery;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create_job':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'status_change':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600" />,
        };
      case 'add_work_round':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Layers className="w-3.5 h-3.5 text-purple-600" />,
        };
      case 'add_product':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'change_team':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <User className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case 'line_notify':
        return {
          bg: 'bg-green-50 text-green-700 border-green-200',
          icon: <Send className="w-3.5 h-3.5 text-green-600" />,
        };
      case 'delete_job':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <History className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">บันทึกประวัติการทำงาน (System Audit Logs)</h2>
              <p className="text-xs text-slate-300">
                ตรวจสอบประวัติ: ใครทำอะไร, เปลี่ยนสถานะ, เพิ่มสินค้า, เปลี่ยนทีมช่าง, หรือส่งแจ้งเตือน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              disabled={logs.length === 0}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
              title="ดาวน์โหลดเป็นไฟล์ CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ส่งออก CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อช่าง, รหัสงาน, ชื่องาน, หรือรายละเอียด..."
              className="w-full text-xs sm:text-sm pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">ทั้งหมด ({logs.length})</option>
              <option value="status_change">🔄 เปลี่ยนสถานะงาน</option>
              <option value="add_work_round">🏗️ เพิ่มรอบงาน & สินค้า</option>
              <option value="add_product">📦 เพิ่มสินค้า</option>
              <option value="create_job">➕ สร้างงานใหม่</option>
              <option value="update_job">✏️ แก้ไขข้อมูล</option>
              <option value="change_team">👷 เปลี่ยนทีมช่าง</option>
              <option value="line_notify">💬 ส่ง LINE Flex</option>
            </select>

            <button
              onClick={handleClearAll}
              disabled={logs.length === 0}
              className="text-xs px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors shrink-0 disabled:opacity-40"
              title="ล้าง Log ทั้งหมด"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              <span>ล้าง Log</span>
            </button>
          </div>
        </div>

        {/* Logs Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">ไม่พบประวัติการทำงานตามเงื่อนไขที่ค้นหา</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const logDate = new Date(log.timestamp);
              return (
                <div
                  key={log.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    {/* Header line: Action Badge + Job Code + User + Timestamp */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold text-[11px] ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{log.actionLabel}</span>
                      </span>

                      {log.jobCode && (
                        <span
                          onClick={() => {
                            if (onSelectJob && log.jobCode) {
                              onSelectJob(log.jobCode);
                              onClose();
                            }
                          }}
                          className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 cursor-pointer hover:underline"
                          title="คลิกเพื่อเปิดดูงานนี้"
                        >
                          {log.jobCode}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.userName || 'ผู้ใช้งาน'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 text-[11px] ml-auto">
                        <Clock className="w-3 h-3" />
                        <span>
                          {logDate.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          })}{' '}
                          {logDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      </div>
                    </div>

                    {/* Job Title if any */}
                    {log.jobTitle && (
                      <p className="font-semibold text-slate-800 line-clamp-1">{log.jobTitle}</p>
                    )}

                    {/* Details content */}
                    <p className="text-slate-600 leading-relaxed bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            แสดงทั้งหมด <strong>{filteredLogs.length}</strong> จาก {logs.length} รายการ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
