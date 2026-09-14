"""
KOMPARATIVNA ANALIZA - Tehnički + Korisnički rezultati
Povezivanje objektivnih merenja sa subjektivnim iskustvom
"""

import json
import re
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from scipy import stats
from bs4 import BeautifulSoup

# ============================================
# MODERNI DIZAJN
# ============================================

BASE_DIR = Path(r"D:\master\new_metrics")
OUTPUT_DIR = BASE_DIR / "comparative_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)
CHARTS_DIR = OUTPUT_DIR
CHARTS_DIR.mkdir(exist_ok=True)

COLORS = {
    'pwa': '#FFB3BA',
    'spa': '#BAE1FF',
    'technical': '#B5E8D5',
    'user': '#FFE4B5',
    'match': '#4CAF50',
    'mismatch': '#FF9800',
    'background': '#FAFAFA',
    'grid': '#E8E8E8',
    'text': '#4A4A4A',
    'title': '#333333',
    'highlight': '#FFD700',
}

plt.rcParams.update({
    'figure.figsize': (14, 8),
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
    'data': 'Home Page',
    'data_artwork': 'Artwork Page',
    'data_competition': 'Competition Page',
}

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
                            }
        except Exception:
            pass
        return {}


def load_technical_data() -> pd.DataFrame:
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
# PODACI IZ KORISNIČKOG UPITNIKA
# ============================================

user_survey_data = {
    'dimenzija': [
        'Brzina prelaska\nizmeđu stranica',
        'Stabilnost pri\nslabijoj vezi',
        'Mogućnost rada\nbez interneta',
        'Korisnost offline\nakcija',
        'Jednostavnost\ninstalacije',
    ],
    'prosecna_ocena': [4.05, 3.55, 4.75, 4.55, 4.65],
    'standardna_devijacija': [0.85, 0.95, 0.55, 0.65, 0.55],
    'tip': ['Brzina', 'Stabilnost', 'Offline', 'Offline', 'Instalacija'],
}
# ============================================
# GRAFIK: MATRICA PODUDARNOSTI
# ============================================

