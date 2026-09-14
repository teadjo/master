"""
📊 ANALIZA KORISNIČKOG UPITNIKA - PWA vs SPA
Tabela 15: Deskriptivna statistika
Tabela 16: Wilcoxon test za zajedničke dimenzije
Tabela 17: Distribucija preferencija
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from pathlib import Path
from scipy.stats import wilcoxon

# ============================================
# KONFIGURACIJA
# ============================================

INPUT_FILE = Path(r"D:\master\new_metrics\PWA vs SPA - 1. одговори из упитника.csv")
OUTPUT_DIR = Path(r"D:\master\new_metrics\questionnaire_analysis")
OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================
# UČITAVANJE PODATAKA
# ============================================

def load_survey_data():
    """Učitava CSV fajl sa odgovorima"""
    
    print("📂 Učitavanje podataka iz upitnika...")
    
    # Pokušaj sa različitim encoding-ima
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1250']:
        try:
            df = pd.read_csv(INPUT_FILE, encoding=encoding)
            print(f"✅ Učitano sa encoding: {encoding}")
            break
        except (UnicodeDecodeError, FileNotFoundError) as e:
            continue
    else:
        raise FileNotFoundError(f"Ne mogu da učitam fajl: {INPUT_FILE}")
    
    print(f"📊 Broj ispitanika: {len(df)}")
    print(f"📊 Broj kolona: {len(df.columns)}")
    
    # Prikaži kolone
    print("\n📋 Kolone u fajlu:")
    for i, col in enumerate(df.columns, 1):
        print(f"   {i}. {col[:80]}...")
    
    return df


def rename_columns(df):
    """Preimenuje kolone u kratke nazive"""

    column_mapping = {}
    
    for col in df.columns:
        col_lower = col.lower().strip()
        
        # Timestamp
        if 'временска' in col_lower or 'timestamp' in col_lower or 'vreme' in col_lower:
            column_mapping[col] = 'timestamp'
        
        # SPA pitanja (prvih 3)
        elif 'prelazak' in col_lower and 'brzo' in col_lower:
            # Proveri da li je prva ili druga pojava
            if 'spa_brzina' not in column_mapping.values():
                column_mapping[col] = 'spa_brzina'
            else:
                column_mapping[col] = 'pwa_brzina'
        
        elif 'stabilno' in col_lower and 'slabijoj' in col_lower:
            if 'spa_stabilnost' not in column_mapping.values():
                column_mapping[col] = 'spa_stabilnost'
            else:
                column_mapping[col] = 'pwa_stabilnost'
        
        elif 'internet' in col_lower and ('nije bio dostupan' in col_lower or 'nastaviti' in col_lower):
            if 'spa_offline' not in column_mapping.values():
                column_mapping[col] = 'spa_offline'
            else:
                column_mapping[col] = 'pwa_offline'
        
        elif 'akcije' in col_lower and 'ponovnog' in col_lower:
            column_mapping[col] = 'sinhronizacija'
        
        elif 'instalacija' in col_lower and 'jednostavna' in col_lower:
            column_mapping[col] = 'instalacija'
        
        elif 'preferiram' in col_lower or 'preferiram prvu' in col_lower:
            column_mapping[col] = 'preferencija'
    
    df_renamed = df.rename(columns=column_mapping)
    
    # Prikaži mapiranje
    print("\n📋 Mapiranje kolona:")
    for old, new in column_mapping.items():
        print(f"   {new}: {old[:60]}...")
    
    return df_renamed


# ============================================
# TABELA 15: DESKRIPTIVNA STATISTIKA
# ============================================

def create_table_15(df):
    """Kreira Tabelu 15 - Deskriptivna statistika"""
    
    print("\n" + "="*100)
    print("📊 TABELA 15: Deskriptivna statistika odgovora na upitnik")
    print("="*100)
    
    # Proveri dostupne kolone
    required_cols = ['spa_brzina', 'pwa_brzina', 'spa_stabilnost', 'pwa_stabilnost',
                     'spa_offline', 'pwa_offline']
    
    for col in required_cols:
        if col not in df.columns:
            print(f"⚠ Kolona nedostaje: {col}")
    
    # Definicija tvrdnji
    statements = []
    
    # Brzina
    if 'spa_brzina' in df.columns and 'pwa_brzina' in df.columns:
        statements.append({
            'Tvrdnja': 'Prelazak između stranica djelovao je brzo',
            'Verzija': 'SPA',
            'kolona': 'spa_brzina'
        })
        statements.append({
            'Tvrdnja': 'Prelazak između stranica djelovao je brzo',
            'Verzija': 'PWA',
            'kolona': 'pwa_brzina'
        })
    
    # Stabilnost
    if 'spa_stabilnost' in df.columns and 'pwa_stabilnost' in df.columns:
        statements.append({
            'Tvrdnja': 'Aplikacija je radila stabilno pri slabijoj mreži',
            'Verzija': 'SPA',
            'kolona': 'spa_stabilnost'
        })
        statements.append({
            'Tvrdnja': 'Aplikacija je radila stabilno pri slabijoj mreži',
            'Verzija': 'PWA',
            'kolona': 'pwa_stabilnost'
        })
    
    # Offline
    if 'spa_offline' in df.columns and 'pwa_offline' in df.columns:
        statements.append({
            'Tvrdnja': 'Mogao/la sam nastaviti korištenje bez interneta',
            'Verzija': 'SPA',
            'kolona': 'spa_offline'
        })
        statements.append({
            'Tvrdnja': 'Mogao/la sam nastaviti korištenje bez interneta',
            'Verzija': 'PWA',
            'kolona': 'pwa_offline'
        })
    
    # Sinhronizacija (samo PWA)
    if 'sinhronizacija' in df.columns:
        statements.append({
            'Tvrdnja': 'Korisnost odložene sinhronizacije akcija',
            'Verzija': 'PWA',
            'kolona': 'sinhronizacija'
        })
    
    # Instalacija (samo PWA)
    if 'instalacija' in df.columns:
        statements.append({
            'Tvrdnja': 'Jednostavnost instalacije',
            'Verzija': 'PWA',
            'kolona': 'instalacija'
        })
    
    # Izračunaj statistiku
    rows = []
    
    print(f"\n{'Tvrdnja':<55} {'Verzija':<8} {'M':>8} {'SD':>8}")
    print("-" * 82)
    
    for stmt in statements:
        col = stmt['kolona']
        if col not in df.columns:
            continue
        
        data = df[col].dropna()
        mean = data.mean()
        std = data.std(ddof=1)
        
        row = {
            'Tvrdnja': stmt['Tvrdnja'],
            'Verzija': stmt['Verzija'],
            'M': round(mean, 2),
            'SD': round(std, 2),
        }
        rows.append(row)
        
        print(f"{stmt['Tvrdnja']:<55} {stmt['Verzija']:<8} {mean:>8.2f} {std:>8.2f}")
    
    # Kreiraj DataFrame
    table_15 = pd.DataFrame(rows)
    
    # Formatiraj za CSV (zarez kao decimalni separator)
    table_15_csv = table_15.copy()
    table_15_csv['M'] = table_15_csv['M'].apply(lambda x: f"{x:.2f}".replace('.', ','))
    table_15_csv['SD'] = table_15_csv['SD'].apply(lambda x: f"{x:.2f}".replace('.', ','))
    
    csv_path = OUTPUT_DIR / "tabela_15_deskriptivna.csv"
    table_15_csv.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ Sačuvano: {csv_path}")
    
   
    return table_15


# ============================================
# TABELA 16: WILCOXON TEST
# ============================================

def create_table_16(df):
    """Kreira Tabelu 16 - Wilcoxon test za zajedničke dimenzije"""
    
    print("\n" + "="*110)
    print("📊 TABELA 16: Rezultati Wilcoxon testa za tri zajedničke dimenzije")
    print("="*110)
    
    # Definicija dimenzija
    dimensions = [
        {
            'name': 'Brzina prelaska između stranica',
            'spa_col': 'spa_brzina',
            'pwa_col': 'pwa_brzina',
        },
        {
            'name': 'Stabilnost pri slabijoj mreži',
            'spa_col': 'spa_stabilnost',
            'pwa_col': 'pwa_stabilnost',
        },
        {
            'name': 'Rad bez internet veze',
            'spa_col': 'spa_offline',
            'pwa_col': 'pwa_offline',
        },
    ]
    
    rows = []
    
    print(f"\n{'Dimenzija':<38} {'M (SPA)':>10} {'M (PWA)':>10} {'p (Wilcoxon)':>15} {'Tumačenje'}")
    print("-" * 120)
    
    for dim in dimensions:
        spa_col = dim['spa_col']
        pwa_col = dim['pwa_col']
        
        if spa_col not in df.columns or pwa_col not in df.columns:
            print(f"⚠ Preskočeno (nedostaju kolone): {dim['name']}")
            continue
        
        # Ukloni redove sa NaN
        valid_data = df[[spa_col, pwa_col]].dropna()
        spa_values = valid_data[spa_col].values
        pwa_values = valid_data[pwa_col].values
        
        if len(spa_values) < 5:
            print(f"⚠ Previše NaN vrednosti za: {dim['name']}")
            continue
        
        # Izračunaj srednje vrednosti
        spa_mean = np.mean(spa_values)
        pwa_mean = np.mean(pwa_values)
        
        # Wilcoxon test (paired)
        try:
            stat, p_value = wilcoxon(spa_values, pwa_values)
        except ValueError as e:
            # Ako su sve razlike nula
            p_value = 1.0
        
        # Tumačenje
        if p_value < 0.05:
            if pwa_mean > spa_mean:
                interpretation = "Statistički značajna prednost PWA"
            else:
                interpretation = "Statistički značajna prednost SPA"
        else:
            interpretation = "Nema statistički značajne razlike"
        
        row = {
            'Dimenzija': dim['name'],
            'M (SPA)': round(spa_mean, 2),
            'M (PWA)': round(pwa_mean, 2),
            'p (Wilcoxon)': p_value,
            'Tumačenje': interpretation,
        }
        rows.append(row)
        
        # Formatiraj p-vrednost
        if p_value < 0.00001:
            p_str = f"<0,00001"
        elif p_value < 0.001:
            p_str = f"{p_value:.6f}".replace('.', ',')
        else:
            p_str = f"{p_value:.3f}".replace('.', ',')
        
        print(f"{dim['name']:<38} {spa_mean:>10.2f} {pwa_mean:>10.2f} {p_str:>15} {interpretation}")
    
    # Kreiraj DataFrame
    table_16 = pd.DataFrame(rows)
    
    # Sačuvaj CSV sa formatiranim vrednostima
    table_16_csv = table_16.copy()
    table_16_csv['M (SPA)'] = table_16_csv['M (SPA)'].apply(lambda x: f"{x:.2f}".replace('.', ','))
    table_16_csv['M (PWA)'] = table_16_csv['M (PWA)'].apply(lambda x: f"{x:.2f}".replace('.', ','))
    table_16_csv['p (Wilcoxon)'] = table_16_csv['p (Wilcoxon)'].apply(
        lambda p: f"{p:.6f}".replace('.', ',') if p < 0.001 else f"{p:.3f}".replace('.', ',')
    )
    
    csv_path = OUTPUT_DIR / "tabela_16_wilcoxon.csv"
    table_16_csv.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ Sačuvano: {csv_path}")
    

    
    return table_16


# ============================================
# TABELA 17: DISTRIBUCIJA PREFERENCIJA
# ============================================

def create_table_17(df):
    """Kreira Tabelu 17 - Distribucija preferencija"""
    
    print("\n" + "="*100)
    print("📊 TABELA 17: Distribucija odgovora na tvrdnju o preferenciji SPA verzije")
    print("="*100)
    
    if 'preferencija' not in df.columns:
        print("❌ Kolona 'preferencija' nije pronađena!")
        return None
    
    pref_data = df['preferencija'].dropna()
    total = len(pref_data)
    
    print(f"\n📊 Ukupno odgovora: {total}")
    
    # Definicija kategorija
    categories = [
        (1, 'Uopšte se ne slažem', 'Jasna preferencija PWA'),
        (2, 'Ne slažem se', 'Preferencija PWA'),
        (3, 'Neutralno', 'Nema izražene preferencije'),
        (4, 'Slažem se', 'Preferencija SPA'),
        (5, 'Potpuno se slažem', 'Jasna preferencija SPA'),
    ]
    
    rows = []
    
    print(f"\n{'Ocjena':<25} {'Tumačenje':<35} {'Broj':>8} {'Procenat':>12}")
    
    for rating, label, interpretation in categories:
        count = (pref_data == rating).sum()
        percent = count / total * 100 if total > 0 else 0
        
        row = {
            'Ocjena slaganja': f"{rating} - {label}",
            'Tumačenje': interpretation,
            'Broj ispitanika': count,
            'Procenat': f"{percent:.1f}%",
        }
        rows.append(row)
        
        print(f"{rating} - {label:<20} {interpretation:<35} {count:>8} {percent:>11.1f}%")
    
    # Sumarni red
    print(f"{'UKUPNO':<62} {total:>8} {100.0:>11.1f}%")
    
    # Kreiraj DataFrame
    table_17 = pd.DataFrame(rows)
    
    # Sačuvaj CSV
    csv_path = OUTPUT_DIR / "tabela_17_preferencije.csv"
    table_17.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ Sačuvano: {csv_path}")

    return table_17


def main():
    # Učitaj podatke
    df_raw = load_survey_data()
    
    # Preimenuj kolone
    df = rename_columns(df_raw)
    
    
    # Kreiraj tabele
    table_15 = create_table_15(df)
    table_16 = create_table_16(df)
    table_17 = create_table_17(df)
    


if __name__ == "__main__":
    main()