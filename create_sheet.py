# ============================================================
# Crea e popola il Google Sheet MyLugano_KPI
# Esegui UNA VOLTA: py create_sheet.py
# ============================================================

import gspread
from oauth2client.service_account import ServiceAccountCredentials

CREDENTIALS_FILE = r"C:\Users\simona.gamba\Documents\CAS\07. Lavoro finale\mylugano-dashboard\credentials.json"

scope  = ["https://spreadsheets.google.com/feeds","https://www.googleapis.com/auth/drive"]
creds  = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
client = gspread.authorize(creds)

# Crea il file
print("Creo il file MyLugano_KPI...")
sh = client.create("MyLugano_KPI")
print(f"File creato! Aprilo qui: https://docs.google.com/spreadsheets/d/{sh.id}")

# ── TAB 1: users ─────────────────────────────────────────────
ws = sh.sheet1
ws.update_title("users")
ws.append_row(["mese","anno","utenti","wallet_attivi","profilo_base","profilo_verificato","profilo_plus","profilo_analogico"])

users_2025 = [
    ["Jan",2025,47684,31074,11216,17071,0,2787],
    ["Feb",2025,48022,31392,11393,17200,0,2799],
    ["Mar",2025,48515,32053,11624,17420,2,3007],
    ["Apr",2025,48904,31404,11157,17028,193,3026],
    ["May",2025,49505,32159,11817,16965,332,3045],
    ["Jun",2025,50823,33635,13072,16933,554,3076],
    ["Jul",2025,52294,35273,14522,16905,747,3099],
    ["Aug",2025,53277,36335,15425,16906,885,3119],
    ["Sep",2025,53744,36858,15911,16854,958,3135],
    ["Oct",2025,54282,37442,16433,16810,1046,3153],
    ["Nov",2025,54569,37776,16693,16808,1111,3164],
    ["Dec",2025,56481,39536,18417,16729,1217,3173],
]
users_2026 = [
    ["Jan",2026,56768,39884,19419,15959,1305,3201],
    ["Feb",2026,57092,40251,19985,15625,1407,3234],
    ["Mar",2026,57570,40766,20390,15645,1485,3246],
    ["Apr",2026,58096,41326,20925,15564,1582,3255],
]
ws.append_rows(users_2025 + users_2026)
print("✅ Tab 'users' creato")

# ── TAB 2: revenue ───────────────────────────────────────────
ws2 = sh.add_worksheet("revenue", rows=50, cols=10)
ws2.append_row(["mese","anno","incassi_chf","cashback_chf","incassi_privati","cashback_privati"])

revenue_2024 = [
    ["Jan",2024,34788,12074,19669,15322],
    ["Feb",2024,33805,12309,21901,17742],
    ["Mar",2024,30435,13806,24923,20017],
    ["Apr",2024,33291,13303,0,0],
    ["May",2024,34628,14269,0,0],
    ["Jun",2024,40620,15053,0,0],
    ["Jul",2024,57976,20468,0,0],
    ["Aug",2024,47981,20188,0,0],
    ["Sep",2024,34859,16341,0,0],
    ["Oct",2024,38907,16006,0,0],
    ["Nov",2024,34867,16602,0,0],
    ["Dec",2024,85872,23910,0,0],
]
revenue_2025 = [
    ["Jan",2025,39939,15276,19669,15322],
    ["Feb",2025,41287,16017,21901,17742],
    ["Mar",2025,43580,18954,24923,20017],
    ["Apr",2025,33598,17986,0,0],
    ["May",2025,48344,22549,0,0],
    ["Jun",2025,58243,24929,0,0],
    ["Jul",2025,56288,23783,0,0],
    ["Aug",2025,49296,22014,0,0],
    ["Sep",2025,39618,17412,0,0],
    ["Oct",2025,38652,19201,0,0],
    ["Nov",2025,32286,16566,0,0],
    ["Dec",2025,39558,20965,0,0],
]
revenue_2026 = [
    ["Jan",2026,22024,16899,19669,15322],
    ["Feb",2026,25272,20187,21901,17742],
    ["Mar",2026,28445,22773,24923,20017],
    ["Apr",2026,21467,15879,18256,15879],
]
ws2.append_rows(revenue_2024 + revenue_2025 + revenue_2026)
print("✅ Tab 'revenue' creato")

