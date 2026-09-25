import React from 'react';
import { SalesEvaluation } from '../../types';
import { formatChannelLabel, formatPriceComparisonLabel, formatFutureIntent } from '../../utils/evaluationCalculator';
import { Printer, Download, X, Award, Check } from 'lucide-react';

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

  const channelText = formatChannelLabel(evaluation.contactChannel);
  const priceComp = formatPriceComparisonLabel(evaluation.overallPriceComparison);
  const futureIntent = formatFutureIntent(evaluation.futurePurchaseIntent);

  const questions = [
    {
      category: 'หมวดที่ 1: ด้านบุคลิกภาพและการให้บริการ',
      items: [
        { code: '1.1', title: 'ความสุภาพ อ่อนน้อม การแต่งกาย และกิริยามารยาทในการติดต่อประสานงาน', score: evaluation.scorePoliteness },
        { code: '1.2', title: 'ความตรงต่อเวลานัดหมาย และความสม่ำเสมอในการเข้าพบ/ติดตามงาน', score: evaluation.scorePunctuality },
        { code: '1.3', title: 'ความกระตือรือร้น ความใส่ใจ และความพร้อมในการให้บริการด้วยความเต็มใจ', score: evaluation.scoreEnthusiasm },
      ],
    },
    {
      category: 'หมวดที่ 2: ด้านความรู้เกี่ยวกับสินค้าและคำแนะนำ',
      items: [
        { code: '2.1', title: 'ความรู้ ความเข้าใจในรายละเอียด คุณสมบัติ และสเปกสินค้าเป็นอย่างดี', score: evaluation.scoreProductKnowledge },
        { code: '2.2', title: 'ความสามารถในการให้คำแนะนำ ตอบข้อซักถาม และเสนอแนะสินค้าที่ตรงความต้องการ', score: evaluation.scoreConsultation },
        { code: '2.3', title: 'การแจ้งข้อมูลข่าวสาร โปรโมชั่น สิทธิประโยชน์ และสินค้าใหม่ๆ อย่างครบถ้วน', score: evaluation.scorePromotionUpdate },
      ],
    },
    {
      category: 'หมวดที่ 3: ด้านความรวดเร็วและการประสานงาน',
      items: [
        { code: '3.1', title: 'ความรวดเร็วและถูกต้องในการจัดทำและส่งใบเสนอราคา (Quotation)', score: evaluation.scoreQuotationSpeed },
        { code: '3.2', title: 'การติดตามสถานะคำสั่งซื้อ การจัดส่งสินค้า และการรายงานความคืบหน้า', score: evaluation.scoreFollowUp },
        { code: '3.3', title: 'การประสานงานแก้ไขปัญหาเฉพาะหน้า และการดูแลหลังการขายอย่างจริงใจ', score: evaluation.scoreProblemSolving },
      ],
    },
    {
      category: 'หมวดที่ 4: ความพึงพอใจด้านเงื่อนไขทางการค้า',
      items: [
        { code: '4.1', title: 'ความเหมาะสมของเงื่อนไขการชำระเงิน ความยืดหยุ่น และระยะเวลาเครดิตเทอม', score: evaluation.scorePaymentTerms },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto print:max-h-none print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">เอกสารแบบประเมินความพึงพอใจการทำงานของทีมขาย</h3>
              <p className="text-xs text-slate-300">รหัสเอกสาร: {evaluation.evaluationCode} • ระบบดิจิทัลลดการใช้กระดาษ (Paperless)</p>
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
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div id="printable-evaluation" className="p-6 sm:p-10 overflow-y-auto font-sans text-slate-800 text-xs sm:text-sm print:p-0 print:overflow-visible">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{companyName}</h1>
                <h2 className="text-base sm:text-lg font-bold text-blue-800 mt-1">แบบประเมินความพึงพอใจ การทำงานของทีมขาย</h2>
                <p className="text-xs text-slate-500">Sales Representative & Commercial Satisfaction Evaluation Report</p>
              </div>
              <div className="text-right border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-xs">
                <div><span className="font-semibold text-slate-600">เลขที่เอกสาร:</span> <span className="font-bold text-slate-900">{evaluation.evaluationCode}</span></div>
                <div><span className="font-semibold text-slate-600">วันที่ประเมิน:</span> {evaluation.date}</div>
                {evaluation.jobCode && <div><span className="font-semibold text-slate-600">อ้างอิงงาน:</span> {evaluation.jobCode}</div>}
              </div>
            </div>
          </div>

          {/* Section: General Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 text-sm">ข้อมูลทั่วไปของลูกค้าและพนักงานขาย</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div><span className="font-semibold text-slate-600">ชื่อลูกค้า / ร้านค้า / โครงการ:</span> <span className="font-bold text-slate-900">{evaluation.customerName}</span></div>
              <div><span className="font-semibold text-slate-600">พนักงานขายที่ถูกประเมิน:</span> <span className="font-bold text-blue-900">{evaluation.salesRepName}</span></div>
              <div><span className="font-semibold text-slate-600">เบอร์โทรศัพท์ติดต่อ:</span> {evaluation.customerPhone || '-'}</div>
              <div><span className="font-semibold text-slate-600">แผนก / ทีมขาย:</span> {evaluation.salesDepartment || '-'}</div>
              <div><span className="font-semibold text-slate-600">ผู้ให้ข้อมูล / ตำแหน่ง:</span> {evaluation.evaluatorName} {evaluation.customerPosition ? `(${evaluation.customerPosition})` : ''}</div>
              <div><span className="font-semibold text-slate-600">ช่องทางการติดต่อเข้าพบ:</span> {channelText}</div>
            </div>
          </div>

          {/* Rating Scale Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 bg-blue-50/60 border border-blue-200 px-3 py-2 rounded-lg mb-4">
            <span className="font-semibold text-blue-900">เกณฑ์การให้คะแนน:</span>
            <span>5 = พึงพอใจมากที่สุด</span>
            <span>4 = พึงพอใจมาก</span>
            <span>3 = ปานกลาง</span>
            <span>2 = ควรปรับปรุง</span>
            <span>1 = ต้องปรับปรุงเร่งด่วน</span>
          </div>

          {/* Table: Questions and Scores */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs border-b border-slate-300">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">ข้อ</th>
                  <th className="py-2.5 px-3 font-bold">หัวข้อการประเมิน</th>
                  <th className="py-2.5 px-2 font-bold w-10 text-center">5</th>
                  <th className="py-2.5 px-2 font-bold w-10 text-center">4</th>
                  <th className="py-2.5 px-2 font-bold w-10 text-center">3</th>
                  <th className="py-2.5 px-2 font-bold w-10 text-center">2</th>
                  <th className="py-2.5 px-2 font-bold w-10 text-center">1</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-200">
                {questions.map((sec) => (
                  <React.Fragment key={sec.category}>
                    <tr className="bg-slate-50/80 font-bold text-slate-900">
                      <td colSpan={7} className="py-2 px-3 bg-blue-50/40 text-blue-950 font-bold text-[11px]">
                        {sec.category}
                      </td>
                    </tr>
                    {sec.items.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-medium text-slate-500">{item.code}</td>
                        <td className="py-2 px-3 text-slate-800">{item.title}</td>
                        {[5, 4, 3, 2, 1].map((val) => (
                          <td key={val} className="py-2 px-2 text-center">
                            {item.score === val ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-slate-300 font-light">•</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section: Competitor Price Comparison (ตารางเปรียบเทียบราคาคู่แข่ง) */}
          <div className="border border-slate-300 rounded-xl p-4 mb-6 bg-white">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">การประเมินราคาและความสามารถในการแข่งขันในตลาด</h4>
                <p className="text-[11px] text-slate-500">เปรียบเทียบระดับราคาสินค้ากับคู่แข่งในตลาด เช่น ไทวัสดุ, โกลบอลเฮ้าส์ หรือร้านค้าท้องถิ่น</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-600 mr-2">ภาพรวมระดับราคา:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                  {priceComp.label}
                </span>
              </div>
            </div>

            {/* Price Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="p-2 border-r border-slate-200 w-10 text-center">ลำดับ</th>
                    <th className="p-2 border-r border-slate-200">รายการสินค้าตัวอย่าง</th>
                    <th className="p-2 border-r border-slate-200 text-right w-24">ราคาเรา (บาท)</th>
                    <th className="p-2 border-r border-slate-200 text-right w-28">ราคาคู่แข่ง (บาท)</th>
                    <th className="p-2 border-r border-slate-200 text-center w-28">ผลการเทียบราคา</th>
                    <th className="p-2 border-r border-slate-200">แหล่งอ้างอิงคู่แข่ง</th>
                    <th className="p-2">ข้อสังเกต/ความเห็น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(evaluation.competitorPriceItems || []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{item.productName}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-semibold text-emerald-700">
                        {item.ourPrice !== undefined ? `${item.ourPrice.toLocaleString()} ฿` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-700">
                        {item.competitorPrice !== undefined ? `${item.competitorPrice.toLocaleString()} ฿` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.comparison === 'lower'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.comparison === 'higher'
                            ? 'bg-amber-100 text-amber-800'
                            : item.comparison === 'similar'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.comparison === 'lower' ? 'ถูกกว่าคู่แข่ง' : item.comparison === 'higher' ? 'สูงกว่าคู่แข่ง' : item.comparison === 'similar' ? 'ใกล้เคียงกัน' : 'ไม่แน่ใจ'}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{item.competitorSource || '-'}</td>
                      <td className="p-2 text-slate-600">{item.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Score Summary & Customer Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <h4 className="font-bold text-slate-900 mb-2 text-xs">สรุปผลการประเมินภาพรวม</h4>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shadow-md">
                  <span className="text-xl font-black">{evaluation.averageScore}</span>
                  <span className="text-[10px]">เต็ม 5.0</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    คะแนนรวม: {evaluation.totalScore} / 50 ({evaluation.percentageScore}%)
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    ระดับความพึงพอใจ: {evaluation.gradeLabel}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    ความประสงค์สั่งซื้อครั้งต่อไป: <span className="font-semibold text-slate-800">{futureIntent.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 mb-1 text-xs">ข้อคิดเห็นและข้อเสนอแนะ</h4>
                {evaluation.strengthsFeedback && (
                  <p className="text-xs text-slate-700 mb-1">
                    <span className="font-semibold text-emerald-800">จุดเด่นที่ประทับใจ:</span> {evaluation.strengthsFeedback}
                  </p>
                )}
                {evaluation.improvementFeedback && (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-amber-800">สิ่งที่ต้องการให้ปรับปรุง:</span> {evaluation.improvementFeedback}
                  </p>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
                <span>ลงนามแบบดิจิทัล (Paperless Verification)</span>
                <span className="font-bold text-slate-800 underline decoration-dotted">{evaluation.signatureName || evaluation.evaluatorName}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
            แบบประเมินนี้จัดทำผ่านระบบอิเล็กทรอนิกส์เพื่อความสะดวกรวดเร็วและลดการใช้กระดาษ (100% Paperless Digital System) • บันทึกเวลา: {new Date(evaluation.createdAt).toLocaleString('th-TH')}
          </div>
        </div>
      </div>
    </div>
  );
};
