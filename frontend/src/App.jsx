import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";

const API = "https://mylugano-backend.onrender.com";
const RED="#d42f3a", RED_L="rgba(212,47,58,0.08)", GREEN="#1fa363";
const MUTED="#7a7a8a", BORDER="#e8e8ee", DARK="#111118", AMBER="#b45309", AMBER_L="rgba(180,83,9,0.08)";
const YEAR_COLORS={2021:"#999",2022:"#777",2023:"#d4d4d4",2024:"#f5a5a8",2025:"#d42f3a",2026:"#7c3aed",2027:"#2563eb"};
const MESI_ORDER=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const I18N = {
  en: {
    subtitle: "KPI Dashboard — Live",
    live: "Live · Google Sheets",
    tab_kpi: "KPI & Analysis",
    tab_trends: "Trends",
    tab_history: "Full History",
    tab_chat: "💬 Ask the data",
    filter: "Filter:",
    all: "All",
    actions: "3 key actions",
    analyzing: "Generating AI analysis...",
    ask_placeholder: "Ask a question about the data...",
    send: "Send",
    chat_intro: "Hi! I'm the MyLugano AI assistant. Ask me anything about the platform data — trends, anomalies, recommendations.",
    suggestions: [
      "What is the user growth trend since 2021?",
      "Why did April 2026 revenue drop?",
      "What are the top 3 priorities for Q3 2026?",
      "How are Android downloads performing?"
    ],
    kpis: [
      { label:"Total Users", key:"utenti", context: (s) => `Total users: ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% vs previous month). Previous month: ${s?.utenti?.prev?.toLocaleString()}.` },
      { label:"Active Wallets", key:"wallet_attivi", context: (s) => `Active wallets: ${s?.wallet_attivi?.valore?.toLocaleString()} (${s?.wallet_attivi?.delta_pct}% vs previous month).` },
      { label:"Total Partners", key:"partner_totali", context: (s) => `Total partners: ${s?.partner_totali?.valore} (${s?.partner_totali?.delta_pct}% vs previous month).` },
      { label:"Circulating CHF", key:"circolante_chf", context: (s) => `Circulating CHF: ${s?.circolante_chf?.valore?.toLocaleString()} (${s?.circolante_chf?.delta_pct}% vs previous month).` },
    ],
    system_prompt: (s) => `You are a senior data analyst for MyLugano, the digital wallet and cashback platform of the City of Lugano, Switzerland, launched in 2021. 
Current data: Users ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% MoM), Active wallets ${s?.wallet_attivi?.valore?.toLocaleString()}, Partners ${s?.partner_totali?.valore}, Circulating CHF ${s?.circolante_chf?.valore?.toLocaleString()}.
Answer concisely and professionally in English.`,
    kpi_prompt: (label, ctx) => `You are a senior analyst for MyLugano, digital wallet platform of the City of Lugano.
Analyze this KPI and respond ONLY with valid JSON, no markdown:
{"headline":"one sentence max 12 words capturing the key message","impatto":"one sentence on economic or UX impact max 20 words","anomalia":"one sentence on any anomaly or null if none","misure":["action 1 max 8 words","action 2 max 8 words","action 3 max 8 words"]}
KPI: ${label}. Data: ${ctx}`,
  },
  it: {
    subtitle: "Dashboard KPI — Live",
    live: "Live · Google Sheets",
    tab_kpi: "KPI & Analisi",
    tab_trends: "Andamenti",
    tab_history: "Storico completo",
    tab_chat: "💬 Chiedi ai dati",
    filter: "Filtra:",
    all: "Tutti",
    actions: "3 misure chiave",
    analyzing: "Generazione analisi AI...",
    ask_placeholder: "Scrivi una domanda sui dati...",
    send: "Invia",
    chat_intro: "Ciao! Sono l'assistente AI di MyLugano. Chiedimi qualsiasi cosa sui dati della piattaforma — trend, anomalie, raccomandazioni.",
    suggestions: [
      "Qual è il trend degli utenti dal 2021?",
      "Perché i ricavi di aprile 2026 sono calati?",
      "Quali sono le 3 priorità per il Q3 2026?",
      "Come stanno andando i download Android?"
    ],
    kpis: [
      { label:"Utenti totali", key:"utenti", context: (s) => `Utenti totali: ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% vs mese precedente). Mese precedente: ${s?.utenti?.prev?.toLocaleString()}.` },
      { label:"Wallet attivi", key:"wallet_attivi", context: (s) => `Wallet attivi: ${s?.wallet_attivi?.valore?.toLocaleString()} (${s?.wallet_attivi?.delta_pct}% vs mese precedente).` },
      { label:"Partner totali", key:"partner_totali", context: (s) => `Partner totali: ${s?.partner_totali?.valore} (${s?.partner_totali?.delta_pct}% vs mese precedente).` },
      { label:"Circolante CHF", key:"circolante_chf", context: (s) => `Circolante CHF: ${s?.circolante_chf?.valore?.toLocaleString()} (${s?.circolante_chf?.delta_pct}% vs mese precedente).` },
    ],
    system_prompt: (s) => `Sei un analista senior di MyLugano, la piattaforma di wallet digitale e cashback della Città di Lugano, lanciata nel 2021.
Dati attuali: Utenti ${s?.utenti?.valore?.toLocaleString()} (${s?.utenti?.delta_pct}% MoM), Wallet attivi ${s?.wallet_attivi?.valore?.toLocaleString()}, Partner ${s?.partner_totali?.valore}, Circolante CHF ${s?.circolante_chf?.valore?.toLocaleString()}.
Rispondi SEMPRE in italiano, in modo conciso e professionale. Usa paragrafi brevi e chiari. Non usare markdown con asterischi o simboli — scrivi testo semplice e leggibile.`,
    kpi_prompt: (label, ctx) => `Sei un analista senior di MyLugano, piattaforma di wallet digitale della Città di Lugano.
Analizza questo KPI e rispondi SOLO con JSON valido, senza markdown:
{"headline":"una frase max 12 parole che cattura il messaggio chiave","impatto":"una frase su impatto economico o UX max 20 parole","anomalia":"una frase su anomalie o null se nessuna","misure":["azione 1 max 8 parole","azione 2 max 8 parole","azione 3 max 8 parole"]}
KPI: ${label}. Dati: ${ctx}`,
  }
};

