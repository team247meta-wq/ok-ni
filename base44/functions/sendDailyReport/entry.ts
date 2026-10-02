import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendTelegramPhoto } from '../../shared/telegram.ts';
import { renderReportPng, dmy } from './render.ts';

// Công thức chuẩn của app: chỉ nhóm tổ (chế độ "full") mới tính phí.
const feeOf = (amount, rate) => (amount || 0) * ((rate ?? 0) / 100);
const hasFee = (g) => !g || !g.mode || g.mode === 'full';

// Dựng ảnh báo cáo thu chi (tháng hiện tại) và gửi vào nhóm Telegram.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const [groups, allTx] = await Promise.all([
      base44.asServiceRole.entities.Group.list('created_date', 200),
      base44.asServiceRole.entities.Transaction.list('-date', 2000),
    ]);

    const tx = allTx.filter((t) => !t.deleted_at);
    const byId = new Map(groups.map((g) => [g.id, g]));

    // Tháng hiện tại theo giờ Việt Nam (UTC+7).
    const vn = new Date(Date.now() + 7 * 3600 * 1000);
    const ym = vn.toISOString().slice(0, 7);
    const monthTx = tx.filter((t) => String(t.date || '').slice(0, 7) === ym);

    // --- bảng tổng cộng theo nhóm (nhóm tổ) ---
    const groupRows = groups.filter(hasFee).map((g) => {
      const mine = monthTx.filter((t) => t.group_id === g.id);
      const totalIn = mine.filter((t) => t.type === 'in').reduce((s, t) => s + (t.amount || 0), 0);
      const totalOut = mine.filter((t) => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0);
      const fee = feeOf(totalIn, g.fee_rate ?? 6) + feeOf(totalOut, g.out_fee_rate ?? 6);
      return { name: g.name, in: totalIn, out: totalOut, fee, after: totalIn - fee - totalOut };
    });

    const groupTotals = groupRows.reduce(
      (a, r) => ({
        totalIn: a.totalIn + r.in,
        totalOut: a.totalOut + r.out,
        fee: a.fee + r.fee,
        afterFee: a.afterFee + r.after,
      }),
      { totalIn: 0, totalOut: 0, fee: 0, afterFee: 0 }
    );
    const payTotal = groupRows.reduce((s, r) => s + r.after, 0);

    // --- khối theo ngày ---
    const dayMap = new Map();
    monthTx.forEach((t) => {
      const key = String(t.date || '').slice(0, 10);
      const row = dayMap.get(key) || { date: key, totalIn: 0, totalOut: 0, feeIn: 0, feeOut: 0 };
      const g = byId.get(t.group_id);
      const applies = hasFee(g);
      if (t.type === 'in') {
        row.totalIn += t.amount || 0;
        if (applies) row.feeIn += feeOf(t.amount, g?.fee_rate ?? 6);
      } else {
        row.totalOut += t.amount || 0;
        if (applies) row.feeOut += feeOf(t.amount, g?.out_fee_rate ?? 6);
      }
      dayMap.set(key, row);
    });

    const dayList = Array.from(dayMap.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
    const dayRows = dayList.map((r) => ({
      name: dmy(r.date),
      in: r.totalIn,
      out: r.totalOut,
      after: r.totalIn - r.feeIn - r.totalOut - r.feeOut,
    }));
    const dayTotals = dayList.reduce(
      (a, r) => ({
        totalIn: a.totalIn + r.totalIn,
        totalOut: a.totalOut + r.totalOut,
        afterFee: a.afterFee + (r.totalIn - r.feeIn - r.totalOut - r.feeOut),
      }),
      { totalIn: 0, totalOut: 0, afterFee: 0 }
    );

    const updatedAt = new Date().toISOString();
    const monthLabel = `Tháng ${ym.slice(5, 7)}/${ym.slice(0, 4)}`;

    const png = await renderReportPng({
      title: 'BÁO CÁO THU CHI',
      subtitle: `Tổ 2 Tuyển dụng · ${monthLabel}`,
      groups: groupRows,
      groupTotals,
      days: dayRows,
      dayTotals,
      payTotal,
      updatedAt,
    });

    const blob = new Blob([png], { type: 'image/png' });
    const result = await sendTelegramPhoto({
      photo: blob,
      caption: `BÁO CÁO THU CHI · Tổ 2 Tuyển dụng · ${monthLabel}`,
    });

    return Response.json({
      ok: true,
      month: ym,
      groups: groupRows.length,
      transactions: monthTx.length,
      message_id: result?.message_id,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}