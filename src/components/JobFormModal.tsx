import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Tag,
  DollarSign,
  CreditCard,
  Building,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Layers,
} from 'lucide-react';
import { JobItem, JobStatus, PaymentType, SyncSettings, WorkRound, ProductItem } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { PhotoUploader, uploadDirectToPublicCdn } from './PhotoUploader';
import { WorkRoundsEditor } from './WorkRoundsEditor';
import { POPULAR_BRANDS } from '../data/initialData';
import { calculateJobFinancials, getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';
import { addAuditLog } from '../utils/auditLogger';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobItem) => void;
  editingJob?: JobItem | null;
  settings: SyncSettings;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingJob,
  settings,
}) => {
  const [formData, setFormData] = useState<Partial<JobItem>>({});
  const [rounds, setRounds] = useState<WorkRound[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const defaultDate = now.toISOString().split('T')[0];
      const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      if (editingJob) {
        setFormData(editingJob);
        setRounds(editingJob.workRounds || []);
      } else {
        const initialJobCode = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({
          jobCode: initialJobCode,
          title: '',
          contactPerson: '',
          phoneNumber: '',
          date: defaultDate,
          time: defaultTime,
          status: 'pending',
          location: {
            address: 'กรุงเทพมหานคร และปริมณฑล',
            lat: 13.7563,
            lng: 100.5018,
          },
          photos: [],
          productBrand: '',
          productDetails: '',
          price: 0,
          paymentType: 'cash',
          notes: '',
          assignedTo: '',
        });

        // Initialize with Round 1 as default
        setRounds([
          {
            id: `round-${Date.now()}`,
            roundNumber: 1,
            title: 'รอบที่ 1: เข้าสำรวจและเริ่มงาน',
            date: defaultDate,
            time: defaultTime,
            teamName: 'ทีมช่างประจำรอบ',
            status: 'pending',
            description: '',
            products: [],
            roundTotalCost: 0,
            createdAt: now.toISOString(),
          },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, editingJob]);

  // When work rounds change, recalculate total cost and update productBrand/details summaries
  const handleRoundsChange = (newRounds: WorkRound[]) => {
    setRounds(newRounds);

    // Calculate grand total from all products across all rounds
    const allProducts: ProductItem[] = [];
    newRounds.forEach((r) => {
      if (r.products && r.products.length > 0) {
        allProducts.push(...r.products);
      }
    });

    const totalFromProducts = allProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    // Derive summarized brands and product names
    const uniqueBrands = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    const productSummary = allProducts
      .map((p) => `${p.name || p.brand} (${p.quantity} ${p.unit})`)
      .join(', ');

    setFormData((prev) => ({
      ...prev,
      price: totalFromProducts > 0 ? totalFromProducts : prev.price,
      productBrand: uniqueBrands.length > 0 ? uniqueBrands.join(' / ') : prev.productBrand,
      productDetails: productSummary || prev.productDetails,
    }));
  };

  if (!isOpen) return null;

  // 4 Core Status options as requested
  const statusList: Array<{ value: JobStatus; label: string }> = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'quotation', label: 'เสนอราคา' },
    { value: 'follow_up', label: 'ติดตามซ้ำ' },
    { value: 'closed_deal', label: 'ปิดการขาย' },
  ];

  // 5 Payment / Credit term options as requested
  const paymentList: Array<{ value: PaymentType; label: string; desc: string }> = [
    { value: 'cash', label: '💵 เงินสด', desc: 'ชำระทันที / หน้างาน' },
    { value: 'credit_7', label: '📅 เครดิต 7 วัน', desc: 'เงื่อนไขเครดิตเทอม 7 วัน' },
    { value: 'credit_15', label: '📅 เครดิต 15 วัน', desc: 'เงื่อนไขเครดิตเทอม 15 วัน' },
    { value: 'credit_30', label: '🗓️ เครดิต 30 วัน', desc: 'วางบิลเครดิตเทอม 30 วัน' },
    { value: 'credit_45', label: '🗓️ เครดิต 45 วัน', desc: 'วางบิลเครดิตเทอม 45 วัน' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title?.trim()) errs.title = 'กรุณาระบุชื่อหน้างาน / ไซต์งาน';
    if (!formData.contactPerson?.trim()) errs.contactPerson = 'กรุณาระบุชื่อผู้ติดต่อ';
    if (!formData.phoneNumber?.trim()) errs.phoneNumber = 'กรุณาระบุเบอร์ติดต่อ';
    if (!formData.date) errs.date = 'กรุณาเลือกวันที่';
    if (!formData.productBrand?.trim() && rounds.every((r) => !r.products || r.products.length === 0)) {
      errs.productBrand = 'กรุณาระบุแบรนด์สินค้า หรือเพิ่มรายการสินค้าในรอบงาน';
    }
    if (formData.price === undefined || formData.price < 0) errs.price = 'กรุณาระบุราคาที่ถูกต้อง';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      const el = document.getElementById('job-form-container');
      if (el) el.scrollTop = 0;
      return;
    }

    setIsSubmitting(true);

    // Ensure all photos are converted to public HTTPS CDN URLs before submitting
    const rawPhotos = formData.photos || [];
    const processedPhotos = await Promise.all(
      rawPhotos.map(async (p) => {
        if (p.url && p.url.startsWith('data:image/')) {
          try {
            const cdnUrl = await uploadDirectToPublicCdn(p.url);
            if (cdnUrl) return { ...p, url: cdnUrl };
          } catch (err) {
            console.warn('Error uploading photo during submit:', err);
          }
        }
        return p;
      })
    );

    // Gather all products across rounds
    const allProducts: ProductItem[] = [];
    rounds.forEach((r) => {
      if (r.products && r.products.length > 0) {
        allProducts.push(...r.products);
      }
    });

    const finalBrand =
      formData.productBrand?.trim() ||
      (allProducts.length > 0 ? Array.from(new Set(allProducts.map((p) => p.brand))).join(' / ') : 'ทั่วไป');

    const finalDetails =
      formData.productDetails?.trim() ||
      (allProducts.length > 0
        ? allProducts.map((p) => `${p.name || p.brand} (${p.quantity} ${p.unit})`).join(', ')
        : 'รายละเอียดตามใบงาน');

    // Find active assigned team from the latest round or fallback
    const currentAssigned =
      formData.assignedTo?.trim() ||
      (rounds.length > 0 ? rounds[rounds.length - 1].teamName : 'ทีมช่างปฏิบัติการ');

    // Compute financial breakdown
    const jobFinancials = calculateJobFinancials({
      price: Number(formData.price) || 0,
      paymentType: formData.paymentType as PaymentType,
      workRounds: rounds,
    });

    const completeJob: JobItem = {
      id: editingJob?.id || `job-${Date.now()}`,
      jobCode: formData.jobCode || `JOB-${Date.now()}`,
      title: formData.title!.trim(),
      contactPerson: formData.contactPerson!.trim(),
      phoneNumber: formData.phoneNumber!.trim(),
      date: formData.date!,
      time: formData.time || '10:00',
      status: formData.status as JobStatus,
      location: formData.location || {
        address: 'กรุงเทพฯ',
        lat: 13.7563,
        lng: 100.5018,
      },
      photos: processedPhotos,
      productBrand: finalBrand,
      productDetails: finalDetails,
      price: Number(formData.price) || 0,
      totalPaidAmount: jobFinancials.totalPaid,
      remainingAmount: jobFinancials.remaining,
      overallPaymentStatus: jobFinancials.status,
      paymentType: formData.paymentType as PaymentType,
      notes: formData.notes?.trim() || '',
      assignedTo: currentAssigned,
      workRounds: rounds,
      products: allProducts,
      createdAt: editingJob?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    // 📜 Record Audit Log
    const user = settings.currentUser || 'เจ้าหน้าที่ระบบ';
    if (editingJob) {
      const isStatusChanged = editingJob.status !== completeJob.status;
      addAuditLog({
        userName: user,
        action: isStatusChanged ? 'status_change' : 'update_job',
        actionLabel: isStatusChanged ? 'เปลี่ยนสถานะงาน' : 'แก้ไขข้อมูลงาน',
        jobCode: completeJob.jobCode,
        jobTitle: completeJob.title,
        jobId: completeJob.id,
        details: isStatusChanged
          ? `เปลี่ยนสถานะจาก "${getStatusConfig(editingJob.status).label}" เป็น "${getStatusConfig(completeJob.status).label}" | ยอดรวม ฿${completeJob.price.toLocaleString()}`
          : `แก้ไขข้อมูลหน้างาน, ปรับปรุง ${rounds.length} รอบการทำงาน และ ${allProducts.length} รายการสินค้า`,
        statusBefore: editingJob.status,
        statusAfter: completeJob.status,
      });
    } else {
      addAuditLog({
        userName: user,
        action: 'create_job',
        actionLabel: 'สร้างงานใหม่',
        jobCode: completeJob.jobCode,
        jobTitle: completeJob.title,
        jobId: completeJob.id,
        details: `บันทึกข้อมูลหน้างานใหม่ สถานะ "${getStatusConfig(completeJob.status).label}" จำนวน ${rounds.length} รอบงาน (${allProducts.length} สินค้า) ยอดรวม ฿${completeJob.price.toLocaleString()}`,
        statusAfter: completeJob.status,
      });
    }

    onSave(completeJob);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div
        id="job-form-container"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {editingJob ? 'แก้ไขและอัพเดทข้อมูลหน้างาน' : 'บันทึกข้อมูลหน้างานใหม่'}
              </h2>
              <p className="text-xs text-slate-300">
                รหัสงาน: <span className="font-mono text-sky-300 font-semibold">{formData.jobCode}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: ข้อมูลหน้างานและสถานะ */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-600" />
                <span>1. ข้อมูลหน้างาน & สถานะงาน</span>
              </h3>
              <span className="text-[11px] text-rose-500 font-medium">* จำเป็นต้องกรอก</span>
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อหน้างาน / ไซต์งาน <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ติดตั้งเครื่องปรับอากาศ บ้านเดี่ยวรามอินทรา, งานเทพื้นและปูกระเบื้องโกดัง"
                className={`w-full text-sm px-3.5 py-2.5 bg-white border ${
                  errors.title ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none`}
              />
              {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สถานะของงาน <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {statusList.map((st) => {
                  const cfg = getStatusConfig(st.value);
                  const isSelected = formData.status === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.value })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? `${cfg.bgClass} ring-2 ring-offset-1 font-bold shadow-xs scale-102`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.badgeBg}`} />
                      <span>{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ผู้ติดต่อ / ลูกค้า <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="เช่น คุณสมชาย (โฟร์แมน)"
                    className={`w-full text-sm pl-9 pr-3 py-2 bg-white border ${
                      errors.contactPerson ? 'border-rose-400' : 'border-slate-300'
                    } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none`}
                  />
                </div>
                {errors.contactPerson && <p className="text-xs text-rose-600 mt-1">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    className={`w-full text-sm pl-9 pr-3 py-2 bg-white border ${
                      errors.phoneNumber ? 'border-rose-400' : 'border-slate-300'
                    } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-xs text-rose-600 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Date & Time & Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เวลา</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่าง / ผู้รับผิดชอบหลัก
                </label>
                <input
                  type="text"
                  value={formData.assignedTo || ''}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="เช่น ทีมช่างเอกชัย (ทีม A)"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ระบุพิกัดแผนที่ (GPS ONLY, Search Disabled, 5KM Radius Enforced) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>2. ระบุพิกัดสถานที่ & แผนที่หน้างาน</span>
              </h3>
              <span className="text-[11px] text-sky-700 font-semibold bg-sky-100 px-2 py-0.5 rounded-full">
                🔒 พิกัด GPS ปัจจุบันเท่านั้น (รัศมีไม่เกิน 5 กม.)
              </span>
            </div>

            {/* Address Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อสถานที่ / ที่อยู่หน้างาน
              </label>
              <input
                type="text"
                value={formData.location?.address || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...(formData.location || { lat: 13.7563, lng: 100.5018 }),
                      address: e.target.value,
                    },
                  })
                }
                placeholder="ระบุชื่ออาคาร หมู่บ้าน ถนน ซอย หรือระบบจะระบุให้อัตโนมัติจาก GPS"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Interactive Leaflet GPS Map with 5KM Radius Restriction */}
            <InteractiveMap
              lat={formData.location?.lat || 13.7563}
              lng={formData.location?.lng || 100.5018}
              address={formData.location?.address}
              isEditable={true}
              height="280px"
              onLocationChange={(newLat, newLng, newAddress) => {
                setFormData((prev) => ({
                  ...prev,
                  location: {
                    lat: newLat,
                    lng: newLng,
                    address: newAddress || prev.location?.address || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
                  },
                }));
              }}
            />
          </div>

          {/* Section 3: ขอภาพประกอบหน้างาน (Camera & Gallery) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-600" />
                <span>3. ภาพประกอบหน้างาน</span>
              </h3>
              <span className="text-[11px] text-slate-500">ถ่ายสดจากกล้อง หรือเลือกจากคลังภาพ</span>
            </div>

            <PhotoUploader
              photos={formData.photos || []}
              onChange={(newPhotos) => setFormData({ ...formData, photos: newPhotos })}
              maxPhotos={8}
            />
          </div>

          {/* Section 4: รอบการเข้าหน้างาน, สินค้าหลายชิ้น, สลับทีมช่าง & การชำระเงิน */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>4. ข้อมูลสินค้า แบรนด์ ราคา และการชำระเงิน</span>
              </h3>
              <span className="text-[11px] text-rose-500 font-medium">* บันทึกสินค้าต่อรอบ & สลับทีมช่าง</span>
            </div>

            {/* Work Rounds & Multi-Item Product Editor */}
            <WorkRoundsEditor
              rounds={rounds}
              onChange={handleRoundsChange}
              currentJobStatus={formData.status as JobStatus}
              defaultAssignedTo={formData.assignedTo}
            />

            {/* Summary Brand & Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แบรนด์สินค้าหลัก <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productBrand || ''}
                  onChange={(e) => setFormData({ ...formData, productBrand: e.target.value })}
                  placeholder="เช่น SCG / COTTO, Daikin, TOA, Schneider"
                  className={`w-full text-sm px-3.5 py-2 bg-white border ${
                    errors.productBrand ? 'border-rose-400' : 'border-slate-300'
                  } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium`}
                />
                {errors.productBrand && <p className="text-xs text-rose-600 mt-1">{errors.productBrand}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สรุปรายละเอียดสินค้าสำหรับ LINE Flex / รายงาน
                </label>
                <input
                  type="text"
                  value={formData.productDetails || ''}
                  onChange={(e) => setFormData({ ...formData, productDetails: e.target.value })}
                  placeholder="เช่น ปูนซีเมนต์ 15 ถุง, กระเบื้อง 45 กล่อง"
                  className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Price (THB) & Payment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยอดรวมทั้งสิ้น (บาท THB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.price ?? ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-full text-base font-bold pl-8 pr-3 py-2 bg-white border ${
                      errors.price ? 'border-rose-400' : 'border-slate-300'
                    } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-emerald-700`}
                  />
                </div>
                {errors.price && <p className="text-xs text-rose-600 mt-1">{errors.price}</p>}
                <p className="text-[11px] text-slate-500 mt-1">
                  * คำนวณจากยอดรวมสินค้าทุกรอบอัตโนมัติ หรือสามารถพิมพ์แก้ไขเองได้
                </p>
              </div>

              {/* Payment Type (สด หรือ เครดิต) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  สด หรือ เครดิต (เงื่อนไขการชำระ) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {paymentList.map((pt) => {
                    const isSelected = formData.paymentType === pt.value;
                    return (
                      <label
                        key={pt.value}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-400 text-sky-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentType"
                            value={pt.value}
                            checked={isSelected}
                            onChange={() => setFormData({ ...formData, paymentType: pt.value })}
                            className="text-sky-600 focus:ring-sky-500"
                          />
                          <span>{pt.label}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">{pt.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* สรุปสถานะการชำระเงินของงาน (คำนวณจากรอบการทำงาน) */}
            {(() => {
              const fin = calculateJobFinancials({
                price: Number(formData.price) || 0,
                paymentType: formData.paymentType as PaymentType,
                workRounds: rounds,
              });
              return (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span>📊 สรุปยอดเงินและสถานะการชำระเงิน</span>
                      {rounds.length > 0 && (
                        <span className="text-[11px] text-slate-500 font-normal">
                          (คำนวณจากการชำระแยกรายรอบ {rounds.length} รอบ)
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${fin.badgeClass}`}>
                      {fin.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium">ยอดรวมทั้งสิ้น</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">฿{fin.totalPrice.toLocaleString()}</div>
                    </div>
                    <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] text-emerald-700 font-medium">
                        ชำระแล้ว ({fin.paidCount}/{rounds.length || 1} รอบ)
                      </div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5">฿{fin.totalPaid.toLocaleString()}</div>
                    </div>
                    <div
                      className={`p-2 rounded-lg border ${
                        fin.remaining > 0
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] font-medium">ยอดคงค้างชำระ</div>
                      <div className={`text-sm font-bold mt-0.5 ${fin.remaining > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                        ฿{fin.remaining.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุ / รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="เช่น เงื่อนไขการรับประกัน 1 ปี, นัดตรวจรับงานซ่อมเพิ่มเติม, เลขที่ใบเสร็จ"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sync & Notification Checklist Indicator */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                ระบบจะบันทึกลง <strong>Firebase Cloud Database</strong>, บันทึก <strong>Audit Log</strong> และส่ง <strong>LINE Flex Message</strong> แจ้งเตือนเข้ากลุ่มทันที
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingJob ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลหน้างาน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
