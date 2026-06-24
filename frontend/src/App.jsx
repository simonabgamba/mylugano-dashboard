import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label, LabelList
} from "recharts";

// ── COLORI ──────────────────────────────────────────────────
const RED="#d42f3a", RED_L="rgba(212,47,58,0.08)", GREEN="#1fa363";
const MUTED="#7a7a8a", BORDER="#e8e8ee", DARK="#111118";
const AMBER="#b45309", AMBER_L="rgba(180,83,9,0.08)";
const YEAR_COLORS={2021:"#bbb",2022:"#888",2023:"#aaa",2024:"#e07b2a",2025:"#d42f3a",2026:"#7c3aed"};
const MESI_ORDER=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SHEET_URL="https://docs.google.com/spreadsheets/d/1gDvJPaOH3EJZ6-0eB9MyCOnQRxsYYcftP3LmJLzrmSg/edit?gid=1642375582#gid=1642375582";

// ── I18N ────────────────────────────────────────────────────
const I18N = {
  en: {
    subtitle: "KPI Dashboard — Live",
    live: "Go to Google Sheet",
    tab_kpi: "KPI & Analysis",
    tab_trends: "Trends",
    tab_history: "Full History",
    tab_chat: "💬 Ask the data",
    filter: "Filter:",
    all: "All",
    none: "None",
    actions: "3 key actions",
    analyzing: "Generating AI analysis...",
    ask_placeholder: "Ask a question about the data...",
    send: "Send",
    chat_intro: "Hi! I'm the MyLugano AI assistant. Ask me anything about the platform data.",
    suggestions: [
      "What is the user growth trend since 2021?",
      "Why did April 2026 revenue drop?",
      "What are the top 3 priorities for Q3 2026?",
      "How are Android downloads performing?"
    ],
    kpis: [
      { label:"Total Users",     key:"utenti"        },
      { label:"Active Wallets",  key:"wallet_attivi" },
      { label:"Total Partners",  key:"partner_totali"},
      { label:"Circulating CHF", key:"circolante_chf"},
    ],
    kpi_prompt: (label, ctx) => `You are a senior analyst for MyLugano, digital wallet platform of the City of Lugano.
Analyze this KPI and respond ONLY with valid JSON, no markdown:
{"headline":"one sentence max 12 words","impatto":"one sentence max 20 words","anomalia":"one sentence on any anomaly or null if none","misure":["action 1 max 8 words","action 2 max 8 words","action 3 max 8 words"]}
KPI: ${label}. Data: ${ctx}`,
    system_prompt: (s) => `You are a senior data analyst for MyLugano, the digital wallet and cashback platform of the City of Lugano, Switzerland.
Current data: Users ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% MoM), Active wallets ${s?.wallet_attivi?.valore?.toLocaleString()}, Partners ${s?.partner_totali?.valore}, Circulating CHF ${s?.circolante_chf?.valore?.toLocaleString()}.
Answer concisely and professionally in English.`,
  },
  it: {
    subtitle: "Dashboard KPI — Live",
    live: "Vai a Google Sheet",
    tab_kpi: "KPI & Analisi",
    tab_trends: "Andamenti",
    tab_history: "Storico completo",
    tab_chat: "💬 Chiedi ai dati",
    filter: "Filtra:",
    all: "Tutti",
    none: "Nessuno",
    actions: "3 misure chiave",
    analyzing: "Generazione analisi AI...",
    ask_placeholder: "Scrivi una domanda sui dati...",
    send: "Invia",
    chat_intro: "Ciao! Sono l'assistente AI di MyLugano. Chiedimi qualsiasi cosa sui dati della piattaforma.",
    suggestions: [
      "Qual è il trend degli utenti dal 2021?",
      "Perché i ricavi di aprile 2026 sono calati?",
      "Quali sono le 3 priorità per il Q3 2026?",
      "Come stanno andando i download Android?"
    ],
    kpis: [
      { label:"Utenti totali",   key:"utenti"        },
      { label:"Wallet attivi",   key:"wallet_attivi" },
      { label:"Partner totali",  key:"partner_totali"},
      { label:"Circolante CHF",  key:"circolante_chf"},
    ],
    kpi_prompt: (label, ctx) => `Sei un analista senior di MyLugano, piattaforma di wallet digitale della Città di Lugano.
Analizza questo KPI e rispondi SOLO con JSON valido, senza markdown:
{"headline":"una frase max 12 parole","impatto":"una frase max 20 parole","anomalia":"una frase su anomalie o null","misure":["azione 1 max 8 parole","azione 2 max 8 parole","azione 3 max 8 parole"]}
KPI: ${label}. Dati: ${ctx}`,
    system_prompt: (s) => `Sei un analista senior di MyLugano, la piattaforma di wallet digitale e cashback della Città di Lugano.
Dati attuali: Utenti ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% MoM), Wallet attivi ${s?.wallet_attivi?.valore?.toLocaleString()}, Partner ${s?.partner_totali?.valore}, Circolante CHF ${s?.circolante_chf?.valore?.toLocaleString()}.
Rispondi in italiano, in modo conciso e professionale. Non usare markdown con asterischi.`,
  }
};

