"""
STATISTIČKA ANALIZA - Mann-Whitney U test
Δ = Me(PWA) - Me(SPA) sa bootstrap CI direktno nad razlikom medijana
"""

import json
import re
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from scipy.stats import mannwhitneyu
from bs4 import BeautifulSoup

# ============================================
# KONFIGURACIJA
# ============================================

BASE_DIR = Path(r"D:\master\new_metrics")
OUTPUT_DIR = BASE_DIR / "statistical_analysis_median_diff"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGE_LABELS = {
    'data': 'Home Page',
    'data_artwork': 'Artwork Page',
    'data_competition': 'Competition Page',
}

PAGE_SHORT = {
    'Home Page': 'HOME',
    'Artwork Page': 'ART',
    'Competition Page': 'COMP',
}

METRICS = [
    'performance_score',
    'fcp',
    'lcp',
    'speed_index',
    'tbt',
    'ttfb',
]

METRIC_LABELS = {
    'performance_score': 'Performance Score',
    'fcp': 'First Contentful Paint',
    'lcp': 'Largest Contentful Paint',
    'speed_index': 'Speed Index',
    'tbt': 'Total Blocking Time',
    'ttfb': 'Time to First Byte',
}

METRIC_SHORT = {
    'performance_score': 'PERF',
    'fcp': 'FCP',
    'lcp': 'LCP',
    'speed_index': 'SI',
    'tbt': 'TBT',
    'ttfb': 'TTFB',
}

LOWER_IS_BETTER = ['fcp', 'lcp', 'speed_index', 'tbt', 'ttfb']
HIGHER_IS_BETTER = ['performance_score']

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
                                'accessibility_score': (categories.get('accessibility', {}).get('score', 0) or 0) * 100,
                                'best_practices_score': (categories.get('best-practices', {}).get('score', 0) or 0) * 100,
                                'seo_score': (categories.get('seo', {}).get('score', 0) or 0) * 100,
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
# STATISTIČKE FUNKCIJE
# ============================================

def median_difference(pwa_values, spa_values):
    """
    Δ = Me(PWA) - Me(SPA)
    Razlika medijana
    """
    return np.median(pwa_values) - np.median(spa_values)


def bootstrap_median_ci(pwa_values, spa_values, n_bootstrap=20000, seed=12345):
    """
    Bootstrap 95% CI direktno nad razlikom medijana.
    FIKS: dodat fiksni seed (bilo je np.random.choice bez seed-a -> svaki run
    daje drugačiji CI). 20.000 umjesto 2.000 ponavljanja radi stabilnijih granica.
    """
    rng = np.random.default_rng(seed)
    n_pwa = len(pwa_values)
    n_spa = len(spa_values)
    bootstrap_diffs = np.empty(n_bootstrap)
    for i in range(n_bootstrap):
        pwa_sample = rng.choice(pwa_values, size=n_pwa, replace=True)
        spa_sample = rng.choice(spa_values, size=n_spa, replace=True)
        bootstrap_diffs[i] = np.median(pwa_sample) - np.median(spa_sample)
    ci_lower = np.percentile(bootstrap_diffs, 2.5)
    ci_upper = np.percentile(bootstrap_diffs, 97.5)
    return ci_lower, ci_upper


def holm_bonferroni_correction(p_values):
    """
    FIKS: standardni Holm postupak — monotonost se nameće UNAPRIJED,
    kumulativnim maksimumom od najmanje ka najvećoj p-vrijednosti
    (holm(i) = max(q_1, ..., q_i)), ne unazad minimumom kako je bilo.
    """
    n = len(p_values)
    p_values = np.asarray(p_values)
    sorted_indices = np.argsort(p_values)
    sorted_p = p_values[sorted_indices]

    raw_adjusted = np.array([min(1.0, sorted_p[i] * (n - i)) for i in range(n)])
    running_max = np.maximum.accumulate(raw_adjusted)   # kumulativni max, ne min unazad

    adjusted_p = np.ones(n)
    for i, idx in enumerate(sorted_indices):
        adjusted_p[idx] = running_max[i]
    return adjusted_p

def rank_biserial_correlation(u_statistic, n1, n2):
    """
    Rang-biserijalna korelacija
    r = 1 - (2*U) / (n1*n2)
    """
    return 1 - (2 * u_statistic) / (n1 * n2)


# ============================================
# GLAVNA ANALIZA
# ============================================

