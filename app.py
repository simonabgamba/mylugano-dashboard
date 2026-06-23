# ============================================================
# MyLugano KPI Dashboard — Demo version (dati incorporati)
# Per avviare: python app.py
# Poi apri il browser su http://localhost:8050
# ============================================================

import dash
from dash import dcc, html, Input, Output
import plotly.graph_objects as go
import pandas as pd

# ─────────────────────────────────────────
# COLORI
# ─────────────────────────────────────────
RED    = "#d42f3a"
GREEN  = "#1fa363"
BLUE   = "#2563eb"
PURPLE = "#7c3aed"
PINK   = "#f5a5a8"
GRAY   = "#d4d4d4"
MUTED  = "#7a7a8a"
BORDER = "#e8e8ee"
SURF   = "#f7f7f9"
WHITE  = "#ffffff"
DARK   = "#111118"

MESI = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

# ─────────────────────────────────────────
# DATI
# ─────────────────────────────────────────
utenti = pd.DataFrame({
    "mese": MESI,
    "u25": [47684,48022,48515,48904,49505,50823,52294,53277,53744,54282,54569,56481],
    "u26": [56768,57092,57570,58096,None,None,None,None,None,None,None,None],
})

wallets = pd.DataFrame({
    "mese": MESI,
    "w25": [31074,31392,32053,31404,32159,33635,35273,36335,36858,37442,37776,39536],
    "w26": [39884,40251,40766,41326,None,None,None,None,None,None,None,None],
})

incassi = pd.DataFrame({
    "mese": MESI,
    "i24": [34788,33805,30435,33291,34628,40620,57976,47981,34859,38907,34867,85872],
    "i25": [39939,41287,43580,33598,48344,58243,56288,49296,39618,38652,32286,39558],
    "i26": [22024,25272,28445,21467,None,None,None,None,None,None,None,None],
})

cashback = pd.DataFrame({
    "mese": MESI,
    "c24": [12074,12309,13806,13303,14269,15053,20468,20188,16341,16006,16602,23910],
    "c25": [15276,16017,18954,17986,22549,24929,23783,22014,17412,19201,16566,20965],
    "c26": [16899,20187,22773,15879,None,None,None,None,None,None,None,None],
})

transazioni = pd.DataFrame({
    "mese": MESI,
    "t23": [2177,2151,2697,2224,2844,5852,6016,6500,3462,3793,3098,None],
    "t24": [5624,4914,4922,5295,4967,6350,7902,12907,13286,4871,6492,13720],
    "t25": [7564,6978,7774,5337,10681,16473,13647,13594,7052,8722,7988,8126],
    "t26": [8246,7541,8993,7500,None,None,None,None,None,None,None,None],
})

downloads = pd.DataFrame({
    "mese": MESI,
    "d25": [43801,44040,44299,44516,44758,45446,46664,48178,48956,49259,49622,49783],
    "d26": [50180,50436,50796,51229,None,None,None,None,None,None,None,None],
})

delta_cb = [-12.32,-0.22,19.97,6.55,9.04,16.20,65.61,58.03,69.50,37.29,30.13,26.52]
delta_cb.reverse()

# ─────────────────────────────────────────
# HELPER LAYOUT GRAFICI
# ─────────────────────────────────────────
def base_layout(title=""):
    return go.Layout(
        title=dict(text=title, font=dict(size=13, color=DARK)),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=MUTED, size=11),
        margin=dict(l=50, r=20, t=50, b=80),
        legend=dict(orientation="h", y=-0.25),
        xaxis=dict(showgrid=False, tickfont=dict(size=10)),
        yaxis=dict(gridcolor=BORDER, tickfont=dict(size=10)),
        hovermode="x unified",
    )

def card(children, border_top=RED):
    return html.Div(children, style={
        "background": WHITE,
        "border": f"1px solid {BORDER}",
        "borderRadius": "16px",
        "borderTop": f"3px solid {border_top}",
        "padding": "16px",
        "boxShadow": "0 1px 4px rgba(0,0,0,0.04)",
    })

def kpi_box(label, value, delta, prev, pos=True):
    return html.Div([
        html.Div(label, style={"fontSize":"10px","color":MUTED,"textTransform":"uppercase","letterSpacing":"0.08em","marginBottom":"6px"}),
        html.Div(value, style={"fontSize":"22px","fontWeight":"700"}),
        html.Div(delta, style={"fontSize":"11px","color":GREEN if pos else RED,"fontWeight":"500","marginTop":"3px"}),
        html.Div(prev,  style={"fontSize":"10px","color":MUTED,"marginTop":"2px"}),
    ], style={
        "background": WHITE,
        "border": f"1px solid {BORDER}",
        "borderRadius": "14px",
        "borderTop": f"3px solid {RED if pos else '#ccc'}",
        "padding": "16px 18px",
    })

