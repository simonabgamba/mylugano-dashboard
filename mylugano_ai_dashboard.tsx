import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const RED="#d42f3a",RED_L="rgba(212,47,58,0.08)",GREEN="#1fa363",MUTED="#7a7a8a",
      BORDER="#e8e8ee",SURF="#f7f7f9",WHITE="#fff",DARK="#111118",
      BLUE="#2563eb",AMBER="#b45309",AMBER_L="rgba(180,83,9,0.08)",PURPLE="#7c3aed";

const T = {
  en: {
    subtitle: "KPI Dashboard — updated April 2026",
    years: "2024 · 2025 · 2026",
    tab_kpi: "KPI & Analysis",
    tab_trends: "Trends",
    kpi_section: "KPI Analysis — updated April 2026",
    key_actions: "3 key actions",
    footer: "MyLugano · City of Lugano · Data 2024–2026",
  },
  it: {
    subtitle: "Dashboard KPI — aggiornato aprile 2026",
    years: "2024 · 2025 · 2026",
    tab_kpi: "KPI & Analisi",
    tab_trends: "Andamenti",
    kpi_section: "Analisi KPI — aggiornato aprile 2026",
    key_actions: "3 misure chiave",
    footer: "MyLugano · Città di Lugano · Dati 2024–2026",
  }
};

const summary = {
  en: [
    {label:"Users (Apr 2026)",value:"58,096",prev:"48,904 in Apr 2025",delta:"+9,192 · +18.8%",pos:true},
    {label:"Active Wallets",value:"41,326",prev:"31,404 in Apr 2025",delta:"+9,922 · +31.6% · 71% of users",pos:true},
    {label:"Total Partners",value:"471",prev:"435 in Apr 2025",delta:"+36 · +8.3% · 160 active (34%)",pos:true},
    {label:"Circulating CHF",value:"669,576",prev:"619,211 in Apr 2025",delta:"+50,365 · +8.1%",pos:true},
  ],
  it: [
    {label:"Utenti (apr 2026)",value:"58.096",prev:"48.904 ad apr 2025",delta:"+9.192 · +18,8%",pos:true},
    {label:"Wallet attivi",value:"41.326",prev:"31.404 ad apr 2025",delta:"+9.922 · +31,6% · 71% degli utenti",pos:true},
    {label:"Partner totali",value:"471",prev:"435 ad apr 2025",delta:"+36 · +8,3% · 160 attivi (34%)",pos:true},
    {label:"Circolante CHF",value:"669.576",prev:"619.211 ad apr 2025",delta:"+50.365 · +8,1%",pos:true},
  ]
};

