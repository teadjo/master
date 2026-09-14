"""
TABELA A.3: Broj povoljnijih kombinacija po metrici
Za svaku metriku: koliko puta je PWA bolja, SPA bolja, ili izjednačeno
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

BASE_DIR = Path(r"D:\master\new_metrics")
OUTPUT_DIR = BASE_DIR / "combination_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGES = {
    'data': 'Početna stranica',
    'data_artwork': 'Stranica umjetničkog djela',
    'data_competition': 'Stranica takmičenja',
}

# Metrike za analizu
METRICS = [
    ('performance_score', 'Performance score', 'higher'), 
    ('fcp', 'FCP', 'lower'),                              
    ('lcp', 'LCP', 'lower'),
    ('speed_index', 'Speed Index', 'lower'),
    ('tbt', 'TBT', 'lower'),
    ('ttfb', 'TTFB', 'lower'),
]

# Prag za izjednačeno (u %)
# Ako je razlika manja od ovog procenta, smatramo izjednačenim
EQUALITY_THRESHOLD_PERCENT = 0.5  # 0.5%


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
        except Exception:
            pass
        return {}


def load_all_data() -> pd.DataFrame:
    results = []
    for page_folder in PAGES.keys():
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
                        'page_folder': page_folder,
                        'page_name': PAGES[page_folder],
                        'app': 'PWA' if app == 'pwa' else 'SPA',
                        'start': info['start'],
                        'network': info['network'],
                        'cpu_slowdown': info['cpu_slowdown'],
                        **metrics
                    })
    
    return pd.DataFrame(results)


# ============================================
# ANALIZA POVOLJNIJIH KOMBINACIJA
# ============================================

def analyze_combinations(df, use_medians=True):
    """
    Analizira sve kombinacije i broji koliko puta je PWA/SPA bolja
    
    Kombinacije: 3 stranice × 2 starta × 2 mreže × 2 CPU = 24 kombinacije
    """
    
    # Sve kombinacije
    combinations = []
    for page_folder in PAGES.keys():
        for start in ['COLD', 'WARM']:
            for network in ['fast4g', 'slow4g']:
                for cpu in [1, 4]:
                    combinations.append((page_folder, start, network, cpu))
    
    print(f"\n📊 Ukupno kombinacija: {len(combinations)}")
    print(f"📊 Metrika: {len(METRICS)}")
    
    # Rezultati po metrici
    results = {}
    
    for metric_key, metric_label, direction in METRICS:
        pwa_better_count = 0
        spa_better_count = 0
        equal_count = 0
        
        for page_folder, start, network, cpu in combinations:
            # Izvuci podatke
            pwa_data = df[(df['page_folder'] == page_folder) &
                         (df['app'] == 'PWA') &
                         (df['start'] == start) &
                         (df['network'] == network) &
                         (df['cpu_slowdown'] == cpu)][metric_key].values
            
            spa_data = df[(df['page_folder'] == page_folder) &
                         (df['app'] == 'SPA') &
                         (df['start'] == start) &
                         (df['network'] == network) &
                         (df['cpu_slowdown'] == cpu)][metric_key].values
            
            if len(pwa_data) == 0 or len(spa_data) == 0:
                continue
            
            # Koristi medijane ili proseke
            if use_medians:
                pwa_val = np.median(pwa_data)
                spa_val = np.median(spa_data)
            else:
                pwa_val = np.mean(pwa_data)
                spa_val = np.mean(spa_data)
            
            # Izračunaj razliku u procentima (za threshold)
            if spa_val > 0:
                diff_percent = abs(pwa_val - spa_val) / spa_val * 100
            else:
                diff_percent = 0
            
            # Proveri da li je izjednačeno
            if diff_percent < EQUALITY_THRESHOLD_PERCENT:
                equal_count += 1
            else:
                # Odredi pobednika
                if direction == 'higher':
                    # Veća vrednost je bolja (Performance score)
                    if pwa_val > spa_val:
                        pwa_better_count += 1
                    else:
                        spa_better_count += 1
                else:
                    # Manja vrednost je bolja (vremenske metrike)
                    if pwa_val < spa_val:
                        pwa_better_count += 1
                    else:
                        spa_better_count += 1
        
        total = pwa_better_count + spa_better_count + equal_count
        
        results[metric_key] = {
            'metric_label': metric_label,
            'pwa_better': pwa_better_count,
            'spa_better': spa_better_count,
            'equal': equal_count,
            'total': total,
            'pwa_percent': pwa_better_count / total * 100 if total > 0 else 0,
            'spa_percent': spa_better_count / total * 100 if total > 0 else 0,
        }
    
    return results


def print_table_a3(results):
    """Ispisuje Tabelu A.3"""
    
    print("\n" + "="*110)
    print("📊 Tabela A.3: Broj povoljnijih kombinacija po metrici")
    print("="*110)
    
    header = (f"{'Metrika':<22} {'PWA povoljnija':>18} {'% PWA':>10} "
              f"{'SPA povoljnija':>18} {'% SPA':>10} {'Izjednačeno':>14}")
    print(header)
    print("-" * len(header))
    
    for metric_key, data in results.items():
        label = data['metric_label']
        pwa_str = f"{data['pwa_better']}/24"
        pwa_pct = f"{data['pwa_percent']:.1f}%"
        spa_str = f"{data['spa_better']}/24"
        spa_pct = f"{data['spa_percent']:.1f}%"
        equal_str = str(data['equal']) if data['equal'] > 0 else "–"
        
        print(f"{label:<22} {pwa_str:>18} {pwa_pct:>10} "
              f"{spa_str:>18} {spa_pct:>10} {equal_str:>14}")


def save_to_csv(results):
    """Čuva rezultate u CSV"""
    
    # Pripremi DataFrame
    rows = []
    for metric_key, data in results.items():
        label = data['metric_label']
        if metric_key == 'lcp':
            label = "LCP*"
        
        rows.append({
            'Metrika': label,
            'PWA povoljnija': f"{data['pwa_better']}/24",
            '% PWA': f"{data['pwa_percent']:.1f}%",
            'SPA povoljnija': f"{data['spa_better']}/24",
            '% SPA': f"{data['spa_percent']:.1f}%",
            'Izjednačeno': data['equal'] if data['equal'] > 0 else '–',
        })
    
    table_df = pd.DataFrame(rows)
    
    csv_path = OUTPUT_DIR / "tabela_A3_kombinacije.csv"
    table_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ CSV sačuvan: {csv_path}")
    
    return table_df


def main():
    print("="*90)
    print("📊 TABELA A.3: Broj povoljnijih kombinacija po metrici")
    print("="*90)
    
    print("\n📂 Učitavanje podataka...")
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    
    print(f"✅ Učitano {len(df)} merenja")
    
    # Analiza kombinacija
    results = analyze_combinations(df, use_medians=True)
    
    # Ispis tabele
    print_table_a3(results)
    
    # Sačuvaj u CSV
    table_df = save_to_csv(results)
    


if __name__ == "__main__":
    main()