def chart_2_match_matrix(df):
    """Matrica podudarnosti tehničkih i korisničkih nalaza"""
    
    print("📊 Kreiranje matrice podudarnosti...")
    
    # Aspekti iz Tabele 19
    aspekti = [
        'Brzina prikaza\nsadržaja',
        'Rad pri\nslaboj mreži',
        'Rad bez\ninterneta',
        'Pozadinska\nsinhronizacija',
        'Instalacija\naplikacije',
    ]
    
    # Izračunaj FCP benefit - sa proverom
    pwa_fcp = df[df['app']=='PWA']['fcp'].mean()
    spa_fcp = df[df['app']=='SPA']['fcp'].mean()
    fcp_benefit = ((spa_fcp - pwa_fcp) / spa_fcp) * 100 if spa_fcp > 0 else 0
    
    # Ako je benefit mali ili negativan, prikaži stvarnu vrednost
    print(f"   FCP: PWA={pwa_fcp:.0f}ms, SPA={spa_fcp:.0f}ms, Benefit={fcp_benefit:.1f}%")
    
    # Izračunaj LCP benefit za slabu mrežu
    pwa_slow_lcp = df[(df['app']=='PWA') & (df['network']=='slow4g')]['lcp'].mean()
    spa_slow_lcp = df[(df['app']=='SPA') & (df['network']=='slow4g')]['lcp'].mean()
    lcp_slow_benefit = ((spa_slow_lcp - pwa_slow_lcp) / spa_slow_lcp) * 100 if spa_slow_lcp > 0 else 0
    
    print(f"   LCP Slow: PWA={pwa_slow_lcp:.0f}ms, SPA={spa_slow_lcp:.0f}ms, Benefit={lcp_slow_benefit:.1f}%")
    
    tehnicki_nalazi = [
        fcp_benefit,        # Brzina - stvarna vrednost
        lcp_slow_benefit,   # Slaba mreža - stvarna vrednost
        100,                # Offline
        100,                # Sinhronizacija
        100,                # Instalacija
    ]
    
    # Korisnički nalazi
    korisnicke_ocene = [4.05, 3.55, 4.75, 4.55, 4.65]
    
    # Wilcoxon p-vrednosti
    p_vrednosti = [0.15, 0.0009, 0.001, None, None]
    
    fig, ax = plt.subplots(figsize=(14, 8))
    
    x = np.arange(len(aspekti))
    width = 0.35
    
    tehnicki_norm = []
    for val in tehnicki_nalazi:
        if val >= 100:
            tehnicki_norm.append(5)
        elif val <= -20:  # Značajno negativan (SPA bolja)
            tehnicki_norm.append(0.5)
        elif val < 0:  # Blago negativan
            tehnicki_norm.append(0.8)
        elif val < 5:  # Veoma mali benefit
            tehnicki_norm.append(1.5)
        else:
            # Normalizuj na 1-5 skalu
            tehnicki_norm.append(1 + (val / 100) * 4)
    
    print(f"   Normalizovane vrijednosti: {tehnicki_norm}")
    
    bars1 = ax.bar(x - width/2, tehnicki_norm, width, 
                  color=COLORS['technical'],
                  edgecolor='#8AD4B8', linewidth=2, alpha=0.8)
    
    bars2 = ax.bar(x + width/2, korisnicke_ocene, width,
                  color=COLORS['user'],
                  edgecolor='#E8C88A', linewidth=2, alpha=0.8)
    
    # Dodaj vrednosti - prikaži STVARNE procente, ne normalizovane
    for bar, val, orig in zip(bars1, tehnicki_norm, tehnicki_nalazi):
        if orig >= 100:
            label = '✓'  # Potpuna funkcionalnost
        elif abs(orig) < 5:
            label = f'{orig:+.1f}%'  # Prikaži malu vrednost sa predznakom
        else:
            label = f'{orig:+.0f}%'  # Prikaži veću vrednost sa predznakom
        
        ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.05,
               label, ha='center', va='bottom', fontsize=10, fontweight='bold',
               color='#333')
    
    for bar, val in zip(bars2, korisnicke_ocene):
        ax.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.05,
               f'{val:.1f}', ha='center', va='bottom', fontsize=10, fontweight='bold',
               color='#333')
    
    # Dodaj p-vrednosti
    for i, p in enumerate(p_vrednosti):
        if p is not None:
            significance = '***' if p < 0.001 else '**' if p < 0.01 else 'ns'
            color = 'green' if p < 0.05 else 'orange'
            ax.text(i, 5.4, f'p={p:.4f} {significance}', ha='center', fontsize=9,
                   color=color, fontweight='bold')
    
    # Dodaj anotacije za podudarnost
    matches = [
        (0, 'Djelimična\npodudarnost', 'orange'),
        (1, 'Visoka\npodudarnost', 'green'),
        (2, 'Potpuna\npodudarnost', 'green'),
        (3, 'Visoka\npodudarnost', 'green'),
        (4, 'Visoka\npodudarnost', 'green'),
    ]
    
    for i, text, color in matches:
        ax.text(i, 5.6, text, ha='center', fontsize=8, color=color,
               fontweight='bold', style='italic')
    
    # Stilizuj osu
    ax.set_xticks(x)
    ax.set_xticklabels(aspekti, fontsize=10, color='#333')
    ax.set_ylabel('Ocena / Benefit (normalizovano)', fontsize=11, color='#333')
    ax.set_ylim(0, 6.5)
    ax.set_title('Matrica podudarnosti tehničkih i korisničkih nalaza\n(Tabela 19)',
                fontsize=14, fontweight='bold', color=COLORS['title'], pad=15)
    
    legend_elements = [
        mpatches.Patch(facecolor=COLORS['technical'], edgecolor='#8AD4B8',
                      label='Tehnički benefit'),
        mpatches.Patch(facecolor=COLORS['user'], edgecolor='#E8C88A',
                      label='Korisnička ocena'),
    ]
    ax.legend(handles=legend_elements, fontsize=10, loc='upper right',
             frameon=True, fancybox=True, shadow=True, framealpha=0.9)
    
    ax.grid(True, alpha=0.2, axis='y', color='#E0E0E0')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#E0E0E0')
    ax.spines['bottom'].set_color('#E0E0E0')
    
    ax.text(0.02, 0.02, 'Značajnost: *** p<0.001 | ** p<0.01 | ns = nije značajno',
           fontsize=8, color='#666', style='italic', transform=ax.transAxes,
           bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig(CHARTS_DIR / '02_match_matrix.png', dpi=200, bbox_inches='tight',
               facecolor='white', edgecolor='none')
    plt.close()
    print("   ✓ Matrica podudarnosti završena")
    print(f"   📊 FCP benefit: {fcp_benefit:+.1f}% | LCP Slow benefit: {lcp_slow_benefit:+.1f}%")


def main():
    print("\n📂 Učitavanje tehničkih podataka...")
    df = load_technical_data()
    
    if df.empty:
        print("❌ Nema validnih tehničkih podataka!")
        return
    
    print(f"✅ Učitano {len(df)} tehničkih merenja")
    
    
    chart_2_match_matrix(df)

if __name__ == "__main__":
    main()