const kpis = {
  en: [
    {label:"Total Users",value:"58,096",delta:"+18.8% vs Apr 2025",pos:true,
     headline:"Consistent growth — on track for 60K by mid-2026",
     anomalia:null,
     impatto:"Users reached 58,096 in April 2026, adding ~526 net new users vs March. The monthly growth pace is stable and linear.",
     misure:["Target 60,000 users by June 2026","Monitor net monthly additions vs churn","Verify whether growth is organic or campaign-driven"]},
    {label:"Active Wallet Rate",value:"71%",delta:"recovering from 65% in Jan 2026",pos:true,
     headline:"Wallet rate rebounds: back above 70%",
     anomalia:"The rate dropped to 65% in January 2026 but recovered to 71% by April — surpassing December 2025. The Q1 dip appears seasonal, not structural.",
     impatto:"40,251 active wallets in April 2026, up from 39,884 in January. Engagement is improving alongside user growth.",
     misure:["Maintain onboarding flow that drove April recovery","Set 73% as the next target by end of Q2","Investigate what drove the January dip to prevent recurrence"]},
    {label:"Total Partners",value:"471",delta:"+8 vs Mar 2026",pos:true,
     headline:"Partners growing again — best figure since 2025 peak",
     anomalia:"After declining from 470 to 463 between January and March, April shows a strong recovery to 471 — the highest count recorded. Worth monitoring whether this holds in May.",
     impatto:"A growing partner network expands spending opportunities for users and signals renewed merchant interest.",
     misure:["Confirm April partner additions with onboarding data","Set a target of 500 total partners by end of 2026","Analyze which categories new partners belong to"]},
    {label:"Circulating CHF",value:"669,576",delta:"stable vs Q1 2026",pos:true,
     headline:"Circulating value stable — slight decrease from Feb peak",
     anomalia:"After peaking at CHF 677,937 in February, circulating value gradually declined to 669,576 in April. A healthy correction — the February spike appears to have been temporary LVGA accumulation.",
     impatto:"Stable circulating value with a gradual downward trend suggests users are actively spending their LVGA balances.",
     misure:["Monitor whether the downward trend continues in May","Ensure circulating value stays above CHF 650,000","Track the ratio of circulating CHF to monthly transactions"]},
    {label:"Q1+Apr 2026 Revenue",value:"CHF 97,208",delta:"+7.6% vs same period 2025",pos:true,
     headline:"Revenue growth continues but April slows",
     anomalia:"April 2026 revenue (CHF 21,467) is -36% vs April 2025 (CHF 33,598) and also below April 2024. This is the first month in 2026 where performance falls below both prior years.",
     impatto:"Q1 2026 was strong across all three months. April introduces caution. The full H1 picture depends on May and June.",
     misure:["Investigate the April 2026 revenue drop","Identify top merchants by April volume","Launch a May campaign to recover momentum"]},
    {label:"Active Partners",value:"160",delta:"+6 vs Mar 2026",pos:true,
     headline:"Active partners at highest level since mid-2025",
     anomalia:null,
     impatto:"160 active partners out of 471 total (34%). Both numbers are improving but the gap between total and active partners remains a key challenge.",
     misure:["Push active rate above 40% by end of 2026","Run a dedicated activation campaign for the 311 inactive partners","Introduce monthly activity reports sent to each merchant"]},
    {label:"Total Downloads",value:"51,229",delta:"+15.2% vs Apr 2025",pos:true,
     headline:"Downloads on track — Android showing first signs of recovery",
     anomalia:"Android downloads turned positive in April 2026 (+97 net), the best figure since the negative run in Q1. Still small but a potential turning point.",
     impatto:"iOS continues to drive growth (+336 in April). The Android recovery is tentative but encouraging after months of net losses.",
     misure:["Monitor Android download trend in May to confirm recovery","Optimize Google Play listing to sustain the positive trend","Track iOS vs Android ratio — target 80/20 by end of 2026"]},
    {label:"Monthly Transactions",value:"7,500",delta:"-65% vs Apr 2025",pos:false,
     headline:"Transaction gap vs 2025 persists — methodology check urgent",
     anomalia:"April 2026 shows 7,500 transactions vs 21,379 in April 2025 (-65%). Four consecutive months of ~65-70% gap strongly suggests a methodology change rather than a real usage drop.",
     impatto:"Until the counting methodology is clarified, this KPI cannot be used reliably for decision-making.",
     misure:["Resolve the methodology question with the tech team — urgent","If methodology changed, recalculate 2025 data on the new basis","Define a transaction KPI that is consistently measurable across years"]}
  ],
  it: [
    {label:"Utenti totali",value:"58.096",delta:"+18,8% vs apr 2025",pos:true,
     headline:"Crescita costante — obiettivo 60K entro metà 2026",
     anomalia:null,
     impatto:"Gli utenti raggiungono 58.096 ad aprile 2026, con circa 526 nuovi utenti netti rispetto a marzo. Il ritmo di crescita mensile è stabile e lineare.",
     misure:["Obiettivo 60.000 utenti entro giugno 2026","Monitora le aggiunte mensili nette vs il churn","Verifica se la crescita è organica o trainata da campagne"]},
    {label:"% Wallet attivi",value:"71%",delta:"in ripresa dal 65% di gen 2026",pos:true,
     headline:"Il tasso wallet rimbalza: torna sopra il 70%",
     anomalia:"Il tasso era sceso al 65% a gennaio 2026 ma è risalito al 71% ad aprile — superando il dicembre 2025. Il calo del Q1 sembra stagionale, non strutturale.",
     impatto:"41.326 wallet attivi ad aprile 2026, in aumento rispetto ai 39.884 di gennaio. L'engagement migliora insieme alla crescita degli utenti.",
     misure:["Mantieni il flusso di onboarding che ha guidato la ripresa di aprile","Imposta il 73% come prossimo obiettivo entro fine Q2","Indaga cosa ha causato il calo di gennaio per prevenirlo"]},
    {label:"Partner totali",value:"471",delta:"+8 vs mar 2026",pos:true,
     headline:"I partner crescono di nuovo — record storico",
     anomalia:"Dopo il calo da 470 a 463 tra gennaio e marzo, aprile mostra una forte ripresa a 471 — il numero più alto mai registrato. Da monitorare se si conferma a maggio.",
     impatto:"Una rete di partner in crescita amplia le opportunità di spesa per gli utenti e segnala un rinnovato interesse dei merchant.",
     misure:["Conferma le nuove adesioni di aprile con i dati di onboarding","Obiettivo 500 partner totali entro fine 2026","Analizza a quali categorie appartengono i nuovi partner"]},
    {label:"Circolante CHF",value:"669.576",delta:"stabile vs Q1 2026",pos:true,
     headline:"Circolante stabile — lieve calo dal picco di febbraio",
     anomalia:"Dopo il picco di CHF 677.937 a febbraio, il circolante è sceso gradualmente a 669.576 ad aprile. Una correzione sana — il picco di febbraio sembra essere stato un accumulo temporaneo di LVGA.",
     impatto:"Un circolante stabile con tendenza leggermente discendente suggerisce che gli utenti stanno attivamente spendendo i loro saldi LVGA.",
     misure:["Monitora se la tendenza discendente continua a maggio","Assicurati che il circolante rimanga sopra CHF 650.000","Traccia il rapporto circolante/transazioni mensili"]},
    {label:"Ricavi Q1+apr 2026",value:"CHF 97.208",delta:"+7,6% vs stesso periodo 2025",pos:true,
     headline:"La crescita dei ricavi continua ma aprile rallenta",
     anomalia:"I ricavi di aprile 2026 (CHF 21.467) sono -36% rispetto ad aprile 2025 (CHF 33.598) e anche sotto aprile 2024. È il primo mese del 2026 in cui la performance scende sotto entrambi gli anni precedenti.",
     impatto:"Il Q1 2026 è stato forte su tutti e tre i mesi. Aprile introduce cautela. Il quadro completo del H1 dipende da maggio e giugno.",
     misure:["Indaga il calo dei ricavi di aprile 2026","Identifica i principali merchant per volume ad aprile","Lancia una campagna a maggio per recuperare lo slancio"]},
    {label:"Partner attivi",value:"160",delta:"+6 vs mar 2026",pos:true,
     headline:"Partner attivi al livello più alto da metà 2025",
     anomalia:null,
     impatto:"160 partner attivi su 471 totali (34%). Entrambi i numeri migliorano ma il divario tra partner totali e attivi rimane una sfida chiave.",
     misure:["Portare il tasso attivi sopra il 40% entro fine 2026","Avviare una campagna di attivazione per i 311 partner inattivi","Introdurre report mensili di attività inviati automaticamente a ogni merchant"]},
    {label:"Download totali",value:"51.229",delta:"+15,2% vs apr 2025",pos:true,
     headline:"Download in crescita — Android mostra i primi segnali di ripresa",
     anomalia:"I download Android sono tornati positivi ad aprile 2026 (+97 netti), il dato migliore dopo i mesi negativi del Q1. Ancora piccolo ma potenziale punto di svolta.",
     impatto:"iOS continua a trainare la crescita (+336 ad aprile). La ripresa Android è ancora incerta ma incoraggiante dopo mesi di perdite nette.",
     misure:["Monitora il trend Android a maggio per confermare la ripresa","Ottimizza la scheda su Google Play per sostenere il trend positivo","Obiettivo rapporto iOS/Android 80/20 entro fine 2026"]},
    {label:"Transazioni mensili",value:"7.500",delta:"-65% vs apr 2025",pos:false,
     headline:"Il gap transazioni vs 2025 persiste — verifica metodologia urgente",
     anomalia:"Aprile 2026 mostra 7.500 transazioni vs 21.379 di aprile 2025 (-65%). Quattro mesi consecutivi con un gap del 65-70% suggerisce fortemente un cambiamento metodologico piuttosto che un vero calo d'uso.",
     impatto:"Finché la metodologia di conteggio non viene chiarita, questo KPI non può essere usato in modo affidabile per le decisioni.",
     misure:["Risolvi la questione metodologica con il team tecnico — urgente","Se la metodologia è cambiata, ricalcola i dati 2025 sulla nuova base","Definisci e documenta formalmente la metodologia di conteggio delle transazioni"]}
  ]
};