# ── TAB 3: partners ──────────────────────────────────────────
ws3 = sh.add_worksheet("partners", rows=50, cols=6)
ws3.append_row(["mese","anno","partner_totali","partner_attivi","circolante_chf"])

partners_2025 = [
    ["Jan",2025,420,165,572007],
    ["Feb",2025,424,159,628110],
    ["Mar",2025,431,150,622874],
    ["Apr",2025,435,149,619211],
    ["May",2025,440,164,620922],
    ["Jun",2025,443,156,619908],
    ["Jul",2025,442,159,614433],
    ["Aug",2025,447,151,611042],
    ["Sep",2025,447,154,607222],
    ["Oct",2025,461,162,613091],
    ["Nov",2025,465,159,609151],
    ["Dec",2025,458,162,615680],
]
partners_2026 = [
    ["Jan",2026,464,150,614945],
    ["Feb",2026,470,155,677937],
    ["Mar",2026,463,154,674536],
    ["Apr",2026,471,160,669576],
]
ws3.append_rows(partners_2025 + partners_2026)
print("✅ Tab 'partners' creato")

# ── TAB 4: downloads ─────────────────────────────────────────
ws4 = sh.add_worksheet("downloads", rows=50, cols=6)
ws4.append_row(["mese","anno","download_totali","download_ios","download_android"])

downloads_2025 = [
    ["Jan",2025,43801,36117,7684],
    ["Feb",2025,44040,36529,7511],
    ["Mar",2025,44299,36813,7486],
    ["Apr",2025,44516,37145,7371],
    ["May",2025,44758,37504,7254],
    ["Jun",2025,45446,38178,7268],
    ["Jul",2025,46664,39298,7366],
    ["Aug",2025,48178,40566,7612],
    ["Sep",2025,48956,41302,7654],
    ["Oct",2025,49259,41714,7545],
    ["Nov",2025,49622,42198,7424],
    ["Dec",2025,49783,42468,7315],
]
downloads_2026 = [
    ["Jan",2026,50180,42880,7300],
    ["Feb",2026,50436,43132,7304],
    ["Mar",2026,50796,43473,7323],
    ["Apr",2026,51229,43809,7420],
]
ws4.append_rows(downloads_2025 + downloads_2026)
print("✅ Tab 'downloads' creato")

# ── TAB 5: transactions ──────────────────────────────────────
ws5 = sh.add_worksheet("transactions", rows=60, cols=4)
ws5.append_row(["mese","anno","transazioni"])

transactions_2023 = [
    ["Jan",2023,2177],["Feb",2023,2151],["Mar",2023,2697],["Apr",2023,2224],
    ["May",2023,2844],["Jun",2023,5852],["Jul",2023,6016],["Aug",2023,6500],
    ["Sep",2023,3462],["Oct",2023,3793],["Nov",2023,3098],
]
transactions_2024 = [
    ["Jan",2024,5624],["Feb",2024,4914],["Mar",2024,4922],["Apr",2024,5295],
    ["May",2024,4967],["Jun",2024,6350],["Jul",2024,7902],["Aug",2024,12907],
    ["Sep",2024,13286],["Oct",2024,4871],["Nov",2024,6492],["Dec",2024,13720],
]
transactions_2025 = [
    ["Jan",2025,7564],["Feb",2025,6978],["Mar",2025,7774],["Apr",2025,5337],
    ["May",2025,10681],["Jun",2025,16473],["Jul",2025,13647],["Aug",2025,13594],
    ["Sep",2025,7052],["Oct",2025,8722],["Nov",2025,7988],["Dec",2025,8126],
]
transactions_2026 = [
    ["Jan",2026,8246],["Feb",2026,7541],["Mar",2026,8993],["Apr",2026,7500],
]
ws5.append_rows(transactions_2023 + transactions_2024 + transactions_2025 + transactions_2026)
print("✅ Tab 'transactions' creato")

print("\n🎉 Google Sheet MyLugano_KPI creato e popolato con successo!")
print(f"👉 Aprilo qui: https://docs.google.com/spreadsheets/d/{sh.id}")
print(f"\n⚠️  Ricorda di condividerlo con: mylugano-sa@mylugano-dashboard.iam.gserviceaccount.com")