# ─────────────────────────────────────────
# GRAFICI
# ─────────────────────────────────────────
def fig_utenti():
    fig = go.Figure(layout=base_layout("Total Users — 2025 vs 2026"))
    fig.add_trace(go.Scatter(x=utenti.mese, y=utenti.u25, name="2025", line=dict(color=RED, width=2), mode="lines+markers", marker=dict(size=4), connectgaps=False))
    fig.add_trace(go.Scatter(x=utenti.mese, y=utenti.u26, name="2026", line=dict(color=PURPLE, width=2, dash="dash"), mode="lines+markers", marker=dict(size=4), connectgaps=False))
    return fig

def fig_wallets():
    fig = go.Figure(layout=base_layout("Active Wallets — 2025 vs 2026"))
    fig.add_trace(go.Scatter(x=wallets.mese, y=wallets.w25, name="2025", line=dict(color=RED, width=2), mode="lines+markers", marker=dict(size=4), connectgaps=False))
    fig.add_trace(go.Scatter(x=wallets.mese, y=wallets.w26, name="2026", line=dict(color=PURPLE, width=2, dash="dash"), mode="lines+markers", marker=dict(size=4), connectgaps=False))
    return fig

def fig_incassi():
    fig = go.Figure(layout=base_layout("Monthly Revenue CHF — 2024/2025/2026"))
    fig.add_trace(go.Bar(x=incassi.mese, y=incassi.i24, name="2024", marker_color=PINK, marker=dict(line=dict(width=0))))
    fig.add_trace(go.Bar(x=incassi.mese, y=incassi.i25, name="2025", marker_color=RED,  marker=dict(line=dict(width=0))))
    fig.add_trace(go.Bar(x=incassi.mese, y=incassi.i26, name="2026", marker_color=PURPLE, marker=dict(line=dict(width=0))))
    fig.update_layout(barmode="group", bargap=0.2)
    return fig

def fig_cashback():
    fig = go.Figure(layout=base_layout("Cashback Issued CHF — 2024/2025/2026"))
    fig.add_trace(go.Bar(x=cashback.mese, y=cashback.c24, name="2024", marker_color=PINK))
    fig.add_trace(go.Bar(x=cashback.mese, y=cashback.c25, name="2025", marker_color=RED))
    fig.add_trace(go.Bar(x=cashback.mese, y=cashback.c26, name="2026", marker_color=PURPLE))
    fig.update_layout(barmode="group", bargap=0.2)
    return fig

def fig_transazioni():
    fig = go.Figure(layout=base_layout("Monthly Transactions — 2023 to 2026"))
    fig.add_trace(go.Bar(x=transazioni.mese, y=transazioni.t23, name="2023", marker_color=GRAY))
    fig.add_trace(go.Bar(x=transazioni.mese, y=transazioni.t24, name="2024", marker_color=PINK))
    fig.add_trace(go.Bar(x=transazioni.mese, y=transazioni.t25, name="2025", marker_color=RED))
    fig.add_trace(go.Bar(x=transazioni.mese, y=transazioni.t26, name="2026", marker_color=PURPLE))
    fig.update_layout(barmode="group", bargap=0.15)
    return fig

def fig_downloads():
    fig = go.Figure(layout=base_layout("Cumulative Downloads — 2025 vs 2026"))
    fig.add_trace(go.Scatter(x=downloads.mese, y=downloads.d25, name="2025", line=dict(color=RED, width=2), mode="lines+markers", marker=dict(size=4)))
    fig.add_trace(go.Scatter(x=downloads.mese, y=downloads.d26, name="2026", line=dict(color=PURPLE, width=2, dash="dash"), mode="lines+markers", marker=dict(size=4), connectgaps=False))
    return fig

def fig_delta():
    colors = [GREEN if v >= 0 else RED for v in delta_cb]
    fig = go.Figure(layout=base_layout("Cashback Delta % — 2024 vs 2025"))
    fig.add_trace(go.Bar(x=MESI, y=delta_cb, marker_color=colors, name="Delta %"))
    fig.update_layout(yaxis_ticksuffix="%")
    return fig