const API = "https://mylugano-backend.onrender.com";

// ── HELPERS ──────────────────────────────────────────────────
function pivotByMese(data, key, years) {
  return MESI_ORDER.map(m => {
    const row = { mese: m };
    years.forEach(y => {
      const found = data.find(d => d.mese === m && d.anno === y);
      row["y"+y] = (found && found[key] != null && found[key] > 0) ? found[key] : null;
    });
    return row;
  });
}

function allTimeSerie(data, key) {
  return data
    .filter(d => d[key] != null && d[key] > 0 && d.anno >= 2021)
    .map(d => ({ label: d.mese+" "+d.anno, valore: d[key], mese: d.mese, anno: d.anno }));
}

function getMinMax(pivoted, years) {
  let minVal = Infinity, maxVal = -Infinity, minPoint = null, maxPoint = null;
  pivoted.forEach(row => {
    years.forEach(y => {
      const v = row["y"+y];
      if (v == null) return;
      if (v < minVal) { minVal = v; minPoint = { mese: row.mese, year: y, val: v }; }
      if (v > maxVal) { maxVal = v; maxPoint = { mese: row.mese, year: y, val: v }; }
    });
  });
  return { minPoint, maxPoint };
}

function hasNote(mese, years, notesObj) {
  if (!notesObj || Object.keys(notesObj).length === 0) return false;
  return years.some(y => notesObj[`${mese}-${y}`]);
}

function getNoteText(mese, years, notesObj) {
  if (!notesObj || Object.keys(notesObj).length === 0) return null;
  for (const y of years) {
    const note = notesObj[`${mese}-${y}`];
    if (note) return note;
  }
  return null;
}

async function callClaude(prompt, system = "") {
  const res = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system })
  });
  const data = await res.json();
  return data.text || "";
}

// ── RESPONSIVE HOOK ──────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── UI BASE ──────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      borderTop: `3px solid ${RED}`, padding: 20,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)", ...style
    }}>
      {children}
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  return (
    <div style={{ display: "flex", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden" }}>
      {["en", "it"].map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding: "5px 14px", fontSize: 12, fontWeight: lang === l ? 600 : 400,
          background: lang === l ? RED : "#fff", color: lang === l ? "#fff" : MUTED,
          border: "none", cursor: "pointer"
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
}

function YearFilter({ allYears, selected, onChange, t }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: MUTED }}>{t.filter}</span>
      {allYears.map(y => {
        const active = selected.includes(y);
        const color = YEAR_COLORS[y] || RED;
        return (
          <button key={y} onClick={() => {
            const next = active ? selected.filter(x => x !== y) : [...selected, y].sort();
            onChange(next);
          }} style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 12,
            border: `1.5px solid ${active ? color : BORDER}`,
            background: active ? color + "33" : "#fff",
            color: active ? color : "#aaa",
            cursor: "pointer", fontWeight: active ? 700 : 400
          }}>{y}</button>
        );
      })}
      <button onClick={() => onChange(allYears)} style={{
        fontSize: 11, padding: "3px 10px", borderRadius: 12,
        border: `1px solid ${BORDER}`, background: "#fff", color: MUTED, cursor: "pointer"
      }}>{t.all}</button>
      <button onClick={() => onChange([])} style={{
        fontSize: 11, padding: "3px 10px", borderRadius: 12,
        border: `1px solid ${BORDER}`, background: "#fff", color: MUTED, cursor: "pointer"
      }}>{t.none || "Nessuno"}</button>
    </div>
  );
}

