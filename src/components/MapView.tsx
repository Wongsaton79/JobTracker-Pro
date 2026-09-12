import React, { useState } from 'react';
import { JobItem, JobStatus } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { formatCurrency, formatThaiDate, getStatusConfig } from '../utils/formatters';
import { MapPin, Filter, Layers, Navigation, ExternalLink, User, Phone } from 'lucide-react';

interface MapViewProps {
  jobs: JobItem[];
  onViewJobDetails: (job: JobItem) => void;
}

export const MapView: React.FC<MapViewProps> = ({ jobs, onViewJobDetails }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter((j) => {
    if (selectedStatus !== 'all' && j.status !== selectedStatus) return false;
    return true;
  });

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const markers = filteredJobs.map((j) => {
    const cfg = getStatusConfig(j.status);
    return {
      id: j.id,
      lat: j.location.lat,
      lng: j.location.lng,
      title: j.title,
      status: j.status,
      color: cfg.lineColor,
      contactPerson: j.contactPerson,
      price: j.price,
    };
  });

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" />
            <span>แผนที่ภาพรวมหน้างาน (Field Sites Map Overview)</span>
          </h2>
          <p className="text-xs text-slate-500">
            แสดงพิกัดไซต์งานทั้งหมดทั่วประเทศ พร้อมข้อมูลผู้ติดต่อและสถานะงาน
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
          >
            <option value="all">📍 ทุกสถานะงาน ({jobs.length})</option>
            <option value="in_progress">🔵 กำลังดำเนินการ</option>
            <option value="pending">⚪ รอดำเนินการ</option>
            <option value="review">🟡 รอตรวจงาน</option>
            <option value="completed">🟢 เสร็จสมบูรณ์</option>
            <option value="issue">🔴 มีปัญหา/แก้ไข</option>
          </select>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 xl:col-span-9 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <InteractiveMap
            lat={13.7563}
            lng={100.5018}
            height="560px"
            allMarkers={markers}
            onMarkerClick={(id) => setSelectedJobId(id)}
          />
        </div>

        {/* Right Sidebar: Selected Job Card or List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {selectedJob ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">{selectedJob.jobCode}</span>
                {(() => {
                  const cfg = getStatusConfig(selectedJob.status);
                  return (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${cfg.bgClass}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {selectedJob.photos.length > 0 && (
                <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={selectedJob.photos[0].url}
                    alt={selectedJob.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h3 className="font-bold text-slate-800 text-sm">{selectedJob.title}</h3>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedJob.contactPerson}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${selectedJob.phoneNumber}`} className="text-sky-600 font-semibold hover:underline">
                    {selectedJob.phoneNumber}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span className="truncate">{selectedJob.location.address}</span>
                </div>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{selectedJob.productBrand}</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(selectedJob.price)}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`https://www.google.com/maps?q=${selectedJob.location.lat},${selectedJob.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>เปิดนำทาง</span>
                </a>
                <button
                  onClick={() => onViewJobDetails(selectedJob)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">คลิกที่หมุดบนแผนที่</p>
              <p className="text-[11px] text-slate-400">เพื่อดูข้อมูลผู้ติดต่อและรายละเอียดของไซต์งานนั้นๆ</p>
            </div>
          )}

          {/* Quick List of Sites */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ไซต์งานในมุมมองนี้ ({filteredJobs.length})
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredJobs.map((j) => {
                const cfg = getStatusConfig(j.status);
                const isSelected = selectedJobId === j.id;
                return (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJobId(j.id)}
                    className={`p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="truncate">{j.title}</span>
                      <span className={`w-2 h-2 rounded-full ${cfg.badgeBg} shrink-0 ml-1`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{j.contactPerson}</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(j.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