# ─────────────────────────────────────────
# APP
# ─────────────────────────────────────────
app = dash.Dash(__name__)
app.title = "MyLugano KPI Dashboard"

app.layout = html.Div(style={"background":SURF,"minHeight":"100vh","fontFamily":"system-ui,sans-serif","padding":"2rem 1.5rem 4rem"}, children=[

    # Header
    html.Div(style={"display":"flex","alignItems":"center","justifyContent":"space-between","marginBottom":"2rem","paddingBottom":"1.5rem","borderBottom":f"1px solid {BORDER}"}, children=[
        html.Div(style={"display":"flex","alignItems":"center","gap":"12px"}, children=[
            html.Div("ML", style={"width":"42px","height":"42px","borderRadius":"10px","background":RED,"color":"#fff","fontWeight":"700","fontSize":"15px","display":"flex","alignItems":"center","justifyContent":"center"}),
            html.Div([
                html.Div("MyLugano", style={"fontSize":"18px","fontWeight":"700"}),
                html.Div("KPI Dashboard — April 2026", style={"fontSize":"11px","color":MUTED}),
            ])
        ]),
        html.Div("2023 · 2024 · 2025 · 2026", style={"fontSize":"11px","color":MUTED,"background":WHITE,"border":f"1px solid {BORDER}","borderRadius":"20px","padding":"5px 14px"}),
    ]),

    # Tab navigation
    dcc.Tabs(id="tabs", value="kpi", style={"marginBottom":"1.5rem","border":"none"}, children=[
        dcc.Tab(label="KPI & Analysis", value="kpi",
            style={"borderRadius":"20px","border":f"1px solid {BORDER}","padding":"8px 20px","marginRight":"8px","background":WHITE,"color":MUTED,"fontSize":"13px"},
            selected_style={"borderRadius":"20px","border":f"1.5px solid {RED}","padding":"8px 20px","marginRight":"8px","background":"rgba(212,47,58,0.08)","color":RED,"fontSize":"13px","fontWeight":"600"}),
        dcc.Tab(label="Trends", value="trends",
            style={"borderRadius":"20px","border":f"1px solid {BORDER}","padding":"8px 20px","background":WHITE,"color":MUTED,"fontSize":"13px"},
            selected_style={"borderRadius":"20px","border":f"1.5px solid {RED}","padding":"8px 20px","background":"rgba(212,47,58,0.08)","color":RED,"fontSize":"13px","fontWeight":"600"}),
    ]),

    html.Div(id="content"),
])

@app.callback(Output("content","children"), Input("tabs","value"))
def render(tab):
    if tab == "kpi":
        return html.Div([
            # Summary cards
            html.Div(style={"display":"grid","gridTemplateColumns":"repeat(4,1fr)","gap":"12px","marginBottom":"2rem"}, children=[
                kpi_box("Users (Apr 2026)",   "58,096",  "+9,192 · +18.8%",    "48,904 in Apr 2025"),
                kpi_box("Active Wallets",     "41,326",  "+9,922 · +31.6%",    "31,404 in Apr 2025 · 71%"),
                kpi_box("Total Partners",     "471",     "+36 · +8.3%",         "435 in Apr 2025 · 160 active"),
                kpi_box("Circulating CHF",    "669,576", "+50,365 · +8.1%",    "619,211 in Apr 2025"),
            ]),
            html.Div("KPI Analysis — April 2026", style={"fontSize":"10px","color":MUTED,"textTransform":"uppercase","letterSpacing":"0.1em","fontWeight":"600","marginBottom":"14px"}),
            # Charts 2x2
            html.Div(style={"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"14px"}, children=[
                card(dcc.Graph(figure=fig_utenti(),  config={"displayModeBar":False})),
                card(dcc.Graph(figure=fig_wallets(), config={"displayModeBar":False})),
                card(dcc.Graph(figure=fig_incassi(), config={"displayModeBar":False})),
                card(dcc.Graph(figure=fig_cashback(),config={"displayModeBar":False})),
            ]),
        ])
    else:
        return html.Div(style={"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"14px"}, children=[
            card(dcc.Graph(figure=fig_transazioni(), config={"displayModeBar":False})),
            card(dcc.Graph(figure=fig_downloads(),   config={"displayModeBar":False})),
            card(dcc.Graph(figure=fig_delta(),       config={"displayModeBar":False})),
        ])

if __name__ == "__main__":
    app.run(debug=True, port=8050)