// ── CUSTOM DOT per picchi/valli locali ───────────────────────
function isLocalPeak(pivoted, mese, year) {
  const key = "y" + year;
  const idx = pivoted.findIndex(r => r.mese === mese);
  if (idx <= 0 || idx >= pivoted.length - 1) return false;
  const prev = pivoted[idx-1][key];
  const curr = pivoted[idx][key];
  const next = pivoted[idx+1][key];
  if (!prev || !curr || !next) return false;
  return curr > prev && curr > next;
}
function isLocalValley(pivoted, mese, year) {
  const key = "y" + year;
  const idx = pivoted.findIndex(r => r.mese === mese);
  if (idx <= 0 || idx >= pivoted.length - 1) return false;
  const prev = pivoted[idx-1][key];
  const curr = pivoted[idx][key];
  const next = pivoted[idx+1][key];
  if (!prev || !curr || !next) return false;
  return curr < prev && curr < next;
}
function CustomDot(props) {
  const { cx, cy, payload, dataKey, pivoted } = props;
  const year = parseInt(dataKey.replace("y", ""));
  const val = payload[dataKey];
  if (!val) return null;
  const isPeak = isLocalPeak(pivoted || [], payload.mese, year);
  const isValley = isLocalValley(pivoted || [], payload.mese, year);
  if (!isPeak && !isValley) return <circle cx={cx} cy={cy} r={2} fill={YEAR_COLORS[year] || RED} opacity={0.5} />;
  const yOffset = isPeak ? -16 : 14;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={RED} stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={cy + yOffset} textAnchor="middle" fontSize={9} fontWeight={600} fill={RED}>
        {val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}
      </text>
    </g>
  );
}

