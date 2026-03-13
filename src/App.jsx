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
  if (p > 100) return "#1D9E75";
  if (p >= 75) return "#BA7517";
  return "#D85A30";
}

const EMPTY_MONTH = { meetings: "", sals: "", sqos: "" };

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem("sdr_fy27_data");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [activeMonth, setActiveMonth] = useState("Feb");
  const [editing, setEditing] = useState({});

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

  // compute per-month results
  function monthResults(m) {
    const d = data[m];
    if (!d || d.meetings === "") return null;
    const meet = calcMeetings(parseFloat(d.meetings) || 0);
    const sal = calcSALs(parseFloat(d.sals) || 0);
    return { meet, sal, month: m };
  }

  // compute per-quarter SQO
  function quarterSQO(q) {
    let totalSQOs = 0;
    q.months.forEach(m => {
      const d = data[m];
      if (d) totalSQOs += parseFloat(d.sqos) || 0;
    });
    return calcSQOs(totalSQOs);
  }

  // total comp for the year
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
    <div style={{ fontFamily: "'DM Mono', monospace", minHeight: "100vh", background: "#0e0e0f", color: "#e8e6e0", padding: "2rem 1.5rem" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;800&display=swap');
        * { box-sizing: border-box; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>SDR COMP</div>
            <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", marginTop: 2 }}>ROBOFLOW · FY27 · FEB 2026 – JAN 2027</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.08em", marginBottom: 4 }}>TOTAL EARNED TO DATE</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 32, fontWeight: 800, color: grandTotal > 0 ? "#a8e6cf" : "#444", letterSpacing: "-0.02em" }}>
              {grandTotal > 0 ? fmt(grandTotal) : "—"}
            </div>
            {grandTotal > 0 && (
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                {fmt(totalMeet)} mtg · {fmt(totalSAL)} SAL · {fmt(totalSQO)} SQO
              </div>
            )}
          </div>
        </div>

        {/* Month tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {MONTHS.map(m => {
            const r = monthResults(m);
            const hasData = !!data[m] && data[m].meetings !== "";
            const isActive = m === activeMonth;
            return (
              <button key={m} onClick={() => setActiveMonth(m)} style={{
                padding: "6px 14px", fontSize: 12, fontFamily: "DM Mono, monospace",
                background: isActive ? "#e8e6e0" : hasData ? "#1a1a1c" : "transparent",
                color: isActive ? "#0e0e0f" : hasData ? "#a8e6cf" : "#555",
                border: isActive ? "none" : `1px solid ${hasData ? "#2a3a2e" : "#222"}`,
                borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em",
                fontWeight: isActive ? 500 : 400,
              }}>
                {m}
                {hasData && !isActive && <span style={{ marginLeft: 6, fontSize: 9, color: "#a8e6cf" }}>●</span>}
              </button>
            );
          })}
        </div>

        {/* Active month panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {/* Input card */}
          <div style={{ background: "#141416", border: "1px solid #222", borderRadius: 8, padding: "1.25rem" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#555", marginBottom: "1rem" }}>
              {MONTH_LABELS[activeMonth]?.toUpperCase()} · ACTUALS
            </div>
            {[
              { field: "meetings", label: "Meetings completed", target: "target 20" },
              { field: "sals", label: "SALs", target: "target 5" },
              { field: "sqos", label: "SQOs this month", target: "target 2/mo · 6/qtr" },
            ].map(({ field, label, target }) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <label style={{ fontSize: 12, color: "#888" }}>{label}</label>
                  <span style={{ fontSize: 10, color: "#444" }}>{target}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={editData(activeMonth)[field]}
                  onChange={e => handleChange(activeMonth, field, e.target.value)}
                  placeholder="—"
                  style={{
                    width: "100%", padding: "8px 10px", fontSize: 15,
                    fontFamily: "DM Mono, monospace", fontWeight: 500,
                    background: "#0e0e0f", color: "#e8e6e0",
                    border: "1px solid #2a2a2c", borderRadius: 4, outline: "none",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => handleSave(activeMonth)} style={{
                flex: 1, padding: "9px", fontSize: 12, fontFamily: "DM Mono, monospace",
                background: "#a8e6cf", color: "#0e0e0f", border: "none",
                borderRadius: 4, cursor: "pointer", fontWeight: 500, letterSpacing: "0.05em",
              }}>SAVE MONTH</button>
              <button onClick={() => handleClear(activeMonth)} style={{
                padding: "9px 16px", fontSize: 12, fontFamily: "DM Mono, monospace",
                background: "transparent", color: "#555", border: "1px solid #222",
                borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em",
              }}>CLEAR</button>
            </div>
          </div>

          {/* Results card */}
          <div style={{ background: "#141416", border: "1px solid #222", borderRadius: 8, padding: "1.25rem" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#555", marginBottom: "1rem" }}>
              {MONTH_LABELS[activeMonth]?.toUpperCase()} · PAYOUT
            </div>
            {(() => {
              const d = data[activeMonth];
              if (!d || d.meetings === "") return (
                <div style={{ color: "#444", fontSize: 13, marginTop: "2rem", textAlign: "center" }}>
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
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                        <span style={{ fontSize: 11, color: "#666" }}>{r.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 500, color: "#e8e6e0" }}>{fmt(r.earned)}</span>
                      </div>
                      <div style={{ height: 3, background: "#1e1e20", borderRadius: 2, marginBottom: 4 }}>
                        <div style={{ height: "100%", width: `${Math.min(r.pct, 100)}%`, background: pctColor(r.pct), borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#444" }}>{r.detail}</div>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid #1e1e20", paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 11, color: "#666" }}>Monthly subtotal</span>
                      <span style={{ fontSize: 20, fontWeight: 500 }}>{fmt(monthTotal)}</span>
                    </div>
                  </div>
                  {sqo && (
                    <div style={{ background: "#0e0e0f", border: "1px solid #1e1e20", borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: "0.08em" }}>{qLabel} SQO (QUARTERLY)</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: 11, color: "#666" }}>{Math.round(sqo.pct)}% of target (6) · {sqo.mult}x</span>
                        <span style={{ fontSize: 18, fontWeight: 500, color: "#a8e6cf" }}>{fmt(sqo.earned)}</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Year summary table */}
        <div style={{ background: "#141416", border: "1px solid #222", borderRadius: 8, padding: "1.25rem", marginTop: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#555", marginBottom: "1rem" }}>FULL YEAR SUMMARY</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e20" }}>
                  {["Month","Meetings","Attain","SALs","Attain","Monthly","SQO Qtr","Total","Annualized"].map((h,hi) => (
                    <th key={h+hi} style={{ padding: "6px 8px", textAlign: "right", color: hi===8 ? "#a8e6cf" : "#555", fontWeight: 400, letterSpacing: "0.05em", fontSize: 10 }}>{h}</th>
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
                        borderBottom: "1px solid #191919", cursor: "pointer",
                        background: isActive ? "#1a1a1c" : "transparent",
                      }}>
                        <td style={{ padding: "7px 8px", color: isActive ? "#fff" : "#888", fontWeight: isActive ? 500 : 400 }}>{MONTH_LABELS[m]}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? "#e8e6e0" : "#333" }}>{r ? d.meetings : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? pctColor(r.meet.pct) : "#333" }}>{r ? `${Math.round(r.meet.pct)}%` : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? "#e8e6e0" : "#333" }}>{r ? d.sals : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? pctColor(r.sal.pct) : "#333" }}>{r ? `${Math.round(r.sal.pct)}%` : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? "#e8e6e0" : "#333" }}>{r ? fmt(monthTotal) : "—"}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: sqo.earned > 0 ? "#a8e6cf" : "#333" }}>
                          {i === 0 ? (sqo.earned > 0 ? fmt(sqo.earned) : "—") : ""}
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? "#fff" : "#333", fontWeight: r ? 500 : 400 }}>
                          {r ? fmt(monthTotal + (i === 0 ? sqo.earned : 0)) : "—"}
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: r ? "#a8e6cf" : "#333", fontWeight: r ? 500 : 400 }}>
                          {r ? fmt(BASE_SALARY + (monthTotal * 12) + (sqo.earned * 4)) : "—"}
                        </td>
                      </tr>
                    );
                  });
                  return qRows;
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid #2a2a2c" }}>
                  <td colSpan={5} style={{ padding: "10px 8px", fontSize: 11, color: "#555", letterSpacing: "0.08em" }}>TOTAL</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#e8e6e0", fontWeight: 500 }}>{totalMeet + totalSAL > 0 ? fmt(totalMeet + totalSAL) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#a8e6cf", fontWeight: 500 }}>{totalSQO > 0 ? fmt(totalSQO) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: grandTotal > 0 ? "#a8e6cf" : "#333" }}>{grandTotal > 0 ? fmt(grandTotal) : "—"}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 800, color: grandTotal > 0 ? "#a8e6cf" : "#333" }}>{grandTotal > 0 ? fmt(BASE_SALARY + grandTotal) : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
