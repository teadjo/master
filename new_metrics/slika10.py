"""
SLika 10: GRUPISANI BAR CHART DELTA VREDNOSTI
"""

import json
import re
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import numpy as np
import pandas as pd
from bs4 import BeautifulSoup

# ============================================================
# 🎨 MODERNI DIZAJN
# ============================================================

# Pastelna paleta
COLORS = {
    'pwa': '#FFB3BA',
    'pwa_dark': '#E88A95',
    'spa': '#BAE1FF', 
    'spa_dark': '#8AB8E8',
    'cold': '#B4D4B4',
    'warm': '#FFE4B5',
    'fast': '#B5E8D5',
    'slow': '#FFD4D4',
    'cpu1': '#D4C5F0',
    'cpu4': '#F0D4C5',
    'background': '#FAFAFA',
    'grid': '#E8E8E8',
    'text': '#4A4A4A',
    'title': '#333333',
}

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 10,
    'axes.facecolor': COLORS['background'],
    'figure.facecolor': 'white',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'grid.color': COLORS['grid'],
    'axes.edgecolor': '#E0E0E0',
    'axes.linewidth': 1.0,
    'xtick.color': COLORS['text'],
    'ytick.color': COLORS['text'],
})

# ============================================================
# KONFIGURACIJA
# ============================================================

BASE_DIR = Path(r"D:\master\new_metrics")
OUTPUT_DIR = BASE_DIR / "slika10"
CHARTS_DIR = OUTPUT_DIR

OUTPUT_DIR.mkdir(exist_ok=True)
CHARTS_DIR.mkdir(exist_ok=True)

PAGE_FOLDERS = ["data", "data_artwork", "data_competition"]

PAGE_LABELS = {
    "data": "Home Page",
    "data_artwork": "Artwork Page",
    "data_competition": "Competition Page",
}

# Dodato mapiranje za kratke oznake
PAGE_SHORT = {
    "Home Page": "HOME",
    "Artwork Page": "ARTWORK",
    "Competition Page": "COMPETITION",
}

METRICS = [
    "performance_score",
    "fcp",
    "lcp",
    "speed_index",
    "tbt",
    "cls",
]

METRIC_LABELS = {
    "fcp": "First Contentful Paint (ms)",
    "lcp": "Largest Contentful Paint (ms)",
    "speed_index": "Speed Index (ms)",
}

# ============================================================
# PARSER
# ============================================================

class LighthouseHTMLParser:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.soup = None
        self._load_html()

    def _load_html(self):
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.soup = BeautifulSoup(f.read(), "html.parser")
        except Exception as e:
            print(f"⚠ Error loading {self.file_path}: {e}")

    def extract_metrics(self):
        metrics = {
            "performance_score": 0, "fcp": 0, "lcp": 0,
            "speed_index": 0, "tbt": 0, "cls": 0,
        }
        if not self.soup:
            return metrics
        
        for script in self.soup.find_all("script"):
            if not script.string or "__LIGHTHOUSE_FLOW_JSON__" not in script.string:
                continue
            try:
                match = re.search(r"__LIGHTHOUSE_FLOW_JSON__\s*=\s*({.*?});", script.string, re.DOTALL)
                if not match:
                    continue
                data = json.loads(match.group(1))
                steps = data.get("steps", [])
                if not steps:
                    continue
                lhr = steps[0].get("lhr", {})
                score = lhr.get("categories", {}).get("performance", {}).get("score", 0)
                metrics["performance_score"] = (score or 0) * 100
                audits = lhr.get("audits", {})
                metrics["fcp"] = audits.get("first-contentful-paint", {}).get("numericValue", 0) or 0
                metrics["lcp"] = audits.get("largest-contentful-paint", {}).get("numericValue", 0) or 0
                metrics["speed_index"] = audits.get("speed-index", {}).get("numericValue", 0) or 0
                metrics["tbt"] = audits.get("total-blocking-time", {}).get("numericValue", 0) or 0
                metrics["cls"] = audits.get("cumulative-layout-shift", {}).get("numericValue", 0) or 0
                break
            except (json.JSONDecodeError, KeyError, AttributeError):
                continue
        return metrics

    @staticmethod
    def parse_filename(filename: str):
        lower = filename.lower()
        start = "COLD" if "cold" in lower else "WARM"
        network = "fast4g" if "fast4g" in lower else "slow4g"
        cpu_match = re.search(r"cpu([14])", lower)
        cpu = int(cpu_match.group(1)) if cpu_match else (1 if network == "fast4g" else 4)
        return {"start": start, "network": network, "cpu_slowdown": cpu}


def load_all_data():
    results = []
    for page_folder in PAGE_FOLDERS:
        page_path = BASE_DIR / page_folder
        if not page_path.exists():
            continue
        for app_folder in ["pwa", "spa"]:
            app_path = page_path / app_folder
            if not app_path.exists():
                continue
            html_files = list(app_path.glob("*.html"))
            for html_file in html_files:
                file_info = LighthouseHTMLParser.parse_filename(html_file.name)
                metrics = LighthouseHTMLParser(html_file).extract_metrics()
                result = {
                    "page": page_folder,
                    "page_label": PAGE_LABELS.get(page_folder, page_folder),
                    "app": "PWA" if app_folder == "pwa" else "SPA",
                    "start": file_info["start"],
                    "network": file_info["network"],
                    "cpu_slowdown": file_info["cpu_slowdown"],
                    **metrics,
                }
                if result["lcp"] > 0 and result["lcp"] < 60000:
                    results.append(result)
    return pd.DataFrame(results)


