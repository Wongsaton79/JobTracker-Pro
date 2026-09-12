import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Printer,
  Send,
  Camera,
  Share2,
  Navigation,
} from 'lucide-react';
import { JobItem, JobPhoto, JobStatus } from '../types';
import { formatCurrency, formatThaiDate, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';

interface JobDetailModalProps {
  job: JobItem | null;
  onClose: () => void;
  onEdit: (job: JobItem) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (id: string, status: JobStatus) => void;
  onSendLinePreview: (job: JobItem) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onEdit,
  onDelete,
  onQuickStatusChange,
  onSendLinePreview,
}) => {
  if (!job) return null;

  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const statusCfg = getStatusConfig(job.status);
  const paymentCfg = getPaymentTypeConfig(job.paymentType);
  const googleMapsUrl = `https://www.google.com/maps?q=${job.location.lat},${job.location.lng}`;

  const allStatuses: JobStatus[] = ['pending', 'in_progress', 'review', 'completed', 'issue'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-sky-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                {job.jobCode}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusCfg.bgClass}`}>
                {statusCfg.label}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold mt-1 line-clamp-1">{job.title}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="พิมพ์ใบงาน"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm">
          {/* Status Quick Changer Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">อัพเดทสถานะงานแบบด่วน:</span>
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((st) => {
                const cfg = getStatusConfig(st);
                const isActive = job.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => onQuickStatusChange(job.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? `${cfg.bgClass} font-bold shadow-xs ring-1 ring-offset-1`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.badgeBg}`} />
                    <span>{cfg.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer & Date */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ข้อมูลผู้ติดต่อ & วันที่
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">{job.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-600" />
                  <a
                    href={`tel:${job.phoneNumber.replace(/[^0-9]/g, '')}`}
                    className="font-bold text-sky-600 hover:underline"
                  >
                    {job.phoneNumber}
                  </a>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-medium">
                    กดเพื่อโทร
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatThaiDate(job.date, 'full')}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
                  <span>{job.time} น.</span>
                </div>
                {job.assignedTo && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    👷 ช่างผู้รับผิดชอบ: <strong className="text-slate-800">{job.assignedTo}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Commercial & Pricing */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                สินค้า ราคา & เงื่อนไขชำระเงิน
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">แบรนด์สินค้า:</span>
                  <span className="font-bold text-slate-800">{job.productBrand}</span>
                </div>
                {job.productDetails && (
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500">รายละเอียด:</span>
                    <span className="font-medium text-right max-w-[180px]">{job.productDetails}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">ราคางาน:</span>
                  <span className="text-base font-bold text-emerald-600">{formatCurrency(job.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">การชำระเงิน:</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md border font-bold ${paymentCfg.badgeClass}`}>
                    {paymentCfg.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>พิกัดหน้างาน & สถานที่</span>
              </h4>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>เปิดนำทางใน Google Maps</span>
              </a>
            </div>
            <p className="text-xs font-medium text-slate-800">{job.location.address}</p>
            <div className="text-[11px] font-mono text-slate-500">
              พิกัด: {job.location.lat.toFixed(6)}, {job.location.lng.toFixed(6)}
            </div>
          </div>

          {/* Photos Gallery */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>ภาพประกอบหน้างาน ({job.photos.length} รูป)</span>
            </h4>

            {job.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {job.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs"
                  >
                    <img
                      src={photo.url}
                      alt="ภาพหน้างาน"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                      คลิกเพื่อดูขยาย
                    </div>
                    {photo.tag && (
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                        {photo.tag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400">
                ไม่มีรูปภาพประกอบสำหรับงานนี้
              </div>
            )}
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950">
              <h5 className="font-bold text-amber-900 mb-1">📝 หมายเหตุ / บันทึกเพิ่มเติม:</h5>
              <p className="whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onSendLinePreview(job)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>ดู LINE Flex Message</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(`ต้องการลบงาน "${job.title}" หรือไม่?`)) {
                  onDelete(job.id);
                  onClose();
                }
              }}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              <span>ลบงาน</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(job);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูล</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.url}
              alt="รูปภาพขนาดใหญ่"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
