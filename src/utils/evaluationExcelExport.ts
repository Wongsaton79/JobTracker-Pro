import * as XLSX from 'xlsx';
import { SalesEvaluation } from '../types';
import { formatChannelLabel, formatPriceComparisonLabel, formatFutureIntent } from './evaluationCalculator';

export function exportEvaluationsToExcel(evaluations: SalesEvaluation[], companyName: string = 'JobTracker Pro'): boolean {
  try {
    if (!evaluations || evaluations.length === 0) {
      alert('ไม่มีข้อมูลแบบประเมินสำหรับส่งออก');
      return false;
    }

    // 1. Data Sheet: All Evaluations
    const rows = evaluations.map((item, index) => {
      const priceComp = formatPriceComparisonLabel(item.overallPriceComparison).label;
      const intent = formatFutureIntent(item.futurePurchaseIntent).label;
      const channel = formatChannelLabel(item.contactChannel);

      const competitorSummary = (item.competitorPriceItems || [])
        .map((p) => `${p.productName} (เรา: ${p.ourPrice ?? '-'} / คู่แข่ง: ${p.competitorPrice ?? '-'} [${p.competitorSource || '-'}])`)
        .join('; ');

      return {
        'ลำดับ': index + 1,
        'รหัสใบประเมิน': item.evaluationCode,
        'วันที่ประเมิน': item.date,
        'ชื่อลูกค้า / ร้านค้า': item.customerName,
        'เบอร์โทรศัพท์': item.customerPhone || '-',
        'ตำแหน่งผู้ให้ข้อมูล': item.customerPosition || '-',
        'ผู้ประเมิน': item.evaluatorName,
        'พนักงานขายที่ถูกประเมิน': item.salesRepName,
        'แผนก / ทีมขาย': item.salesDepartment || '-',
        'ช่องทางการติดต่อ': channel,
        'รหัสงานที่เชื่อมโยง': item.jobCode || '-',
        'โครงการ / สถานที่': item.projectName || '-',

        // Scores
        '1.1 ความสุภาพและมารยาท (เต็ม 5)': item.scorePoliteness,
        '1.2 ความตรงต่อเวลา (เต็ม 5)': item.scorePunctuality,
        '1.3 ความกระตือรือร้น (เต็ม 5)': item.scoreEnthusiasm,
        '2.1 ความรู้ในสินค้า (เต็ม 5)': item.scoreProductKnowledge,
        '2.2 คำแนะนำและแก้ปัญหา (เต็ม 5)': item.scoreConsultation,
        '2.3 แจ้งโปรโมชั่น/ข่าวสาร (เต็ม 5)': item.scorePromotionUpdate,
        '3.1 ความรวดเร็วใบเสนอราคา (เต็ม 5)': item.scoreQuotationSpeed,
        '3.2 การติดตามสถานะ/จัดส่ง (เต็ม 5)': item.scoreFollowUp,
        '3.3 ประสานงานแก้ปัญหา (เต็ม 5)': item.scoreProblemSolving,
        '4.1 เงื่อนไขชำระเงิน/เครดิต (เต็ม 5)': item.scorePaymentTerms,

        // Totals
        'คะแนนรวม (เต็ม 50)': item.totalScore,
        'คะแนนเฉลี่ย (เต็ม 5.0)': item.averageScore,
        'ร้อยละความพึงพอใจ (%)': `${item.percentageScore}%`,
        'ระดับผลการประเมิน': item.gradeLabel,

        // Competitor price analysis
        'ระดับราคาเทียบกับคู่แข่ง': priceComp,
        'สรุปรายการเปรียบเทียบราคาคู่แข่ง': competitorSummary || '-',

        // Feedback
        'ความประสงค์สั่งซื้อในอนาคต': intent,
        'จุดเด่นที่ประทับใจ': item.strengthsFeedback || '-',
        'สิ่งที่ต้องการให้ปรับปรุง': item.improvementFeedback || '-',
        'ผู้ลงนามรับรอง': item.signatureName || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const columnKeys = Object.keys(rows[0] || {});
    worksheet['!cols'] = columnKeys.map((key) => {
      const maxLen = Math.max(
        key.length * 2,
        ...rows.map((r: any) => String(r[key] || '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'แบบประเมินทีมขาย');

    // 2. Summary Sheet: Average scores by category and sales rep
    const salesRepMap = new Map<string, { count: number; totalScore: number; totalAvg: number }>();
    evaluations.forEach((ev) => {
      const rep = ev.salesRepName || 'ไม่ระบุ';
      const existing = salesRepMap.get(rep) || { count: 0, totalScore: 0, totalAvg: 0 };
      existing.count += 1;
      existing.totalScore += ev.totalScore;
      existing.totalAvg += ev.averageScore;
      salesRepMap.set(rep, existing);
    });

    const summaryRows = Array.from(salesRepMap.entries()).map(([rep, stat], idx) => ({
      'ลำดับ': idx + 1,
      'พนักงานขาย': rep,
      'จำนวนแบบประเมิน (ครั้ง)': stat.count,
      'คะแนนเฉลี่ยรวม (เต็ม 5.0)': Number((stat.totalAvg / stat.count).toFixed(2)),
      'ร้อยละเฉลี่ย (%)': `${Math.round((stat.totalScore / (stat.count * 50)) * 100)}%`,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปรายพนักงานขาย');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `แบบประเมินความพึงพอใจทีมขาย_${dateStr}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export Excel failed:', error);
    return false;
  }
}
