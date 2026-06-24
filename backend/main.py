# ============================================================
# MyLugano KPI — FastAPI Backend
# Avvia con: py -m uvicorn backend.main:app
# Docs API:  http://127.0.0.1:8000/docs
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import httpx
from typing import Optional
from pydantic import BaseModel
import os
import json
import tempfile
import base64
from datetime import datetime, timedelta

app = FastAPI(title="MyLugano KPI API", version="1.0")

# ─────────────────────────────────────────
# CACHE (10 minuti)
# ─────────────────────────────────────────
_cache_data = None
_cache_mesi = None
_cache_time = None
CACHE_TTL = timedelta(minutes=10)

def get_cached_sheet():
    global _cache_data, _cache_mesi, _cache_time
    now = datetime.now()
    if _cache_data is not None and _cache_time is not None and now - _cache_time < CACHE_TTL:
        return _cache_data, _cache_mesi
    _cache_data, _cache_mesi = parse_sheet()
    _cache_time = now
    return _cache_data, _cache_mesi

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://mylugano-dashboard.vercel.app",
        "https://*.vercel.app",
        "https://jade-lolly-be9687.netlify.app",
        "https://myluganodashboard.netlify.app",
        "https://*.netlify.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SHEET_ID = "1gDvJPaOH3EJZ6-0eB9MyCOnQRxsYYcftP3LmJLzrmSg"
TAB_NAME = "MyLugano_General_Data"

def get_credentials_file():
    local_file = os.path.join(os.path.dirname(__file__), "..", "credentials.json")
    if os.path.exists(local_file):
        return local_file
    creds_b64 = os.environ.get("GOOGLE_CREDENTIALS", "")
    if creds_b64:
        creds_json = base64.b64decode(creds_b64).decode()
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
        tmp.write(creds_json)
        tmp.flush()
        return tmp.name
    raise Exception("No Google credentials found")

def get_dataframe():
    scope  = ["https://spreadsheets.google.com/feeds","https://www.googleapis.com/auth/drive"]
    creds  = ServiceAccountCredentials.from_json_keyfile_name(get_credentials_file(), scope)
    client = gspread.authorize(creds)
    sh     = client.open_by_key(SHEET_ID)
    ws     = sh.worksheet(TAB_NAME)
    data   = ws.get_all_values()
    df     = pd.DataFrame(data)
    return df

def parse_sheet():
    df = get_dataframe()
    headers = df.iloc[0].tolist()
    mesi_cols = headers[3:]
    result = {}
    for _, row in df.iloc[1:].iterrows():
        kpi       = str(row[0]).strip()
        categoria = str(row[1]).strip()
        dato      = str(row[2]).strip()
        if not kpi or kpi == "KPI":
            continue
        valori = {}
        for i, mese in enumerate(mesi_cols):
            val = str(row[i+3]).strip().replace(".", "").replace(",", ".").replace("%", "").replace(" ", "")
            try:
                valori[mese] = float(val) if val else None
            except:
                valori[mese] = None
        result[(kpi, categoria, dato)] = valori
    return result, mesi_cols

def get_serie(data, kpi, categoria, dato):
    key = (kpi, categoria, dato)
    if key not in data:
        return {}
    return data[key]

def mese_to_anno_mese(mese_str):
    mesi_map = {
        "gen":"Jan","feb":"Feb","mar":"Mar","apr":"Apr","mag":"May","giu":"Jun",
        "lug":"Jul","ago":"Aug","set":"Sep","ott":"Oct","nov":"Nov","dic":"Dec"
    }
    try:
        m = mese_str[:3].lower()
        y = int(mese_str[3:])
        return mesi_map.get(m, m), y
    except:
        return mese_str, None

def serie_to_list(serie, mesi_cols, anno_filter=None):
    records = []
    for mese_str in mesi_cols:
        m, y = mese_to_anno_mese(mese_str)
        if anno_filter and y != anno_filter:
            continue
        records.append({"mese": m, "anno": y, "valore": serie.get(mese_str)})
    return records

# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────

@app.get("/api/debug-creds")
def debug_creds():
    creds_b64 = os.environ.get("GOOGLE_CREDENTIALS", "")
    if not creds_b64:
        return {"error": "GOOGLE_CREDENTIALS not set"}
    try:
        decoded = base64.b64decode(creds_b64).decode()
        data = json.loads(decoded)
        return {
            "type": data.get("type"),
            "project_id": data.get("project_id"),
            "client_email": data.get("client_email"),
            "private_key_id": data.get("private_key_id"),
        }
    except Exception as e:
        return {"error": str(e)}

class ChatRequest(BaseModel):
    prompt: str
    system: str = ""

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-5",
                    "max_tokens": 800,
                    "system": req.system,
                    "messages": [{"role": "user", "content": req.prompt}]
                },
                timeout=30.0
            )
        data = res.json()
        content = data.get("content", [])
        if content and isinstance(content, list):
            text = content[0].get("text", "")
        else:
            text = data.get("text", "") or str(data)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
