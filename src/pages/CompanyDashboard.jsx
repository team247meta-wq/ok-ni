import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import StatCards from "@/components/ledger/StatCards";
import GroupBreakdownTable from "@/components/ledger/GroupBreakdownTable";
import DailySummaryTable from "@/components/ledger/DailySummaryTable";
import SingleSideTable from "@/components/ledger/SingleSideTable";
import UsdtTable from "@/components/ledger/UsdtTable";
import ProfitTable from "@/components/ledger/ProfitTable";
import { buildProfitRows, filterProfitRows, profitTotals } from "@/lib/profitFromFees";
import { feeOf, hasFee, afterFeeOf } from "@/lib/calc";
import PeriodFilter from "@/components/ledger/PeriodFilter";
import CompanyTabs from "@/components/ledger/CompanyTabs";

const SUMMARY_ID = "__summary__";

export default function CompanyDashboard() {
  const { toast } = useToast();
  const [allGroups, setAllGroups] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeId, setActiveId] = useState(SUMMARY_ID);
  const [period, setPeriod] = useState({ mode: "all", from: "", to: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [gs, ts] = await Promise.all([
          base44.entities.Group.list("created_date", 100),
          base44.entities.Transaction.list("-date", 1000),
        ]);
        setAllGroups(gs);
        setTransactions(ts);
      } catch (e) {
        toast({ title: "Lỗi tải dữ liệu công ty", variant: "destructive" });
      }
      setLoading(false);
    })();
  }, []);

  const companyGroups = useMemo(() => allGroups.filter((g) => g.mode && g.mode !== "full"), [allGroups]);
  const companyIds = useMemo(() => new Set(companyGroups.map((g) => g.id)), [companyGroups]);

  const isSummary = activeId === SUMMARY_ID;
  const activeGroup = useMemo(() => companyGroups.find((g) => g.id === activeId), [companyGroups, activeId]);

  const expenseOnly = !isSummary && activeGroup?.mode === "expense";
  const profitOnly = !isSummary && activeGroup?.mode === "profit";
  const usdtOnly = !isSummary && activeGroup?.mode === "usdt";

  const active = useMemo(
    () => transactions.filter((t) => !t.deleted_at && companyIds.has(t.group_id)),
    [transactions, companyIds]
  );

  const view = useMemo(() => {
    if (period.mode === "all") return active;
    const key = (t) => (period.mode === "day" ? t.date || "" : (t.date || "").slice(0, 7));
    return active.filter((t) => (!period.from || key(t) >= period.from) && (!period.to || key(t) <= period.to));
  }, [active, period]);

  const ins = useMemo(() => view.filter((t) => t.type === "in"), [view]);
  const outs = useMemo(() => view.filter((t) => t.type === "out"), [view]);

  const totalIn = useMemo(() => ins.reduce((s, t) => s + (t.amount || 0), 0), [ins]);
  const usdtTotal = useMemo(() => ins.reduce((s, t) => s + (t.usdt_out || 0), 0), [ins]);
  const totalOut = useMemo(() => outs.reduce((s, t) => s + (t.amount || 0), 0), [outs]);
  const maxIn = useMemo(() => ins.reduce((m, t) => Math.max(m, t.amount || 0), 0), [ins]);
  const maxOut = useMemo(() => outs.reduce((m, t) => Math.max(m, t.amount || 0), 0), [outs]);

  const feeIn = useMemo(() => {
    const byId = new Map(companyGroups.map((g) => [g.id, g]));
    return ins.reduce((s, t) => {
      const g = byId.get(t.group_id);
      if (!hasFee(g)) return s;
      return s + feeOf(t.amount, g?.fee_rate ?? 6);
    }, 0);
  }, [ins, companyGroups]);

  const feeOut = useMemo(() => {
    const byId = new Map(companyGroups.map((g) => [g.id, g]));
    return outs.reduce((s, t) => {
      const g = byId.get(t.group_id);
      if (!hasFee(g)) return s;
      return s + feeOf(t.amount, g?.out_fee_rate ?? 6);
    }, 0);
  }, [outs, companyGroups]);

  const fee = feeIn + feeOut;
  const afterFee = afterFeeOf({ totalIn, feeIn, totalOut, feeOut });

  const profit = useMemo(() => {
    const { rows } = buildProfitRows(transactions.filter((t) => !t.deleted_at), allGroups);
    const filtered = filterProfitRows(rows, period);
    return { rows: filtered, totals: profitTotals(filtered) };
  }, [transactions, allGroups, period]);

  const groupRows = useMemo(() => {
    const map = new Map(
      companyGroups.map((g) => [
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
    return Array.from(map.values()).map((r) => {
      const f = hasFee(r) ? feeOf(r.totalIn, r.rate) + feeOf(r.totalOut, r.outRate) : 0;
      return { ...r, fee: f, afterFee: r.totalIn - f - r.totalOut };
    });
  }, [companyGroups, view]);

  const dailyRows = useMemo(() => {
    const map = new Map();
    view.forEach((t) => {
      const key = t.date || "";
      const row = map.get(key) || { date: key, totalIn: 0, totalOut: 0 };
      if (t.type === "in") row.totalIn += t.amount || 0;
      else row.totalOut += t.amount || 0;
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [view]);

  const statMode = usdtOnly ? "usdt" : expenseOnly ? "expense" : profitOnly ? "profit" : "full";

  return (
    <div className="min-h-screen bg-[#E7ECF4] text-[#0F172A] font-body">
      <header className="sticky top-0 z-20 h-14 bg-white border-b border-[#C9D5E6] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="https://media.base44.com/images/public/6aaf8198d70750feca5bf597/c0d39cd65_aecch.jpg"
            alt="USDT"
            className="w-9 h-9 rounded-lg shadow-md shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-display text-[17px] font-bold tracking-tight truncate">
              Dashboard khối công ty
            </h1>
            <p className="text-[12px] font-medium text-[#5B6B85] truncate">
              {isSummary
                ? "Tổng công ty · toàn bộ nhóm công ty"
                : `${activeGroup?.name || "—"} · ${
                    usdtOnly ? "u xuất & lãi" : expenseOnly ? "chi tiêu" : profitOnly ? "lợi nhuận" : "theo dõi"
                  }`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block font-mono text-[11px] tabular-nums text-[#7B8AA3]">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
          <Button
            asChild
            variant="outline"
            className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EAF7F1] hover:text-[#0E9F6E] rounded-lg font-medium"
          >
            <Link to="/">
              <ArrowLeft size={15} className="mr-2" />
              <span className="hidden sm:inline">Về sổ quỹ</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="p-3 sm:p-4">
        <CompanyTabs
          groups={companyGroups}
          activeId={activeId}
          onSelect={setActiveId}
          summaryActive={isSummary}
          onSelectSummary={() => setActiveId(SUMMARY_ID)}
        />

        <PeriodFilter period={period} onChange={setPeriod} />

        <StatCards
          totalIn={profitOnly ? profit.totals.fee : totalIn}
          totalOut={totalOut}
          fee={fee}
          afterFee={afterFee}
          feeRate={activeGroup?.fee_rate ?? 0}
          feeHint={isSummary ? "Phí vào + phí ra theo từng nhóm" : "Phí vào + phí ra"}
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
          mode={statMode}
        />

        <div className="mt-4">
          {isSummary ? (
            <>
              <GroupBreakdownTable rows={groupRows} loading={loading} />
              <div className="mt-4">
                <DailySummaryTable rows={dailyRows} totals={{ totalIn, totalOut }} loading={loading} />
              </div>
            </>
          ) : usdtOnly ? (
            <UsdtTable
              items={ins}
              totalUsdt={usdtTotal}
              totalProfit={totalIn}
              loading={loading}
              canEdit={false}
              groupName={activeGroup?.name || "LỢI NHUẬN USDT"}
            />
          ) : expenseOnly ? (
            <SingleSideTable
              items={outs}
              total={totalOut}
              loading={loading}
              canEdit={false}
              groupName={activeGroup?.name || "CHI TIÊU"}
              sideLabel="Chi tiêu"
              totalLabel="TỔNG CHI TIÊU"
              sign="−"
              tone="text-[#DC2626]"
              bandTone="bg-[#FFF7ED] text-[#B45309]"
              emptyText="Chưa có khoản chi nào"
            />
          ) : profitOnly ? (
            <ProfitTable
              rows={profit.rows}
              totals={profit.totals}
              loading={loading}
              groupName={activeGroup?.name || "LỢI NHUẬN CÔNG TY"}
            />
          ) : (
            <SingleSideTable
              items={ins}
              total={totalIn}
              loading={loading}
              canEdit={false}
              groupName={activeGroup?.name || "LỢI NHUẬN"}
              sideLabel="Lợi nhuận"
              totalLabel="LỢI NHUẬN TỔNG"
              sign="+"
              tone="text-[#047857]"
              bandTone="bg-[#ECFDF5] text-[#047857]"
              emptyText="Chưa có khoản lợi nhuận nào"
            />
          )}
        </div>
      </main>
    </div>
  );
}