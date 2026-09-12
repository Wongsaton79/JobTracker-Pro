import React, { useState } from 'react';
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
} from 'lucide-react';
import { JobItem, JobStatus, PaymentType, SyncSettings } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { PhotoUploader, uploadDirectToPublicCdn } from './PhotoUploader';
import { POPULAR_BRANDS } from '../data/initialData';
import { getPaymentTypeConfig, getStatusConfig } from '../utils/formatters';

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
  if (!isOpen) return null;

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const [formData, setFormData] = useState<Partial<JobItem>>(
    editingJob || {
      jobCode: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
      productBrand: 'SCG / COTTO',
      productDetails: '',
      price: 0,
      paymentType: 'cash',
      notes: '',
      assignedTo: '',
    }
  );

  const [customBrand, setCustomBrand] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status options
  const statusList: Array<{ value: JobStatus; label: string }> = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'review', label: 'รอตรวจงาน' },
    { value: 'completed', label: 'เสร็จสมบูรณ์' },
    { value: 'issue', label: 'มีปัญหา / ต้องแก้ไข' },
  ];

  // Payment options
  const paymentList: Array<{ value: PaymentType; label: string; desc: string }> = [
    { value: 'cash', label: '💵 เงินสด', desc: 'ชำระทันทีหน้างาน' },
    { value: 'transfer', label: '📱 เงินโอน', desc: 'โอนผ่านบัญชีธนาคาร' },
    { value: 'credit_30', label: '📅 เครดิต 30 วัน', desc: 'วางบิลเครดิตเทอม 30 วัน' },
    { value: 'credit_60', label: '🗓️ เครดิต 60 วัน', desc: 'วางบิลเครดิตเทอม 60 วัน' },
    { value: 'credit_card', label: '💳 บัตรเครดิต', desc: 'รูดบัตรเครดิต' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title?.trim()) errs.title = 'กรุณาระบุชื่อหน้างาน / ไซต์งาน';
    if (!formData.contactPerson?.trim()) errs.contactPerson = 'กรุณาระบุชื่อผู้ติดต่อ';
    if (!formData.phoneNumber?.trim()) errs.phoneNumber = 'กรุณาระบุเบอร์ติดต่อ';
    if (!formData.date) errs.date = 'กรุณาเลือกวันที่';
    if (!formData.productBrand?.trim()) errs.productBrand = 'กรุณาเลือกแบรนด์สินค้า';
    if (formData.price === undefined || formData.price < 0) errs.price = 'กรุณาระบุราคาที่ถูกต้อง';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to top error
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

    const finalBrand =
      formData.productBrand === 'อื่นๆ' && customBrand.trim()
        ? customBrand.trim()
        : formData.productBrand || 'ทั่วไป';

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
      productDetails: formData.productDetails?.trim() || '',
      price: Number(formData.price) || 0,
      paymentType: formData.paymentType as PaymentType,
      notes: formData.notes?.trim() || '',
      assignedTo: formData.assignedTo?.trim() || '',
      createdAt: editingJob?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

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
                {editingJob ? 'แก้ไขและอัพเดทสถานะงาน' : 'บันทึกข้อมูลหน้างานใหม่'}
              </h2>
              <p className="text-xs text-slate-300">
                รหัสงาน: <span className="font-mono text-sky-300 font-semibold">{formData.jobCode}</span>
              </p>
            </div>
          </div>

          <button
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
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ติดตั้งเครื่องปรับอากาศ บ้านเดี่ยวรามอินทรา, ปูกระเบื้องคอนโดลุมพินี"
                className={`w-full text-sm px-3.5 py-2.5 bg-white border ${
                  errors.title ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'
                } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none`}
              />
              {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                อัพเดทสถานะของงาน <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {statusList.map((st) => {
                  const cfg = getStatusConfig(st.value);
                  const isSelected = formData.status === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: st.value })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? `${cfg.bgClass} ring-2 ring-offset-1 font-bold shadow-xs scale-102`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.badgeBg}`} />
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
                    value={formData.contactPerson}
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
                    value={formData.phoneNumber}
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
                    value={formData.date}
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
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-sm pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ช่าง / ผู้รับผิดชอบ</label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="เช่น ช่างเอกชัย (ทีม A)"
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: ระบุพิกัดแผนที่ (Google Map & GPS Pin) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>2. ระบุพิกัดสถานที่ & แผนที่หน้างาน</span>
              </h3>
              <span className="text-[11px] text-slate-500">เลือกจาก GPS หรือปักหมุดบน Map</span>
            </div>

            {/* Address Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อสถานที่ / ที่อยู่หน้างาน
              </label>
              <input
                type="text"
                value={formData.location?.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: {
                      ...(formData.location || { lat: 13.7563, lng: 100.5018 }),
                      address: e.target.value,
                    },
                  })
                }
                placeholder="ระบุชื่ออาคาร หมู่บ้าน ถนน ซอย หรือระบบจะกรอกให้อัตโนมัติเมื่อปักหมุด"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Interactive Leaflet/Google Map Picker */}
            <InteractiveMap
              lat={formData.location?.lat || 13.7563}
              lng={formData.location?.lng || 100.5018}
              address={formData.location?.address}
              isEditable={true}
              height="260px"
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

          {/* Section 4: สินค้า แบรนด์ ราคา และการชำระเงิน */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>4. ข้อมูลสินค้า แบรนด์ ราคา และการชำระเงิน</span>
              </h3>
              <span className="text-[11px] text-rose-500 font-medium">* สินค้า / ราคา / สดหรือเครดิต</span>
            </div>

            {/* Brand Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สินค้าที่ใช้ แบรนด์ไหน <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_BRANDS.map((brand) => {
                  const isSelected = formData.productBrand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setFormData({ ...formData, productBrand: brand })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {formData.productBrand === 'อื่นๆ' && (
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="พิมพ์ระบุชื่อแบรนด์อื่นๆ..."
                  className="w-full text-sm px-3.5 py-2 bg-white border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              )}
            </div>

            {/* Product Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายการสินค้า / รุ่น / ปริมาณ
              </label>
              <input
                type="text"
                value={formData.productDetails}
                onChange={(e) => setFormData({ ...formData, productDetails: e.target.value })}
                placeholder="เช่น Daikin Inverter 18000 BTU, กระเบื้อง COTTO 60x60 cm. 20 กล่อง"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Price (THB) & Payment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ราคาเท่าไหร่ (บาท THB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={`w-full text-base font-bold pl-8 pr-3 py-2 bg-white border ${
                      errors.price ? 'border-rose-400' : 'border-slate-300'
                    } rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-emerald-700`}
                  />
                </div>
                {errors.price && <p className="text-xs text-rose-600 mt-1">{errors.price}</p>}

                {/* Quick Price Buttons */}
                <div className="flex gap-1.5 mt-1.5">
                  {[5000, 15000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({ ...formData, price: amt })}
                      className="text-[10px] px-2 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-700 rounded-md font-medium"
                    >
                      +{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
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

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุ / รายละเอียดเพิ่มเติม
              </label>
              <textarea
                rows={2}
                value={formData.notes}
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
                เมื่อกดบันทึก ข้อมูลจะจัดเก็บลง <strong>Firebase Cloud Database</strong> แบบเรียลไทม์ และส่ง <strong>LINE Flex Message</strong> แจ้งเตือนเข้ากลุ่มทันที
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
