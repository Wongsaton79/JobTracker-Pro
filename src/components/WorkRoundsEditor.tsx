import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Layers,
  ShoppingBag,
  User,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  Building,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JobStatus, ProductItem, WorkRound } from '../types';
import { formatCurrency, getStatusConfig } from '../utils/formatters';
import { POPULAR_BRANDS } from '../data/initialData';

interface WorkRoundsEditorProps {
  rounds: WorkRound[];
  onChange: (updatedRounds: WorkRound[]) => void;
  currentJobStatus: JobStatus;
  defaultAssignedTo?: string;
}

const ROUND_PRESETS = [
  'งานเทพื้น & ปรับระดับฐานราก',
  'งานโครงสร้างเหล็กและเสา',
  'งานก่ออิฐฉาบปูน',
  'งานปูกระเบื้อง & สุขภัณฑ์',
  'งานระบบไฟฟ้า & แสงสว่าง',
  'งานระบบปรับอากาศ & ท่อแอร์',
  'งานทาสีภายใน & ภายนอก',
  'งานติดตั้งประตูหน้าต่าง & อลูมิเนียม',
  'งานตรวจเช็คส่งมอบ & บริการหลังการขาย',
];

const UNIT_PRESETS = ['ชุด', 'เครื่อง', 'ถุง', 'กล่อง', 'แผ่น', 'เส้น', 'เมตร', 'ตร.ม.', 'ถัง', 'ม้วน', 'ตัว', 'จุด'];