def get_users(anno: Optional[int] = None):
    try:
        data, mesi = get_cached_sheet()
        utenti      = get_serie(data, "Utenti", "Utenti", "Numero account")
        wallet      = get_serie(data, "Utenti", "Wallet Attivi", "Totale Wallet Attivi")
        base        = get_serie(data, "Utenti", "Wallet Attivi", "Profilo base")
        verificato  = get_serie(data, "Utenti", "Wallet Attivi", "Profilo verificato")
        plus        = get_serie(data, "Utenti", "Wallet Attivi", "Profilo Plus")
        analogico   = get_serie(data, "Utenti", "Wallet Attivi", "Profilo analogico")
        records = []
        for mese_str in mesi:
            m, y = mese_to_anno_mese(mese_str)
            if anno and y != anno:
                continue
            records.append({
                "mese": m, "anno": y,
                "utenti":              utenti.get(mese_str),
                "wallet_attivi":       wallet.get(mese_str),
                "profilo_base":        base.get(mese_str),
                "profilo_verificato":  verificato.get(mese_str),
                "profilo_plus":        plus.get(mese_str),
                "profilo_analogico":   analogico.get(mese_str),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/revenue")
def get_revenue(anno: Optional[int] = None):
    try:
        data, mesi = get_cached_sheet()
        incassi_tot   = get_serie(data, "Circuito", "Tutte le attività", "Totale CHF incassati")
        cashback_tot  = get_serie(data, "Circuito", "Tutte le attività", "Totale cashback in CHF emesso")
        incassi_priv  = get_serie(data, "Partner/Merchant", "Attività economiche private", "Totale CHF incassati attività economiche private")
        cashback_priv = get_serie(data, "Partner/Merchant", "Attività economiche private", "Totale cashback in CHF emesso da attività private")
        records = []
        for mese_str in mesi:
            m, y = mese_to_anno_mese(mese_str)
            if anno and y != anno:
                continue
            records.append({
                "mese": m, "anno": y,
                "incassi_chf":      incassi_tot.get(mese_str),
                "cashback_chf":     cashback_tot.get(mese_str),
                "incassi_privati":  incassi_priv.get(mese_str),
                "cashback_privati": cashback_priv.get(mese_str),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/partners")
def get_partners(anno: Optional[int] = None):
    try:
        data, mesi = get_cached_sheet()
        partner_tot    = get_serie(data, "Partner/Merchant", "Partner", "Totale Partner")
        partner_attivi = get_serie(data, "Partner/Merchant", "Partner", "Partner attivi")
        circolante     = get_serie(data, "Circuito", "Circolante", "Circolante in CHF")
        records = []
        for mese_str in mesi:
            m, y = mese_to_anno_mese(mese_str)
            if anno and y != anno:
                continue
            records.append({
                "mese": m, "anno": y,
                "partner_totali": partner_tot.get(mese_str),
                "partner_attivi": partner_attivi.get(mese_str),
                "circolante_chf": circolante.get(mese_str),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/transactions")
def get_transactions(anno: Optional[int] = None):
    try:
        data, mesi = get_cached_sheet()
        transazioni = get_serie(data, "Circuito", "Totale transazioni", "Numero di transazioni")
        records = []
        for mese_str in mesi:
            m, y = mese_to_anno_mese(mese_str)
            if anno and y != anno:
                continue
            records.append({
                "mese": m, "anno": y,
                "transazioni": transazioni.get(mese_str),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/downloads")
def get_downloads(anno: Optional[int] = None):
    try:
        data, mesi = get_cached_sheet()
        dl_tot     = get_serie(data, "App", "Download TOTALI", "IOS + Android")
        dl_ios     = get_serie(data, "App", "Download TOTALI", "Download cumulativo (iOS)")
        dl_android = get_serie(data, "App", "Download TOTALI", "Download cumulativo (Android)")
        records = []
        for mese_str in mesi:
            m, y = mese_to_anno_mese(mese_str)
            if anno and y != anno:
                continue
            records.append({
                "mese": m, "anno": y,
                "download_totali":  dl_tot.get(mese_str),
                "download_ios":     dl_ios.get(mese_str),
                "download_android": dl_android.get(mese_str),
            })
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/summary")
def get_summary():
    try:
        data, mesi = get_cached_sheet()
        ultimi = [m for m in reversed(mesi) if any(
            data.get(k, {}).get(m) for k in data
        )][:2]
        mese_attuale = ultimi[0] if ultimi else mesi[-1]
        mese_prec    = ultimi[1] if len(ultimi) > 1 else mesi[-2]

        def val(kpi, cat, dato, mese):
            return data.get((kpi, cat, dato), {}).get(mese) or 0

        def delta(v1, v2):
            if v2 and v2 != 0:
                return round((v1 - v2) / v2 * 100, 1)
            return 0

        u_att  = val("Utenti", "Utenti", "Numero account", mese_attuale)
        u_prec = val("Utenti", "Utenti", "Numero account", mese_prec)
        w_att  = val("Utenti", "Wallet Attivi", "Totale Wallet Attivi", mese_attuale)
        w_prec = val("Utenti", "Wallet Attivi", "Totale Wallet Attivi", mese_prec)
        p_att  = val("Partner/Merchant", "Partner", "Totale Partner", mese_attuale)
        p_prec = val("Partner/Merchant", "Partner", "Totale Partner", mese_prec)
        c_att  = val("Circuito", "Circolante", "Circolante in CHF", mese_attuale)
        c_prec = val("Circuito", "Circolante", "Circolante in CHF", mese_prec)

        return {
            "mese_attuale": mese_attuale,
            "utenti":         {"valore": u_att, "delta_pct": delta(u_att, u_prec),  "prev": u_prec},
            "wallet_attivi":  {"valore": w_att, "delta_pct": delta(w_att, w_prec),  "prev": w_prec},
            "partner_totali": {"valore": p_att, "delta_pct": delta(p_att, p_prec),  "prev": p_prec},
            "circolante_chf": {"valore": c_att, "delta_pct": delta(c_att, c_prec),  "prev": c_prec},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes")
def get_notes():
    try:
        data, mesi = get_cached_sheet()
        note_key = ("NOTE", "Note Generali", "Note del periodo")
        note_serie = data.get(note_key, {})
        result = {}
        for mese_str, val in note_serie.items():
            if val and str(val).strip():
                m, y = mese_to_anno_mese(mese_str)
                if m and y:
                    result[f"{m}-{y}"] = str(val).strip()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
