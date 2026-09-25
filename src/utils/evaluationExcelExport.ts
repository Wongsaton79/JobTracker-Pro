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
        'สาขา': item.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก',
        'ชื่อร้านค้า / ลูกค้า': item.customerName,
        'เบอร์โทรศัพท์': item.customerPhone || '-',
        'ผู้ให้ข้อมูล / เบอร์ติดต่อ': item.evaluatorName,
        'พนักงานขายที่ถูกประเมิน': item.salesRepName,
        'ช่องทางให้ข้อมูล': channel,
        'โครงการ / หน้างาน': item.projectName || item.jobCode || '-',
        'Check-in พิกัด GPS': item.checkInLocation
          ? `${item.checkInLocation.lat}, ${item.checkInLocation.lng}${item.checkInLocation.address ? ` (${item.checkInLocation.address})` : ''}`
          : '-',
        'จำนวนรูปถ่ายหน้างาน': item.photos?.length || 0,

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

        // คะแนนรวมเต็ม 30 คะแนน
        '⭐ คะแนนประเมินรวมทั้ง 3 หมวด (คะแนนเต็ม 30 คะแนน)': item.totalScore ?? item.rawTotalScore ?? 30,
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

    // 2. Summary Sheet: Average scores by sales rep (เต็ม 30 คะแนน)
    const salesRepMap = new Map<string, { count: number; totalScore30: number; sec1: number; sec2: number; sec3: number }>();
    evaluations.forEach((ev) => {
      const rep = ev.salesRepName || 'ไม่ระบุ';
      const existing = salesRepMap.get(rep) || { count: 0, totalScore30: 0, sec1: 0, sec2: 0, sec3: 0 };
      existing.count += 1;
      existing.totalScore30 += (ev.totalScore ?? ev.rawTotalScore ?? 30);
      existing.sec1 += (ev.section1Score || 0);
      existing.sec2 += (ev.section2Score || 0);
      existing.sec3 += (ev.section3Score || 0);
      salesRepMap.set(rep, existing);
    });

    const repSummaryRows = Array.from(salesRepMap.entries()).map(([rep, stat], idx) => ({
      'ลำดับ': idx + 1,
      'พนักงานขาย': rep,
      'จำนวนแบบประเมิน (ใบ)': stat.count,
      '⭐ คะแนนเฉลี่ย (เต็ม 30 คะแนน)': Number((stat.totalScore30 / stat.count).toFixed(2)),
      'หมวด 1 สื่อสาร/บริการ (เต็ม 20)': Number((stat.sec1 / stat.count).toFixed(2)),
      'หมวด 2 รับผิดชอบ (เต็ม 5)': Number((stat.sec2 / stat.count).toFixed(2)),
      'หมวด 3 ประทับใจ (เต็ม 5)': Number((stat.sec3 / stat.count).toFixed(2)),
      'ร้อยละความพึงพอใจเฉลี่ย (%)': `${Math.round(((stat.totalScore30 / stat.count) / 30) * 100)}%`,
    }));

    const repSheet = XLSX.utils.json_to_sheet(repSummaryRows);
    XLSX.utils.book_append_sheet(workbook, repSheet, 'สรุปแยกตามพนักงาน (เต็ม30)');

    // 3. Summary Sheet: By Branch (สาขา ตาก vs สาขา แม่สอด)
    const branchMap = new Map<string, { count: number; totalScore30: number }>();
    evaluations.forEach((ev) => {
      const br = ev.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก';
      const existing = branchMap.get(br) || { count: 0, totalScore30: 0 };
      existing.count += 1;
      existing.totalScore30 += (ev.totalScore ?? ev.rawTotalScore ?? 30);
      branchMap.set(br, existing);
    });

    const branchSummaryRows = Array.from(branchMap.entries()).map(([br, stat], idx) => ({
      'ลำดับ': idx + 1,
      'สาขา': br,
      'จำนวนแบบประเมิน (ใบ)': stat.count,
      '⭐ คะแนนเฉลี่ย (เต็ม 30 คะแนน)': Number((stat.totalScore30 / stat.count).toFixed(2)),
      'ร้อยละความพึงพอใจเฉลี่ย (%)': `${Math.round(((stat.totalScore30 / stat.count) / 30) * 100)}%`,
    }));
    const branchSheet = XLSX.utils.json_to_sheet(branchSummaryRows);
    XLSX.utils.book_append_sheet(workbook, branchSheet, 'สรุปแยกตามสาขา');

    // 4. Summary Sheet: By Customer / Store
    const custMap = new Map<string, { count: number; totalScore30: number; rep: string; branch: string }>();
    evaluations.forEach((ev) => {
      const cName = ev.customerName.trim() || 'ไม่ระบุ';
      const existing = custMap.get(cName) || { count: 0, totalScore30: 0, rep: ev.salesRepName, branch: ev.branch === 'แม่สอด' ? 'สาขา แม่สอด' : 'สาขา ตาก' };
      existing.count += 1;
      existing.totalScore30 += (ev.totalScore ?? ev.rawTotalScore ?? 30);
      custMap.set(cName, existing);
    });

    const custSummaryRows = Array.from(custMap.entries()).map(([cName, stat], idx) => ({
      'ลำดับ': idx + 1,
      'ชื่อร้านค้า / ลูกค้า': cName,
      'สาขา': stat.branch,
      'พนักงานขาย': stat.rep,
      'จำนวนแบบประเมิน (ใบ)': stat.count,
      '⭐ คะแนนเฉลี่ย (เต็ม 30 คะแนน)': Number((stat.totalScore30 / stat.count).toFixed(2)),
      'ร้อยละความพึงพอใจเฉลี่ย (%)': `${Math.round(((stat.totalScore30 / stat.count) / 30) * 100)}%`,
    }));
    const custSheet = XLSX.utils.json_to_sheet(custSummaryRows);
    XLSX.utils.book_append_sheet(workbook, custSheet, 'สรุปแยกตามร้านค้า');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `แบบประเมินความพึงพอใจทีมขาย_30คะแนน_${dateStr}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export Excel failed:', error);
    return false;
  }
}