export const WorkRoundsEditor: React.FC<WorkRoundsEditorProps> = ({
  rounds,
  onChange,
  currentJobStatus,
  defaultAssignedTo = '',
}) => {
  const [collapsedRounds, setCollapsedRounds] = useState<Record<string, boolean>>({});

  const toggleCollapse = (roundId: string) => {
    setCollapsedRounds((prev) => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  // Add a new work round / stage
  const handleAddRound = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const roundNumber = rounds.length + 1;

    const newRound: WorkRound = {
      id: `round-${Date.now()}`,
      roundNumber,
      title: `รอบที่ ${roundNumber}: `,
      date: dateStr,
      time: timeStr,
      teamName: defaultAssignedTo || 'ทีมช่างประจำรอบ',
      status: currentJobStatus,
      description: '',
      products: [],
      roundTotalCost: 0,
      createdAt: now.toISOString(),
    };

    onChange([...rounds, newRound]);
  };

  // Delete a work round
  const handleDeleteRound = (roundIndex: number) => {
    if (window.confirm(`ต้องการลบรอบการทำงานรอบที่ ${roundIndex + 1} หรือไม่?`)) {
      const updated = rounds.filter((_, idx) => idx !== roundIndex);
      // Recalculate round numbers
      const renumbered = updated.map((r, idx) => ({
        ...r,
        roundNumber: idx + 1,
      }));
      onChange(renumbered);
    }
  };

  // Update a work round field
  const handleUpdateRound = (roundIndex: number, fields: Partial<WorkRound>) => {
    const updated = [...rounds];
    const target = { ...updated[roundIndex], ...fields };

    // Recompute total cost of products in this round
    if (target.products) {
      target.roundTotalCost = target.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    }

    updated[roundIndex] = target;
    onChange(updated);
  };

  // Add a product item inside a round
  const handleAddProductToRound = (roundIndex: number) => {
    const round = rounds[roundIndex];
    const now = new Date();
    const timeFormatted = `${now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    })} ${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newProduct: ProductItem = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      brand: 'SCG',
      name: '',
      quantity: 1,
      unit: 'ชุด',
      unitPrice: 0,
      totalPrice: 0,
      addedAt: timeFormatted,
      statusAtAdd: round.status || currentJobStatus,
      roundNumber: round.roundNumber,
      roundTitle: round.title,
      teamName: round.teamName,
    };

    const updatedProducts = [...(round.products || []), newProduct];
    const roundTotal = updatedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    const updatedRounds = [...rounds];
    updatedRounds[roundIndex] = {
      ...round,
      products: updatedProducts,
      roundTotalCost: roundTotal,
    };

    onChange(updatedRounds);
  };

  // Update a product item
  const handleUpdateProduct = (
    roundIndex: number,
    prodIndex: number,
    fields: Partial<ProductItem>
  ) => {
    const round = rounds[roundIndex];
    const updatedProducts = [...(round.products || [])];
    const currentProd = { ...updatedProducts[prodIndex], ...fields };

    // Recompute totalPrice if quantity or unitPrice changed
    if (fields.quantity !== undefined || fields.unitPrice !== undefined) {
      currentProd.totalPrice = (Number(currentProd.quantity) || 0) * (Number(currentProd.unitPrice) || 0);
    }

    updatedProducts[prodIndex] = currentProd;
    const roundTotal = updatedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    const updatedRounds = [...rounds];
    updatedRounds[roundIndex] = {
      ...round,
      products: updatedProducts,
      roundTotalCost: roundTotal,
    };

    onChange(updatedRounds);
  };

  // Delete a product item
  const handleDeleteProduct = (roundIndex: number, prodIndex: number) => {
    const round = rounds[roundIndex];
    const updatedProducts = round.products.filter((_, idx) => idx !== prodIndex);
    const roundTotal = updatedProducts.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    const updatedRounds = [...rounds];
    updatedRounds[roundIndex] = {
      ...round,
      products: updatedProducts,
      roundTotalCost: roundTotal,
    };

    onChange(updatedRounds);
  };

  const statusOptions: Array<{ value: JobStatus; label: string }> = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'quotation', label: 'เสนอราคา' },
    { value: 'follow_up', label: 'ติดตามซ้ำ' },
    { value: 'closed_deal', label: 'ปิดการขาย' },
  ];

  return (
    <div className="space-y-4">
      {/* Overview Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950">
              บันทึกรอบเข้าหน้างาน, สินค้าหลายชิ้น & สลับเปลี่ยนทีมช่าง
            </h4>
            <p className="text-[11px] text-amber-800">
              ในแต่ละรอบสามารถระบุทีมช่างประจำรอบ สินค้าหลายรายการ พร้อมป้ายระบุสถานะขณะเพิ่มสินค้า
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddRound}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่มรอบการเข้าหน้างาน</span>
        </button>
      </div>

      {/* Rounds List */}
      {rounds.length === 0 ? (
        <div className="p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            ยังไม่มีการบันทึกรอบงาน (กดปุ่มด้านบนเพื่อเพิ่มรอบ เช่น งานเทพื้น, งานโครงสร้าง ฯลฯ)
          </p>
          <button
            type="button"
            onClick={handleAddRound}
            className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เริ่มต้นเพิ่มรอบที่ 1</span>
          </button>
        </div>
      ) : (
        rounds.map((round, rIdx) => {
          const isCollapsed = !!collapsedRounds[round.id];
          const stCfg = getStatusConfig(round.status || currentJobStatus);

          return (
            <div
              key={round.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Round Header Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {round.roundNumber}
                  </span>
                  <input
                    type="text"
                    value={round.title}
                    onChange={(e) => handleUpdateRound(rIdx, { title: e.target.value })}
                    placeholder={`ชื่องานรอบที่ ${round.roundNumber} เช่น งานเทพื้นและฐานราก`}
                    className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-sky-500 focus:outline-none min-w-[200px] sm:min-w-[280px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge of this round */}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${stCfg.bgClass}`}>
                    {stCfg.label}
                  </span>

                  {/* Round Cost Summary */}
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ฿{round.roundTotalCost.toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleCollapse(round.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                    title={isCollapsed ? 'ขยายดูรายละเอียด' : 'ย่อเก็บ'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRound(rIdx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                    title="ลบรอบนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Presets for Round Title */}
              <div className="px-4 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500 scrollbar-none">
                <span className="shrink-0 text-slate-400">เลือกด่วน:</span>
                {ROUND_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleUpdateRound(rIdx, { title: `รอบที่ ${round.roundNumber}: ${preset}` })}
                    className="shrink-0 px-2 py-0.5 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 text-slate-600 rounded text-[10px] transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {/* Round Details (Collapsible) */}
              {!isCollapsed && (
                <div className="p-4 space-y-4 text-xs">
                  {/* Team Assignment & Status & Date/Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                    {/* Assigned Team for this specific round */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ทีมช่างผู้รับผิดชอบรอบนี้ (สลับทีมได้)</span>
                      </label>
                      <input
                        type="text"
                        value={round.teamName || ''}
                        onChange={(e) => handleUpdateRound(rIdx, { teamName: e.target.value })}
                        placeholder="เช่น ทีมช่างปูน (ช่างวิทย์), ทีมโครงสร้าง (ช่างเอก)"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                      />
                    </div>

                    {/* Status at this round */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        สถานะงานในรอบนี้
                      </label>
                      <select
                        value={round.status || currentJobStatus}
                        onChange={(e) => handleUpdateRound(rIdx, { status: e.target.value as JobStatus })}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {statusOptions.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date of round */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>วันที่เข้างาน</span>
                      </label>
                      <input
                        type="date"
                        value={round.date || ''}
                        onChange={(e) => handleUpdateRound(rIdx, { date: e.target.value })}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Multi-item Product Table for this Round */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>รายการสินค้าในรอบนี้ ({round.products?.length || 0} ชิ้น)</span>
                      </h5>

                      <button
                        type="button"
                        onClick={() => handleAddProductToRound(rIdx)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ เพิ่มสินค้าในรอบนี้</span>
                      </button>
                    </div>

                    {round.products && round.products.length > 0 ? (
                      <div className="space-y-2">
                        {round.products.map((prod, pIdx) => {
                          const prodStCfg = getStatusConfig(prod.statusAtAdd || round.status);
                          return (
                            <div
                              key={prod.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
                            >
                              {/* Product Header Row: Status tag + Added timestamp + delete */}
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold border ${prodStCfg.bgClass}`}
                                    title="สถานะของงานตอนที่เพิ่มสินค้าชิ้นนี้"
                                  >
                                    เพิ่มตอน: {prodStCfg.label}
                                  </span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{prod.addedAt}</span>
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(rIdx, pIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="ลบสินค้านี้"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Product inputs grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                {/* Brand */}
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">แบรนด์</label>
                                  <input
                                    type="text"
                                    value={prod.brand || ''}
                                    onChange={(e) => handleUpdateProduct(rIdx, pIdx, { brand: e.target.value })}
                                    placeholder="เช่น SCG, TOA, Daikin"
                                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                                  />
                                </div>

                                {/* Product name / model */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">
                                    ชื่อสินค้า / รุ่น / สเปก
                                  </label>
                                  <input
                                    type="text"
                                    value={prod.name || ''}
                                    onChange={(e) => handleUpdateProduct(rIdx, pIdx, { name: e.target.value })}
                                    placeholder="เช่น ปูนซีเมนต์ SCG แดง, กระเบื้อง 60x60"
                                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>

                                {/* Quantity */}
                                <div className="sm:col-span-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">จำนวน</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={prod.quantity || 1}
                                    onChange={(e) =>
                                      handleUpdateProduct(rIdx, pIdx, {
                                        quantity: Math.max(1, parseFloat(e.target.value) || 1),
                                      })
                                    }
                                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none text-center"
                                  />
                                </div>

                                {/* Unit */}
                                <div className="sm:col-span-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">หน่วย</label>
                                  <input
                                    type="text"
                                    value={prod.unit || 'ชุด'}
                                    onChange={(e) => handleUpdateProduct(rIdx, pIdx, { unit: e.target.value })}
                                    placeholder="ชุด, ถุง"
                                    className="w-full text-xs px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none text-center"
                                  />
                                </div>

                                {/* Unit price */}
                                <div className="sm:col-span-1.5">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">ราคา/หน่วย</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={prod.unitPrice || 0}
                                    onChange={(e) =>
                                      handleUpdateProduct(rIdx, pIdx, {
                                        unitPrice: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    placeholder="0"
                                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none text-right font-medium"
                                  />
                                </div>

                                {/* Total Price */}
                                <div className="sm:col-span-1.5 flex flex-col justify-end">
                                  <label className="block text-[10px] text-slate-500 mb-0.5 text-right">
                                    รวม (บาท)
                                  </label>
                                  <div className="text-xs font-bold text-emerald-700 bg-white px-2 py-1.5 rounded-lg border border-slate-200 text-right">
                                    ฿{(prod.totalPrice || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                        รอบนี้ยังไม่มีการเบิกใช้สินค้า (กดปุ่ม "+ เพิ่มสินค้าในรอบนี้" หากมีสินค้าที่ใช้)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
