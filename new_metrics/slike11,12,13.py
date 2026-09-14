"""
PER-PAGE METRICS COMPARISON
Za svaku stranicu: FCP, LCP, SI u svim kombinacijama uslova
"""

import os
import re
import json
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from bs4 import BeautifulSoup

# ============================================
# MODERNI STILOVI
# ============================================

BASE_DIR = Path(r"D:\master\new_metrics")
OUTPUT_DIR = BASE_DIR / "per_page_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)
CHARTS_DIR = OUTPUT_DIR 
CHARTS_DIR.mkdir(exist_ok=True)

# Pastelna paleta sa jasnim nijansama
COLORS = {
    # PWA - roze nijanse
    'PWA_fast_1x': '#FFE0E5',   # najsvetlija
    'PWA_fast_4x': '#FF8FA3',   # tamnija
    'PWA_slow_1x': '#FFB3BA',   # svetla
    'PWA_slow_4x': '#E86A7A',   # najtamnija
    
    # SPA - plave nijanse
    'SPA_fast_1x': '#E0F0FF',   # najsvetlija
    'SPA_fast_4x': '#8AB8E8',   # tamnija
    'SPA_slow_1x': '#BAE1FF',   # svetla
    'SPA_slow_4x': '#5B8BC0',   # najtamnija
    
    'background': '#FAFAFA',
    'grid': '#E8E8E8',
    'text': '#4A4A4A',
    'title': '#333333',
}

plt.rcParams.update({
    'figure.figsize': (16, 9),  # Smanjena visina sa 10 na 9
    'font.size': 10,
    'axes.facecolor': COLORS['background'],
    'figure.facecolor': 'white',
    'axes.grid': True,
    'grid.alpha': 0.25,
    'grid.color': COLORS['grid'],
    'axes.edgecolor': '#E0E0E0',
    'axes.linewidth': 1.0,
    'xtick.color': COLORS['text'],
    'ytick.color': COLORS['text'],
})

PAGE_LABELS = {
    'data': '🏠 Home Page',
    'data_artwork': '🎨 Artwork Page',
    'data_competition': '🏆 Competition Page',
}

PAGE_SHORT = {
    '🏠 Home Page': 'home',
    '🎨 Artwork Page': 'artwork',
    '🏆 Competition Page': 'competition',
}

METRICS = {
    'fcp': 'First Contentful Paint',
    'lcp': 'Largest Contentful Paint',
    'speed_index': 'Speed Index',
    'tbt': 'Total Blocking Time',
    'ttfb': 'Time to First Byte',
}

# ============================================
# PARSER
# ============================================

class LighthouseParser:
    @staticmethod
    def parse_filename(filename: str) -> dict:
        lower = filename.lower()
        start = 'COLD' if 'cold' in lower else 'WARM'
        network = 'fast4g' if 'fast4g' in lower else 'slow4g'
        cpu_match = re.search(r'cpu([14])x?', lower)
        cpu_slowdown = int(cpu_match.group(1)) if cpu_match else (1 if network == 'fast4g' else 4)
        return {'start': start, 'network': network, 'cpu_slowdown': cpu_slowdown}
    
    @staticmethod
    def extract_metrics(file_path: Path) -> dict:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            for script in soup.find_all('script'):
                if script.string and '__LIGHTHOUSE_FLOW_JSON__' in script.string:
                    match = re.search(r'__LIGHTHOUSE_FLOW_JSON__\s*=\s*({.*?});', script.string, re.DOTALL)
                    if match:
                        data = json.loads(match.group(1))
                        steps = data.get('steps', [])
                        if steps:
                            lhr = steps[0].get('lhr', {})
                            audits = lhr.get('audits', {})
                            categories = lhr.get('categories', {})
                            
                            return {
                                'performance_score': (categories.get('performance', {}).get('score', 0) or 0) * 100,
                                'fcp': audits.get('first-contentful-paint', {}).get('numericValue', 0) or 0,
                                'lcp': audits.get('largest-contentful-paint', {}).get('numericValue', 0) or 0,
                                'speed_index': audits.get('speed-index', {}).get('numericValue', 0) or 0,
                                'tbt': audits.get('total-blocking-time', {}).get('numericValue', 0) or 0,
                                'ttfb': audits.get('server-response-time', {}).get('numericValue', 0) or 0,
                            }
        except Exception as e:
            print(f"⚠ Greška: {file_path.name} - {e}")
        return {}


