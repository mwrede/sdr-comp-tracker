import { useState, useEffect } from "react";

const MONTHS = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"];
const MONTH_LABELS = {
  "Feb":"Feb 2026","Mar":"Mar 2026","Apr":"Apr 2026","May":"May 2026",
  "Jun":"Jun 2026","Jul":"Jul 2026","Aug":"Aug 2026","Sep":"Sep 2026",
  "Oct":"Oct 2026","Nov":"Nov 2026","Dec":"Dec 2026","Jan":"Jan 2027"
};
const QUARTERS = [
  { label: "Q1 FY27", months: ["Feb","Mar","Apr"] },
  { label: "Q2 FY27", months: ["May","Jun","Jul"] },
  { label: "Q3 FY27", months: ["Aug","Sep","Oct"] },
  { label: "Q4 FY27", months: ["Nov","Dec","Jan"] },
];

const BASE_SALARY = 70000;
const MONTHLY_BASE = BASE_SALARY / 12;

function calcMeetings(actual) {
  const pct = (actual / 20) * 100;
  let rate;
  if (pct <= 50) rate = 35;
  else if (pct <= 75) rate = 55;
  else if (pct <= 100) rate = 75;
  else if (pct <= 125) rate = 85;
  else rate = 95;
  return { earned: actual * rate, pct, rate };
}

function calcSALs(actual) {
  const pct = (actual / 5) * 100;
  let earned;
  if (pct < 40) earned = 0;
  else if (pct <= 80) earned = 875;
  else if (pct <= 100) earned = 1250;
  else if (pct <= 120) earned = 1750;
  else if (pct <= 160) earned = 2200;
  else earned = 2500;
  return { earned, pct };
}

function calcSQOs(sqos) {
  const pct = (sqos / 6) * 100;
  let mult;
  if (pct < 40) mult = 0;
  else if (pct <= 60) mult = 0.75;
  else if (pct <= 80) mult = 1.0;
  else if (pct <= 90) mult = 1.15;
  else mult = 1.3;
  return { earned: 2250 * mult, pct, mult };
}

function fmt(n) { return "$" + Math.round(n).toLocaleString(); }
function pctColor(p) {
  if (p > 100) return "#16a34a";
  if (p >= 75) return "#16a34a";
  return "#dc2626";
}

const EMPTY_MONTH = { meetings: "", sals: "", sqos: "" };

