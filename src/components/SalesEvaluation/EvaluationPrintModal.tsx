import React from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelText, formatPriceComparisonLabel } from '../../utils/evaluationCalculator';
import { Printer, X, Award, Check } from 'lucide-react';

interface EvaluationPrintModalProps {
  evaluation: SalesEvaluation | null;
  companyName: string;
  onClose: () => void;
}

export const EvaluationPrintModal: React.FC<EvaluationPrintModalProps> = ({
  evaluation,
  companyName,
  onClose,
}) => {
  if (!evaluation) return null;

  const handlePrint = () => {
    window.print();
  };

  const questionsList = [
    {
      category: 'ส่วนที่ 1: การสื่อสารกับลูกค้าและการบริการของเซลล์ (คะแนนเต็ม 20 คะแนน)',
      subtotal: `${evaluation.section1Score} / 20 คะแนน`,
      items: [
        {
          num: 1,
          code: '1.1',
          text: 'เซลล์ให้ข้อมูลสินค้า ราคา และโปรโมชั่น แจ้งกิจกรรม แคมเปญได้ชัดเจน ถูกต้องและรวดเร็ว (คะแนนเต็ม 10 คะแนน)',
          rating: evaluation.q1_1_rating,
          score: evaluation.q1_1_score,
          maxScore: 10,
          note: evaluation.q1_1_note,
        },
        {
          num: 2,
          code: '1.2',
          text: 'เซลล์มีความเอาใจใส่ ติดตามงาน เข้าเยี่ยมและติดตามการขายกับลูกค้าอย่างต่อเนื่อง (คะแนนเต็ม 5 คะแนน)',
          rating: evaluation.q1_2_rating,
          score: evaluation.q1_2_score,
          maxScore: 5,
          note: evaluation.q1_2_note,
        },
        {
          num: 3,
          code: '1.3',
          text: 'เซลล์ผลักดันสินค้า HVA และ SVP พร้อมอุปกรณ์กลุ่มหลังคา ฝา , ฝ้า และกลุ่มไม้ต่างๆ (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q1_3_rating,
          score: evaluation.q1_3_score,
          maxScore: 2.5,
          note: evaluation.q1_3_note,
        },
        {
          num: 4,
          code: '1.4',
          text: 'มีการเก็บราคาสินค้าคู่แข่ง (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q1_4_rating,
          score: evaluation.q1_4_score,
          maxScore: 2.5,
          note: evaluation.q1_4_note,
        },
      ],
    },
    {
      category: 'การรับผิดชอบในหน้าที่ (คะแนนเต็ม 5 คะแนน)',
      subtotal: `${evaluation.section2Score} / 5 คะแนน`,
      items: [
        {
          num: 5,
          code: '2.1',
          text: 'มีการแจ้งล่วงหน้า ในการจัดส่งสินค้าตรงต่อเวลาตามที่นัดหมาย และอัพเดตเมื่อเกิดปัญหา เช่น ขนส่งอาจล่าช้า เป็นต้น (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q2_1_rating,
          score: evaluation.q2_1_score,
          maxScore: 2.5,
          note: evaluation.q2_1_note,
        },
        {
          num: 6,
          code: '2.2',
          text: 'มีความรับผิดชอบในการติดตามแก้ไขปัญหา และการจัดการปัญหาเฉพาะหน้าได้รวดเร็ว (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q2_2_rating,
          score: evaluation.q2_2_score,
          maxScore: 2.5,
          note: evaluation.q2_2_note,
        },
      ],
    },
    {
      category: 'ความประทับใจ (คะแนนเต็ม 5 คะแนน)',
      subtotal: `${evaluation.section3Score} / 5 คะแนน`,
      items: [
        {
          num: 7,
          code: '3.1',
          text: 'เข้าพบอย่างสม่ำเสมอ เดือนละ 2-3 ครั้ง ติดตามอัพเดตยอดขายและสิทธิประโยชน์อย่างต่อเนื่อง (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q3_1_rating,
          score: evaluation.q3_1_score,
          maxScore: 2.5,
          note: evaluation.q3_1_note,
        },
        {
          num: 8,
          code: '3.2',
          text: 'ใส่ใจบริการ มีท่าทีสุภาพเรียบร้อย เป็นกันเอง (คะแนนเต็ม 2.5 คะแนน)',
          rating: evaluation.q3_2_rating,
          score: evaluation.q3_2_score,
          maxScore: 2.5,
          note: evaluation.q3_2_note,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden my-auto print:max-h-none print:shadow-none print:rounded-none">
        {/* Modal Top Bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">เอกสารแบบประเมินความพึงพอใจ การทำงานของทีมขาย</h3>
              <p className="text-xs text-slate-300">รหัสเอกสาร: {evaluation.evaluationCode} • คะแนนเต็ม 30 คะแนน</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (ตรงตามภาพ 100%) */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans text-slate-900 text-xs print:p-2 print:overflow-visible bg-white">
          {/* Header Title */}
          <div className="text-center mb-4">
            <h1 className="text-base sm:text-lg font-bold tracking-tight">แบบประเมินความพึงพอใจ</h1>
            <h2 className="text-sm sm:text-base font-bold">การทำงานของทีมขาย</h2>
            <div className="text-[11px] text-slate-500 mt-0.5">{companyName}</div>
          </div>

          {/* Top Info Row: Scoring Scale on Left, Channel on Right (ตรงตามภาพที่ 1) */}
          <div className="flex justify-between items-start mb-4 text-xs">
            <div className="border border-slate-300 rounded p-2 bg-slate-50/50 text-[11px] space-y-0.5">
              <div className="font-bold text-slate-800">เกณฑ์การให้คะแนน</div>
              <div>5 = ดีมาก</div>
              <div>4 = ดี</div>
              <div>3 = ปานกลาง</div>
              <div>2 = ควรปรับปรุง</div>
              <div>1 = ไม่ผ่าน</div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-800 mb-1">ช่องทางให้ข้อมูล</div>
              <div className="border border-slate-300 rounded overflow-hidden inline-block text-left text-[11px]">
                <div className={`px-3 py-0.5 border-b border-slate-200 flex items-center gap-1.5 ${evaluation.contactChannel === 'phone' ? 'bg-slate-200 font-bold' : ''}`}>
                  <span className="font-mono">{evaluation.contactChannel === 'phone' ? '✓' : '□'}</span>
                  <span>โทรศัพท์</span>
                </div>
                <div className={`px-3 py-0.5 border-b border-slate-200 flex items-center gap-1.5 ${evaluation.contactChannel === 'line' ? 'bg-slate-200 font-bold' : ''}`}>
                  <span className="font-mono">{evaluation.contactChannel === 'line' ? '✓' : '□'}</span>
                  <span>Line</span>
                </div>
                <div className={`px-3 py-0.5 flex items-center gap-1.5 ${evaluation.contactChannel === 'onsite' ? 'bg-emerald-100 font-bold text-emerald-950' : ''}`}>
                  <span className="font-mono">{evaluation.contactChannel === 'onsite' ? '✓' : '□'}</span>
                  <span>Onsite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Rep Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded mb-4 text-[11px]">
            <div><span className="font-semibold text-slate-600">ร้านค้า / ลูกค้า:</span> <span className="font-bold text-slate-900">{evaluation.customerName}</span></div>
            <div><span className="font-semibold text-slate-600">สาขา:</span> <span className="font-bold text-emerald-800">{evaluation.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก'}</span></div>
            <div><span className="font-semibold text-slate-600">พนักงานขาย:</span> <span className="font-bold text-blue-900">{evaluation.salesRepName}</span></div>
            <div><span className="font-semibold text-slate-600">ผู้ให้ข้อมูล / เบอร์ติดต่อ:</span> {evaluation.evaluatorName}</div>
            <div><span className="font-semibold text-slate-600">วันที่ประเมิน:</span> {evaluation.date}</div>
            {evaluation.checkInLocation && (
              <div>
                <span className="font-semibold text-slate-600">Check-in พิกัด:</span>{' '}
                <span className={`font-bold ${evaluation.checkInLocation.isWithinRange ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {evaluation.checkInLocation.distanceKm} กม. ({evaluation.checkInLocation.isWithinRange ? 'ไม่เกิน 5 กม.' : 'เกิน 5 กม.'})
                </span>
              </div>
            )}
          </div>

          {/* ส่วนที่ 1: ตารางข้อคำถามและคะแนน */}
          <div className="border border-slate-400 rounded overflow-hidden mb-4">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="p-1.5 w-10 text-center border-r border-slate-300">ลำดับที่</th>
                  <th className="p-1.5 border-r border-slate-300">หัวข้อการประเมิน</th>
                  <th colSpan={5} className="p-1.5 text-center border-r border-slate-300">คะแนน</th>
                  <th className="p-1.5 w-28 text-center border-r border-slate-300">คะแนนที่ได้</th>
                  <th className="p-1.5 min-w-[120px]">หมายเหตุ</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-300 text-[10px] text-center font-bold text-slate-600">
                  <th className="border-r border-slate-300"></th>
                  <th className="border-r border-slate-300"></th>
                  <th className="w-7 border-r border-slate-300">5</th>
                  <th className="w-7 border-r border-slate-300">4</th>
                  <th className="w-7 border-r border-slate-300">3</th>
                  <th className="w-7 border-r border-slate-300">2</th>
                  <th className="w-7 border-r border-slate-300">1</th>
                  <th className="border-r border-slate-300"></th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {questionsList.map((sec) => (
                  <React.Fragment key={sec.category}>
                    <tr className="bg-slate-100/80 font-bold">
                      <td colSpan={9} className="p-1.5 text-slate-900 bg-slate-200/60 font-bold">
                        <div className="flex justify-between items-center">
                          <span>{sec.category}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            รวมหมวด: {sec.subtotal}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {sec.items.map((item) => (
                      <tr key={item.num} className="hover:bg-slate-50/50">
                        <td className="p-1.5 text-center border-r border-slate-300 font-semibold">{item.num}</td>
                        <td className="p-1.5 border-r border-slate-300">{item.text}</td>
                        {[5, 4, 3, 2, 1].map((val) => (
                          <td key={val} className="p-1 text-center border-r border-slate-300">
                            {item.rating === val ? (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px]">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 font-light">•</span>
                            )}
                          </td>
                        ))}
                        <td className="p-1.5 text-center border-r border-slate-300 font-bold text-emerald-800">
                          {item.score} / {item.maxScore}
                        </td>
                        <td className="p-1.5 text-slate-700 text-[10px]">{item.note || '-'}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* สรุปคะแนน (คะแนนเต็ม 30 คะแนน) */}
          <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-950">
                ⭐ คะแนนประเมินรวมทั้ง 3 หมวด (คะแนนเต็ม 30 คะแนน):
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                หมวด 1: {evaluation.section1Score}/20 • หมวด 2: {evaluation.section2Score}/5 • หมวด 3: {evaluation.section3Score}/5 • ร้อยละความพึงพอใจ: {evaluation.percentageScore}%
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-700">{evaluation.totalScore ?? evaluation.rawTotalScore ?? 30}</span>
              <span className="text-xs font-bold text-emerald-900"> / 30.00</span>
              <div className="text-[10px] font-bold text-emerald-600">{evaluation.gradeLabel}</div>
            </div>
          </div>

          {/* ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback (ตรงตามภาพที่ 2) */}
          <div className="border border-slate-400 rounded overflow-hidden mb-4">
            <div className="bg-slate-200 p-1.5 font-bold text-slate-900 border-b border-slate-400 text-xs">
              ส่วนที่ 2: ข้อมูลราคาสินค้า & Feedback โปรโมชั่นต่างๆ
            </div>

            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-center font-bold">
                  <th className="p-1.5 w-8 border-r border-slate-300">#</th>
                  <th className="p-1.5 text-left border-r border-slate-300">หัวข้อ / รายการสินค้า</th>
                  <th className="p-1.5 w-14 border-r border-slate-300">สูงกว่า</th>
                  <th className="p-1.5 w-14 border-r border-slate-300">ต่ำกว่า</th>
                  <th className="p-1.5 w-14 border-r border-slate-300">ใกล้เคียง</th>
                  <th className="p-1.5 w-14 border-r border-slate-300">ไม่แน่ใจ</th>
                  <th className="p-1.5 w-24 border-r border-slate-300">ไม่สามารถเปิดเผยได้</th>
                  <th className="p-1.5 min-w-[100px]">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* ข้อ 1 ภาพรวมราคา */}
                <tr className="bg-blue-50/40 font-medium">
                  <td className="p-1.5 text-center border-r border-slate-300 font-bold">1</td>
                  <td className="p-1.5 border-r border-slate-300">
                    ข้อมูลราคาสินค้า&feedback โปรโมชั่นต่างๆ โดยรวมอยู่ในเกณฑ์เปรียบเทียบกับของคู่แข่ง
                  </td>
                  {['higher', 'lower', 'similar', 'uncertain', 'undisclosed'].map((opt) => (
                    <td key={opt} className="p-1 text-center border-r border-slate-300">
                      {evaluation.feedbackPriceAndPromo === opt ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px]">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-300 font-light">•</span>
                      )}
                    </td>
                  ))}
                  <td className="p-1.5 text-[10px] text-slate-700">{evaluation.feedbackPriceNote || '-'}</td>
                </tr>

                {/* ตารางเก็บราคาสินค้า อย่างน้อย 3 รายการ */}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={8} className="p-1.5 bg-slate-100 text-slate-900">
                    เก็บราคาสินค้า อย่างน้อย 3 รายการ (เทียบกับคู่แข่ง เช่น ไทวัสดุ)
                  </td>
                </tr>

                {(evaluation.competitorPriceItems || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-1.5 text-center border-r border-slate-300 text-slate-500">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-medium">{item.productName}</td>
                    {['higher', 'lower', 'similar', 'uncertain', 'undisclosed'].map((opt) => (
                      <td key={opt} className="p-1 text-center border-r border-slate-300">
                        {item.comparison === opt ? (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px]">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 font-light">•</span>
                        )}
                      </td>
                    ))}
                    <td className="p-1.5 text-[10px] text-slate-700">{item.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* สินค้าที่ลูกค้าสนใจ และอยากให้ทางบริษัทฯ ทำราคาให้คือ (5 รายการ ตามภาพที่ 2) */}
          <div className="border border-slate-300 rounded p-3 mb-4 bg-slate-50/40 text-[11px] space-y-1">
            <div className="font-bold text-slate-800 mb-1">
              สินค้าที่ลูกค้าสนใจ และอยากให้ทางบริษัทฯ ทำราคาให้คือ:
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-500 w-4">{i + 1}.</span>
                <span className="flex-1 border-b border-dotted border-slate-400 py-0.5 text-slate-800 font-medium">
                  {evaluation.interestedProducts?.[i] || '-'}
                </span>
              </div>
            ))}
          </div>

          {/* ข้อเสนอแนะเพิ่มเติม (ตามภาพที่ 2) */}
          <div className="border border-slate-300 rounded p-3 mb-4 text-[11px]">
            <div className="font-bold text-slate-800 mb-1">ข้อเสนอแนะเพิ่มเติม:</div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded min-h-[50px] whitespace-pre-wrap text-slate-800">
              {evaluation.additionalFeedback || '-'}
            </div>
          </div>

          {/* ภาพถ่ายหน้างาน & พิกัด GPS (ถ้ามี) */}
          {((evaluation.photos && evaluation.photos.length > 0) || evaluation.checkInLocation) && (
            <div className="border border-slate-300 rounded p-3 mb-4 text-[11px] bg-slate-50/50">
              <div className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>📷 ข้อมูลหน้างาน & พิกัด Check-in:</span>
                {evaluation.checkInLocation && (
                  <span className="text-[10px] text-slate-600">
                    พิกัด: {evaluation.checkInLocation.lat}, {evaluation.checkInLocation.lng} • ระยะห่าง: {evaluation.checkInLocation.distanceKm} กม. ({evaluation.checkInLocation.isWithinRange ? 'อยู่ในเกณฑ์ <=5 กม.' : 'เกิน 5 กม.'})
                  </span>
                )}
              </div>
              {evaluation.photos && evaluation.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {evaluation.photos.map((p, idx) => (
                    <div key={idx} className="border border-slate-300 rounded overflow-hidden aspect-video bg-white">
                      <img src={p} alt={`หน้างาน ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ส่วนลงนาม ผู้ให้ข้อมูล / ร้าน / วันที่ (มุมล่างขวา ตามภาพที่ 2) */}
          <div className="flex justify-end pt-3 text-[11px]">
            <div className="text-left space-y-1.5 min-w-[240px]">
              <div>
                <span className="font-semibold text-slate-700">ผู้ให้ข้อมูล / เบอร์ติดต่อ: </span>
                <span className="font-bold text-slate-900 underline decoration-dotted">{evaluation.signatureName || evaluation.evaluatorName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">ร้าน: </span>
                <span className="font-bold text-slate-900 underline decoration-dotted">{evaluation.customerName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">วันที่: </span>
                <span className="font-bold text-slate-900">{evaluation.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
