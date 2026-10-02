import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Mail, FileSpreadsheet, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import LedgerTable from "@/components/ledger/LedgerTable";
import SingleSideTable from "@/components/ledger/SingleSideTable";
import GroupTabs from "@/components/ledger/GroupTabs";
import StatCards from "@/components/ledger/StatCards";
import DailySummaryTable from "@/components/ledger/DailySummaryTable";
import GroupBreakdownTable from "@/components/ledger/GroupBreakdownTable";
import UsdtTable from "@/components/ledger/UsdtTable";
import { Image } from "@/components/ui/image";
import ControlPanel from "@/components/ledger/ControlPanel";
import PeriodFilter from "@/components/ledger/PeriodFilter";
import HistoryTable from "@/components/ledger/HistoryTable";
import EditTransactionDialog from "@/components/ledger/EditTransactionDialog";
import SendReportDialog from "@/components/ledger/SendReportDialog";
import ProfitTable from "@/components/ledger/ProfitTable";
import ProfitMonthlyTable from "@/components/ledger/ProfitMonthlyTable";
import ProfitDailyTable from "@/components/ledger/ProfitDailyTable";
import InOutTable from "@/components/ledger/InOutTable";
import PayoutTable from "@/components/ledger/PayoutTable";
import PayoutQuickForm from "@/components/ledger/PayoutQuickForm";
import CopyImageButton from "@/components/ledger/CopyImageButton";
import SendTelegramButton from "@/components/ledger/SendTelegramButton";
import { parseLedgerPaste, parseAmount } from "@/lib/parseLedgerPaste";
import { buildProfitRows, filterProfitRows, profitTotals, buildMonthlyProfit, buildDailyProfit } from "@/lib/profitFromFees";
import { inferGroupMode } from "@/lib/groupMode";
import { buildReportData } from "@/lib/buildReport";
import { feeOf, hasFee, afterFeeOf } from "@/lib/calc";

const SUMMARY_ID = "__summary__";
const HISTORY_ID = "__history__";
const INOUT_ID = "__inout__";
const PAYOUT_ID = "__payout__";