def perform_statistical_analysis(df):
    all_results = []
    raw_p_values = []
    test_info = []
    
    # Sve kombinacije uslova
    conditions = []
    for page in PAGE_LABELS.values():
        for start in ['COLD', 'WARM']:
            for network in ['fast4g', 'slow4g']:
                for cpu in [1, 4]:
                    conditions.append((page, start, network, cpu))
    
    # PRVI PROLAZ: Izračunaj Mann-Whitney U test
    for page, start, network, cpu in conditions:
        for metric in METRICS:
            pwa_data = df[(df['page'] == page) & 
                         (df['start'] == start) & 
                         (df['network'] == network) & 
                         (df['cpu_slowdown'] == cpu) & 
                         (df['app'] == 'PWA')][metric].values
            
            spa_data = df[(df['page'] == page) & 
                         (df['start'] == start) & 
                         (df['network'] == network) & 
                         (df['cpu_slowdown'] == cpu) & 
                         (df['app'] == 'SPA')][metric].values
            
            if len(pwa_data) < 5 or len(spa_data) < 5:
                continue
            
            u_stat, p_value = mannwhitneyu(pwa_data, spa_data, alternative='two-sided')
            
            raw_p_values.append(p_value)
            test_info.append((page, start, network, cpu, metric, pwa_data, spa_data, u_stat, p_value))
    
    # Holm-Bonferroni korekcija
    holm_p_values = holm_bonferroni_correction(raw_p_values)

    
    header = (f"{'#':<4} {'STRANICA':<8} {'START':<6} {'MREŽA':<8} {'CPU':<4} "
              f"{'METRIKA':<6} {'Me(PWA)':>10} {'Me(SPA)':>10} {'Δ':>10} "
              f"{'CI LOWER':>10} {'CI UPPER':>10} {'p_Holm':>8} {'ZNAČ.'}")
    
    for idx, (page, start, network, cpu, metric, pwa_data, spa_data, u_stat, p_raw) in enumerate(test_info):
        
        # Razlika medijana
        pwa_median = np.median(pwa_data)
        spa_median = np.median(spa_data)
        delta = pwa_median - spa_median
        
        # Bootstrap CI direktno nad razlikom medijana
        ci_lower, ci_upper = bootstrap_median_ci(pwa_data, spa_data, n_bootstrap=20000)
        
        # Rang-biserijalna korelacija
        r = rank_biserial_correlation(u_stat, len(pwa_data), len(spa_data))
        
        # Holm p-vrednost
        p_holm = holm_p_values[idx]
        
        # Značajnost
        significant = p_holm < 0.05
        
        # Odredi pobednika
        if metric in LOWER_IS_BETTER:
            pwa_better = delta < 0  # Negativan delta = PWA bolja
        else:
            pwa_better = delta > 0  # Pozitivan delta = PWA bolja
        
        winner = 'PWA' if pwa_better else 'SPA'
        sig_mark = '***' if p_holm < 0.001 else '**' if p_holm < 0.01 else '*' if p_holm < 0.05 else ''
        
        # Formatiraj ispis
        page_short = PAGE_SHORT.get(page, page[:4])
        metric_short = METRIC_SHORT.get(metric, metric[:4])
        network_short = 'F4G' if network == 'fast4g' else 'S4G'
        
        print(f"{idx+1:<4} {page_short:<8} {start:<6} {network_short:<8} {cpu:<4} "
              f"{metric_short:<6} {pwa_median:>10.1f} {spa_median:>10.1f} {delta:>10.1f} "
              f"{ci_lower:>10.1f} {ci_upper:>10.1f} {p_holm:>8.4f} {sig_mark}")
        
        # Dodatni ispis za značajne
        if significant:
            print(f"     {'':>4} {'':>8} {'':>6} {'':>8} {'':>4} {'':>6} "
                  f"{'':>10} {'':>10} {'':>10} {'':>10} {'':>10} {'':>8}")
            print(f"     → {winner} bolja | CI = [{ci_lower:.1f}; {ci_upper:.1f}] | r = {r:.2f}")
            print()
        
        # Sačuvaj
        all_results.append({
            'page': page,
            'start': start,
            'network': network,
            'cpu_slowdown': cpu,
            'metric': metric,
            'metric_label': METRIC_LABELS[metric],
            'pwa_n': len(pwa_data),
            'spa_n': len(spa_data),
            'pwa_median': pwa_median,
            'spa_median': spa_median,
            'pwa_mean': np.mean(pwa_data),
            'spa_mean': np.mean(spa_data),
            'pwa_std': np.std(pwa_data, ddof=1),
            'spa_std': np.std(spa_data, ddof=1),
            'u_statistic': u_stat,
            'p_value_raw': p_raw,
            'p_holm': p_holm,
            'delta_median': delta,
            'ci_lower': ci_lower,
            'ci_upper': ci_upper,
            'rank_biserial_r': r,
            'pwa_better': pwa_better,
            'winner': winner,
            'significant': significant,
        })
    
    # Sumarni pregled
    results_df = pd.DataFrame(all_results)
    significant_df = results_df[results_df['significant']]
    
    # Ispis svih značajnih
    if len(significant_df) > 0:
        
        for _, row in significant_df.iterrows():
            page_short = PAGE_SHORT.get(row['page'], row['page'][:4])
            metric_short = METRIC_SHORT.get(row['metric'], row['metric'][:4])
            network_label = 'Fast 4G' if row['network'] == 'fast4g' else 'Slow 4G'

    return results_df


def save_results(results_df):
    
    csv_path = OUTPUT_DIR / "mann_whitney_median_diff_results.csv"
    results_df.to_csv(csv_path, index=False, encoding='utf-8')
    
    significant_df = results_df[results_df['significant']]
    sig_csv_path = OUTPUT_DIR / "significant_results_median_diff.csv"
    significant_df.to_csv(sig_csv_path, index=False, encoding='utf-8')
    
    return significant_df

       
def main():
    df = load_all_data()
    
    if df.empty:
        print("❌ Nema validnih podataka!")
        return
        
    results_df = perform_statistical_analysis(df)
    
    significant_df = save_results(results_df)
    

if __name__ == "__main__":
    main()