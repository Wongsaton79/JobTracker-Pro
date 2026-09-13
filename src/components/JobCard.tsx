import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Calendar,
  Clock,
  User,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Camera,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { JobItem, JobStatus } from '../types';
import {
  calculateJobFinancials,
  formatCurrency,
  formatThaiDate,
  getPaymentTypeConfig,
  getStatusConfig,
} from '../utils/formatters';

interface JobCardProps {
  job: JobItem;
  onEdit: (job: JobItem) => void;
  onDelete: (id: string) => void;
  onViewDetails: (job: JobItem) => void;
  onQuickStatusChange: (id: string, status: JobStatus) => void;
  onSendLinePreview: (job: JobItem) => void;
  onDirectSendLine?: (job: JobItem) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickStatusChange,
  onSendLinePreview,
  onDirectSendLine,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusCfg = getStatusConfig(job.status);
  const paymentCfg = getPaymentTypeConfig(job.paymentType);
  const mainPhoto = job.photos.length > 0 ? job.photos[0].url : null;
  const googleMapsUrl = `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`;

  const allStatuses: JobStatus[] = ['pending', 'in_progress', 'review', 'completed', 'issue'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Top Banner / Photo Header */}
      <div className="relative h-40 w-full bg-slate-100 overflow-hidden shrink-0">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <Camera className="w-8 h-8 mb-1 text-slate-300" />
            <span className="text-xs">ไม่มีภาพประกอบ</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs transition-all ${statusCfg.bgClass}`}
              title="คลิกเพื่อเปลี่ยนสถานะด่วน"
            >
              <span className={`w-2 h-2 rounded-full ${statusCfg.badgeBg}`} />
              <span>{statusCfg.label}</span>
              <span className="text-[10px] opacity-60">▼</span>
            </button>

            {/* Quick Status Dropdown */}
            {showStatusMenu && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-fade-in">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  เปลี่ยนสถานะงาน
                </div>
                {allStatuses.map((st) => {
                  const cfg = getStatusConfig(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        onQuickStatusChange(job.id, st);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        job.status === st ? 'font-bold text-sky-700 bg-sky-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.badgeBg}`} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Photo count badge */}
        {job.photos.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
            <Camera className="w-3 h-3" />
            <span>{job.photos.length} รูป</span>
          </div>
        )}

        {/* Job Code */}
        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded-md">
          {job.jobCode}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Job Title */}
          <h3
            onClick={() => onViewDetails(job)}
            className="text-base font-bold text-slate-800 line-clamp-2 hover:text-sky-600 cursor-pointer transition-colors"
          >
            {job.title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatThaiDate(job.date, 'short')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {job.time} น.
            </span>
          </div>

          {/* Contact Person & Phone */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate text-slate-700 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{job.contactPerson}</span>
            </div>
            <a
              href={`tel:${job.phoneNumber.replace(/[^0-9]/g, '')}`}
              className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-md shrink-0 transition-colors"
              title="โทรออก"
            >
              <Phone className="w-3 h-3" />
              <span>{job.phoneNumber}</span>
            </a>
          </div>

          {/* Product Brand & Details */}
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md text-[11px]">
              {job.productBrand}
            </span>
            {job.productDetails && (
              <span className="text-slate-600 truncate text-[11px]">{job.productDetails}</span>
            )}
          </div>

          {/* Location */}
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 truncate text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{job.location.address || 'ไม่ระบุชื่อสถานที่'}</span>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 text-[11px] font-medium flex items-center gap-0.5 ml-1 shrink-0"
              title="เปิด Google Maps"
            >
              <span>Map</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Commercial Section (Price & Payment) */}
        {(() => {
          const fin = calculateJobFinancials(job);
          return (
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">มูลค่างานรวม</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(fin.totalPrice)}
                  </span>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-bold ${fin.badgeClass}`}
                  >
                    {fin.statusLabel}
                  </span>
                </div>
              </div>

              {/* Per-Round Payment Detail Pill */}
              {(job.workRounds && job.workRounds.length > 0) && (
                <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                  <span className="text-slate-500">
                    รอบชำระแล้ว <strong className="text-emerald-700">{fin.paidCount}/{job.workRounds.length}</strong>
                  </span>
                  <span className="font-semibold text-slate-700">
                    ชำระ ฿{fin.totalPaid.toLocaleString()}
                    {fin.remaining > 0 ? (
                      <span className="text-amber-600 font-normal"> (ค้าง ฿{fin.remaining.toLocaleString()})</span>
                    ) : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Card Action Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1">
          {onDirectSendLine && (
            <button
              type="button"
              onClick={() => onDirectSendLine(job)}
              className="flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg font-bold transition-all shadow-2xs active:scale-95 border border-emerald-300"
              title="กดส่ง LINE Flex Message เข้ากลุ่มช่างทันที"
            >
              <Send className="w-3.5 h-3.5 text-emerald-700" />
              <span>ส่ง LINE</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSendLinePreview(job)}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="ดูตัวอย่างการ์ด Flex Message"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
            title="แก้ไขงาน"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`ต้องการลบงาน "${job.title}" หรือไม่?`)) {
                onDelete(job.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
            title="ลบงาน"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(job)}
            className="flex items-center gap-0.5 px-2.5 py-1 bg-slate-800 text-white hover:bg-slate-900 rounded-lg font-medium transition-colors"
          >
            <span>ดูงาน</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