const chartLabels = {
  en: {
    users_title: "Total Users — 2025 vs 2026", users_sub: "Monthly cumulative trend",
    users_headline: "2026 tracking ~9,000 ahead of 2025 — pace holding",
    users_impatto: "Four months of data confirm the gap is stable. If the current monthly growth rate holds, 60,000 users are reachable by June 2026.",
    users_misure: ["Target 60,000 users by June 2026","Monitor net monthly additions vs March pace","Verify growth is organic not just campaign-driven"],
    wallet_title: "Active Wallets — 2025 vs 2026", wallet_sub: "Monthly cumulative",
    wallet_headline: "Wallet recovery in April confirms Q1 dip was seasonal",
    wallet_anomalia: "The April 2025 dip in wallet actives was the only negative month of 2025. In 2026, Q1 showed a low rate of 65% but April recovered to 71% — above December 2025.",
    wallet_impatto: "Both years show the same seasonal pattern: Q1 softness followed by April recovery. 2026 is tracking ~9,000 wallets ahead of 2025.",
    wallet_misure: ["Set 43,000 active wallets as target for Q2 2026","Monitor whether the seasonal Q1 dip repeats in 2027","Use April recovery pattern to time future activation campaigns"],
    rev_title: "Monthly Revenue CHF — 2024 vs 2025 vs 2026", rev_sub: "Three-year comparison (2026: Jan-Apr)",
    rev_headline: "April 2026 breaks the positive Q1 trend",
    rev_anomalia: "April 2026 revenue (CHF 21,467) is -36% vs April 2025 and below April 2024. This is the first month in 2026 where performance falls below both prior years.",
    rev_impatto: "Q1 2026 was strong across all three months. April introduces caution — the pattern mirrors the weak April seen in 2025.",
    rev_misure: ["Investigate April 2026 revenue drop — seasonal or structural?","Identify top merchants by April volume","Launch a May campaign to recover momentum"],
    cb_title: "Cashback Issued CHF — 2024 vs 2025 vs 2026", cb_sub: "Three-year comparison (2026: Jan-Apr)",
    cb_headline: "April cashback drops sharply — ratio improves",
    cb_anomalia: "April 2026 cashback (CHF 15,879) is the lowest month of the year. Cashback dropped more sharply than revenue in April, which actually improves the cashback/revenue ratio for that month.",
    cb_impatto: "The cashback-to-revenue ratio in April 2026 is around 74% — still high overall, but the April data shows the ratio can self-correct when volumes drop.",
    cb_misure: ["Separate cashback tracking for private vs public circuit","Monitor April as a potential natural correction point","Verify the cashback/revenue ratio for private businesses only"],
    dl_title: "Cumulative Downloads — 2025 vs 2026", dl_sub: "iOS + Android combined",
    dl_headline: "Downloads growing — Android turning positive",
    dl_anomalia: "April 2026 Android downloads: +97 net — the first meaningfully positive month after three near-zero or negative months. Tentative but encouraging.",
    dl_impatto: "At the current pace, 52,000 total downloads are reachable by mid-2026. Android recovery needs confirmation over the next 2-3 months.",
    dl_misure: ["Monitor Android trend in May to confirm recovery","Optimize the Google Play listing to sustain momentum","Target 80/20 iOS/Android ratio by end of 2026"],
    tx_title: "Monthly Transactions — 2025 vs 2026", tx_sub: "Total transactions in the circuit",
    tx_headline: "Transaction gap persists — methodology clarification urgent",
    tx_anomalia: "Four consecutive months of ~65-70% gap vs 2025. Too consistent to be random. Until resolved, flag as unreliable in any external reporting.",
    tx_impatto: "Revenue and users are growing while transactions appear to drop — an inconsistency that must be explained before sharing with stakeholders.",
    tx_misure: ["Escalate methodology question to tech team","If methodology changed, restate all 2026 data on a comparable basis","Formally document the transaction counting methodology"],
    prof_title: "User Profiles — 2026 trend", prof_sub: "Jan-Apr 2026 composition",
    prof_headline: "Base growing fast, Verified declining — Plus accelerating",
    prof_anomalia: "Verified profiles dropped from 15,959 in January to 15,564 in April (-395). Simultaneously Base profiles grew by 1,506. Users are entering as Base and not upgrading.",
    prof_impatto: "The Plus profile is growing consistently (+277 in four months, from 1,305 to 1,582) — the strongest positive signal for monetization in 2026.",
    prof_misure: ["Introduce a verification incentive tied to cashback uplift","Track the Base-to-Verified conversion rate monthly","Set a Plus profile target of 2,000 by end of 2026"],
    merch_title: "Top 10 Merchants by Transactions", merch_sub: "Full year 2025 — total transaction count",
    merch_headline: "High concentration: top 3 account for 45% of transactions",
    merch_anomalia: "Mauri Concept and Da Lino together total over 6,500 transactions. If either exits, total volume drops ~15% overnight.",
    merch_impatto: "The long tail is very weak: from 4th place onwards volumes drop sharply. The circuit needs more mid-range merchants (500-1,500 transactions).",
    merch_misure: ["Lock in top 3 merchants with multi-year agreements","Support merchants with potential in the 200-500 tx range","Diversify by incentivising under-represented categories: health, culture, sport"],
    delta_title: "Cashback Delta % — 2024 vs 2025", delta_sub: "Monthly variation — green positive, red negative",
    delta_headline: "Explosive growth in Q2, reversal in Q4",
    delta_anomalia: "April shows the highest delta (+69.5%) despite April 2025 revenues being the lowest of the year. This spike is inflated by a weak April 2024 baseline.",
    delta_impatto: "Central months show extraordinary deltas. The autumn slowdown partly reflects a stronger 2024 base.",
    delta_misure: ["Calculate delta on a 3-month rolling average","Introduce extra cashback incentives in negative delta months","Set a minimum annual delta target as a formal objective"],
    y2025:"2025", y2026:"2026 (Jan-Apr)", y2024:"2024", transactions:"transactions",
  },
  it: {
    users_title: "Utenti totali — 2025 vs 2026", users_sub: "Trend mensile cumulativo",
    users_headline: "Il 2026 è ~9.000 utenti avanti al 2025 — ritmo confermato",
    users_impatto: "Quattro mesi di dati confermano che il gap è stabile. Al ritmo attuale, 60.000 utenti sono raggiungibili entro giugno 2026.",
    users_misure: ["Obiettivo 60.000 utenti entro giugno 2026","Monitora le aggiunte mensili nette vs il ritmo di marzo","Verifica se la crescita è organica o trainata da campagne"],
    wallet_title: "Wallet attivi — 2025 vs 2026", wallet_sub: "Trend mensile cumulativo",
    wallet_headline: "La ripresa di aprile conferma che il calo del Q1 era stagionale",
    wallet_anomalia: "Il calo dei wallet attivi ad aprile 2025 era l'unico mese negativo del 2025. Nel 2026, il Q1 ha mostrato un tasso del 65% ma aprile si è ripreso al 71% — sopra dicembre 2025.",
    wallet_impatto: "Entrambi gli anni mostrano lo stesso schema stagionale: Q1 debole seguito da ripresa ad aprile. Il 2026 è ~9.000 wallet avanti al 2025.",
    wallet_misure: ["Obiettivo 43.000 wallet attivi per il Q2 2026","Monitora se il calo stagionale del Q1 si ripete nel 2027","Usa il pattern di ripresa di aprile per pianificare le campagne di attivazione"],
    rev_title: "Ricavi mensili CHF — 2024 vs 2025 vs 2026", rev_sub: "Confronto tre anni (2026: gen-apr)",
    rev_headline: "Aprile 2026 interrompe il trend positivo del Q1",
    rev_anomalia: "I ricavi di aprile 2026 (CHF 21.467) sono -36% rispetto ad aprile 2025 e anche sotto aprile 2024. È il primo mese del 2026 in cui la performance scende sotto entrambi gli anni precedenti.",
    rev_impatto: "Il Q1 2026 è stato forte su tutti e tre i mesi. Aprile introduce cautela — lo schema rispecchia il debole aprile del 2025.",
    rev_misure: ["Indaga il calo dei ricavi di aprile 2026 — stagionale o strutturale?","Identifica i principali merchant per volume ad aprile","Lancia una campagna a maggio per recuperare lo slancio"],
    cb_title: "Cashback emesso CHF — 2024 vs 2025 vs 2026", cb_sub: "Confronto tre anni (2026: gen-apr)",
    cb_headline: "Il cashback di aprile cala nettamente — il rapporto migliora",
    cb_anomalia: "Il cashback di aprile 2026 (CHF 15.879) è il minimo dell'anno. Il cashback è calato più rapidamente dei ricavi ad aprile, migliorando di fatto il rapporto cashback/ricavi per quel mese.",
    cb_impatto: "Il rapporto cashback/ricavi ad aprile 2026 è intorno al 74% — ancora alto complessivamente, ma il dato di aprile mostra che il rapporto può auto-correggersi quando i volumi scendono.",
    cb_misure: ["Separa il monitoraggio cashback per circuito privato vs pubblico","Monitora aprile come potenziale punto di correzione naturale","Verifica il rapporto cashback/ricavi solo per le attività private"],
    dl_title: "Download cumulativi — 2025 vs 2026", dl_sub: "iOS + Android combinati",
    dl_headline: "Download in crescita — Android torna positivo",
    dl_anomalia: "Download Android ad aprile 2026: +97 netti — il primo mese significativamente positivo dopo tre mesi quasi a zero o negativi. Ancora incerto ma incoraggiante.",
    dl_impatto: "Al ritmo attuale, 52.000 download totali sono raggiungibili entro metà 2026. La ripresa Android va confermata nei prossimi 2-3 mesi.",
    dl_misure: ["Monitora il trend Android a maggio per confermare la ripresa","Ottimizza la scheda su Google Play per sostenere il momentum","Obiettivo rapporto iOS/Android 80/20 entro fine 2026"],
    tx_title: "Transazioni mensili — 2025 vs 2026", tx_sub: "Transazioni totali nel circuito",
    tx_headline: "Il gap transazioni persiste — verifica metodologia urgente",
    tx_anomalia: "Quattro mesi consecutivi con un gap del 65-70% vs 2025. Troppo consistente per essere casuale. Finché non risolto, segnalare come inaffidabile in qualsiasi report esterno.",
    tx_impatto: "Ricavi e utenti crescono mentre le transazioni sembrano calare — un'incoerenza da spiegare prima di condividere con gli stakeholder.",
    tx_misure: ["Escalate la questione metodologica al team tecnico","Se la metodologia è cambiata, ridichiarare tutti i dati 2026 su base comparabile","Documentare formalmente la metodologia di conteggio delle transazioni"],
    prof_title: "Profili utenti — trend 2026", prof_sub: "Composizione gen-apr 2026",
    prof_headline: "Base in forte crescita, Verificato in calo — Plus accelera",
    prof_anomalia: "I profili Verificati sono scesi da 15.959 a gennaio a 15.564 ad aprile (-395). Contemporaneamente i profili Base sono cresciuti di 1.506. Gli utenti entrano come Base e non effettuano l'upgrade.",
    prof_impatto: "Il profilo Plus cresce in modo consistente (+277 in quattro mesi, da 1.305 a 1.582) — il segnale positivo più forte per la monetizzazione nel 2026.",
    prof_misure: ["Introduci un incentivo alla verifica legato a un aumento del cashback","Traccia mensilmente il tasso di conversione Base → Verificato","Obiettivo profilo Plus: 2.000 entro fine 2026"],
    merch_title: "Top 10 merchant per transazioni", merch_sub: "Anno intero 2025 — numero totale transazioni",
    merch_headline: "Alta concentrazione: i top 3 rappresentano il 45% delle transazioni",
    merch_anomalia: "Mauri Concept e Da Lino insieme totalizzano oltre 6.500 transazioni. Se uno dei due esce, il volume totale cala ~15% in un colpo solo.",
    merch_impatto: "La coda lunga è molto debole: dal 4° classificato in poi i volumi calano nettamente. Il circuito ha bisogno di più merchant nella fascia media (500-1.500 transazioni).",
    merch_misure: ["Fidelizza i top 3 merchant con accordi pluriennali dedicati","Supporta i merchant con potenziale nella fascia 200-500 transazioni","Diversifica incentivando categorie sotto-rappresentate: salute, cultura, sport"],
    delta_title: "Delta % cashback — 2024 vs 2025", delta_sub: "Variazione mensile — verde positivo, rosso negativo",
    delta_headline: "Crescita esplosiva nel Q2, inversione nel Q4",
    delta_anomalia: "Aprile mostra il delta più alto (+69,5%) nonostante i ricavi di aprile 2025 siano stati i più bassi dell'anno. Il picco è gonfiato da una base 2024 debole.",
    delta_impatto: "I mesi centrali mostrano delta straordinari. Il rallentamento autunnale riflette in parte una base 2024 più forte.",
    delta_misure: ["Calcola il delta su media mobile a 3 mesi","Introduci incentivi cashback extra nei mesi con delta negativo","Definisci un target minimo di delta annuo come obiettivo formale"],
    y2025:"2025", y2026:"2026 (gen-apr)", y2024:"2024", transactions:"transazioni",
  }
};