const PAY_TABLES = {
  Meetings: {
    title: "Meetings Payout Table",
    subtitle: "Monthly quota: 20 meetings",
    headers: ["Attainment", "Meetings", "Rate per Meeting"],
    rows: [
      { cells: ["0–50%", "0–10", "$35"], highlight: false },
      { cells: ["51–75%", "11–15", "$55"], highlight: false },
      { cells: ["76–100%", "16–20", "$75"], highlight: true },
      { cells: ["101–125%", "21–25", "$85"], highlight: false },
      { cells: ["126%+", "26+", "$95"], highlight: false },
    ],
  },
  SALs: {
    title: "SALs Payout Table",
    subtitle: "Monthly quota: 5 SALs",
    headers: ["Attainment", "SALs", "Monthly Payout"],
    rows: [
      { cells: ["0–39%", "0–1", "$0"], highlight: false },
      { cells: ["40–80%", "2–4", "$875"], highlight: false },
      { cells: ["81–100%", "5", "$1,250"], highlight: true },
      { cells: ["101–120%", "6", "$1,750"], highlight: false },
      { cells: ["121–160%", "7–8", "$2,200"], highlight: false },
      { cells: ["161%+", "9+", "$2,500"], highlight: false },
    ],
  },
  SQOs: {
    title: "SQOs Payout Table",
    subtitle: "Quarterly quota: 6 SQOs · Base payout: $2,250",
    headers: ["Attainment", "SQOs (Qtr)", "Multiplier", "Quarterly Payout"],
    rows: [
      { cells: ["0–39%", "0–2", "0x", "$0"], highlight: false },
      { cells: ["40–60%", "3", "0.75x", "$1,688"], highlight: false },
      { cells: ["61–80%", "4–5", "1.0x", "$2,250"], highlight: false },
      { cells: ["81–90%", "5", "1.15x", "$2,588"], highlight: true },
      { cells: ["91%+", "6+", "1.3x", "$2,925"], highlight: false },
    ],
  },
};

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("sdr_fy27_data");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [activeMonth, setActiveMonth] = useState("Feb");
  const [editing, setEditing] = useState({});
  const [showPayTable, setShowPayTable] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("sdr_fy27_data", JSON.stringify(data)); } catch {}
  }, [data]);

  const monthData = (m) => data[m] || EMPTY_MONTH;
  const editData = (m) => editing[m] || monthData(m);

  function handleChange(month, field, val) {
    setEditing(e => ({ ...e, [month]: { ...editData(month), [field]: val } }));
  }

  function handleSave(month) {
    const d = editData(month);
    setData(prev => ({ ...prev, [month]: d }));
    setEditing(e => { const n = { ...e }; delete n[month]; return n; });
  }

  function handleClear(month) {
    setData(prev => { const n = { ...prev }; delete n[month]; return n; });
    setEditing(e => { const n = { ...e }; delete n[month]; return n; });
  }

  function monthResults(m) {
    const d = data[m];
    if (!d || d.meetings === "") return null;
    const meet = calcMeetings(parseFloat(d.meetings) || 0);
    const sal = calcSALs(parseFloat(d.sals) || 0);
    return { meet, sal, month: m };
  }

  function quarterSQO(q) {
    let totalSQOs = 0;
    q.months.forEach(m => {
      const d = data[m];
      if (d) totalSQOs += parseFloat(d.sqos) || 0;
    });
    return calcSQOs(totalSQOs);
  }

  let totalMeet = 0, totalSAL = 0, totalSQO = 0;
  MONTHS.forEach(m => {
    const r = monthResults(m);
    if (r) { totalMeet += r.meet.earned; totalSAL += r.sal.earned; }
  });
  QUARTERS.forEach(q => { totalSQO += quarterSQO(q).earned; });
  const grandTotal = totalMeet + totalSAL + totalSQO;

  const activeQ = QUARTERS.find(q => q.months.includes(activeMonth));
  const sqoResult = activeQ ? quarterSQO(activeQ) : null;

  return (
    <div style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", minHeight: "100vh", background: "#F8F8FA", color: "#1a1a1a", padding: "2rem 1.5rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Ubuntu+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 2px; }
        input:focus { border-color: #6706CE !important; box-shadow: 0 0 0 2px rgba(103,6,206,0.12); }
        button:hover { opacity: 0.9; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="44" height="44" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" fill="#6706CE"/>
            </svg>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", color: "#111", lineHeight: 1 }}>SDR COMP</div>
              <div style={{ fontSize: 12, color: "#6B7280", letterSpacing: "0.1em", marginTop: 4 }}>ROBOFLOW · FY27 · FEB 2026 – JAN 2027</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6B7280", letterSpacing: "0.08em", marginBottom: 4 }}>TOTAL EARNED TO DATE</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: grandTotal > 0 ? "#6706CE" : "#d4d4d8", letterSpacing: "-0.02em" }}>
              {grandTotal > 0 ? fmt(grandTotal) : "—"}
            </div>
            {grandTotal > 0 && (
              <>
                <div style={{ fontSize: 15, color: "#111", marginTop: 6, fontWeight: 600 }}>
                  {fmt(BASE_SALARY + grandTotal)} total comp
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                  {fmt(BASE_SALARY)} base · {fmt(totalMeet)} mtg · {fmt(totalSAL)} SAL · {fmt(totalSQO)} SQO
                </div>
              </>
            )}
          </div>
        </div>

        {/* Month tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {MONTHS.map(m => {
            const hasData = !!data[m] && data[m].meetings !== "";
            const isActive = m === activeMonth;
            return (
              <button key={m} onClick={() => setActiveMonth(m)} style={{
                padding: "7px 14px", fontSize: 13, fontFamily: "Inter, sans-serif",
                background: isActive ? "#6706CE" : hasData ? "rgba(103,6,206,0.06)" : "#fff",
                color: isActive ? "#fff" : hasData ? "#6706CE" : "#6B7280",
                border: isActive ? "none" : `1px solid ${hasData ? "rgba(103,6,206,0.2)" : "#E5E7EB"}`,
                borderRadius: 6, cursor: "pointer", letterSpacing: "0.02em",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s ease",
              }}>
                {m}
                {hasData && !isActive && <span style={{ marginLeft: 6, fontSize: 10, color: "#6706CE" }}>●</span>}
              </button>
            );
          })}
        </div>

        {/* Active month panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {/* Input card */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.25rem" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "#6B7280", marginBottom: "1rem", fontWeight: 600 }}>
              {MONTH_LABELS[activeMonth]?.toUpperCase()} · ACTUALS
            </div>
            {[
              { field: "meetings", label: "Meetings completed", target: "Quota: 20" },
              { field: "sals", label: "SALs", target: "Quota: 5" },
              { field: "sqos", label: "SQOs this month", target: "Quota: 2/mo · 6/qtr" },
            ].map(({ field, label, target }) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 14, color: "#111", fontWeight: 500 }}>{label}</label>
                  <span style={{ fontSize: 12, color: "#6706CE", fontWeight: 500, background: "rgba(103,6,206,0.06)", padding: "2px 8px", borderRadius: 4 }}>{target}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={editData(activeMonth)[field]}
                  onChange={e => handleChange(activeMonth, field, e.target.value)}
                  placeholder="—"
                  style={{
                    width: "100%", padding: "9px 11px", fontSize: 16,
                    fontFamily: "Ubuntu Mono, monospace", fontWeight: 500,
                    background: "#F8F8FA", color: "#111",
                    border: "1px solid #E5E7EB", borderRadius: 6, outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => handleSave(activeMonth)} style={{
                flex: 1, padding: "10px", fontSize: 13, fontFamily: "Inter, sans-serif",
                background: "linear-gradient(135deg, #6706CE 0%, #A351FB 100%)", color: "#fff", border: "none",
                borderRadius: 6, cursor: "pointer", fontWeight: 600, letterSpacing: "0.02em",
                transition: "opacity 0.15s",
              }}>SAVE MONTH</button>
              <button onClick={() => handleClear(activeMonth)} style={{
                padding: "10px 16px", fontSize: 13, fontFamily: "Inter, sans-serif",
                background: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB",
                borderRadius: 6, cursor: "pointer", letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}>CLEAR</button>
            </div>
          </div>

          {/* Results card */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.25rem" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "#6B7280", marginBottom: "1rem", fontWeight: 600 }}>
              {MONTH_LABELS[activeMonth]?.toUpperCase()} · PAYOUT
            </div>
            {(() => {
              const d = data[activeMonth];
              if (!d || d.meetings === "") return (
                <div style={{ color: "#d4d4d8", fontSize: 14, marginTop: "2rem", textAlign: "center" }}>
                  Enter actuals and save to see payout
                </div>
              );
              const meet = calcMeetings(parseFloat(d.meetings) || 0);
              const sal = calcSALs(parseFloat(d.sals) || 0);
              const qLabel = activeQ?.label;
              const sqo = sqoResult;
              const monthTotal = meet.earned + sal.earned;

              return (
                <>
                  {[
                    { label: "Meetings", earned: meet.earned, detail: `${Math.round(meet.pct)}% · $${meet.rate}/meeting`, pct: meet.pct },
                    { label: "SALs", earned: sal.earned, detail: `${Math.round(sal.pct)}% attainment`, pct: sal.pct },
                    { label: "SQOs", earned: sqo ? sqo.earned : 0, detail: `${Math.round(sqo ? sqo.pct : 0)}% attainment · quarterly`, pct: sqo ? sqo.pct : 0 },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: "#6B7280" }}>{r.label}</span>
                        <span style={{ fontSize: 20, fontWeight: 600, fontFamily: "Ubuntu Mono, monospace", color: "#111" }}>{fmt(r.earned)}</span>
                      </div>
                      <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, marginBottom: 4 }}>
                        <div style={{ height: "100%", width: `${Math.min(r.pct, 100)}%`, background: pctColor(r.pct), borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{r.detail}</div>
                      {r.note && <div style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic", marginTop: 2 }}>{r.note}</div>}
                    </div>
                  ))}
                  <div style={{ background: "linear-gradient(135deg, rgba(103,6,206,0.06) 0%, rgba(163,81,251,0.06) 100%)", border: "1px solid rgba(103,6,206,0.15)", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 24 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 4 }}>MONTHLY</div>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Ubuntu Mono, monospace", color: "#111", lineHeight: 1 }}>
                        {fmt(monthTotal)}
                      </div>
                    </div>
                    <div style={{ width: 1, background: "rgba(103,6,206,0.15)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: "0.08em", fontWeight: 500, marginBottom: 4 }}>ESTIMATED ANNUAL PAY</div>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Ubuntu Mono, monospace", color: "#6706CE", lineHeight: 1 }}>
                        {fmt(BASE_SALARY + (monthTotal * 12) + (sqo ? sqo.earned * 4 : 0))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Year summary table */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "1.25rem", marginTop: 8 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "#6B7280", marginBottom: "1rem", fontWeight: 600 }}>FULL YEAR SUMMARY</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                  {["Month","Meetings","Attain","SALs","Attain","Monthly","SQO Qtr","Total","Annualized"].map((h,hi) => (
                    <th key={h+hi} style={{ padding: "8px 8px", textAlign: "right", color: hi===8 ? "#6706CE" : "#6B7280", fontWeight: 500, letterSpacing: "0.05em", fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {QUARTERS.map(q => {
                  const sqo = quarterSQO(q);
                  let qRows = q.months.map((m, i) => {
                    const d = data[m];
                    const r = monthResults(m);
                    const isActive = m === activeMonth;
                    const monthTotal = r ? r.meet.earned + r.sal.earned : null;
                    return (
                      <tr key={m} onClick={() => setActiveMonth(m)} style={{
                        borderBottom: "1px solid #F9FAFB", cursor: "pointer",
                        background: isActive ? "rgba(103,6,206,0.04)" : "transparent",
                        transition: "background 0.15s",
                      }}>
                        <td style={{ padding: "8px 8px", color: isActive ? "#111" : "#6B7280", fontWeight: isActive ? 600 : 400 }}>{MONTH_LABELS[m]}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: r ? "#111" : "#E5E7EB" }}>{r ? d.meetings : "—"}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", color: r ? pctColor(r.meet.pct) : "#E5E7EB", fontWeight: r ? 500 : 400 }}>{r ? `${Math.round(r.meet.pct)}%` : "—"}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: r ? "#111" : "#E5E7EB" }}>{r ? d.sals : "—"}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", color: r ? pctColor(r.sal.pct) : "#E5E7EB", fontWeight: r ? 500 : 400 }}>{r ? `${Math.round(r.sal.pct)}%` : "—"}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: r ? "#111" : "#E5E7EB" }}>{r ? fmt(monthTotal) : "—"}</td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: sqo.earned > 0 ? "#6706CE" : "#E5E7EB" }}>
                          {i === 0 ? (sqo.earned > 0 ? fmt(sqo.earned) : "—") : ""}
                        </td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: r ? "#111" : "#E5E7EB", fontWeight: r ? 600 : 400 }}>
                          {r ? fmt(monthTotal + (i === 0 ? sqo.earned : 0)) : "—"}
                        </td>
                        <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: r ? "#6706CE" : "#E5E7EB", fontWeight: r ? 600 : 400 }}>
                          {r ? fmt(BASE_SALARY + (monthTotal * 12) + (sqo.earned * 4)) : "—"}
                        </td>
                      </tr>
                    );
                  });
                  return qRows;
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #F3F4F6" }}>
                  <td colSpan={5} style={{ padding: "10px 8px", fontSize: 12, color: "#6B7280", letterSpacing: "0.08em", fontWeight: 500 }}>TOTAL</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: "#111", fontWeight: 600 }}>{totalMeet + totalSAL > 0 ? fmt(totalMeet + totalSAL) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", color: "#6706CE", fontWeight: 600 }}>{totalSQO > 0 ? fmt(totalSQO) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", fontSize: 16, fontWeight: 800, color: grandTotal > 0 ? "#6706CE" : "#E5E7EB" }}>{grandTotal > 0 ? fmt(grandTotal) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Ubuntu Mono, monospace", fontSize: 14, fontWeight: 800, color: grandTotal > 0 ? "#6706CE" : "#E5E7EB" }}>{grandTotal > 0 ? fmt(BASE_SALARY + grandTotal) : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Pay Table Overlay */}
      {showPayTable && PAY_TABLES[showPayTable] && (
        <div onClick={() => setShowPayTable(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 12, padding: "1.5rem", maxWidth: 480, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{PAY_TABLES[showPayTable].title}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{PAY_TABLES[showPayTable].subtitle}</div>
              </div>
              <button onClick={() => setShowPayTable(null)} style={{
                background: "none", border: "none", fontSize: 20, color: "#6B7280", cursor: "pointer", padding: "0 4px", lineHeight: 1,
              }}>&times;</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                  {PAY_TABLES[showPayTable].headers.map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6B7280", fontWeight: 600, fontSize: 11, letterSpacing: "0.03em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAY_TABLES[showPayTable].rows.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: "1px solid #F9FAFB",
                    background: row.highlight ? "rgba(103,6,206,0.04)" : "transparent",
                  }}>
                    {row.cells.map((cell, j) => (
                      <td key={j} style={{
                        padding: "9px 10px", fontFamily: j === 0 ? "Inter, sans-serif" : "Ubuntu Mono, monospace",
                        color: row.highlight ? "#6706CE" : "#374151", fontWeight: row.highlight ? 600 : 400,
                      }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
