import * as XLSX from 'xlsx';
import { SalesEvaluation } from '../types';
import { formatChannelText, formatPriceComparisonLabel } from './evaluationCalculator';

export function exportEvaluationsToExcel(evaluations: SalesEvaluation[], companyName: string = 'JobTracker Pro'): boolean {
  try {
    if (!evaluations || evaluations.length === 0) {
      alert('ไม่มีข้อมูลแบบประเมินสำหรับส่งออก');
      return false;
    }

    // 1. Data Sheet: All Evaluations
    const rows = evaluations.map((item, index) => {
      const priceComp = formatPriceComparisonLabel(item.feedbackPriceAndPromo).label;
      const channel = formatChannelText(item.contactChannel);

      const competitorSummary = (item.competitorPriceItems || [])
        .map((p) => `${p.productName} [${formatPriceComparisonLabel(p.comparison).label}]${p.note ? ` (${p.note})` : ''}`)
        .join('; ');

      const interestedSummary = (item.interestedProducts || []).filter(Boolean).join('; ');

      return {
        'ลำดับ': index + 1,
        'รหัสใบประเมิน': item.evaluationCode,
        'วันที่ประเมิน': item.date,
        'ชื่อร้านค้า / ลูกค้า': item.customerName,
        'เบอร์โทรศัพท์': item.customerPhone || '-',
        'ผู้ให้ข้อมูล / ผู้ลงนาม': item.evaluatorName,
        'พนักงานขายที่ถูกประเมิน': item.salesRepName,
        'ช่องทางให้ข้อมูล': channel,
        'โครงการ / หน้างาน': item.projectName || item.jobCode || '-',

        // หมวดที่ 1 (เต็ม 20)
        '1.1 ให้ข้อมูลสินค้า ราคา โปรโมชั่น รวดเร็ว (เต็ม 10)': item.q1_1_score,
        '1.1 หมายเหตุ': item.q1_1_note || '-',
        '1.2 เอาใจใส่ ติดตามงาน เข้าเยี่ยมสม่ำเสมอ (เต็ม 5)': item.q1_2_score,
        '1.2 หมายเหตุ': item.q1_2_note || '-',
        '1.3 ผลักดันสินค้า HVA, SVP หลังคา ฝา ฝ้า ไม้ (เต็ม 2.5)': item.q1_3_score,
        '1.3 หมายเหตุ': item.q1_3_note || '-',
        '1.4 มีการเก็บราคาสินค้าคู่แข่ง (เต็ม 2.5)': item.q1_4_score,
        '1.4 หมายเหตุ': item.q1_4_note || '-',
        'รวมหมวด 1: การสื่อสารและการบริการ (เต็ม 20)': item.section1Score,

        // หมวดที่ 2 (เต็ม 5)
        '2.1 แจ้งล่วงหน้า จัดส่งตรงเวลา อัพเดตปัญหา (เต็ม 2.5)': item.q2_1_score,
        '2.1 หมายเหตุ': item.q2_1_note || '-',
        '2.2 รับผิดชอบแก้ไขปัญหาเฉพาะหน้ารวดเร็ว (เต็ม 2.5)': item.q2_2_score,
        '2.2 หมายเหตุ': item.q2_2_note || '-',
        'รวมหมวด 2: การรับผิดชอบในหน้าที่ (เต็ม 5)': item.section2Score,

        // หมวดที่ 3 (เต็ม 5)
        '3.1 เข้าพบสม่ำเสมอ เดือนละ 2-3 ครั้ง อัพเดตยอด (เต็ม 2.5)': item.q3_1_score,
        '3.1 หมายเหตุ': item.q3_1_note || '-',
        '3.2 ใส่ใจบริการ สุภาพเรียบร้อย เป็นกันเอง (เต็ม 2.5)': item.q3_2_score,
        '3.2 หมายเหตุ': item.q3_2_note || '-',
        'รวมหมวด 3: ความประทับใจ (เต็ม 5)': item.section3Score,

        // คะแนนรวม & อัตราส่วนเต็ม 20 คะแนน
        'คะแนนรวมดิบ (เต็ม 30 คะแนน)': item.rawTotalScore,
        '⭐ คะแนนประเมินเทียบเต็ม 20 คะแนน (คะแนนเต็ม 20)': item.scoreOutOf20,
        'ร้อยละความพึงพอใจ (%)': `${item.percentageScore}%`,
        'ระดับผลการประเมิน': item.gradeLabel,

        // ส่วนที่ 2
        'ราคาสินค้า & Feedback โปรโมชั่น เทียบกับคู่แข่ง': priceComp,
        'หมายเหตุราคา & โปรโมชั่น': item.feedbackPriceNote || '-',
        'สรุปรายการเปรียบเทียบราคาสินค้าคู่แข่ง': competitorSummary || '-',
        'สินค้าที่ลูกค้าสนใจอยากให้ทำราคาให้': interestedSummary || '-',
        'ข้อเสนอแนะเพิ่มเติม': item.additionalFeedback || '-',
        'ลายเซ็นผู้ให้ข้อมูล': item.signatureName || item.evaluatorName,
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

    // 2. Summary Sheet: Average scores by sales rep out of 20
    const salesRepMap = new Map<string, { count: number; totalScore20: number; totalRaw: number }>();
    evaluations.forEach((ev) => {
      const rep = ev.salesRepName || 'ไม่ระบุ';
      const existing = salesRepMap.get(rep) || { count: 0, totalScore20: 0, totalRaw: 0 };
      existing.count += 1;
      existing.totalScore20 += ev.scoreOutOf20;
      existing.totalRaw += ev.rawTotalScore;
      salesRepMap.set(rep, existing);
    });

    const summaryRows = Array.from(salesRepMap.entries()).map(([rep, stat], idx) => ({
      'ลำดับ': idx + 1,
      'พนักงานขาย': rep,
      'จำนวนแบบประเมิน (ใบ)': stat.count,
      '⭐ คะแนนเฉลี่ย (เต็ม 20 คะแนน)': Number((stat.totalScore20 / stat.count).toFixed(2)),
      'คะแนนเฉลี่ยดิบ (เต็ม 30 คะแนน)': Number((stat.totalRaw / stat.count).toFixed(2)),
      'ร้อยละเฉลี่ย (%)': `${Math.round(((stat.totalScore20 / stat.count) / 20) * 100)}%`,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปคะแนนเต็ม20รายบุคคล');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `แบบประเมินความพึงพอใจทีมขาย_${dateStr}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export Excel failed:', error);
    return false;
  }
}