const utentiTrend=[{m:"Jan",u25:47684,u26:56768},{m:"Feb",u25:48022,u26:57092},{m:"Mar",u25:48515,u26:57570},{m:"Apr",u25:48904,u26:58096},{m:"May",u25:49505,u26:null},{m:"Jun",u25:50823,u26:null},{m:"Jul",u25:52294,u26:null},{m:"Aug",u25:53277,u26:null},{m:"Sep",u25:53744,u26:null},{m:"Oct",u25:54282,u26:null},{m:"Nov",u25:54569,u26:null},{m:"Dec",u25:56481,u26:null}];
const walletTrend=[{m:"Jan",w25:31074,w26:39884},{m:"Feb",w25:31392,w26:40251},{m:"Mar",w25:32053,w26:40766},{m:"Apr",w25:31404,w26:41326},{m:"May",w25:32159,w26:null},{m:"Jun",w25:33635,w26:null},{m:"Jul",w25:35273,w26:null},{m:"Aug",w25:36335,w26:null},{m:"Sep",w25:36858,w26:null},{m:"Oct",w25:37442,w26:null},{m:"Nov",w25:37776,w26:null},{m:"Dec",w25:39536,w26:null}];
const incassiTrend=[{m:"Jan",i24:34788,i25:39939,i26:22024},{m:"Feb",i24:33805,i25:41287,i26:25272},{m:"Mar",i24:30435,i25:43580,i26:28445},{m:"Apr",i24:33291,i25:33598,i26:21467},{m:"May",i24:34628,i25:48344,i26:null},{m:"Jun",i24:40620,i25:58243,i26:null},{m:"Jul",i24:57976,i25:56288,i26:null},{m:"Aug",i24:47981,i25:49296,i26:null},{m:"Sep",i24:34859,i25:39618,i26:null},{m:"Oct",i24:38907,i25:38652,i26:null},{m:"Nov",i24:34867,i25:32286,i26:null},{m:"Dec",i24:85872,i25:39558,i26:null}];
const cashbackTrend=[{m:"Jan",c24:12074,c25:15276,c26:16899},{m:"Feb",c24:12309,c25:16017,c26:20187},{m:"Mar",c24:13806,c25:18954,c26:22773},{m:"Apr",c24:13303,c25:17986,c26:15879},{m:"May",c24:14269,c25:22549,c26:null},{m:"Jun",c24:15053,c25:24929,c26:null},{m:"Jul",c24:20468,c25:23783,c26:null},{m:"Aug",c24:20188,c25:22014,c26:null},{m:"Sep",c24:16341,c25:17412,c26:null},{m:"Oct",c24:16006,c25:19201,c26:null},{m:"Nov",c24:16602,c25:16566,c26:null},{m:"Dec",c24:23910,c25:20965,c26:null}];
const downloadTrend=[{m:"Jan",d25:43801,d26:50180},{m:"Feb",d25:44040,d26:50436},{m:"Mar",d25:44299,d26:50796},{m:"Apr",d25:44516,d26:51229},{m:"May",d25:44758,d26:null},{m:"Jun",d25:45446,d26:null},{m:"Jul",d25:46664,d26:null},{m:"Aug",d25:48178,d26:null},{m:"Sep",d25:48956,d26:null},{m:"Oct",d25:49259,d26:null},{m:"Nov",d25:49622,d26:null},{m:"Dec",d25:49783,d26:null}];
const txTrend=[
  {m:"Jan",t23:2177,t24:5624,t25:7564,t26:8246},
  {m:"Feb",t23:2151,t24:4914,t25:6978,t26:7541},
  {m:"Mar",t23:2697,t24:4922,t25:7774,t26:8993},
  {m:"Apr",t23:2224,t24:5295,t25:5337,t26:7500},
  {m:"May",t23:2844,t24:4967,t25:10681,t26:null},
  {m:"Jun",t23:5852,t24:6350,t25:16473,t26:null},
  {m:"Jul",t23:6016,t24:7902,t25:13647,t26:null},
  {m:"Aug",t23:6500,t24:12907,t25:13594,t26:null},
  {m:"Sep",t23:3462,t24:13286,t25:7052,t26:null},
  {m:"Oct",t23:3793,t24:4871,t25:8722,t26:null},
  {m:"Nov",t23:3098,t24:6492,t25:7988,t26:null},
  {m:"Dec",t23:null,t24:13720,t25:8126,t26:null},
];
const deltaData=[{m:"Jan",delta:26.52},{m:"Feb",delta:30.13},{m:"Mar",delta:37.29},{m:"Apr",delta:69.50},{m:"May",delta:58.03},{m:"Jun",delta:65.61},{m:"Jul",delta:16.20},{m:"Aug",delta:9.04},{m:"Sep",delta:6.55},{m:"Oct",delta:19.97},{m:"Nov",delta:-0.22},{m:"Dec",delta:-12.32}];
const merchantData=[{name:"Mauri Concept",tx:3382},{name:"Da Lino",tx:3217},{name:"Snack Bar Piscina",tx:2343},{name:"Fully Burger",tx:2077},{name:"Rist. Al Lido",tx:1984},{name:"Comm. Pizzeria",tx:1771},{name:"McDonald's",tx:1731},{name:"PortoBello!",tx:1281},{name:"Il Segnalibro",tx:1147},{name:"Gabbani",tx:783}];
const profiliTrend=[{m:"Jan",base:19419,verif:15959,plus:1305,analog:3201},{m:"Feb",base:19985,verif:15625,plus:1407,analog:3234},{m:"Mar",base:20390,verif:15645,plus:1485,analog:3246},{m:"Apr",base:20925,verif:15564,plus:1582,analog:3255}];

