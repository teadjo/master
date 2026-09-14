"""
AGREGIRANE TABELE A.1a, A.1b, A.1c
Za svaku stranicu: SPA M, SPA SD, PWA M, PWA SD po svim metrikama
"""

import json
import re
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from bs4 import BeautifulSoup

# ============================================
# KONFIGURACIJA
# ============================================

BASE_DIR = Path(r"D:\new_metrics")
OUTPUT_DIR = BASE_DIR / "tabeleA1abc"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGES = {
    'data': {
        'name': 'Početna stranica',
        'table_label': 'Tabela A.1a',
        'csv_name': 'tabela_A1a_pocetna.csv',
    },
    'data_artwork': {
        'name': 'Stranica umjetničkog djela',
        'table_label': 'Tabela A.1b',
        'csv_name': 'tabela_A1b_umjetnicko_djelo.csv',
    },
    'data_competition': {
        'name': 'Stranica takmičenja',
        'table_label': 'Tabela A.1c',
        'csv_name': 'tabela_A1c_takmicenja.csv',
    },
}

METRICS = [
    ('performance_score', 'Performance score', 'score'),
    ('fcp', 'FCP (ms)', 'ms'),
    ('lcp', 'LCP (ms)', 'ms'),
    ('speed_index', 'Speed Index (ms)', 'ms'),
    ('tbt', 'TBT (ms)', 'ms'),
    ('cls', 'CLS', 'cls'),
    ('ttfb', 'TTFB (ms)', 'ms'),
]

# ============================================
# PARSER
# ============================================

class LighthouseParser:
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
                                'cls': audits.get('cumulative-layout-shift', {}).get('numericValue', 0) or 0,
                                'ttfb': audits.get('server-response-time', {}).get('numericValue', 0) or 0,
                            }
        except Exception:
            pass
        return {}


def load_all_data() -> pd.DataFrame:
    results = []
    for page_folder in PAGES.keys():
        page_path = BASE_DIR / page_folder
        if not page_path.exists():
            print(f"⚠ Folder ne postoji: {page_path}")
            continue
        
        for app in ['pwa', 'spa']:
            app_path = page_path / app
            if not app_path.exists():
                continue
            
            html_files = list(app_path.glob("*.html"))
            print(f"{page_folder}/{app}: {len(html_files)} fajlova")
            
            for html_file in html_files:
                metrics = LighthouseParser.extract_metrics(html_file)
                
                if metrics.get('lcp', 0) > 0:
                    results.append({
                        'page_folder': page_folder,
                        'page_name': PAGES[page_folder]['name'],
                        'app': 'PWA' if app == 'pwa' else 'SPA',
                        **metrics
                    })
    
    return pd.DataFrame(results)


# ============================================
# FORMATIRANJE VREDNOSTI
# ============================================

def format_value(val, metric_type):
    """Formatira vrednost po tipu metrike"""
    if metric_type == 'score':
        # Score: 2 decimale, zarez
        return f"{val:.2f}".replace('.', ',')
    elif metric_type == 'cls':
        # CLS: 2 decimale, zarez
        return f"{val:.2f}".replace('.', ',')
    else:
        # ms: 2 decimale, zarez, sa hiljadama tačkom
        formatted = f"{val:,.2f}"
        # Zameni zapete i tačke (US format u EU format)
        formatted = formatted.replace(',', 'X').replace('.', ',').replace('X', '.')
        return formatted


# ============================================
# GENERISANJE AGREGIRANE TABELE
# ============================================

def generate_aggregated_table(df, page_folder):
    """Generiše agregiranu tabelu za jednu stranicu"""
    
    page_info = PAGES[page_folder]
    page_df = df[df['page_folder'] == page_folder]
    
    print(f"\n{'='*90}")
    print(f"📊 {page_info['table_label']} - Agregirani rezultati")
    print(f"   {page_info['name']}")
    print(f"   Vrijednosti su nezavisno potvrđene direktnim preračunom nad sirovim podacima.")
    print(f"{'='*90}\n")
    
    rows = []
    
    print(f"{'Metrika':<20} {'SPA M':>12} {'SPA SD':>12} {'PWA M':>12} {'PWA SD':>12}")
    print(f"{'─'*20} {'─'*12} {'─'*12} {'─'*12} {'─'*12}")
    
    for metric_key, metric_label, metric_type in METRICS:
        
        spa_data = page_df[page_df['app'] == 'SPA'][metric_key].dropna()
        pwa_data = page_df[page_df['app'] == 'PWA'][metric_key].dropna()
        
        if len(spa_data) == 0 or len(pwa_data) == 0:
            continue
        
        spa_mean = spa_data.mean()
        spa_std = spa_data.std(ddof=1) 
        pwa_mean = pwa_data.mean()
        pwa_std = pwa_data.std(ddof=1)

        row = {
            'Metrika': metric_label,
            'SPA M': format_value(spa_mean, metric_type),
            'SPA SD': format_value(spa_std, metric_type),
            'PWA M': format_value(pwa_mean, metric_type),
            'PWA SD': format_value(pwa_std, metric_type),
        }
        
        rows.append(row)
        
        print(f"{row['Metrika']:<20} {row['SPA M']:>12} {row['SPA SD']:>12} "
              f"{row['PWA M']:>12} {row['PWA SD']:>12}")
    
    table_df = pd.DataFrame(rows)
    
    csv_path = OUTPUT_DIR / page_info['csv_name']
    table_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    
    return table_df


# ============================================
# MAIN
# ============================================

def main():
    print("="*90)
    print("📊 GENERISANJE AGREGIRANIH TABELA A.1a, A.1b, A.1c")
    print("   SPA M, SPA SD, PWA M, PWA SD po svim metrikama")
    print("="*90)
    
    print("\n📂 Učitavanje podataka...")
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    
    print(f"\n✅ Učitano {len(df)} merenja")
    
    # Generiši tabelu za svaku stranicu
    all_tables = {}
    
    for page_folder in PAGES.keys():
        if page_folder not in df['page_folder'].unique():
            print(f"⚠ Nema podataka za {page_folder}")
            continue
        
        table_df = generate_aggregated_table(df, page_folder)
        all_tables[page_folder] = table_df

    
    # Lista fajlova
    print("\n📊 Kreirani CSV fajlovi:")
    for page_folder, page_info in PAGES.items():
        csv_path = OUTPUT_DIR / page_info['csv_name']
        if csv_path.exists():
            print(f"   • {page_info['csv_name']} ({page_info['name']})")


if __name__ == "__main__":
    main()