"""
LIGHTHOUSE CSV GENERATOR
Učitava sve HTML fajlove i pravi sumarni CSV sa svim merenjima
"""

import json
import re
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
from bs4 import BeautifulSoup

# ============================================
# KONFIGURACIJA
# ============================================

BASE_DIR = Path(r"D:\new_metrics")
OUTPUT_DIR = BASE_DIR / "csv_output"
OUTPUT_DIR.mkdir(exist_ok=True)

PAGE_LABELS = {
    'data': 'Home Page',
    'data_artwork': 'Artwork Page',
    'data_competition': 'Competition Page',
}

# ============================================
# PARSER
# ============================================

class LighthouseParser:
    @staticmethod
    def parse_filename(filename: str) -> dict:
        """Parsira naziv fajla za metapodatke"""
        lower = filename.lower()
        
        start = 'COLD' if 'cold' in lower else 'WARM'
        network = 'fast4g' if 'fast4g' in lower else 'slow4g'
        
        # CPU slowdown
        cpu_match = re.search(r'cpu([14])x?', lower)
        cpu_slowdown = int(cpu_match.group(1)) if cpu_match else (1 if network == 'fast4g' else 4)
        
        return {
            'start': start,
            'network': network,
            'cpu_slowdown': cpu_slowdown
        }
    
    @staticmethod
    def extract_metrics(file_path: Path) -> dict:
        """Izvlači sve metrike iz HTML fajla"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            for script in soup.find_all('script'):
                if script.string and '__LIGHTHOUSE_FLOW_JSON__' in script.string:
                    match = re.search(r'__LIGHTHOUSE_FLOW_JSON__\s*=\s*({.*?});', 
                                    script.string, re.DOTALL)
                    if match:
                        data = json.loads(match.group(1))
                        steps = data.get('steps', [])
                        
                        if steps:
                            lhr = steps[0].get('lhr', {})
                            audits = lhr.get('audits', {})
                            categories = lhr.get('categories', {})
                            
                            # Izvuci sve metrike
                            return {
                                'performance_score': (categories.get('performance', {}).get('score', 0) or 0) * 100,
                                'accessibility_score': (categories.get('accessibility', {}).get('score', 0) or 0) * 100,
                                'best_practices_score': (categories.get('best-practices', {}).get('score', 0) or 0) * 100,
                                'seo_score': (categories.get('seo', {}).get('score', 0) or 0) * 100,
                                
                                # Core Web Vitals
                                'fcp': audits.get('first-contentful-paint', {}).get('numericValue', 0) or 0,
                                'lcp': audits.get('largest-contentful-paint', {}).get('numericValue', 0) or 0,
                                'speed_index': audits.get('speed-index', {}).get('numericValue', 0) or 0,
                                'tbt': audits.get('total-blocking-time', {}).get('numericValue', 0) or 0,
                                'cls': audits.get('cumulative-layout-shift', {}).get('numericValue', 0) or 0,
                                'ttfb': audits.get('server-response-time', {}).get('numericValue', 0) or 0,
                                
                                # Dodatne metrike
                                'interactive': audits.get('interactive', {}).get('numericValue', 0) or 0,
                                'first_meaningful_paint': audits.get('first-meaningful-paint', {}).get('numericValue', 0) or 0,
                                'estimated_input_latency': audits.get('estimated-input-latency', {}).get('numericValue', 0) or 0,
                                'max_potential_fid': audits.get('max-potential-fid', {}).get('numericValue', 0) or 0,
                            }
        except Exception as e:
            print(f"⚠ Greška pri učitavanju {file_path.name}: {e}")
        
        return {}


def load_all_data() -> pd.DataFrame:
    """Učitava sve HTML fajlove i vraća DataFrame sa svim merenjima"""
    
    results = []
    total_files = 0
    processed_files = 0
    skipped_files = 0
    
    print("\n📂 Učitavanje podataka...\n")
    
    for page_folder, page_label in PAGE_LABELS.items():
        page_path = BASE_DIR / page_folder
        
        if not page_path.exists():
            print(f"⚠ Folder ne postoji: {page_path}")
            continue
        
        for app in ['pwa', 'spa']:
            app_path = page_path / app
            
            if not app_path.exists():
                continue
            
            html_files = sorted(app_path.glob("*.html"))
            total_files += len(html_files)
            
            print(f"📁 {page_folder}/{app}: {len(html_files)} fajlova")
            
            for idx, html_file in enumerate(html_files, 1):
                # Parse filename za metapodatke
                info = LighthouseParser.parse_filename(html_file.name)
                
                # Izvuci metrike
                metrics = LighthouseParser.extract_metrics(html_file)
                
                if metrics.get('lcp', 0) > 0:
                    # Kreiraj red sa svim podacima
                    row = {
                        # Metapodaci
                        'page': page_label,
                        'page_folder': page_folder,
                        'app': 'PWA' if app == 'pwa' else 'SPA',
                        'start': info['start'],
                        'network': info['network'],
                        'cpu_slowdown': info['cpu_slowdown'],
                        
                        # Redni broj merenja
                        'measurement_number': idx,
                        
                        # Originalni naziv fajla
                        'filename': html_file.name,
                        
                        # Sve metrike
                        **metrics
                    }
                    
                    results.append(row)
                    processed_files += 1
                else:
                    skipped_files += 1
                    print(f"   ⚠ Preskočen (LCP=0): {html_file.name}")
    
    print(f"\n📊 Statistika učitavanja:")
    print(f"   Ukupno fajlova: {total_files}")
    print(f"   Uspešno obrađeno: {processed_files}")
    print(f"   Preskočeno: {skipped_files}")
    
    return pd.DataFrame(results)


def save_to_csv(df: pd.DataFrame):
    """Čuva DataFrame u CSV fajl"""
    
    csv_path = OUTPUT_DIR / "all_measurements.csv"
    
    df.to_csv(csv_path, index=False, encoding='utf-8')
    
    print(f"\n✅ CSV sačuvan: {csv_path}")
    print(f"   Broj redova: {len(df)}")
    print(f"   Broj kolona: {len(df.columns)}")
    
    # Prikaži prvih nekoliko redova
    print("\n📋 Prvih 5 redova:")
    print(df.head().to_string())
    
    # Prikaži statistiku po kolonama
    print("\n📊 Distribucija po stranicama:")
    print(df['page'].value_counts().to_string())
    
    print("\n📊 Distribucija po aplikacijama:")
    print(df['app'].value_counts().to_string())
    
    print("\n📊 Distribucija po CPU slowdown:")
    print(df['cpu_slowdown'].value_counts().to_string())
    
    print("\n📊 Distribucija po mrežama:")
    print(df['network'].value_counts().to_string())
    
    print("\n📊 Distribucija po startu:")
    print(df['start'].value_counts().to_string())


def main():
    print("="*60)
    print("📊 LIGHTHOUSE CSV GENERATOR")
    print("="*60)
    
    # Učitaj sve podatke
    df = load_all_data()
    
    if df.empty:
        print("\n❌ Nema validnih podataka!")
        return
    
    # Sačuvaj u CSV
    save_to_csv(df)
    
    # Dodatna validacija
    expected_rows = 480  # 3 stranice × 2 app × 2 start × 2 mreže × 2 CPU × 10 ponavljanja
    
    print(f"\n{'='*60}")
    print(f"📊 VALIDACIJA:")
    print(f"   Očekivano redova: {expected_rows}")
    print(f"   Dobijeno redova: {len(df)}")
    
    if len(df) == expected_rows:
        print(f"   ✅ SAVRŠENO - Svi podaci su tu!")
    else:
        print(f"   ⚠ Razlika: {expected_rows - len(df)} redova nedostaje")
    
    print(f"{'='*60}")
    
    # Prikaži kolone
    print("\n📋 Kolone u CSV-u:")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i:2d}. {col}")


if __name__ == "__main__":
    main()