"""
📊 TABELE ZA ANALIZU - Medijane i Delta vrednosti
Tabela 1: Score, ΔFCP, ΔLCP, ΔSI, ΔTBT, ΔTTFB po uslovima
Tabela 2: Pad Performance Score-a i rast TBT-a pri CPU 4x
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
OUTPUT_DIR = BASE_DIR / "tables_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGE_LABELS = {
    'data': 'Home Page',
    'data_artwork': 'Artwork Page',
    'data_competition': 'Competition Page',
}

PAGE_SHORT = {
    'Home Page': 'Početna',
    'Artwork Page': 'Umjetničko djelo',
    'Competition Page': 'Takmičenja',
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
        except Exception:
            pass
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
# TABELA 1: MEDIJANE I DELTA VREDNOSTI (sa TBT i TTFB)
# ============================================

def generate_table_1(df):
    results = []
    
    for page in PAGE_LABELS.values():
        page_df = df[df['page'] == page]
        
        for start in ['COLD', 'WARM']:
            for network in ['fast4g', 'slow4g']:
                for cpu in [1, 4]:
                    
                    # Izvuci podatke
                    spa_data = page_df[(page_df['app'] == 'SPA') & 
                                      (page_df['start'] == start) & 
                                      (page_df['network'] == network) & 
                                      (page_df['cpu_slowdown'] == cpu)]
                    
                    pwa_data = page_df[(page_df['app'] == 'PWA') & 
                                      (page_df['start'] == start) & 
                                      (page_df['network'] == network) & 
                                      (page_df['cpu_slowdown'] == cpu)]
                    
                    if len(spa_data) == 0 or len(pwa_data) == 0:
                        continue
                    
                    # Medijane
                    spa_score = spa_data['performance_score'].median()
                    pwa_score = pwa_data['performance_score'].median()
                    
                    # FCP
                    spa_fcp = spa_data['fcp'].median()
                    pwa_fcp = pwa_data['fcp'].median()
                    delta_fcp = pwa_fcp - spa_fcp
                    
                    # LCP
                    spa_lcp = spa_data['lcp'].median()
                    pwa_lcp = pwa_data['lcp'].median()
                    delta_lcp = pwa_lcp - spa_lcp
                    
                    # Speed Index
                    spa_si = spa_data['speed_index'].median()
                    pwa_si = pwa_data['speed_index'].median()
                    delta_si = pwa_si - spa_si
                    
                    # TBT
                    spa_tbt = spa_data['tbt'].median()
                    pwa_tbt = pwa_data['tbt'].median()
                    delta_tbt = pwa_tbt - spa_tbt
                    
                    # TTFB
                    spa_ttfb = spa_data['ttfb'].median()
                    pwa_ttfb = pwa_data['ttfb'].median()
                    delta_ttfb = pwa_ttfb - spa_ttfb
                    
                    results.append({
                        'page': page,
                        'start': start,
                        'network': network,
                        'cpu': cpu,
                        'spa_score': spa_score,
                        'pwa_score': pwa_score,
                        'delta_fcp': delta_fcp,
                        'delta_lcp': delta_lcp,
                        'delta_si': delta_si,
                        'delta_tbt': delta_tbt,
                        'delta_ttfb': delta_ttfb,
                    })
    
    # Konvertuj u DataFrame
    results_df = pd.DataFrame(results)
    
    # Ispis tabele za svaku stranicu
    for page in PAGE_LABELS.values():
        page_results = results_df[results_df['page'] == page]
        page_short = PAGE_SHORT.get(page, page)
        
        for _, row in page_results.iterrows():
            start_label = 'Hladno' if row['start'] == 'COLD' else 'Toplo'
            network_label = 'Fast 4G' if row['network'] == 'fast4g' else 'Slow 4G'
            
            # Formatiraj delta vrednosti sa predznakom
            delta_fcp_str = f"{row['delta_fcp']:+.0f}"
            delta_lcp_str = f"{row['delta_lcp']:+.0f}"
            delta_si_str = f"{row['delta_si']:+.0f}"
            delta_tbt_str = f"{row['delta_tbt']:+.0f}"
            delta_ttfb_str = f"{row['delta_ttfb']:+.0f}"
    # Sačuvaj u CSV
    csv_path = OUTPUT_DIR / "table_1_medians_delta_full.csv"
    results_df.to_csv(csv_path, index=False, encoding='utf-8')
    print(f"\n✅ CSV sačuvan: {csv_path}")
    
    return results_df


# ============================================
# TABELA 2: CPU UTICAJ NA SCORE I TBT
# ============================================

def generate_table_2(df):
    """Generiše tabelu sa padom Performance Score-a i rastom TBT-a"""
    results = []
    
    for page in PAGE_LABELS.values():
        page_df = df[df['page'] == page]
        page_short = PAGE_SHORT.get(page, page)
        
        for app in ['SPA', 'PWA']:
            app_df = page_df[page_df['app'] == app]
            
            for start in ['COLD', 'WARM']:
                start_df = app_df[app_df['start'] == start]
                
                # CPU 1x medijane
                cpu1_df = start_df[start_df['cpu_slowdown'] == 1]
                cpu4_df = start_df[start_df['cpu_slowdown'] == 4]
                
                if len(cpu1_df) == 0 or len(cpu4_df) == 0:
                    continue
                
                score_1x = cpu1_df['performance_score'].median()
                score_4x = cpu4_df['performance_score'].median()
                score_drop = score_1x - score_4x  # Pozitivno = pad
                
                tbt_1x = cpu1_df['tbt'].median()
                tbt_4x = cpu4_df['tbt'].median()
                tbt_increase = tbt_4x - tbt_1x  # Pozitivno = rast
                
                # TTFB takođe
                ttfb_1x = cpu1_df['ttfb'].median()
                ttfb_4x = cpu4_df['ttfb'].median()
                ttfb_increase = ttfb_4x - ttfb_1x
                
                results.append({
                    'page': page_short,
                    'app': app,
                    'start': 'Hladan' if start == 'COLD' else 'Topao',
                    'score_drop': score_drop,
                    'tbt_increase': tbt_increase,
                    'ttfb_increase': ttfb_increase,
                })
    
    for row in results:
        score_str = f"{row['score_drop']:.1f}" if abs(row['score_drop']) > 0.05 else "0,0"
        tbt_str = f"{row['tbt_increase']:.1f}" if abs(row['tbt_increase']) > 0.05 else "0"
        ttfb_str = f"{row['ttfb_increase']:.1f}" if abs(row['ttfb_increase']) > 0.05 else "0"
    
    # Sačuvaj u CSV
    results_df = pd.DataFrame(results)
    csv_path = OUTPUT_DIR / "table_2_cpu_impact_full.csv"
    results_df.to_csv(csv_path, index=False, encoding='utf-8')
    
    return results_df

          

# ============================================
# MAIN
# ============================================

def main():
    
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
    
    # Generiši Tabelu 1 (sa TBT i TTFB)
    table1_df = generate_table_1(df)
    
    # Generiši Tabelu 2 (sa TTFB)
    table2_df = generate_table_2(df)
    

if __name__ == "__main__":
    main()