const fmt=v=>v>=1000?(v/1000).toFixed(0)+"k":v;

const Leg=({color,label})=>(<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:MUTED}}><span style={{width:10,height:10,borderRadius:2,background:color,display:"inline-block"}}/>{label}</span>);
const Anomalia=({text})=>(<div style={{background:AMBER_L,border:"1px solid rgba(180,83,9,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:14,flexShrink:0}}>⚠</span><div style={{fontSize:12,color:AMBER,lineHeight:1.55,fontWeight:500}}>{text}</div></div>);

const Misure=({misure,label})=>(<>
  <div style={{fontSize:9,fontWeight:700,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{label}</div>
  <div style={{display:"flex",flexDirection:"column",gap:7}}>
    {misure.map((m,j)=>(<div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{width:20,height:20,borderRadius:6,background:RED_L,fontSize:10,fontWeight:700,color:RED,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{j+1}</div>
      <div style={{fontSize:12,lineHeight:1.5,color:DARK}}>{m}</div>
    </div>))}
  </div>
</>);

const ChartCard=({title,sub,headline,anomalia,impatto,misure,actionsLabel,children})=>(
  <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:16,padding:20,marginBottom:16,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:RED,borderRadius:"16px 16px 0 0"}}/>
    <div style={{fontSize:13,fontWeight:600,color:DARK,marginBottom:2,marginTop:4}}>{title}</div>
    {sub&&<div style={{fontSize:11,color:MUTED,marginBottom:16}}>{sub}</div>}
    {children}
    <div style={{marginTop:16,borderTop:`1px solid ${BORDER}`,paddingTop:14}}>
      <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:6,color:DARK}}>{headline}</div>
      <div style={{fontSize:12,color:MUTED,lineHeight:1.65,marginBottom:12}}>{impatto}</div>
      {anomalia&&<Anomalia text={anomalia}/>}
      <Misure misure={misure} label={actionsLabel}/>
    </div>
  </div>
);

function TabKPI({lang}){
  const s=summary[lang];
  const k=kpis[lang];
  const ui=T[lang];
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"2rem"}}>
      {s.map((item,i)=>(
        <div key={i} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:item.pos?RED:"#ccc",borderRadius:"14px 14px 0 0"}}/>
          <div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{item.label}</div>
          <div style={{fontSize:22,fontWeight:700,letterSpacing:-0.5}}>{item.value}</div>
          <div style={{fontSize:11,marginTop:4,color:item.pos?GREEN:RED,fontWeight:500}}>{item.delta}</div>
          <div style={{fontSize:10,marginTop:3,color:MUTED}}>{item.prev}</div>
        </div>
      ))}
    </div>
    <div style={{fontSize:10,color:MUTED,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:600,marginBottom:14}}>{ui.kpi_section}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {k.map((item,i)=>(
        <div key={i} style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:16,padding:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:item.pos?RED:"#ccc",borderRadius:"16px 16px 0 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,marginTop:4}}>
            <div>
              <div style={{fontSize:11,color:MUTED,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{item.label}</div>
              <div style={{fontSize:26,fontWeight:700,lineHeight:1,letterSpacing:-1}}>{item.value}</div>
              <div style={{fontSize:11,marginTop:5,color:item.pos?GREEN:RED,fontWeight:500}}>{item.delta}</div>
            </div>
            <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,background:item.pos?RED_L:"rgba(150,150,150,0.10)",color:item.pos?RED:"#999",flexShrink:0}}>{item.pos?"↑":"↓"}</div>
          </div>
          <div style={{height:1,background:BORDER,marginBottom:14}}/>
          <div style={{fontSize:13,fontWeight:600,lineHeight:1.4,marginBottom:8,color:DARK}}>{item.headline}</div>
          <div style={{fontSize:12,color:MUTED,lineHeight:1.65,marginBottom:item.anomalia?12:14}}>{item.impatto}</div>
          {item.anomalia&&<Anomalia text={item.anomalia}/>}
          <Misure misure={item.misure} label={ui.key_actions}/>
        </div>
      ))}
    </div>
  </>);
}