# ============================================================
# POMOĆNE FUNKCIJE
# ============================================================

def save_fig(fig, filename):
    fig.tight_layout(pad=4)
    fig.savefig(CHARTS_DIR / filename, dpi=200, bbox_inches="tight",
                facecolor='white', edgecolor='none')
    plt.close(fig)


def style_axis(ax, title=None, xlabel=None, ylabel=None):
    if title:
        ax.set_title(title, fontsize=12, fontweight='bold', color=COLORS['title'], pad=15)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=10, color=COLORS['text'])
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=10, color=COLORS['text'])
    
    ax.tick_params(colors=COLORS['text'], which='both')
    ax.grid(True, alpha=0.2, color=COLORS['grid'], linestyle='-', linewidth=0.5)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)


# ============================================================
# GRAFIK: GRUPISANI BAR CHART DELTA VREDNOSTI, tabela 10
# ============================================================

def create_delta_comparison(df):
    """Grupisani bar chart razlika medijana po stranici"""
        
    # Izračunaj medijane za svaku kombinaciju
    grouped = df.groupby(['page_label', 'app', 'start', 'network'])[METRICS].median()
    
    scenarios = [
        ('WARM', 'fast4g', 'Warm\nFast 4G'),
        ('WARM', 'slow4g', 'Warm\nSlow 4G'),
        ('COLD', 'fast4g', 'Cold\nFast 4G'),
        ('COLD', 'slow4g', 'Cold\nSlow 4G'),
    ]
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 8))
    
    metrics_to_plot = ['fcp', 'lcp', 'speed_index']
    
    for idx, metric in enumerate(metrics_to_plot):
        ax = axes[idx]
        
        pages = ['Home Page', 'Artwork Page', 'Competition Page']
        page_colors = ['#FFB3BA', '#BAE1FF', '#B4D4B4']
        delta_values = []
        
        for page in pages:
            for start, network, label in scenarios:
                try:
                    pwa_val = grouped.loc[(page, 'PWA', start, network), metric]
                    spa_val = grouped.loc[(page, 'SPA', start, network), metric]
                    delta = spa_val - pwa_val
                    delta_values.append(delta)
                except KeyError:
                    delta_values.append(0)
        
        x = np.arange(len(scenarios))
        width = 0.25
        
        for i, (page, color) in enumerate(zip(pages, page_colors)):
            page_deltas = delta_values[i*len(scenarios):(i+1)*len(scenarios)]
            x_pos = x + (i - 1) * width
            
            # Boje zavise od predznaka
            bar_colors = []
            for d in page_deltas:
                if d > 0:
                    bar_colors.append(COLORS['pwa'])  # PWA bolja
                elif d < 0:
                    bar_colors.append(COLORS['spa'])  # SPA bolja
                else:
                    bar_colors.append('#E0E0E0')  # Izjednačeno
            
            bars = ax.bar(x_pos, page_deltas, width, 
                         color=bar_colors, edgecolor='white', 
                         linewidth=1.5, alpha=0.85,
                         label=PAGE_SHORT[page])
            
            # Dodaj vrednosti
            for bar, val in zip(bars, page_deltas):
                if abs(val) > 0:
                    offset = max(abs(val) * 0.05, 10)
                    ax.text(bar.get_x() + bar.get_width()/2., 
                           val + (offset if val > 0 else -offset),
                           f'{val:+.0f}', ha='center', 
                           va='bottom' if val > 0 else 'top',
                           fontsize=8, fontweight='bold',
                           color='#333')
        
        # Nulta linija
        ax.axhline(y=0, color='black', linewidth=1.5)
        
        style_axis(ax, f'Δ{METRIC_LABELS[metric].split(" (")[0]}\n(SPA - PWA, ms)',
                  ylabel='Delta (ms)')
        ax.set_xticks(x)
        ax.set_xticklabels([s[2] for s in scenarios], fontsize=9)
        
        if idx == 0:
            ax.legend(fontsize=9, loc='upper left', ncol=3)
        
        # Dodaj pozadinske oznake
        ax.text(0.02, 0.98, 'PWA bolja →', transform=ax.transAxes,
               fontsize=9, color=COLORS['pwa_dark'], va='top', fontweight='bold')
        ax.text(0.02, 0.02, '← SPA bolja', transform=ax.transAxes,
               fontsize=9, color=COLORS['spa_dark'], va='bottom', fontweight='bold')
    
    fig.suptitle('Delta analiza performansi\nRazlike medijana između SPA i PWA po stranicama',
                fontsize=16, fontweight='bold', color=COLORS['title'], y=1.02)
    
    save_fig(fig, "02_delta_comparison.png")
    print("   ✓ Delta comparison završen")


def main():
    print("\n📂 Učitavanje podataka...")
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    create_delta_comparison(df)
    

if __name__ == "__main__":
    main()