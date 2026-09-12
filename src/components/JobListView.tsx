import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { JobItem, JobStatus, PaymentType } from '../types';
import { JobCard } from './JobCard';
import { formatCurrency, formatThaiDate, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';
import { POPULAR_BRANDS } from '../data/initialData';

interface JobListViewProps {
  jobs: JobItem[];
  onAddNew: () => void;
  onEdit: (job: JobItem) => void;
  onDelete: (id: string) => void;
  onViewDetails: (job: JobItem) => void;
  onQuickStatusChange: (id: string, status: JobStatus) => void;
  onSendLinePreview: (job: JobItem) => void;
  onExportCsv: () => void;
}

export const JobListView: React.FC<JobListViewProps> = ({
  jobs,
  onAddNew,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickStatusChange,
  onSendLinePreview,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc'>('date_desc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: jobs.length };
    jobs.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCode = job.jobCode.toLowerCase().includes(q);
          const matchContact = job.contactPerson.toLowerCase().includes(q);
          const matchPhone = job.phoneNumber.toLowerCase().includes(q);
          const matchBrand = job.productBrand.toLowerCase().includes(q);
          const matchAddress = job.location.address?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchCode && !matchContact && !matchPhone && !matchBrand && !matchAddress) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== 'all' && job.status !== selectedStatus) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== 'all' && job.productBrand !== selectedBrand) {
          return false;
        }

        // Payment filter
        if (selectedPayment !== 'all' && job.paymentType !== selectedPayment) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        }
        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }
        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }
        return 0;
      });
  }, [jobs, searchTerm, selectedStatus, selectedBrand, selectedPayment, sortBy]);

  const totalFilteredValue = filteredJobs.reduce((sum, j) => sum + j.price, 0);

  return (
    <div className="space-y-4">
      {/* Top Action Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่องาน, รหัสงาน, ผู้ติดต่อ, เบอร์โทร, แบรนด์, หรือที่อยู่..."
              className="w-full text-xs sm:text-sm pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>ตัวกรอง</span>
            </button>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองแบบการ์ด"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="มุมมองแบบตาราง"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={onExportCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors"
              title="ดาวน์โหลด CSV สำหรับ Google Sheets / Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Add New Job Button */}
            <button
              onClick={onAddNew}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'in_progress', label: 'กำลังทำ' },
            { key: 'pending', label: 'รอดำเนินการ' },
            { key: 'review', label: 'รอตรวจงาน' },
            { key: 'completed', label: 'เสร็จสิ้น' },
            { key: 'issue', label: 'มีปัญหา' },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.key;
            const count = statusCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Dropdowns (Desktop & Mobile expanded) */}
        <div className={`pt-2 border-t border-slate-100 flex-wrap gap-2.5 items-center justify-between text-xs ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">แบรนด์:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">ทุกแบรนด์</option>
                {POPULAR_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Payment filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">การชำระ:</span>
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">ทุกประเภท</option>
                <option value="cash">เงินสด</option>
                <option value="transfer">เงินโอน</option>
                <option value="credit_30">เครดิต 30 วัน</option>
                <option value="credit_60">เครดิต 60 วัน</option>
                <option value="credit_card">บัตรเครดิต</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium">เรียงตาม:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="date_desc">วันที่ล่าสุด</option>
                <option value="date_asc">วันที่เก่าสุด</option>
                <option value="price_desc">ราคาสูงสุด</option>
                <option value="price_asc">ราคาต่ำสุด</option>
              </select>
            </div>
          </div>

          {/* Summary of filtered results */}
          <div className="text-slate-500 text-[11px] font-medium">
            แสดง <strong className="text-slate-800">{filteredJobs.length}</strong> งาน • รวมมูลค่า{' '}
            <strong className="text-emerald-700">{formatCurrency(totalFilteredValue)}</strong>
          </div>
        </div>
      </div>

      {/* Main Content (Grid or Table View) */}
      {filteredJobs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onQuickStatusChange={onQuickStatusChange}
                onSendLinePreview={onSendLinePreview}
              />
            ))}
          </div>
        ) : (
          /* Table View for dense management */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">รหัส / วันที่</th>
                    <th className="py-3 px-4">ชื่องาน / สถานที่</th>
                    <th className="py-3 px-4">ผู้ติดต่อ</th>
                    <th className="py-3 px-4">แบรนด์สินค้า</th>
                    <th className="py-3 px-4">ยอดเงิน</th>
                    <th className="py-3 px-4">การชำระ</th>
                    <th className="py-3 px-4">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((job) => {
                    const statusCfg = getStatusConfig(job.status);
                    const paymentCfg = getPaymentTypeConfig(job.paymentType);
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-slate-800">{job.jobCode}</div>
                          <div className="text-[11px] text-slate-400">{formatThaiDate(job.date, 'short')}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div
                            onClick={() => onViewDetails(job)}
                            className="font-bold text-slate-800 hover:text-sky-600 cursor-pointer truncate"
                          >
                            {job.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            📍 {job.location.address || 'ไม่ระบุ'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{job.contactPerson}</div>
                          <a href={`tel:${job.phoneNumber}`} className="text-sky-600 text-[11px] hover:underline">
                            {job.phoneNumber}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-700">{job.productBrand}</span>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{job.productDetails}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600">
                          {formatCurrency(job.price)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-medium ${paymentCfg.badgeClass}`}>
                            {paymentCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${statusCfg.bgClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.badgeBg}`} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onSendLinePreview(job)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="LINE Flex"
                            >
                              💬
                            </button>
                            <button
                              onClick={() => onEdit(job)}
                              className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                              title="แก้ไข"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => onViewDetails(job)}
                              className="px-2 py-1 bg-slate-800 text-white rounded text-[11px] font-medium"
                            >
                              ดูงาน
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">ไม่พบข้อมูลงานที่ค้นหา</h3>
          <p className="text-xs text-slate-500 mb-4">
            ลองปรับเปลี่ยนคำค้นหา หรือล้างตัวกรองสถานะเพื่อแสดงรายการงานทั้งหมด
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
              setSelectedBrand('all');
              setSelectedPayment('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