export default function Home() {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "in", amount: "", usdt: "", note: "", date: new Date().toISOString().slice(0, 10) });
  const [period, setPeriod] = useState({ mode: "all", from: "", to: "" });
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [inoutRate, setInoutRate] = useState({ in: 6, out: 6 });
  const [inoutEntries, setInoutEntries] = useState([]);
  const [payoutEntries, setPayoutEntries] = useState([]);
  const [outEntries, setOutEntries] = useState([]);
  const sheetTimer = useRef(null);
  const syncPromiseRef = useRef(null);
  const pendingSyncRef = useRef(false);
  const inoutSettingId = useRef(null);
  const contentRef = useRef(null);
  // Vùng chụp ảnh: chỉ khung bảng của mục đang xem.
  const frameRef = useRef(null);

  const isSummary = activeId === SUMMARY_ID;
  const isHistory = activeId === HISTORY_ID;
  const isInOut = activeId === INOUT_ID;
  const isPayout = activeId === PAYOUT_ID;
  const isAdmin = me?.role === "admin";
  const activeGroup = useMemo(() => groups.find((g) => g.id === activeId), [groups, activeId]);
  const feeRate = activeGroup?.fee_rate ?? 6;
  const outFeeRate = activeGroup?.out_fee_rate ?? 6;
  const expenseOnly = !isSummary && activeGroup?.mode === "expense";
  const profitOnly = !isSummary && activeGroup?.mode === "profit";
  const usdtOnly = !isSummary && activeGroup?.mode === "usdt";

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
    runSync().catch(() => {});
    (async () => {
      try {
        const rows = await base44.entities.Setting.filter({ key: "inout_fee" });
        if (rows[0]) {
          inoutSettingId.current = rows[0].id;
          const parsed = JSON.parse(rows[0].value || "{}");
          setInoutRate({ in: parsed.in ?? 6, out: parsed.out ?? 6 });
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let gs = await base44.entities.Group.list("created_date", 100);
        if (gs.length === 0) {
          const created = await base44.entities.Group.create({ name: "TỔ 2 TUYỂN DỤNG", fee_rate: 6 });
          gs = [created];
          const all = await base44.entities.Transaction.list("-date", 500);
          const orphans = all.filter((t) => !t.group_id).map((t) => ({ id: t.id, group_id: created.id }));
          if (orphans.length) await base44.entities.Transaction.bulkUpdate(orphans);
        }
        setGroups(gs);
        setActiveId(gs[0].id);
      } catch (e) {
        toast({ title: "Lỗi tải nhóm", variant: "destructive" });
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      setLoading(true);
      try {
        if (isInOut) {
          setInoutEntries(await base44.entities.InOutEntry.list("-date", 1000));
        } else if (isPayout) {
          setPayoutEntries(await base44.entities.PayoutEntry.list("-date", 1000));
          setOutEntries(await base44.entities.PayoutOutEntry.list("-date", 1000));
        } else {
          const activeMode = groups.find((g) => g.id === activeId)?.mode;
          const data =
            isSummary || isHistory || activeMode === "profit"
              ? await base44.entities.Transaction.list("-date", 1000)
              : await base44.entities.Transaction.filter({ group_id: activeId }, "-date", 500);
          setTransactions(data);
        }
      } catch (e) {
        toast({ title: "Lỗi tải dữ liệu", variant: "destructive" });
      }
      setLoading(false);
    })();
  }, [activeId]);

  const active = useMemo(
    () => (isInOut ? inoutEntries : isPayout ? payoutEntries : transactions).filter((t) => !t.deleted_at),
    [transactions, inoutEntries, payoutEntries, isInOut, isPayout]
  );

  const view = useMemo(() => {
    if (period.mode === "all") return active;
    const key = (t) => (period.mode === "day" ? t.date || "" : (t.date || "").slice(0, 7));
    return active.filter(
      (t) => (!period.from || key(t) >= period.from) && (!period.to || key(t) <= period.to)
    );
  }, [active, period]);

  const historyRows = useMemo(
    () =>
      transactions
        .filter((t) => t.deleted_at || (t.history || []).length > 0)
        .sort((a, b) => ((a.updated_date || "") < (b.updated_date || "") ? 1 : -1)),
    [transactions]
  );

  const ins = useMemo(() => view.filter((t) => t.type === "in"), [view]);
  const outs = useMemo(() => view.filter((t) => t.type === "out"), [view]);

  const inoutFeeIn = useMemo(
    () => ins.reduce((s, t) => s + feeOf(t.amount, inoutRate.in), 0),
    [ins, inoutRate]
  );

  const inoutFeeOut = useMemo(
    () => outs.reduce((s, t) => s + feeOf(t.amount, inoutRate.out), 0),
    [outs, inoutRate]
  );

  const dailyRows = useMemo(() => {
    const byId = new Map(groups.map((g) => [g.id, g]));
    const map = new Map();
    view.forEach((t) => {
      const key = t.date || "";
      const row = map.get(key) || { date: key, totalIn: 0, totalOut: 0, feeIn: 0, feeOut: 0 };
      const g = byId.get(t.group_id);
      const applies = hasFee(g);
      if (t.type === "in") {
        row.totalIn += t.amount || 0;
        if (applies) row.feeIn += feeOf(t.amount, g?.fee_rate ?? 6);
      } else {
        row.totalOut += t.amount || 0;
        if (applies) row.feeOut += feeOf(t.amount, g?.out_fee_rate ?? 6);
      }
      map.set(key, row);
    });
    return Array.from(map.values())
      .map((r) => ({ ...r, afterFee: afterFeeOf(r) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [view, groups]);

  const groupRows = useMemo(() => {
    const map = new Map(
      groups.map((g) => [
        g.id,
        {
          id: g.id,
          name: g.name,
          rate: g.fee_rate ?? 6,
          outRate: g.out_fee_rate ?? 6,
          mode: g.mode,
          totalIn: 0,
          totalOut: 0,
        },
      ])
    );
    view.forEach((t) => {
      const r = map.get(t.group_id);
      if (!r) return;
      if (t.type === "in") r.totalIn += t.amount || 0;
      else r.totalOut += t.amount || 0;
    });
    return Array.from(map.values())
      .filter((r) => !r.mode || r.mode === "full")
      .map((r) => {
        const fee = hasFee(r) ? feeOf(r.totalIn, r.rate) + feeOf(r.totalOut, r.outRate) : 0;
        return { ...r, fee, afterFee: r.totalIn - fee - r.totalOut };
      });
  }, [groups, view]);

  const totalIn = useMemo(() => ins.reduce((s, t) => s + (t.amount || 0), 0), [ins]);
  const usdtTotal = useMemo(() => ins.reduce((s, t) => s + (t.usdt_out || 0), 0), [ins]);
  const totalOut = useMemo(() => outs.reduce((s, t) => s + (t.amount || 0), 0), [outs]);
  const maxOut = useMemo(() => outs.reduce((m, t) => Math.max(m, t.amount || 0), 0), [outs]);
  const maxIn = useMemo(() => ins.reduce((m, t) => Math.max(m, t.amount || 0), 0), [ins]);
  const feeIn = useMemo(() => {
    const byId = new Map(groups.map((g) => [g.id, g]));
    return ins.reduce((s, t) => {
      const g = byId.get(t.group_id);
      if (!hasFee(g)) return s;
      return s + feeOf(t.amount, g?.fee_rate ?? 6);
    }, 0);
  }, [ins, groups]);

  const feeOut = useMemo(() => {
    const byId = new Map(groups.map((g) => [g.id, g]));
    return outs.reduce((s, t) => {
      const g = byId.get(t.group_id);
      if (!hasFee(g)) return s;
      return s + feeOf(t.amount, g?.out_fee_rate ?? 6);
    }, 0);
  }, [outs, groups]);

  const fee = feeIn + feeOut;
  const afterFee = afterFeeOf({ totalIn, feeIn, totalOut, feeOut });
  const inoutAfterFee = afterFeeOf({ totalIn, feeIn: inoutFeeIn, totalOut, feeOut: inoutFeeOut });

  const profit = useMemo(() => {
    const { rows } = buildProfitRows(transactions.filter((t) => !t.deleted_at), groups);
    const filtered = filterProfitRows(rows, period);
    return { rows: filtered, totals: profitTotals(filtered) };
  }, [transactions, groups, period]);

  const profitMonthly = useMemo(() => buildMonthlyProfit(profit.rows), [profit]);
  const profitDaily = useMemo(() => buildDailyProfit(profit.rows), [profit]);

  const profitItems = useMemo(
    () =>
      profit.rows.map((r) => ({
        id: `${r.date}-${r.groupId}`,
        date: r.date,
        amount: r.fee,
        note: r.groupName,
      })),
    [profit]
  );

  const report = useMemo(
    () =>
      buildReportData({
        isSummary,
        isHistory,
        isInOut,
        isPayout,
        inoutRate,
        expenseOnly,
        profitOnly,
        activeGroup,
        groups,
        ins,
        outs,
        dailyRows,
        historyRows,
        profitRows: profit.rows,
        profitTotals: profit.totals,
        totals: { totalIn, totalOut, fee, feeIn, feeOut, afterFee },
        feeRate,
        outFeeRate,
      }),
    [isSummary, isHistory, isInOut, inoutRate, expenseOnly, profitOnly, activeGroup, groups, ins, outs, dailyRows, historyRows, totalIn, totalOut, fee, feeIn, feeOut, afterFee, feeRate, outFeeRate, profit]
  );

  // Không chạy chồng nhau: thay đổi đến trong lúc đang đồng bộ sẽ được
  // gộp vào lần chạy kế tiếp, tránh ghi đè bằng dữ liệu cũ.
  const runSync = async () => {
    if (syncPromiseRef.current) {
      pendingSyncRef.current = true;
      return syncPromiseRef.current;
    }
    const task = (async () => {
      const res = await base44.functions.invoke("syncLedgerToSheet", {});
      if (res.data?.url) setSheetUrl(res.data.url);
      return res.data?.url || null;
    })();
    syncPromiseRef.current = task;
    try {
      return await task;
    } finally {
      syncPromiseRef.current = null;
      if (pendingSyncRef.current) {
        pendingSyncRef.current = false;
        runSync().catch(() => {});
      }
    }
  };

  // Đồng bộ gần như tức thì: chỉ gộp các thay đổi trong 200ms liền nhau
  // (gõ tên nhóm, nhập nhanh nhiều dòng) rồi đẩy lên Sheet ngay.
  const pushToSheet = () => {
    clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(() => {
      runSync().catch(() => {});
    }, 200);
  };

  const openSheet = async () => {
    const tab = window.open("", "_blank");
    setSheetLoading(true);
    try {
      const url = sheetUrl || (await runSync());
      if (url && tab) tab.location.href = url;
      else if (tab) tab.close();
    } catch (e) {
      if (tab) tab.close();
      toast({ title: "Không mở được Google Sheet", variant: "destructive" });
    }
    setSheetLoading(false);
  };

  const patchGroup = async (patch) => {
    const next = patch.name === undefined ? patch : { ...patch, mode: inferGroupMode(patch.name) };
    setGroups((prev) => prev.map((g) => (g.id === activeId ? { ...g, ...next } : g)));
    try {
      await base44.entities.Group.update(activeId, next);
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi lưu cấu hình nhóm", variant: "destructive" });
    }
  };

  const saveInoutRate = async (next) => {
    setInoutRate(next);
    const value = JSON.stringify(next);
    try {
      if (inoutSettingId.current) {
        await base44.entities.Setting.update(inoutSettingId.current, { value });
      } else {
        const created = await base44.entities.Setting.create({ key: "inout_fee", value });
        inoutSettingId.current = created.id;
      }
    } catch (e) {
      toast({ title: "Lỗi lưu phí nhập xuất", variant: "destructive" });
    }
  };

  const addInOut = async ({ type, note, amount, date }) => {
    if (!amount || amount <= 0) {
      toast({ title: "Nhập số tiền hợp lệ", variant: "destructive" });
      return false;
    }
    try {
      const created = await base44.entities.InOutEntry.create({ type, amount, note, date });
      setInoutEntries((prev) => [created, ...prev]);
      toast({ title: type === "in" ? "Đã thêm khoản nhập" : "Đã thêm khoản xuất" });
      pushToSheet();
      return true;
    } catch (e) {
      toast({ title: "Lỗi khi thêm", variant: "destructive" });
      return false;
    }
  };

  const addPayout = async ({ type, note, amount, date, group_id }) => {
    if (!note || !note.trim()) {
      toast({
        title: "Nhập nội dung",
        description: "Cả khoản nhận và khoản xuất đều phải có nội dung.",
        variant: "destructive",
      });
      return false;
    }
    if (!amount || amount <= 0) {
      toast({ title: "Nhập số tiền hợp lệ", variant: "destructive" });
      return false;
    }
    try {
      const created = await base44.entities.PayoutEntry.create({
        type,
        amount,
        note: note.trim(),
        date,
        group_id: group_id || "",
      });
      setPayoutEntries((prev) => [created, ...prev]);
      toast({ title: type === "in" ? "Đã thêm khoản nhận" : "Đã thêm khoản xuất đi" });
      return true;
    } catch (e) {
      toast({ title: "Lỗi khi thêm", variant: "destructive" });
      return false;
    }
  };

  // Sổ xuất đi ghi riêng: chỉ lưu những khoản tự ghi ở form này.
  const addPayoutOut = async ({ note, amount, date, group_id }) => {
    if (!note || !note.trim()) {
      toast({ title: "Nhập nội dung", variant: "destructive" });
      return false;
    }
    if (!amount || amount <= 0) {
      toast({ title: "Nhập số tiền hợp lệ", variant: "destructive" });
      return false;
    }
    try {
      const created = await base44.entities.PayoutOutEntry.create({
        amount,
        note: note.trim(),
        date,
        group_id: group_id || "",
      });
      setOutEntries((prev) => [created, ...prev]);
      toast({ title: "Đã ghi khoản xuất đi" });
      return true;
    } catch (e) {
      toast({ title: "Lỗi khi ghi", variant: "destructive" });
      return false;
    }
  };

  const updatePayoutOut = async (id, patch) => {
    try {
      await base44.entities.PayoutOutEntry.update(id, patch);
      setOutEntries((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      toast({ title: "Đã lưu thay đổi" });
      return true;
    } catch (e) {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
      return false;
    }
  };

  const removePayoutOut = async (id) => {
    if (!window.confirm("Xoá khoản xuất đi này?")) return;
    try {
      await base44.entities.PayoutOutEntry.delete(id);
      setOutEntries((prev) => prev.filter((x) => x.id !== id));
      toast({ title: "Đã xoá khoản xuất đi" });
    } catch (e) {
      toast({ title: "Lỗi khi xoá", variant: "destructive" });
    }
  };

  const addGroup = async () => {
    try {
      const name = `NHÓM ${groups.length + 1}`;
      const created = await base44.entities.Group.create({ name, fee_rate: 6, mode: inferGroupMode(name) });
      setGroups((prev) => [...prev, created]);
      setActiveId(created.id);
      toast({ title: "Đã thêm nhóm mới" });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi thêm nhóm", variant: "destructive" });
    }
  };

  const deleteGroup = async () => {
    if (groups.length <= 1) {
      toast({ title: "Cần giữ ít nhất một nhóm", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Xoá nhóm "${activeGroup.name}" và toàn bộ giao dịch của nhóm?`)) return;
    try {
      await base44.entities.Transaction.deleteMany({ group_id: activeId });
      await base44.entities.Group.delete(activeId);
      const rest = groups.filter((g) => g.id !== activeId);
      setGroups(rest);
      setActiveId(rest[0].id);
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi xoá nhóm", variant: "destructive" });
    }
  };

  const add = async () => {
    const amt = parseAmount(form.amount);
    if (!amt || amt <= 0) { toast({ title: "Nhập số tiền hợp lệ", variant: "destructive" }); return; }
    try {
      const payload = {
        type: usdtOnly ? "in" : expenseOnly ? "out" : profitOnly ? "in" : form.type,
        amount: amt,
        note: form.note,
        date: form.date,
        group_id: activeId,
      };
      if (usdtOnly) payload.usdt_out = parseAmount(form.usdt);
      const created = await base44.entities.Transaction.create(payload);
      setTransactions((prev) => [created, ...prev]);
      setForm({ ...form, amount: "", usdt: "", note: "" });
      toast({ title: "Đã thêm giao dịch" });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi thêm", variant: "destructive" });
    }
  };

  const importMany = async (text) => {
    const { records, invalid } = parseLedgerPaste(text, {
      defaultDate: form.date,
      mode: expenseOnly ? "expense" : profitOnly ? "profit" : "full",
    });
    if (records.length === 0) {
      toast({ title: "Không đọc được dòng nào hợp lệ", variant: "destructive" });
      return false;
    }
    try {
      const created = await base44.entities.Transaction.bulkCreate(
        records.map((r) => ({ ...r, group_id: activeId }))
      );
      setTransactions((prev) => [...created, ...prev]);
      toast({
        title: `Đã nhập ${created.length} giao dịch${invalid ? `, bỏ qua ${invalid} dòng lỗi` : ""}`,
      });
      pushToSheet();
      return true;
    } catch (e) {
      toast({ title: "Lỗi khi nhập", variant: "destructive" });
      return false;
    }
  };

  const remove = async (id) => {
    const stamp = new Date().toISOString();
    try {
      if (isPayout) {
        await base44.entities.PayoutEntry.update(id, { deleted_at: stamp });
        setPayoutEntries((prev) => prev.map((t) => (t.id === id ? { ...t, deleted_at: stamp } : t)));
        toast({ title: "Đã xoá giao dịch" });
        return;
      }
      if (isInOut) {
        await base44.entities.InOutEntry.update(id, { deleted_at: stamp });
        setInoutEntries((prev) => prev.map((t) => (t.id === id ? { ...t, deleted_at: stamp } : t)));
        toast({ title: "Đã xoá giao dịch" });
        return;
      }
      await base44.entities.Transaction.update(id, { deleted_at: stamp });
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, deleted_at: stamp } : t)));
      toast({ title: "Đã xoá giao dịch", description: "Vào tab LỊCH SỬ để khôi phục lại." });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi xoá", variant: "destructive" });
    }
  };

  const saveEdit = async (patch) => {
    if (isPayout) {
      const bookPatch = { type: patch.type, amount: patch.amount, note: patch.note, date: patch.date };
      try {
        await base44.entities.PayoutEntry.update(editing.id, bookPatch);
        setPayoutEntries((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...bookPatch } : x)));
        setEditing(null);
        toast({ title: "Đã lưu thay đổi" });
      } catch (e) {
        toast({ title: "Lỗi khi lưu", variant: "destructive" });
      }
      return;
    }
    if (isInOut) {
      const bookPatch = { type: patch.type, amount: patch.amount, note: patch.note, date: patch.date };
      try {
        await base44.entities.InOutEntry.update(editing.id, bookPatch);
        setInoutEntries((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...bookPatch } : x)));
        setEditing(null);
        toast({ title: "Đã lưu thay đổi" });
      } catch (e) {
        toast({ title: "Lỗi khi lưu", variant: "destructive" });
      }
      return;
    }
    const t = transactions.find((x) => x.id === editing.id);
    const entry = { type: t.type, amount: t.amount, usdt_out: t.usdt_out, note: t.note, date: t.date, at: new Date().toISOString() };
    const history = [...(t.history || []), entry].slice(-10);
    try {
      await base44.entities.Transaction.update(t.id, { ...patch, history });
      setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...patch, history } : x)));
      setEditing(null);
      toast({ title: "Đã lưu thay đổi", description: "Vào tab LỊCH SỬ để khôi phục lại." });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi lưu", variant: "destructive" });
    }
  };

  const restore = async (t) => {
    try {
      if (t.deleted_at) {
        await base44.entities.Transaction.update(t.id, { deleted_at: "" });
        setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, deleted_at: "" } : x)));
      } else {
        const hist = t.history || [];
        const last = hist[hist.length - 1];
        if (!last) return;
        const entry = { type: t.type, amount: t.amount, usdt_out: t.usdt_out, note: t.note, date: t.date, at: new Date().toISOString() };
        const history = [...hist.slice(0, -1), entry];
        const patch = { type: last.type, amount: last.amount, usdt_out: last.usdt_out, note: last.note, date: last.date, history };
        await base44.entities.Transaction.update(t.id, patch);
        setTransactions((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
      }
      toast({ title: "Đã khôi phục lại như trước" });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi khôi phục", variant: "destructive" });
    }
  };

  const purge = async (id) => {
    if (!window.confirm("Xoá vĩnh viễn giao dịch này? Không thể khôi phục lại.")) return;
    try {
      await base44.entities.Transaction.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Đã xoá vĩnh viễn" });
      pushToSheet();
    } catch (e) {
      toast({ title: "Lỗi khi xoá", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    let rows;
    let fileName;
    if (isSummary) {
      rows = [["Ngày", "Tiền vào", "Tiền ra", "Sau phí"]];
      dailyRows.forEach((r) => rows.push([r.date, r.totalIn, r.totalOut, r.afterFee]));
      rows.push([]);
      rows.push(["Tổng vào", totalIn]);
      rows.push(["Tổng ra", totalOut]);
      rows.push(["Sau phí", afterFee]);
      fileName = "tong-cong-ty";
    } else if (isInOut) {
      rows = [["Loại", "Nội dung", "Số tiền", "Phí", "Ngày"]];
      ins.forEach((t) => rows.push(["Tiền vào", t.note || "", t.amount, Math.round((t.amount || 0) * (inoutRate.in / 100)), t.date]));
      outs.forEach((t) => rows.push(["Tiền ra", t.note || "", t.amount, Math.round((t.amount || 0) * (inoutRate.out / 100)), t.date]));
      rows.push([]);
      rows.push(["Tổng vào", totalIn]);
      rows.push([`Phí vào (${inoutRate.in}%)`, inoutFeeIn]);
      rows.push(["Tổng ra", totalOut]);
      rows.push([`Phí ra (${inoutRate.out}%)`, inoutFeeOut]);
      rows.push(["Sau phí", inoutAfterFee]);
      fileName = "ra-tien-mat";
    } else if (isPayout) {
      rows = [["Loại", "Nội dung", "Số tiền", "Ngày"]];
      ins.forEach((t) => rows.push(["Nhận", t.note || "", t.amount, t.date]));
      outs.forEach((t) => rows.push(["Xuất đi", t.note || "", t.amount, t.date]));
      rows.push([]);
      rows.push(["Tổng nhận", totalIn]);
      rows.push(["Tổng xuất đi", totalOut]);
      rows.push(["Chênh lệch", totalIn - totalOut]);
      fileName = "tien-xuat-di";
    } else if (usdtOnly) {
      rows = [["Tên", "U xuất", "Lãi", "Ngày"]];
      view.forEach((t) => rows.push([t.note || "", t.usdt_out || 0, t.amount || 0, t.date]));
      rows.push([]);
      rows.push(["Tổng U xuất", usdtTotal]);
      rows.push(["Tổng lãi", totalIn]);
      fileName = (activeGroup?.name || "loi-nhuan-usdt").replace(/\s+/g, "-");
    } else if (profitOnly) {
      rows = [["Ngày", "Nhóm", "Mức phí %", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"]];
      profit.rows.forEach((r) => rows.push([r.date, r.groupName, r.rate, r.totalIn, r.totalOut, r.fee]));
      rows.push([]);
      rows.push(["Tổng vào", profit.totals.totalIn]);
      rows.push(["Tổng ra", profit.totals.totalOut]);
      rows.push(["Tổng lợi nhuận (tổng phí các nhóm)", profit.totals.fee]);
      rows.push([]);
      rows.push(["LỢI NHUẬN THEO NGÀY"]);
      rows.push(["Ngày", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"]);
      profitDaily.rows.forEach((r) => rows.push([r.date, r.totalIn, r.totalOut, r.fee]));
      rows.push([]);
      rows.push(["LỢI NHUẬN CẢ THÁNG"]);
      rows.push(["Tháng", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"]);
      profitMonthly.rows.forEach((r) => rows.push([r.month, r.totalIn, r.totalOut, r.fee]));
      fileName = (activeGroup?.name || "loi-nhuan").replace(/\s+/g, "-");
    } else {
      rows = [["Loại", "Số tiền", "Ghi chú", "Ngày"]];
      view.forEach((t) => rows.push([t.type === "in" ? "Tiền vào" : "Tiền ra", t.amount, t.note || "", t.date]));
      rows.push([]);
      rows.push(["Tổng vào", totalIn]);
      rows.push([`Phí vào (${feeRate}%)`, feeIn]);
      rows.push(["Tổng ra", totalOut]);
      rows.push([`Phí ra (${outFeeRate}%)`, feeOut]);
      rows.push(["Sau phí", afterFee]);
      fileName = (activeGroup?.name || "so-quy").replace(/\s+/g, "-");
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${fileName}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const captureTitle = isSummary
    ? "TỔNG CÔNG TY"
    : isPayout
    ? "TIỀN XUẤT ĐI"
    : isInOut
    ? "RA TIỀN MẶT"
    : isHistory
    ? "LỊCH SỬ THAY ĐỔI"
    : activeGroup?.name || "SỔ QUỸ";
  const captureSubtitle = period.mode === "all"
    ? "Toàn bộ thời gian"
    : period.mode === "day"
    ? `Từ ${period.from} đến ${period.to}`
    : `Từ tháng ${period.from} đến ${period.to}`;

  return (
    <div className="min-h-screen bg-[#E7ECF4] text-[#0F172A] font-body">
      {/* Top bar */}
      <header className="sticky top-0 z-20 h-14 bg-white border-b border-[#C9D5E6] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="https://media.base44.com/images/public/6aaf8198d70750feca5bf597/c0d39cd65_aecch.jpg"
            alt="USDT"
            className="w-11 h-11 rounded-xl ring-1 ring-[#C9D5E6] shadow-sm shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-extrabold tracking-tight truncate">TIỀN LẠI VỀ VỚI NGƯỜI HIỀN</h1>
            <p className="text-[12px] font-medium text-[#5B6B85] truncate">
              {isSummary
                ? "TỔNG CÔNG TY · Tất cả các nhóm"
                : isPayout
                ? "TIỀN XUẤT ĐI · Nhận tiền và xuất tiền"
                : isInOut
                ? "RA TIỀN MẶT · Sổ riêng"
                : isHistory
                ? "LỊCH SỬ · Khôi phục thay đổi"
                : `${activeGroup?.name || "—"} · ${usdtOnly ? "U xuất & lãi" : expenseOnly ? "Chi tiêu" : profitOnly ? "Lợi nhuận" : `Phí ${feeRate}%`}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block font-mono text-[11px] tabular-nums text-[#7B8AA3]">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
          <Button
            asChild
            variant="outline"
            className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EAF0FE] hover:text-[#1D4ED8] rounded-lg font-medium"
          >
            <Link to="/cong-ty">
              <Building2 size={15} className="mr-2" />
              <span className="hidden sm:inline">Dashboard công ty</span>
            </Link>
          </Button>
          {sheetUrl ? (
            <Button
              asChild
              variant="outline"
              className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EAF7F1] hover:text-[#0E9F6E] rounded-lg font-medium"
            >
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" onClick={() => pushToSheet()}>
                <FileSpreadsheet size={15} className="mr-2" />
                <span className="hidden sm:inline">Google Sheet</span>
              </a>
            </Button>
          ) : (
            <Button
              onClick={openSheet}
              disabled={sheetLoading}
              variant="outline"
              className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EAF7F1] hover:text-[#0E9F6E] rounded-lg font-medium"
            >
              <FileSpreadsheet size={15} className="mr-2" />
              <span className="hidden sm:inline">{sheetLoading ? "Đang đồng bộ…" : "Google Sheet"}</span>
            </Button>
          )}
          <CopyImageButton
            targetRef={frameRef}
            fileName={captureTitle.replace(/\s+/g, "-").toLowerCase()}
            title={captureTitle}
            subtitle={captureSubtitle}
          />
          <SendTelegramButton
            targetRef={frameRef}
            title={captureTitle}
            subtitle={captureSubtitle}
          />
          <Button
            onClick={() => setReportOpen(true)}
            className="bg-[#0E9F6E] text-white hover:bg-[#0B8A5E] font-semibold rounded-lg"
          >
            <Mail size={15} className="mr-2" /> <span className="hidden sm:inline">Gửi báo cáo</span>
          </Button>
          <Button
            onClick={exportCSV}
            variant="outline"
            className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#FFF6E8] hover:text-[#B45309] rounded-lg font-medium"
          >
            <Download size={15} className="mr-2" /> <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
        </div>
      </header>

      <div className="px-3 sm:px-4 pt-3">
        <GroupTabs
          groups={groups}
          activeId={activeId}
          onSelect={setActiveId}
          onAdd={addGroup}
          summaryActive={isSummary}
          onSelectSummary={() => setActiveId(SUMMARY_ID)}
          historyActive={isHistory}
          onSelectHistory={() => setActiveId(HISTORY_ID)}
          inOutActive={isInOut}
          onSelectInOut={() => setActiveId(INOUT_ID)}
          payoutActive={isPayout}
          onSelectPayout={() => setActiveId(PAYOUT_ID)}
          canAdd={isAdmin}
        />
      </div>

      <div className="flex flex-col-reverse lg:flex-row">
        <ControlPanel
          isSummary={isSummary}
          isInOut={isInOut}
          expenseOnly={expenseOnly}
          profitOnly={profitOnly}
          usdtOnly={usdtOnly}
          usdtTotal={usdtTotal}
          activeGroup={activeGroup}
          patchGroup={patchGroup}
          deleteGroup={deleteGroup}
          form={form}
          setForm={setForm}
          add={add}
          importMany={importMany}
          totalIn={profitOnly ? profit.totals.fee : totalIn}
          totalOut={totalOut}
          afterFee={isInOut ? inoutAfterFee : afterFee}
          inoutRate={inoutRate}
          onPatchInoutRate={saveInoutRate}
          onAddInOut={addInOut}
          transactions={profitOnly ? profitItems : view}
          ins={profitOnly ? profitItems : ins}
          outs={outs}
          canEdit={isAdmin}
          isHistory={isHistory}
          isPayout={isPayout}
          onAddPayout={addPayout}
        />

        {/* Workspace */}
        <main ref={contentRef} className="lg:flex-1 p-3 sm:p-4">
          {!isHistory && (
          <div data-capture-exclude="true">
          <StatCards
            totalIn={profitOnly ? profit.totals.fee : totalIn}
            totalOut={profitOnly ? profit.totals.totalOut : totalOut}
            grossIn={profitOnly ? profit.totals.totalIn : 0}
            fee={isInOut ? inoutFeeIn + inoutFeeOut : fee}
            afterFee={isInOut ? inoutAfterFee : afterFee}
            feeRate={feeRate}
            feeHint={isSummary ? "Phí vào + phí ra theo từng nhóm" : isInOut ? "Theo mức phí nhập/xuất" : "Phí vào + phí ra"}
            count={
              expenseOnly
                ? outs.length
                : profitOnly
                ? profit.rows.length
                : usdtOnly
                ? ins.length
                : view.length
            }
            maxOut={maxOut}
            maxIn={profitOnly ? profit.rows.reduce((m, r) => Math.max(m, r.fee), 0) : maxIn}
            usdtTotal={usdtTotal}
            mode={usdtOnly ? "usdt" : expenseOnly ? "expense" : profitOnly ? "profit" : isPayout ? "payout" : "full"}
          />
          </div>
          )}
          <div className="mt-4">
            {!isHistory && (
              <div data-capture-exclude="true">
                <PeriodFilter period={period} onChange={setPeriod} />
              </div>
            )}
            {isHistory ? (
              <div ref={frameRef}>
                <HistoryTable
                  rows={historyRows}
                  groups={groups}
                  loading={loading}
                  onRestore={restore}
                  onPurge={purge}
                  canEdit={isAdmin}
                />
              </div>
            ) : isPayout ? (
              <>
                <div ref={frameRef}>
                  <PayoutTable
                    ins={ins}
                    outs={outs}
                    totals={{ totalIn, totalOut }}
                    loading={loading}
                    onRemove={remove}
                    onEdit={setEditing}
                    canEdit={isAdmin}
                    groups={groups}
                  />
                </div>
                <div className="mt-4" data-capture-exclude="true">
                  <PayoutQuickForm
                    groups={groups}
                    canEdit={isAdmin}
                    onAdd={addPayoutOut}
                    onUpdate={updatePayoutOut}
                    onRemove={removePayoutOut}
                    entries={outEntries}
                    loading={loading}
                  />
                </div>
              </>
            ) : isInOut ? (
              <div ref={frameRef}>
                <InOutTable
                  ins={ins}
                  outs={outs}
                  loading={loading}
                  onRemove={remove}
                  onEdit={setEditing}
                  canEdit={isAdmin}
                  feeIn={inoutRate.in}
                  feeOut={inoutRate.out}
                />
              </div>
            ) : isSummary ? (
              <>
                <div ref={frameRef}>
                  <GroupBreakdownTable rows={groupRows} loading={loading} />
                </div>
                <div className="mt-2">
                  <DailySummaryTable
                    rows={dailyRows}
                    totals={{ totalIn, totalOut, afterFee }}
                    loading={loading}
                  />
                </div>
              </>
            ) : usdtOnly ? (
              <div ref={frameRef}>
                <UsdtTable
                  items={ins}
                  totalUsdt={usdtTotal}
                  totalProfit={totalIn}
                  loading={loading}
                  onRemove={remove}
                  onEdit={setEditing}
                  canEdit={isAdmin}
                  groupName={activeGroup?.name || "LỢI NHUẬN USDT"}
                />
              </div>
            ) : expenseOnly ? (
              <div ref={frameRef}>
                <SingleSideTable
                  items={outs}
                  total={totalOut}
                  loading={loading}
                  onRemove={remove}
                  onEdit={setEditing}
                  canEdit={isAdmin}
                  groupName={activeGroup?.name || "CHI TIÊU"}
                  sideLabel="Chi tiêu"
                  totalLabel="TỔNG CHI TIÊU"
                  sign="−"
                  tone="text-[#B91C1C]"
                  bandTone="bg-[#FEF2F2] text-[#B91C1C]"
                  emptyText="Chưa có khoản chi nào"
                />
              </div>
            ) : profitOnly ? (
              <>
                <div ref={frameRef}>
                  <ProfitTable
                    rows={profit.rows}
                    totals={profit.totals}
                    loading={loading}
                    groupName={activeGroup?.name || "LỢI NHUẬN"}
                  />
                </div>
                <ProfitDailyTable
                  rows={profitDaily.rows}
                  totals={profitDaily.totals}
                  loading={loading}
                />
                <ProfitMonthlyTable
                  rows={profitMonthly.rows}
                  totals={profitMonthly.totals}
                  loading={loading}
                />
              </>
            ) : (
              <div ref={frameRef}>
                <LedgerTable
                  ins={ins}
                  outs={outs}
                  totals={{ totalIn, totalOut, feeIn, feeOut, afterFee }}
                  loading={loading}
                  onRemove={remove}
                  onEdit={setEditing}
                  canEdit={isAdmin}
                  feeRate={feeRate}
                  outFeeRate={outFeeRate}
                  groupName={activeGroup?.name || "SỔ QUỸ"}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {reportOpen && (
        <SendReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          report={report}
          defaultTo={me?.email || ""}
        />
      )}

      {editing && (
        <EditTransactionDialog
          transaction={editing}
          usdt={usdtOnly}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}