// ── KPI CARD WITH AI ──────────────────────────────────────────
function KpiCard({ label, value, delta, prev, pos, context, kpiPromptFn, t }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!context) return;
    setLoading(true);
    setAnalysis(null);
    callClaude(kpiPromptFn(label, context)).then(text => {
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        setAnalysis(JSON.parse(clean));
      } catch { setAnalysis(null); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [label, context]);

  return (
    <div style={{
      background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16,
      padding: 20, position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: pos ? RED : "#ccc", borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>{value}</div>
          <div style={{ fontSize: 11, marginTop: 5, color: pos ? GREEN : RED, fontWeight: 500 }}>{delta}</div>
          <div style={{ fontSize: 10, marginTop: 3, color: MUTED }}>{prev}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, fontWeight: 700,
          background: pos ? RED_L : "rgba(150,150,150,0.1)", color: pos ? RED : "#999", flexShrink: 0
        }}>{pos ? "↑" : "↓"}</div>
      </div>
      <div style={{ height: 1, background: BORDER, marginBottom: 14 }} />
      {loading && <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>{t.analyzing}</div>}
      {analysis && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: DARK }}>{analysis.headline}</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65, marginBottom: analysis.anomalia ? 12 : 14 }}>{analysis.impatto}</div>
          {analysis.anomalia && (
            <div style={{ background: AMBER_L, border: `1px solid rgba(180,83,9,0.2)`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
              <div style={{ fontSize: 12, color: AMBER, lineHeight: 1.55, fontWeight: 500 }}>{analysis.anomalia}</div>
            </div>
          )}
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.actions}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {analysis.misure?.map((m, j) => (
              <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: RED_L, fontSize: 10, fontWeight: 700, color: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{j + 1}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: DARK }}>{m}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── CHART HELPERS ─────────────────────────────────────────────

function NoteTooltip({ active, payload, label, years, notes }) {
  if (!active || !payload || !payload.length) return null;
  const note = getNoteText(label, years || [], notes);
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, maxWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => p.value && (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {p.value.toLocaleString()}</div>
      ))}
      {note && <div style={{ marginTop: 8, color: MUTED, fontSize: 11, borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>ⓘ {label} — {note}</div>}
    </div>
  );
}

function CustomXTick({ x, y, payload, noteMesi }) {
  const hasN = noteMesi && noteMesi.includes(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill={MUTED}>{payload.value}</text>
      {hasN && <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill={MUTED} fontWeight={500}>ⓘ</text>}
    </g>
  );
}

function CustomXTickAllTime({ x, y, payload, noteLabels }) {
  const hasN = noteLabels && noteLabels.includes(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={9} fill={MUTED}>{payload.value}</text>
      {hasN && <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill={MUTED} fontWeight={500}>ⓘ</text>}
    </g>
  );
}

function CustomBarLabel(props) {
  const { x, y, width, value } = props;
  if (!value || value <= 0) return null;
  return (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={8} fontWeight={600} fill={MUTED}>
      {value >= 1000 ? (value / 1000).toFixed(1) + "k" : value}
    </text>
  );
}

function Leg({ color, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: DARK, fontWeight: 500 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}

function ExportBtn({ chartRef, title }) {
  function doExport() {
    const node = chartRef.current;
    if (!node) return;
    const svg = node.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx2d = canvas.getContext("2d");
    ctx2d.scale(2, 2);
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx2d.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      const safeName = title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").trim().replace(/ +/g, "_");
      link.download = `${safeName}_${date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }
  return (
    <button onClick={doExport} style={{
      marginTop: 12, fontSize: 11, color: MUTED, background: "none",
      border: `1px solid ${BORDER}`, borderRadius: 8, padding: "4px 12px",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 6
    }}>
      <span>↓</span> Export PNG
    </button>
  );
}

const MESE_TO_Q = {Jan:"Q1",Feb:"Q1",Mar:"Q1",Apr:"Q2",May:"Q2",Jun:"Q2",Jul:"Q3",Aug:"Q3",Sep:"Q3",Oct:"Q4",Nov:"Q4",Dec:"Q4"};

function buildQuarterly(data) {
  const map = {};
  data.filter(d => d.nuovi_utenti != null && d.nuovi_utenti > 0 && d.anno >= 2021).forEach(d => {
    const q = MESE_TO_Q[d.mese];
    if (!q) return;
    const key = q + " " + d.anno;
    map[key] = (map[key] || 0) + d.nuovi_utenti;
  });
  return Object.entries(map)
    .sort(([a], [b]) => {
      const [qa, ya] = a.split(" ");
      const [qb, yb] = b.split(" ");
      return ya !== yb ? parseInt(ya) - parseInt(yb) : qa.localeCompare(qb);
    })
    .map(([label, valore]) => ({ label, valore: Math.round(valore) }));
}

function ChartNuoviUtenti({ data, title, lang, kpiPromptFn, t }) {
  const chartRef = useRef(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const serie = buildQuarterly(data);

  useEffect(() => {
    if (!serie.length) return;
    setLoading(true);
    const ctx = (lang === "it" ? "Nuovi utenti aggregati per trimestre: " : "New users per quarter: ") + serie.map(d => d.label + ": " + d.valore).join(", ");
    const prompt = kpiPromptFn(lang === "it" ? "Nuovi utenti per trimestre" : "New users per quarter", ctx);
    callClaude(prompt).then(text => {
      try {
        const clean = text.replace(/```json|```/g,"").trim();
        setAnalysis(JSON.parse(clean));
      } catch { setAnalysis(null); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lang, data]);

  return (
    <Card style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={serie} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
            <YAxis tickFormatter={v => v ? v.toLocaleString() : ""} tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => v ? v.toLocaleString() : "-"} />
            <Bar dataKey="valore" fill={RED} radius={[3,3,0,0]}>
              <LabelList dataKey="valore" content={<CustomBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ExportBtn chartRef={chartRef} title={title} />
      <div style={{ height: 1, background: BORDER, margin: "14px 0" }} />
      {loading && <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>{t.analyzing}</div>}
      {analysis && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, color: DARK }}>{analysis.headline}</div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.65, marginBottom: analysis.anomalia ? 12 : 14 }}>{analysis.impatto}</div>
          {analysis.anomalia && (
            <div style={{ background: AMBER_L, border: "1px solid rgba(180,83,9,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
              <div style={{ fontSize: 12, color: AMBER, lineHeight: 1.55, fontWeight: 500 }}>{analysis.anomalia}</div>
            </div>
          )}
          <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{t.actions}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {analysis.misure?.map((m, j) => (
              <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: RED_L, fontSize: 10, fontWeight: 700, color: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{j+1}</div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: DARK }}>{m}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function ChartLine({ data, dataKey, years, title, sub, yPadding, notes }) {
  const chartRef = useRef(null);
  const pivoted = pivotByMese(data, dataKey, years);
  const noteMesi = pivoted.filter(row => hasNote(row.mese, years, notes)).map(r => r.mese);
  const allVals = pivoted.flatMap(row => years.map(y => row["y"+y]).filter(Boolean));
  const maxVal = allVals.length ? Math.max(...allVals) : 0;
  const yMax = yPadding ? Math.ceil((maxVal + yPadding) / 10000) * 10000 : undefined;
  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{sub}</div>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {years.map(y => <Leg key={y} color={YEAR_COLORS[y] || RED} label={y} />)}
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={pivoted} margin={{ bottom: noteMesi.length > 0 ? 16 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="mese" tick={<CustomXTick noteMesi={noteMesi} />} height={noteMesi.length > 0 ? 40 : 20} />
            <YAxis tickFormatter={v => v ? (v / 1000).toFixed(0) + "k" : ""} tick={{ fontSize: 10 }} domain={yMax ? [0, yMax] : ["auto", "auto"]} />
            <Tooltip content={<NoteTooltip years={years} notes={notes} />} />
            {years.map(y => (
              <Line key={y} type="monotone" dataKey={"y" + y}
                stroke={YEAR_COLORS[y] || RED} strokeWidth={2}
                dot={<CustomDot pivoted={pivoted} dataKey={"y" + y} />}
                name={String(y)} connectNulls={false}
                strokeDasharray={y === new Date().getFullYear() ? "4 2" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ExportBtn chartRef={chartRef} title={title} />
    </Card>
  );
}

function ChartBar({ data, dataKey, years, title, sub, notes }) {
  const chartRef = useRef(null);
  const pivoted = pivotByMese(data, dataKey, years);
  const noteMesi = pivoted.filter(row => hasNote(row.mese, years, notes)).map(r => r.mese);
  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{sub}</div>}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {years.map(y => <Leg key={y} color={YEAR_COLORS[y] || RED} label={y} />)}
      </div>
      <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={pivoted} barSize={Math.max(3, Math.floor(18 / years.length))} margin={{ bottom: noteMesi.length > 0 ? 16 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="mese" tick={<CustomXTick noteMesi={noteMesi} />} height={noteMesi.length > 0 ? 40 : 20} />
            <YAxis tickFormatter={v => v ? (v / 1000).toFixed(0) + "k" : ""} tick={{ fontSize: 10 }} />
            <Tooltip content={<NoteTooltip years={years} notes={notes} />} />
            {years.map(y => (
              <Bar key={y} dataKey={"y" + y} fill={YEAR_COLORS[y] || RED} name={String(y)} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ExportBtn chartRef={chartRef} title={title} />
    </Card>
  );
}

function isLocalPeakSerie(serie, i) {
  if (i <= 0 || i >= serie.length - 1) return false;
  return serie[i].valore > serie[i-1].valore && serie[i].valore > serie[i+1].valore;
}
function isLocalValleySerie(serie, i) {
  if (i <= 0 || i >= serie.length - 1) return false;
  return serie[i].valore < serie[i-1].valore && serie[i].valore < serie[i+1].valore;
}
function CustomDotAllTime(props) {
  const { cx, cy, index, value, serie, showEvery3, noteKeys } = props;
  if (!value || !serie) return null;
  const isPeak = isLocalPeakSerie(serie, index);
  const isValley = isLocalValleySerie(serie, index);
  const isEvery3 = showEvery3 && index % 3 === 0;
  const showLabel = isPeak || isValley || isEvery3;
  if (!showLabel) return <circle cx={cx} cy={cy} r={1.5} fill={RED} opacity={0.3} />;
  const yOffset = isValley && !isEvery3 ? 14 : -16;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={RED} stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={cy + yOffset} textAnchor="middle" fontSize={9} fontWeight={600} fill={RED}>
        {value >= 1000 ? (value / 1000).toFixed(0) + "k" : value}
      </text>
    </g>
  );
}
function ChartAllTime({ data, dataKey, title, sub, showEvery3, notes, yPadding }) {
  const serie = allTimeSerie(data, dataKey);
  const maxVal = serie.length ? Math.max(...serie.map(d => d.valore)) : 0;
  const yMax = yPadding ? Math.ceil((maxVal + yPadding) / 10000) * 10000 : undefined;
  const noteKeys = notes ? serie.reduce((acc, d, i) => {
    const k = d.mese + "-" + d.anno;
    if (notes[k]) acc.push(i);
    return acc;
  }, []) : [];
  const noteIndicesSerie = noteKeys;
  return (
    <Card>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>{sub}</div>}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={serie}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
          <XAxis dataKey="label" tick={<CustomXTickAllTime noteLabels={noteIndicesSerie.map(i => serie[i]?.label)} />}
            ticks={[
              ...serie.filter((_, i) => i % 6 === 0).map(d => d.label),
              ...noteIndicesSerie.map(i => serie[i]?.label)
            ].filter((v, i, arr) => arr.indexOf(v) === i)}
            height={noteIndicesSerie.length > 0 ? 40 : 20} />
          <YAxis tickFormatter={v => v ? (v / 1000).toFixed(0) + "k" : ""} tick={{ fontSize: 10 }} domain={yMax ? [0, yMax] : ['auto', 'auto']} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const d = payload[0]?.payload;
            const note = notes && d && notes[d.mese + "-" + d.anno];
            return (
              <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, padding: "10px 14px", fontSize: 12, maxWidth: 220 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{d?.label}</div>
                <div style={{ color: RED }}>{payload[0]?.value?.toLocaleString()}</div>
                {note && <div style={{ marginTop: 8, color: MUTED, fontSize: 11, borderTop: "1px solid " + BORDER, paddingTop: 6 }}>ⓘ {d?.mese} {d?.anno}: {note}</div>}
              </div>
            );
          }} />
          <Line type="monotone" dataKey="valore" stroke={RED} strokeWidth={2}
            dot={<CustomDotAllTime serie={serie} showEvery3={showEvery3} noteKeys={noteKeys} />} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── CHATBOT ──────────────────────────────────────────────────
function formatMessage(text) {
  return text
    .replace(/#{1,3} (.+)/g, '<strong style="font-size:13px;display:block;margin:10px 0 4px">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n/g, '<br>');
}

function ChatBot({ summary, t }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: t.chat_intro }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const reply = await callClaude(userMsg, t.system_prompt(summary));
      setMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>💬 {t.tab_chat.replace("💬 ", "")}</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 12 }}>{t.chat_intro}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {t.suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)} style={{
              fontSize: 11, padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${BORDER}`, background: "#f7f7f9", color: MUTED, cursor: "pointer"
            }}>{s}</button>
          ))}
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, maxHeight: 400, overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              fontSize: 13, lineHeight: 1.7,
              background: m.role === "user" ? RED : "#fff",
              color: m.role === "user" ? "#fff" : DARK,
              border: m.role === "user" ? "none" : `1px solid ${BORDER}`
            }}
              dangerouslySetInnerHTML={m.role === "assistant" ? { __html: formatMessage(m.text) } : undefined}>
              {m.role === "user" ? m.text : undefined}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex" }}><div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#fff", border: `1px solid ${BORDER}`, fontSize: 13, color: MUTED }}>...</div></div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder={t.ask_placeholder} style={{ flex: 1, padding: "10px 14px", border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={send} disabled={loading} style={{
          padding: "10px 20px", background: RED, color: "#fff", border: "none",
          borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1
        }}>{t.send}</button>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("it");
  const [tab, setTab] = useState("kpi");
  const [selYears, setSelYears] = useState([2025, 2026]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [transactions, setTx] = useState([]);
  const [downloads, setDl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState({});
  const isMobile = useIsMobile();
  const t = I18N[lang];

  useEffect(() => {
    async function fetchAll() {
      try {
        const [s, u, r, tx, d, n] = await Promise.all([
          fetch(`${API}/api/summary`).then(r => r.json()),
          fetch(`${API}/api/users`).then(r => r.json()),
          fetch(`${API}/api/revenue`).then(r => r.json()),
          fetch(`${API}/api/transactions`).then(r => r.json()),
          fetch(`${API}/api/downloads`).then(r => r.json()),
          fetch(`${API}/api/notes`).then(r => r.json()).catch(() => ({})),
        ]);
        setSummary(s);
        setUsers(u.filter(d => d.anno >= 2021 && Number.isInteger(d.anno)));
        setRevenue(r.filter(d => d.anno >= 2021 && Number.isInteger(d.anno)));
        setTx(tx.filter(d => d.anno >= 2021 && Number.isInteger(d.anno)));
        setDl(d.filter(d => d.anno >= 2021 && Number.isInteger(d.anno)));
        setNotes(n || {});
        const yrs = [...new Set(u.map(d => d.anno))].filter(y => Number.isInteger(y) && y >= 2021).sort();
        setSelYears(yrs.slice(-1));
      } catch(e) {
        setError("Cannot connect to API.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", color: MUTED }}>Caricamento dati...</div>;
  if (error) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui", color: RED, textAlign: "center", padding: 40 }}><div><div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div><div>{error}</div></div></div>;

  const allYears = [...new Set(users.map(d => d.anno))].sort();

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 14,
  };

  return (
    <div style={{ background: "#f7f7f9", minHeight: "100vh", fontFamily: "system-ui,sans-serif", padding: isMobile ? "1rem" : "2rem 1.5rem 4rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: RED, color: "#fff", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>ML</div>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, letterSpacing: -0.5 }}>MyLugano</div>
            <div style={{ fontSize: 11, color: MUTED }}>{t.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, color: MUTED, background: "#fff", border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "5px 14px", textDecoration: "none", cursor: "pointer"
            }}>{t.live}</a>
          )}
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* Tabs — scroll orizzontale su mobile */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: 8, minWidth: "max-content", paddingBottom: 4 }}>
          {[
            ["kpi", t.tab_kpi],
            ["trends", t.tab_trends],
            ["history", t.tab_history],
            ["chat", t.tab_chat],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              fontSize: 13, fontWeight: tab === id ? 600 : 400,
              padding: "8px 20px", borderRadius: 20, whiteSpace: "nowrap",
              border: tab === id ? `1.5px solid ${RED}` : `1px solid ${BORDER}`,
              background: tab === id ? RED_L : "#fff",
              color: tab === id ? RED : MUTED, cursor: "pointer"
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── TAB KPI ── */}
      {tab === "kpi" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: "1.5rem" }}>
            <ChartNuoviUtenti data={users} title={lang === "it" ? "Nuovi utenti per trimestre" : "New users per quarter"} lang={lang} kpiPromptFn={t.kpi_prompt} t={t} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: "2rem" }}>
            {t.kpis.map(k => {
              const s = summary[k.key];
              return (
                <div key={k.key} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: RED, borderRadius: "14px 14px 0 0" }} />
                  <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: -0.5 }}>{s?.valore?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: s?.delta_pct >= 0 ? GREEN : RED, fontWeight: 500 }}>{s?.delta_pct > 0 ? "+" : ""}{s?.delta_pct}% vs prev</div>
                  <div style={{ fontSize: 10, marginTop: 3, color: MUTED }}>{s?.prev?.toLocaleString()} prev</div>
                </div>
              );
            })}
          </div>
          <div style={gridStyle}>
            {t.kpis.map(k => {
              const s = summary[k.key];
              const ctx = `${k.label}: ${s?.valore?.toLocaleString()} (${s?.delta_pct}% vs mese precedente). Mese precedente: ${s?.prev?.toLocaleString()}.`;
              return (
                <KpiCard key={k.key}
                  label={k.label}
                  value={s?.valore?.toLocaleString()}
                  delta={`${s?.delta_pct > 0 ? "+" : ""}${s?.delta_pct}% vs prev`}
                  prev={`${s?.prev?.toLocaleString()} prev month`}
                  pos={s?.delta_pct >= 0}
                  context={ctx}
                  kpiPromptFn={t.kpi_prompt}
                  t={t}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── TAB TRENDS ── */}
      {tab === "trends" && (
        <>
          <YearFilter allYears={allYears} selected={selYears} onChange={setSelYears} t={t} />
          <div style={gridStyle}>
            <ChartLine data={users} dataKey="utenti" years={selYears}
              title={lang === "it" ? "Utenti totali" : "Total Users"}
              sub={lang === "it" ? "Trend mensile cumulativo" : "Monthly cumulative trend"}
              yPadding={20000} notes={notes} />
            <ChartLine data={users} dataKey="wallet_attivi" years={selYears.filter(y => y >= 2025)}
              title={lang === "it" ? "Wallet attivi" : "Active Wallets"}
              sub={lang === "it" ? "Disponibile dal 2025" : "Available from 2025"} notes={notes} />
            <ChartBar data={revenue} dataKey="incassi_chf" years={selYears}
              title={lang === "it" ? "Ricavi mensili CHF" : "Monthly Revenue CHF"}
              sub={lang === "it" ? "Circuito totale" : "Total circuit"} notes={notes} />
            <ChartBar data={revenue} dataKey="cashback_chf" years={selYears}
              title={lang === "it" ? "Cashback emesso CHF" : "Cashback Issued CHF"}
              sub={lang === "it" ? "Circuito totale" : "Total circuit"} notes={notes} />
            <ChartBar data={transactions} dataKey="transazioni" years={selYears}
              title={lang === "it" ? "Transazioni mensili" : "Monthly Transactions"}
              sub={lang === "it" ? "Circuito totale" : "Total circuit"} notes={notes} />
            <ChartLine data={downloads} dataKey="download_totali" years={selYears.filter(y => y >= 2025)}
              title={lang === "it" ? "Download cumulativi" : "Cumulative Downloads"} sub="iOS + Android" notes={notes} />
          </div>
        </>
      )}

      {/* ── TAB HISTORY ── */}
      {tab === "history" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <ChartAllTime data={users} dataKey="utenti"
            title={lang === "it" ? "Utenti — storico completo" : "Users — full history"} sub="2021 →"
            showEvery3={true} notes={notes} yPadding={20000} />
          <ChartAllTime data={transactions} dataKey="transazioni"
            title={lang === "it" ? "Transazioni — storico completo" : "Transactions — full history"} sub="2024 →" notes={notes} />
          <ChartAllTime data={revenue} dataKey="incassi_chf"
            title={lang === "it" ? "Ricavi CHF — storico completo" : "Revenue CHF — full history"} sub="2024 →" notes={notes} />
          <ChartAllTime data={revenue} dataKey="cashback_chf"
            title={lang === "it" ? "Cashback CHF — storico completo" : "Cashback CHF — full history"} sub="2024 →" notes={notes} />
        </div>
      )}

      {/* ── TAB CHAT ── */}
      {tab === "chat" && <ChatBot summary={summary} t={t} />}

      <div style={{ marginTop: "2.5rem", textAlign: "center", fontSize: 11, color: MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: "1.5rem" }}>
        MyLugano · {lang === "it" ? "Città di Lugano" : "City of Lugano"} · Live data from Google Sheets
      </div>
    </div>
  );
}
