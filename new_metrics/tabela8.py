"""
TABELA 8: Broj kombinacija u kojima PWA ostvaruje povoljniji medijan
Po stranicama i ukupno
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
OUTPUT_DIR = BASE_DIR / "table_8_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGES = {
    'data': 'Početna',
    'data_competition': 'Takmičenja',
    'data_artwork': 'Umjetničko djelo',
}

METRICS = [
    ('performance_score', 'Performance score', 'higher'),
    ('fcp', 'FCP', 'lower'),
    ('lcp', 'LCP', 'lower'),
    ('speed_index', 'Speed Index', 'lower'),
    ('tbt', 'TBT', 'lower'),
    ('ttfb', 'TTFB', 'lower'),
]

# Prag za izjednačeno (u % ili apsolutno)
EQUALITY_THRESHOLD_PERCENT = 0.5  # 0.5%
TBT_EQUALITY_THRESHOLD = 1.0  # 1 ms za TBT


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
                lower = html_file.name.lower()
                start = 'COLD' if 'cold' in lower else 'WARM'
                network = 'fast4g' if 'fast4g' in lower else 'slow4g'
                cpu_match = re.search(r'cpu([14])x?', lower)
                cpu_slowdown = int(cpu_match.group(1)) if cpu_match else (1 if network == 'fast4g' else 4)
                
                metrics = LighthouseParser.extract_metrics(html_file)
                
                if metrics.get('lcp', 0) > 0:
                    results.append({
                        'page_folder': page_folder,
                        'page_name': PAGES[page_folder],
                        'app': 'PWA' if app == 'pwa' else 'SPA',
                        'start': start,
                        'network': network,
                        'cpu_slowdown': cpu_slowdown,
                        **metrics
                    })
    
    return pd.DataFrame(results)


# ============================================
# ANALIZA PO STRANICI
# ============================================

def analyze_page_combinations(df, page_folder, metric_key, direction):
    """
    Analizira 8 kombinacija za jednu stranicu i jednu metriku
    Vraća: (pwa_better, spa_better, equal)
    """
    
    page_df = df[df['page_folder'] == page_folder]
    
    combinations = []
    for start in ['COLD', 'WARM']:
        for network in ['fast4g', 'slow4g']:
            for cpu in [1, 4]:
                combinations.append((start, network, cpu))
    
    pwa_better = 0
    spa_better = 0
    equal = 0
    
    for start, network, cpu in combinations:
        pwa_data = page_df[(page_df['app'] == 'PWA') &
                          (page_df['start'] == start) &
                          (page_df['network'] == network) &
                          (page_df['cpu_slowdown'] == cpu)][metric_key].values
        
        spa_data = page_df[(page_df['app'] == 'SPA') &
                          (page_df['start'] == start) &
                          (page_df['network'] == network) &
                          (page_df['cpu_slowdown'] == cpu)][metric_key].values
        
        if len(pwa_data) == 0 or len(spa_data) == 0:
            continue
        
        pwa_val = np.median(pwa_data)
        spa_val = np.median(spa_data)
        
        # Proveri izjednačenost
        if metric_key == 'tbt':
            # Specijalan slučaj za TBT
            if abs(pwa_val - spa_val) < TBT_EQUALITY_THRESHOLD:
                equal += 1
                continue
        
        if spa_val > 0:
            diff_percent = abs(pwa_val - spa_val) / spa_val * 100
        else:
            diff_percent = 0
        
        if diff_percent < EQUALITY_THRESHOLD_PERCENT:
            equal += 1
        else:
            if direction == 'higher':
                if pwa_val > spa_val:
                    pwa_better += 1
                else:
                    spa_better += 1
            else:
                if pwa_val < spa_val:
                    pwa_better += 1
                else:
                    spa_better += 1
    
    return pwa_better, spa_better, equal


def generate_table_8(df):
    header = (f"{'Metrika':<20} {'Početna':>10} {'Takmičenja':>12} "
              f"{'Umjetničko djelo':>18} {'Ukupno':>10}")
    print(f"\n{header}")
    print("-" * len(header))
    
    results = []
    
    for metric_key, metric_label, direction in METRICS:
        
        # Analiziraj svaku stranicu
        page_results = {}
        total_pwa = 0
        total_combinations = 0
        
        for page_folder, page_label in PAGES.items():
            pwa_better, spa_better, equal = analyze_page_combinations(
                df, page_folder, metric_key, direction
            )
            
            page_results[page_folder] = {
                'pwa_better': pwa_better,
                'spa_better': spa_better,
                'equal': equal,
                'total': pwa_better + spa_better + equal,
            }
            
            total_pwa += pwa_better
            total_combinations += pwa_better + spa_better + equal
        
        # Formatiraj rezultate
        row = {
            'Metrika': metric_label,
            'Početna': f"{page_results['data']['pwa_better']}/8",
            'Takmičenja': f"{page_results['data_competition']['pwa_better']}/8",
            'Umjetničko djelo': f"{page_results['data_artwork']['pwa_better']}/8",
            'Ukupno': f"{total_pwa}/{total_combinations}",
        }
        
        # Dodaj zvezdice za specijalne slučajeve
        artwork_page = page_results['data_artwork']
        
        # Performance score - zvezdica ako ima izjednačenja
        if metric_key == 'performance_score' and artwork_page['equal'] > 0:
            row['Umjetničko djelo'] += '*'
        
        # TBT - zvezdica ako ima izjednačenja
        if metric_key == 'tbt':
            total_equal = sum(page_results[p]['equal'] for p in PAGES)
            if total_equal > 0:
                for page_folder in PAGES:
                    if page_results[page_folder]['equal'] > 0:
                        row[PAGES[page_folder]] += '**'
                row['Ukupno'] += '**'
        
        results.append(row)
        
        # Ispis
        print(f"{row['Metrika']:<20} {row['Početna']:>10} {row['Takmičenja']:>12} "
              f"{row['Umjetničko djelo']:>18} {row['Ukupno']:>10}")
    
    # Kreiraj DataFrame
    table_df = pd.DataFrame(results)
    
    # Sačuvaj u CSV
    csv_path = OUTPUT_DIR / "tabela_8_kombinacije.csv"
    table_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    
    return table_df, results


def print_detailed_analysis(df):
    
    # Analiza TBT izjednačenja    
    for page_folder, page_label in PAGES.items():
        page_df = df[df['page_folder'] == page_folder]
        
        equal_count = 0
        total_count = 0
        
        for start in ['COLD', 'WARM']:
            for network in ['fast4g', 'slow4g']:
                for cpu in [1, 4]:
                    pwa_data = page_df[(page_df['app'] == 'PWA') &
                                      (page_df['start'] == start) &
                                      (page_df['network'] == network) &
                                      (page_df['cpu_slowdown'] == cpu)]['tbt'].values
                    
                    spa_data = page_df[(page_df['app'] == 'SPA') &
                                      (page_df['start'] == start) &
                                      (page_df['network'] == network) &
                                      (page_df['cpu_slowdown'] == cpu)]['tbt'].values
                    
                    if len(pwa_data) == 0 or len(spa_data) == 0:
                        continue
                    
                    total_count += 1
                    pwa_val = np.median(pwa_data)
                    spa_val = np.median(spa_data)
                    
                    if abs(pwa_val - spa_val) < TBT_EQUALITY_THRESHOLD:
                        equal_count += 1
        
        print(f"   {page_label}: {equal_count}/{total_count} izjednačeno")
    
    # Analiza Performance score izjednačenja na Artwork stranici
    print("\n📊 Performance score izjednačenja:")
    
    artwork_df = df[df['page_folder'] == 'data_artwork']
    equal_count = 0
    
    for start in ['COLD', 'WARM']:
        for network in ['fast4g', 'slow4g']:
            for cpu in [1, 4]:
                pwa_data = artwork_df[(artwork_df['app'] == 'PWA') &
                                     (artwork_df['start'] == start) &
                                     (artwork_df['network'] == network) &
                                     (artwork_df['cpu_slowdown'] == cpu)]['performance_score'].values
                
                spa_data = artwork_df[(artwork_df['app'] == 'SPA') &
                                     (artwork_df['start'] == start) &
                                     (artwork_df['network'] == network) &
                                     (artwork_df['cpu_slowdown'] == cpu)]['performance_score'].values
                
                if len(pwa_data) == 0 or len(spa_data) == 0:
                    continue
                
                pwa_val = np.median(pwa_data)
                spa_val = np.median(spa_data)
                
                if spa_val > 0:
                    diff = abs(pwa_val - spa_val) / spa_val * 100
                    if diff < EQUALITY_THRESHOLD_PERCENT:
                        equal_count += 1
                        print(f"   Izjednačeno: {start} / {network} / CPU {cpu}× "
                              f"(PWA: {pwa_val:.1f}, SPA: {spa_val:.1f})")
    
    print(f"\n   Ukupno izjednačenja: {equal_count}")


def main():
    
    print("\n📂 Učitavanje podataka...")
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    
    print(f"✅ Učitano {len(df)} merenja")
    print(f"   Stranice: {df['page_name'].unique()}")
    
    # Generiši tabelu
    table_df, results = generate_table_8(df)
    
    # Detaljna analiza
    print_detailed_analysis(df)
    

    



if __name__ == "__main__":
    main()