// ── HELPERS ──────────────────────────────────────────────────
function cleanData(data) {
  return data.filter(d => d.anno && d.anno >= 2021 && Number.isInteger(d.anno));
}
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
  return cleanData(data).filter(d => d[key] != null && d[key] > 0)
    .map(d => ({ label: d.mese+" "+d.anno, valore: d[key] }));
}
async function callClaude(prompt, system="") {
  const res = await fetch(`${API}/api/chat`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ prompt, system })
  });
  const data = await res.json();
  return data.text || "";
}

// ── UI BASE ──────────────────────────────────────────────────
function Card({ children, style={} }) {
  return <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:16,borderTop:`3px solid ${RED}`,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",...style}}>{children}</div>;
}
function TabBtn({ label, active, onClick }) {
  return <button onClick={onClick} style={{fontSize:13,fontWeight:active?600:400,padding:"8px 20px",borderRadius:20,border:active?`1.5px solid ${RED}`:`1px solid ${BORDER}`,background:active?RED_L:"#fff",color:active?RED:MUTED,cursor:"pointer"}}>{label}</button>;
}
function LangToggle({ lang, setLang }) {
  return (
    <div style={{display:"flex",background:"#fff",border:`1px solid ${BORDER}`,borderRadius:20,overflow:"hidden"}}>
      {["en","it"].map(l=>(
        <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 14px",fontSize:12,fontWeight:lang===l?600:400,background:lang===l?RED:"#fff",color:lang===l?"#fff":MUTED,border:"none",cursor:"pointer"}}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
function YearFilter({ allYears, selected, onChange, t }) {
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
      <span style={{fontSize:11,color:MUTED}}>{t.filter}</span>
      {allYears.map(y => {
        const active = selected.includes(y);
        const color = YEAR_COLORS[y]||RED;
        return <button key={y} onClick={()=>{const next=active?selected.filter(x=>x!==y):[...selected,y].sort();if(next.length>0)onChange(next);}} style={{fontSize:11,padding:"3px 10px",borderRadius:12,border:`1.5px solid ${active?color:BORDER}`,background:active?color+"22":"#fff",color:active?color:MUTED,cursor:"pointer",fontWeight:active?600:400}}>{y}</button>;
      })}
      <button onClick={()=>onChange(allYears)} style={{fontSize:11,padding:"3px 10px",borderRadius:12,border:`1px solid ${BORDER}`,background:"#fff",color:MUTED,cursor:"pointer"}}>{t.all}</button>
    </div>
  );
}

// ── KPI CARD WITH AI ANALYSIS ─────────────────────────────────
function KpiCard({ label, value, delta, prev, pos, context, kpiPromptFn, t }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!context) return;
    setLoading(true);
    setAnalysis(null);
    callClaude(kpiPromptFn(label, context)).then(text => {
      try {
        const clean = text.replace(/```json|```/g,"").trim();
        setAnalysis(JSON.parse(clean));
      } catch { setAnalysis(null); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [label, context]);

  return (
    <div style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:16,padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:pos?RED:"#ccc",borderRadius:"16px 16px 0 0"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
        <div>
          <div style={{fontSize:11,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{label}</div>
          <div style={{fontSize:26,fontWeight:700,lineHeight:1,letterSpacing:-1}}>{value}</div>
          <div style={{fontSize:11,marginTop:5,color:pos?GREEN:RED,fontWeight:500}}>{delta}</div>
          <div style={{fontSize:10,marginTop:3,color:MUTED}}>{prev}</div>
        </div>
        <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,background:pos?RED_L:"rgba(150,150,150,0.1)",color:pos?RED:"#999",flexShrink:0}}>{pos?"↑":"↓"}</div>
      </div>
      <div style={{height:1,background:BORDER,marginBottom:14}}/>
      {loading && <div style={{fontSize:12,color:MUTED,fontStyle:"italic"}}>{t.analyzing}</div>}
      {analysis && (
        <>
          <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8,color:DARK}}>{analysis.headline}</div>
          <div style={{fontSize:12,color:MUTED,lineHeight:1.65,marginBottom:analysis.anomalia?12:14}}>{analysis.impatto}</div>
          {analysis.anomalia && (
            <div style={{background:AMBER_L,border:`1px solid rgba(180,83,9,0.2)`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0}}>⚠</span>
              <div style={{fontSize:12,color:AMBER,lineHeight:1.55,fontWeight:500}}>{analysis.anomalia}</div>
            </div>
          )}
          <div style={{fontSize:9,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{t.actions}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {analysis.misure?.map((m,j)=>(
              <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:6,background:RED_L,fontSize:10,fontWeight:700,color:RED,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{j+1}</div>
                <div style={{fontSize:12,lineHeight:1.5,color:DARK}}>{m}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── GRAFICI ──────────────────────────────────────────────────
function ChartLine({ data, dataKey, years, title, sub }) {
  const pivoted = pivotByMese(data, dataKey, years);
  return (
    <Card>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:MUTED,marginBottom:16}}>{sub}</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={pivoted}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="mese" tick={{fontSize:10}}/>
          <YAxis tickFormatter={v=>v?(v/1000).toFixed(0)+"k":""} tick={{fontSize:10}}/>
          <Tooltip formatter={v=>v?v.toLocaleString():"-"}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          {years.map(y=><Line key={y} type="monotone" dataKey={"y"+y} stroke={YEAR_COLORS[y]||RED} strokeWidth={2} dot={{r:2}} name={String(y)} connectNulls={false} strokeDasharray={y===new Date().getFullYear()?"4 2":undefined}/>)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
function ChartBar({ data, dataKey, years, title, sub }) {
  const pivoted = pivotByMese(data, dataKey, years);
  return (
    <Card>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:MUTED,marginBottom:16}}>{sub}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={pivoted} barSize={Math.max(3,Math.floor(18/years.length))}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="mese" tick={{fontSize:10}}/>
          <YAxis tickFormatter={v=>v?(v/1000).toFixed(0)+"k":""} tick={{fontSize:10}}/>
          <Tooltip formatter={v=>v?v.toLocaleString()+" CHF":"-"}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          {years.map(y=><Bar key={y} dataKey={"y"+y} fill={YEAR_COLORS[y]||RED} name={String(y)} radius={[2,2,0,0]}/>)}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
function ChartAllTime({ data, dataKey, title, sub }) {
  const serie = allTimeSerie(data, dataKey);
  return (
    <Card style={{gridColumn:"1 / -1"}}>
      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:MUTED,marginBottom:16}}>{sub}</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={serie}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="label" tick={{fontSize:9}} interval={5}/>
          <YAxis tickFormatter={v=>v?(v/1000).toFixed(0)+"k":""} tick={{fontSize:10}}/>
          <Tooltip formatter={v=>v?v.toLocaleString():"-"}/>
          <Line type="monotone" dataKey="valore" stroke={RED} strokeWidth={2} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function formatMessage(text) {
  return text
    .replace(/#{1,3} (.+)/g, '<strong style="font-size:13px;display:block;margin:10px 0 4px">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n/g, '<br>');
}
function ChatBot({ summary, t }) {
  const [messages, setMessages] = useState([{role:"assistant",text:t.chat_intro}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  async function send() {
    if (!input.trim()||loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m=>[...m,{role:"user",text:userMsg}]);
    setLoading(true);
    try {
      const reply = await callClaude(userMsg, t.system_prompt(summary));
      setMessages(m=>[...m,{role:"assistant",text:reply}]);
    } catch {
      setMessages(m=>[...m,{role:"assistant",text:"Connection error. Please try again."}]);
    }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:720,margin:"0 auto"}}>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>💬 {t.tab_chat.replace("💬 ","")}</div>
        <div style={{fontSize:12,color:MUTED,marginBottom:12}}>{t.chat_intro}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {t.suggestions.map((s,i)=><button key={i} onClick={()=>setInput(s)} style={{fontSize:11,padding:"4px 12px",borderRadius:20,border:`1px solid ${BORDER}`,background:"#f7f7f9",color:MUTED,cursor:"pointer"}}>{s}</button>)}
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16,maxHeight:400,overflowY:"auto"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",fontSize:13,lineHeight:1.7,background:m.role==="user"?RED:"#fff",color:m.role==="user"?"#fff":DARK,border:m.role==="user"?"none":`1px solid ${BORDER}`,textAlign:m.role==="user"?"center":"left"}}
              dangerouslySetInnerHTML={m.role==="assistant" ? {__html: formatMessage(m.text)} : undefined}>
              {m.role==="user" ? m.text : undefined}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex"}}><div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:"#fff",border:`1px solid ${BORDER}`,fontSize:13,color:MUTED}}>...</div></div>}
        <div ref={endRef}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={t.ask_placeholder} style={{flex:1,padding:"10px 14px",border:`1px solid ${BORDER}`,borderRadius:12,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} disabled={loading} style={{padding:"10px 20px",background:RED,color:"#fff",border:"none",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",opacity:loading?0.6:1}}>{t.send}</button>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang]       = useState("en");
  const [tab, setTab]         = useState("kpi");
  const [summary, setSummary] = useState(null);
  const [users, setUsers]     = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [transactions, setTx] = useState([]);
  const [downloads, setDl]    = useState([]);
  const [selYears, setSelYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const t = I18N[lang];

  useEffect(()=>{
    async function fetchAll(){
      try {
        const [s,u,r,tx,d] = await Promise.all([
          axios.get(`${API}/api/summary`),
          axios.get(`${API}/api/users`),
          axios.get(`${API}/api/revenue`),
          axios.get(`${API}/api/transactions`),
          axios.get(`${API}/api/downloads`),
        ]);
        setSummary(s.data);
        const cu=cleanData(u.data), cr=cleanData(r.data), ct=cleanData(tx.data), cd=cleanData(d.data);
        setUsers(cu); setRevenue(cr); setTx(ct); setDl(cd);
        const yrs=[...new Set(cu.map(d=>d.anno))].sort();
        setSelYears(yrs.slice(-4));
      } catch(e) {
        setError("Cannot connect to API. Make sure the backend is running on port 8000.");
      } finally { setLoading(false); }
    }
    fetchAll();
  },[]);

  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui",color:MUTED}}>Loading data from Google Sheets...</div>;
  if (error)   return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui",color:RED,textAlign:"center",padding:40}}><div><div style={{fontSize:24,marginBottom:12}}>⚠️</div><div>{error}</div></div></div>;

  const allYears = [...new Set(users.map(d=>d.anno))].sort();

  const fmt = (v,pos) => (
    <span style={{color:pos?GREEN:RED,fontWeight:500}}>{v>0?"+":""}{v}% vs prev</span>
  );

  return (
    <div style={{background:"#f7f7f9",minHeight:"100vh",fontFamily:"system-ui,sans-serif",padding:"2rem 1.5rem 4rem"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem",paddingBottom:"1.5rem",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:10,background:RED,color:"#fff",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>ML</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:-0.5}}>MyLugano</div>
            <div style={{fontSize:11,color:MUTED}}>{t.subtitle}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:MUTED,background:"#fff",border:`1px solid ${BORDER}`,borderRadius:20,padding:"5px 14px"}}>{t.live}</div>
          <LangToggle lang={lang} setLang={setLang}/>
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"2rem"}}>
          {t.kpis.map(k=>{
            const s = summary[k.key];
            return (
              <div key={k.key} style={{background:"#fff",border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:s?.delta_pct>=0?RED:"#ccc",borderRadius:"14px 14px 0 0"}}/>
                <div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{k.label}</div>
                <div style={{fontSize:22,fontWeight:700,letterSpacing:-0.5}}>{s?.valore?.toLocaleString()}</div>
                <div style={{fontSize:11,marginTop:4,color:s?.delta_pct>=0?GREEN:RED,fontWeight:500}}>{s?.delta_pct>0?"+":""}{s?.delta_pct}% vs prev</div>
                <div style={{fontSize:10,marginTop:3,color:MUTED}}>{s?.prev?.toLocaleString()} prev month</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:"1.5rem",flexWrap:"wrap"}}>
        <TabBtn label={t.tab_kpi}     active={tab==="kpi"}     onClick={()=>setTab("kpi")}/>
        <TabBtn label={t.tab_trends}  active={tab==="trends"}  onClick={()=>setTab("trends")}/>
        <TabBtn label={t.tab_history} active={tab==="history"} onClick={()=>setTab("history")}/>
        <TabBtn label={t.tab_chat}    active={tab==="chat"}    onClick={()=>setTab("chat")}/>
      </div>

      {/* KPI TAB */}
      {tab==="kpi" && summary && (
        <>
          <YearFilter allYears={allYears} selected={selYears} onChange={setSelYears} t={t}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:"2rem"}}>
            {t.kpis.map(k=>(
              <KpiCard key={k.key}
                label={k.label}
                value={summary[k.key]?.valore?.toLocaleString()}
                delta={`${summary[k.key]?.delta_pct>0?"+":""}${summary[k.key]?.delta_pct}% vs prev`}
                prev={`${summary[k.key]?.prev?.toLocaleString()} prev month`}
                pos={summary[k.key]?.delta_pct>=0}
                context={k.context(summary)}
                kpiPromptFn={t.kpi_prompt}
                t={t}
              />
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <ChartLine data={users}   dataKey="utenti"        years={selYears} title={lang==="it"?"Utenti totali":"Total Users"}         sub={lang==="it"?"Trend mensile cumulativo":"Monthly cumulative trend"}/>
            <ChartLine data={users}   dataKey="wallet_attivi" years={selYears.filter(y=>y>=2025)} title={lang==="it"?"Wallet attivi":"Active Wallets"} sub={lang==="it"?"Disponibile dal 2025":"Available from 2025"}/>
            <ChartBar  data={revenue} dataKey="incassi_chf"   years={selYears} title={lang==="it"?"Ricavi mensili CHF":"Monthly Revenue CHF"} sub={lang==="it"?"Circuito totale":"Total circuit"}/>
            <ChartBar  data={revenue} dataKey="cashback_chf"  years={selYears} title={lang==="it"?"Cashback emesso CHF":"Cashback Issued CHF"} sub={lang==="it"?"Circuito totale":"Total circuit"}/>
          </div>
        </>
      )}

      {/* TRENDS TAB */}
      {tab==="trends" && (
        <>
          <YearFilter allYears={allYears} selected={selYears} onChange={setSelYears} t={t}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <ChartBar  data={transactions} dataKey="transazioni"      years={selYears} title={lang==="it"?"Transazioni mensili":"Monthly Transactions"} sub={lang==="it"?"Circuito totale":"Total circuit"}/>
            <ChartLine data={downloads}    dataKey="download_totali"  years={selYears.filter(y=>y>=2025)} title={lang==="it"?"Download cumulativi":"Cumulative Downloads"} sub="iOS + Android"/>
            <ChartLine data={downloads}    dataKey="download_ios"     years={selYears.filter(y=>y>=2025)} title="iOS Downloads" sub={lang==="it"?"Cumulativo":"Cumulative"}/>
            <ChartLine data={downloads}    dataKey="download_android" years={selYears.filter(y=>y>=2025)} title="Android Downloads" sub={lang==="it"?"Cumulativo":"Cumulative"}/>
          </div>
        </>
      )}

      {/* HISTORY TAB */}
      {tab==="history" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <ChartAllTime data={users}        dataKey="utenti"       title={lang==="it"?"Utenti — storico completo":"Users — full history"}        sub="2021 →"/>
          <ChartAllTime data={transactions} dataKey="transazioni"  title={lang==="it"?"Transazioni — storico completo":"Transactions — full history"} sub="2023 →"/>
          <ChartAllTime data={revenue}      dataKey="incassi_chf"  title={lang==="it"?"Ricavi CHF — storico completo":"Revenue CHF — full history"}  sub="2023 →"/>
          <ChartAllTime data={revenue}      dataKey="cashback_chf" title={lang==="it"?"Cashback CHF — storico completo":"Cashback CHF — full history"} sub="2023 →"/>
        </div>
      )}

      {/* CHAT TAB */}
      {tab==="chat" && <ChatBot summary={summary} t={t}/>}

      <div style={{marginTop:"2.5rem",textAlign:"center",fontSize:11,color:MUTED,borderTop:`1px solid ${BORDER}`,paddingTop:"1.5rem"}}>
        MyLugano · {lang==="it"?"Città di Lugano":"City of Lugano"} · Live data from Google Sheets
      </div>
    </div>
  );
}