def load_all_data() -> pd.DataFrame:
    results = []
    for page_folder, page_label in PAGE_LABELS.items():
        page_path = BASE_DIR / page_folder
        if not page_path.exists():
            continue
        
        for app in ['pwa', 'spa']:
            app_path = page_path / app
            if not app_path.exists():
                continue
            
            for html_file in app_path.glob("*.html"):
                info = LighthouseParser.parse_filename(html_file.name)
                metrics = LighthouseParser.extract_metrics(html_file)
                
                if metrics.get('lcp', 0) > 0:
                    results.append({
                        'page': page_label,
                        'app': 'PWA' if app == 'pwa' else 'SPA',
                        'start': info['start'],
                        'network': info['network'],
                        'cpu_slowdown': info['cpu_slowdown'],
                        **metrics
                    })
    
    return pd.DataFrame(results)


# ============================================
# GLAVNA FUNKCIJA ZA SVAKU STRANICU
# ============================================

def create_page_metrics_comparison(df, page_label):
    """Kreira poređenje metrika za jednu stranicu"""
    
    page_df = df[df['page'] == page_label]
    page_short = PAGE_SHORT.get(page_label, page_label.lower().replace(' ', '_'))
    
    metrics_list = ['fcp', 'lcp', 'speed_index', 'tbt', 'ttfb']
    metric_labels = ['FCP (ms)', 'LCP (ms)', 'Speed Index (ms)', 'TBT (ms)', 'TTFB (ms)']
    
    # Kreiraj figuru sa 6 subplotova (2 kolone x 3 reda) - smanjena visina
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    axes = axes.flatten()
    
    scenarios = [
        ('PWA', 'fast4g', 1),
        ('PWA', 'fast4g', 4),
        ('PWA', 'slow4g', 1),
        ('PWA', 'slow4g', 4),
        ('SPA', 'fast4g', 1),
        ('SPA', 'fast4g', 4),
        ('SPA', 'slow4g', 1),
        ('SPA', 'slow4g', 4),
    ]
    
    scenario_labels = [
        'PWA\nFast\n1x',
        'PWA\nFast\n4x',
        'PWA\nSlow\n1x',
        'PWA\nSlow\n4x',
        'SPA\nFast\n1x',
        'SPA\nFast\n4x',
        'SPA\nSlow\n1x',
        'SPA\nSlow\n4x',
    ]
    
    # Prvih 5 subplotova za metrike
    for idx, (metric, label) in enumerate(zip(metrics_list, metric_labels)):
        ax = axes[idx]
        
        # Izračunaj proseke za COLD i WARM
        cold_values = []
        warm_values = []
        
        for app, network, cpu in scenarios:
            cold = page_df[(page_df['app'] == app) & 
                          (page_df['network'] == network) & 
                          (page_df['cpu_slowdown'] == cpu) & 
                          (page_df['start'] == 'COLD')][metric]
            warm = page_df[(page_df['app'] == app) & 
                          (page_df['network'] == network) & 
                          (page_df['cpu_slowdown'] == cpu) & 
                          (page_df['start'] == 'WARM')][metric]
            
            cold_values.append(cold.mean() if len(cold) > 0 else 0)
            warm_values.append(warm.mean() if len(warm) > 0 else 0)
        
        x = np.arange(len(scenarios))
        width = 0.35
        
        # Boje za COLD i WARM
        cold_colors = []
        warm_colors = []
        
        for app, network, cpu in scenarios:
            if app == 'PWA':
                cold_colors.append(COLORS['PWA_slow_4x'] if cpu == 4 else COLORS['PWA_slow_1x'])
                warm_colors.append(COLORS['PWA_fast_4x'] if cpu == 4 else COLORS['PWA_fast_1x'])
            else:
                cold_colors.append(COLORS['SPA_slow_4x'] if cpu == 4 else COLORS['SPA_slow_1x'])
                warm_colors.append(COLORS['SPA_fast_4x'] if cpu == 4 else COLORS['SPA_fast_1x'])
        
        # Plot COLD
        bars_cold = ax.bar(x - width/2, cold_values, width, 
                          color=cold_colors,
                          edgecolor='white', linewidth=1.5, alpha=0.9)
        
        # Plot WARM
        bars_warm = ax.bar(x + width/2, warm_values, width,
                          color=warm_colors,
                          edgecolor='white', linewidth=1.5, alpha=0.9)
        
        # Dodaj vrednosti
        for bar, val in zip(bars_cold, cold_values):
            if val > 0:
                ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + max(cold_values + warm_values) * 0.01,
                       f'{val:.0f}', ha='center', va='bottom', fontsize=7, fontweight='bold')
        
        for bar, val in zip(bars_warm, warm_values):
            if val > 0:
                ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + max(cold_values + warm_values) * 0.01,
                       f'{val:.0f}', ha='center', va='bottom', fontsize=7, fontweight='bold')
        
        # Stilizuj
        ax.set_ylabel(label, fontsize=10, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(scenario_labels, fontsize=7)
        ax.grid(True, alpha=0.2, axis='y')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        # Log skala za velike vrednosti
        if max(cold_values + warm_values) > 2000:
            ax.set_yscale('log')
            ax.set_ylabel(f'{label} (log)', fontsize=10, fontweight='bold')
        
        # # Dodaj legendu samo na prvi subplot
        # if idx == 0:
        #     ax.legend(['COLD ❄️', 'WARM 🔥'], fontsize=9, loc='upper right',
        #              frameon=True, fancybox=True, shadow=True)
    
    # Poslednji subplot (index 5) - LEGENDA
    ax_legend = axes[5]
    ax_legend.axis('off')
    
    # Naslov legende
    ax_legend.text(0.5, 0.95, 'LEGENDA BOJA', 
                  ha='center', va='top', fontsize=14, fontweight='bold',
                  color=COLORS['title'], transform=ax_legend.transAxes)
    
    # Kreiraj legendu sa bojama
    legend_items = [
        ('PWA - Fast 4G - CPU 1x', COLORS['PWA_fast_1x'], 'COLD'),
        ('PWA - Fast 4G - CPU 4x', COLORS['PWA_fast_4x'], 'WARM'),
        ('PWA - Slow 4G - CPU 1x', COLORS['PWA_slow_1x'], 'COLD'),
        ('PWA - Slow 4G - CPU 4x', COLORS['PWA_slow_4x'], 'WARM'),
        ('SPA - Fast 4G - CPU 1x', COLORS['SPA_fast_1x'], 'COLD'),
        ('SPA - Fast 4G - CPU 4x', COLORS['SPA_fast_4x'], 'WARM'),
        ('SPA - Slow 4G - CPU 1x', COLORS['SPA_slow_1x'], 'COLD'),
        ('SPA - Slow 4G - CPU 4x', COLORS['SPA_slow_4x'], 'WARM'),
    ]
    
    y_pos = 0.80
    for label, color, start_type in legend_items:
        # Obojeni kvadrat
        rect = mpatches.FancyBboxPatch((0.15, y_pos), 0.06, 0.06,
                                       boxstyle="round,pad=0.02",
                                       facecolor=color, edgecolor='white',
                                       linewidth=2, transform=ax_legend.transAxes)
        ax_legend.add_patch(rect)
        
        # Tekst
        ax_legend.text(0.25, y_pos + 0.03, label, 
                      fontsize=9, va='center', color=COLORS['text'],
                      transform=ax_legend.transAxes)
        
        # Start tip
        ax_legend.text(0.85, y_pos + 0.03, start_type,
                      fontsize=8, va='center', ha='right',
                      color=COLORS['text'], style='italic',
                      transform=ax_legend.transAxes)
        
        y_pos -= 0.10
    
    # Dodatna objašnjenja
    ax_legend.text(0.5, -0.05, 
                  'Svjetlije boje = COLD start\nTamnije boje = WARM start',
                  ha='center', va='top', fontsize=10, style='italic',
                  color='#666', transform=ax_legend.transAxes)
    
    # Glavni naslov
    fig.suptitle(f'{page_label}\nPoređenje metrika u svim uslovima\n' + 
                 'PWA vs SPA | COLD vs WARM | Fast vs Slow 4G | CPU 1x vs 4x',
                fontsize=16, fontweight='bold', color=COLORS['title'], y=1.02)
    
    plt.tight_layout()
    plt.savefig(CHARTS_DIR / f'{page_short}_metrics_comparison.png', 
               dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f"   ✓ {page_label} - Poređenje metrika završeno")



# ============================================
# MAIN
# ============================================

def main():
    print("\n📂 Učitavanje podataka...")
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    
    print(f"\n✅ Učitano {len(df)} merenja")
    
    
    for page_label in PAGE_LABELS.values():
        if page_label not in df['page'].unique():
            print(f"⚠ {page_label} nema podataka")
            continue
        
        
        create_page_metrics_comparison(df, page_label)

if __name__ == "__main__":
    main()