function TabGrafici({lang}){
  const L=chartLabels[lang];
  const al=T[lang].key_actions;
  return(<>
    <ChartCard title={L.users_title} sub={L.users_sub} headline={L.users_headline} anomalia={null} impatto={L.users_impatto} misure={L.users_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12}}><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/></div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={utentiTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={v=>(v/1000).toFixed(0)+"k"} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString():"-"}/>
          <Line type="monotone" dataKey="u25" stroke={RED} strokeWidth={2} dot={{r:3}} name={L.y2025} connectNulls={false}/>
          <Line type="monotone" dataKey="u26" stroke={PURPLE} strokeWidth={2} dot={{r:3}} name={L.y2026} connectNulls={false} strokeDasharray="4 2"/>
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.wallet_title} sub={L.wallet_sub} headline={L.wallet_headline} anomalia={L.wallet_anomalia} impatto={L.wallet_impatto} misure={L.wallet_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12}}><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/></div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={walletTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={v=>(v/1000).toFixed(0)+"k"} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString():"-"}/>
          <Line type="monotone" dataKey="w25" stroke={RED} strokeWidth={2} dot={{r:3}} name={L.y2025} connectNulls={false}/>
          <Line type="monotone" dataKey="w26" stroke={PURPLE} strokeWidth={2} dot={{r:3}} name={L.y2026} connectNulls={false} strokeDasharray="4 2"/>
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.rev_title} sub={L.rev_sub} headline={L.rev_headline} anomalia={L.rev_anomalia} impatto={L.rev_impatto} misure={L.rev_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}><Leg color="#f5a5a8" label={L.y2024}/><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/></div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={incassiTrend} barSize={7}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={fmt} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString()+" CHF":"-"}/>
          <Bar dataKey="i24" fill="#f5a5a8" radius={[2,2,0,0]} name={L.y2024}/>
          <Bar dataKey="i25" fill={RED} radius={[2,2,0,0]} name={L.y2025}/>
          <Bar dataKey="i26" fill={PURPLE} radius={[2,2,0,0]} name={L.y2026}/>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.cb_title} sub={L.cb_sub} headline={L.cb_headline} anomalia={L.cb_anomalia} impatto={L.cb_impatto} misure={L.cb_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}><Leg color="#f5a5a8" label={L.y2024}/><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/></div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={cashbackTrend} barSize={7}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={fmt} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString()+" CHF":"-"}/>
          <Bar dataKey="c24" fill="#f5a5a8" radius={[2,2,0,0]} name={L.y2024}/>
          <Bar dataKey="c25" fill={RED} radius={[2,2,0,0]} name={L.y2025}/>
          <Bar dataKey="c26" fill={PURPLE} radius={[2,2,0,0]} name={L.y2026}/>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.dl_title} sub={L.dl_sub} headline={L.dl_headline} anomalia={L.dl_anomalia} impatto={L.dl_impatto} misure={L.dl_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12}}><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/></div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={downloadTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={v=>(v/1000).toFixed(0)+"k"} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString():"-"}/>
          <Line type="monotone" dataKey="d25" stroke={RED} strokeWidth={2} dot={{r:3}} name={L.y2025}/>
          <Line type="monotone" dataKey="d26" stroke={PURPLE} strokeWidth={2} dot={{r:3}} name={L.y2026} strokeDasharray="4 2"/>
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.tx_title} sub={L.tx_sub} headline={L.tx_headline} anomalia={L.tx_anomalia} impatto={L.tx_impatto} misure={L.tx_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
        <Leg color="#d4d4d4" label="2023"/><Leg color="#f5a5a8" label="2024"/><Leg color={RED} label={L.y2025}/><Leg color={PURPLE} label={L.y2026}/>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={txTrend} barSize={5}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={fmt} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v?v.toLocaleString()+" "+L.transactions:"-"}/>
          <Bar dataKey="t23" fill="#d4d4d4" radius={[2,2,0,0]} name="2023"/>
          <Bar dataKey="t24" fill="#f5a5a8" radius={[2,2,0,0]} name="2024"/>
          <Bar dataKey="t25" fill={RED} radius={[2,2,0,0]} name={L.y2025}/>
          <Bar dataKey="t26" fill={PURPLE} radius={[2,2,0,0]} name={L.y2026}/>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.prof_title} sub={L.prof_sub} headline={L.prof_headline} anomalia={L.prof_anomalia} impatto={L.prof_impatto} misure={L.prof_misure} actionsLabel={al}>
      <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
        <Leg color={RED} label="Base"/><Leg color={BLUE} label="Verified"/><Leg color={GREEN} label="Plus"/><Leg color="#aaa" label={lang==="it"?"Analogico":"Analogue"}/>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={profiliTrend} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tickFormatter={v=>(v/1000).toFixed(0)+"k"} tick={{fontSize:10,fill:MUTED}}/>
          <Tooltip formatter={v=>v.toLocaleString()}/>
          <Bar dataKey="base" stackId="a" fill={RED} name="Base"/>
          <Bar dataKey="verif" stackId="a" fill={BLUE} name="Verified"/>
          <Bar dataKey="plus" stackId="a" fill={GREEN} name="Plus"/>
          <Bar dataKey="analog" stackId="a" fill="#aaa" name={lang==="it"?"Analogico":"Analogue"} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.merch_title} sub={L.merch_sub} headline={L.merch_headline} anomalia={L.merch_anomalia} impatto={L.merch_impatto} misure={L.merch_misure} actionsLabel={al}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={merchantData} layout="vertical" barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false}/>
          <XAxis type="number" tick={{fontSize:10,fill:MUTED}}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:MUTED}} width={120}/>
          <Tooltip formatter={v=>v.toLocaleString()+" "+L.transactions}/>
          <Bar dataKey="tx" fill={RED} radius={[0,3,3,0]} name={L.transactions}/>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title={L.delta_title} sub={L.delta_sub} headline={L.delta_headline} anomalia={L.delta_anomalia} impatto={L.delta_impatto} misure={L.delta_misure} actionsLabel={al}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={deltaData} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER}/>
          <XAxis dataKey="m" tick={{fontSize:10,fill:MUTED}}/><YAxis tick={{fontSize:10,fill:MUTED}} tickFormatter={v=>v+"%"}/>
          <Tooltip formatter={v=>v.toFixed(2)+"%"}/>
          <Bar dataKey="delta" name="Delta %" radius={[3,3,0,0]}>
            {deltaData.map((d,i)=><Cell key={i} fill={d.delta>=0?GREEN:RED}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  </>);
}

export default function App(){
  const [tab,setTab]=useState("kpi");
  const [lang,setLang]=useState("en");
  const ui=T[lang];
  return(
    <div style={{background:SURF,color:DARK,minHeight:"100vh",padding:"2rem 1.5rem 4rem",fontFamily:"system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem",paddingBottom:"1.5rem",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:10,background:RED,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:15}}>ML</div>
          <div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:-0.5}}>MyLugano</div>
            <div style={{fontSize:11,color:MUTED}}>{ui.subtitle}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:MUTED,background:WHITE,border:`1px solid ${BORDER}`,borderRadius:20,padding:"5px 14px"}}>{ui.years}</div>
          <div style={{display:"flex",background:WHITE,border:`1px solid ${BORDER}`,borderRadius:20,overflow:"hidden"}}>
            {["en","it"].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{padding:"5px 14px",fontSize:12,fontWeight:lang===l?600:400,background:lang===l?RED:WHITE,color:lang===l?WHITE:MUTED,border:"none",cursor:"pointer",transition:"all 0.15s"}}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:"1.5rem"}}>
        {[["kpi",ui.tab_kpi],["grafici",ui.tab_trends]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{fontSize:13,fontWeight:tab===id?600:400,padding:"8px 20px",borderRadius:20,border:tab===id?`1.5px solid ${RED}`:`1px solid ${BORDER}`,background:tab===id?RED_L:WHITE,color:tab===id?RED:MUTED,cursor:"pointer"}}>{label}</button>
        ))}
      </div>
      {tab==="kpi"?<TabKPI lang={lang}/>:<TabGrafici lang={lang}/>}
      <div style={{marginTop:"2.5rem",textAlign:"center",fontSize:11,color:MUTED,borderTop:`1px solid ${BORDER}`,paddingTop:"1.5rem"}}>{ui.footer}</div>
    </div>
  );
}
