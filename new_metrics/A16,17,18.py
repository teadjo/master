"""
WILCOXON SIGNED-RANK TEST - Detaljni proračun
Tabela A.8: Brzina prelaska između stranica
Tabela A.9: Stabilnost pri slaboj mreži
Tabela A.10: Rad bez internet veze
"""

import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from pathlib import Path
from scipy.stats import wilcoxon, norm

# ============================================
# KONFIGURACIJA
# ============================================

INPUT_FILE = Path(r"D:\master\new_metrics\PWA vs SPA - 1. одговори из упитника.csv")
OUTPUT_DIR = Path(r"D:\master\new_metrics\wilcoxon_detailed")
OUTPUT_DIR.mkdir(exist_ok=True)


# ============================================
# UČITAVANJE PODATAKA
# ============================================

def load_survey_data():
    """Učitava CSV fajl sa odgovorima"""
    
    print("📂 Učitavanje podataka iz upitnika...")
    
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1250']:
        try:
            df = pd.read_csv(INPUT_FILE, encoding=encoding)
            print(f"✅ Učitano sa encoding: {encoding}")
            break
        except (UnicodeDecodeError, FileNotFoundError):
            continue
    else:
        raise FileNotFoundError(f"Ne mogu da učitam fajl: {INPUT_FILE}")
    
    return df


def extract_pairs(df):
    """Izvlači parove SPA/PWA za tri dimenzije"""
    
    # Kolone (indeksi)
    # 0: timestamp
    # 1-3: SPA (brzina, stabilnost, offline)
    # 4-6: PWA (brzina, stabilnost, offline)
    # 7: sinhronizacija
    # 8: instalacija
    # 9: preferencija
    
    cols = df.columns.tolist()
    
    pairs = {
        'brzina': {
            'name': 'Brzina prelaska između stranica',
            'spa': df.iloc[:, 1].values,
            'pwa': df.iloc[:, 4].values,
        },
        'stabilnost': {
            'name': 'Stabilnost pri slaboj mreži',
            'spa': df.iloc[:, 2].values,
            'pwa': df.iloc[:, 5].values,
        },
        'offline': {
            'name': 'Rad bez internet veze',
            'spa': df.iloc[:, 3].values,
            'pwa': df.iloc[:, 6].values,
        },
    }
    
    return pairs


# ============================================
# WILCOXON SIGNED-RANK PRORAČUN
# ============================================

def calculate_wilcoxon_detailed(spa_values, pwa_values):
    """
    Detaljni Wilcoxon signed-rank proračun sa tabelom
    Vraća: (tabela_df, statistike_dict)
    """
    
    n = len(spa_values)
    
    # Korak 1: Izračunaj razlike
    differences = pwa_values - spa_values
    
    # Korak 2: Apsolutne vrednosti
    abs_diff = np.abs(differences)
    
    # Korak 3: Ukloni nulte razlike za rangiranje
    nonzero_mask = abs_diff > 0
    nonzero_abs = abs_diff[nonzero_mask]
    n_nonzero = len(nonzero_abs)
    
    # Korak 4: Rangiraj apsolutne vrednosti (average rank za ties)
    if n_nonzero > 0:
        # scipy rankdata sa metodom 'average' za ties
        from scipy.stats import rankdata
        ranks_nonzero = rankdata(nonzero_abs, method='average')
    else:
        ranks_nonzero = np.array([])
    
    # Korak 5: Mapiraj rangove nazad na sve ispitanike
    ranks = np.zeros(n)
    ranks[nonzero_mask] = ranks_nonzero
    
    # Korak 6: Označeni rangovi (signed ranks)
    signed_ranks = np.sign(differences) * ranks
    signed_ranks[~nonzero_mask] = 0
    
    # Korak 7: Statistike
    W_plus = np.sum(signed_ranks[signed_ranks > 0])   # Suma pozitivnih rangova
    W_minus = np.abs(np.sum(signed_ranks[signed_ranks < 0]))  # Suma negativnih rangova
    W = min(W_plus, W_minus)  # Test statistika
    
    # Broj pozitivnih i negativnih
    n_positive = np.sum(differences > 0)
    n_negative = np.sum(differences < 0)
    n_zero = np.sum(differences == 0)
    
    # Korak 8: p-vrednost
    # Koristimo scipy wilcoxon za tačnu p-vrednost
    if n_nonzero > 0:
        try:
            stat_scipy, p_value = wilcoxon(pwa_values, spa_values, 
                                           alternative='two-sided',
                                           zero_method='wilcox')
        except ValueError:
            p_value = 1.0
            stat_scipy = 0
    else:
        p_value = 1.0
        stat_scipy = 0
    
    # Korak 9: Kreiraj tabelu
    table_rows = []
    for i in range(n):
        row = {
            'Isp.': i + 1,
            'SPA': int(spa_values[i]),
            'PWA': int(pwa_values[i]),
            'dᵢ': f"{differences[i]:+d}" if differences[i] != 0 else "0",
            '|dᵢ|': int(abs_diff[i]),
            'Rang': f"{ranks[i]:.1f}".replace('.0', '') if ranks[i] > 0 else '-',
            'Označeni rang': (f"{signed_ranks[i]:+.1f}".replace('.0', '+').replace('+-', '-') 
                             if signed_ranks[i] != 0 else '-'),
        }
        table_rows.append(row)
    
    table_df = pd.DataFrame(table_rows)
    
    # Statistike
    stats = {
        'n': n,
        'n_nonzero': n_nonzero,
        'n_positive': n_positive,
        'n_negative': n_negative,
        'n_zero': n_zero,
        'W_plus': W_plus,
        'W_minus': W_minus,
        'W': W,
        'p_value': p_value,
    }
    
    return table_df, stats


# ============================================
# FORMATIRANJE RANGOVA
# ============================================

def format_rank(rank):
    """Formatira rang - ceo broj ako je ceo, inače .5"""
    if rank == 0:
        return '-'
    if rank == int(rank):
        return str(int(rank))
    return f"{rank:.1f}"


def format_signed_rank(signed_rank):
    """Formatira označeni rang"""
    if signed_rank == 0:
        return '-'
    if signed_rank == int(signed_rank):
        return f"{int(signed_rank):+d}"
    return f"{signed_rank:+.1f}"


# ============================================
# GENERISANJE TABELE
# ============================================

def generate_wilcoxon_table(df, dimension_key, pairs, table_label):
    """Generiše tabelu za jednu dimenziju"""
    
    pair = pairs[dimension_key]
    spa_values = pair['spa']
    pwa_values = pair['pwa']
    name = pair['name']
    
    # Ukloni NaN
    valid_mask = ~(np.isnan(spa_values) | np.isnan(pwa_values))
    spa_values = spa_values[valid_mask].astype(int)
    pwa_values = pwa_values[valid_mask].astype(int)
    
    # Izračunaj Wilcoxon
    table_df, stats = calculate_wilcoxon_detailed(spa_values, pwa_values)
    
    # Ispis
    print(f"\n{'='*100}")
    print(f"📊 {table_label}: {name}")
    print(f"   (n nenultih parova = {stats['n_nonzero']}; "
          f"{stats['n_positive']} pozitivnih, {stats['n_negative']} negativnih, "
          f"{stats['n_zero']} jednakih)")
    print(f"{'='*100}")
    
    # Ispis tabele
    print(f"\n{'Isp.':<6} {'SPA':<6} {'PWA':<6} {'dᵢ':<8} {'|dᵢ|':<8} {'Rang':<8} {'Označeni rang':<15}")
    print("-" * 60)
    
    for _, row in table_df.iterrows():
        # Formatiraj dᵢ lepo
        di = row['dᵢ']
        if di.startswith('+'):
            di_str = di
        elif di == '0':
            di_str = '0'
        else:
            di_str = di.replace('-', '−')  # Unicode minus
        
        rank_str = row['Rang']
        signed_str = row['Označeni rang'].replace('-', '−') if row['Označeni rang'] != '-' else '-'
        
        print(f"{row['Isp.']:<6} {row['SPA']:<6} {row['PWA']:<6} "
              f"{di_str:<8} {row['|dᵢ|']:<8} {rank_str:<8} {signed_str:<15}")
    
    # Ispis statistika
    print(f"\n📊 Statistike:")
    print(f"   Broj ispitanika (n): {stats['n']}")
    print(f"   Nenulti parovi: {stats['n_nonzero']}")
    print(f"   Pozitivne razlike (PWA > SPA): {stats['n_positive']}")
    print(f"   Negativne razlike (PWA < SPA): {stats['n_negative']}")
    print(f"   Nulte razlike: {stats['n_zero']}")
    print(f"   Suma pozitivnih rangova (W+): {stats['W_plus']}")
    print(f"   Suma negativnih rangova (W−): {stats['W_minus']}")
    print(f"   Test statistika (W): {stats['W']}")
    print(f"   p-vrednost (two-sided): {stats['p_value']:.6f}")
    
    # Sačuvaj CSV
    csv_path = OUTPUT_DIR / f"tabela_{table_label.lower().replace('.', '_').replace(' ', '_')}.csv"
    table_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ CSV sačuvan: {csv_path}")
    
    return table_df, stats


# ============================================
# LATEX ISPIS
# ============================================

def print_latex_table(table_df, stats, table_label, dimension_name):
    """Ispisuje LaTeX tabelu"""
    
    print(f"\n--- {table_label} (LaTeX) ---\n")
    print("\\begin{tabular}{ccccccc}")
    print("\\toprule")
    print("Isp. & SPA & PWA & $d_i$ & $|d_i|$ & Rang & Označeni rang \\\\")
    print("\\midrule")
    
    for _, row in table_df.iterrows():
        # Formatiraj vrednosti za LaTeX
        di = row['dᵢ'].replace('−', '$-$').replace('+', '$+$')
        if di == '0':
            di = '0'
        
        rank_str = row['Rang']
        signed_str = row['Označeni rang'].replace('−', '$-$')
        if signed_str == '-':
            signed_str = '--'
        
        print(f"{row['Isp.']} & {row['SPA']} & {row['PWA']} & "
              f"{di} & {row['|dᵢ|']} & {rank_str} & {signed_str} \\\\")
    
    print("\\bottomrule")
    print("\\end{tabular}")


def main():
    # Učitaj podatke
    df_raw = load_survey_data()
    print(f"📊 Broj ispitanika: {len(df_raw)}")
    
    # Izvuci parove
    pairs = extract_pairs(df_raw)
    
    # Generiši tabele za tri dimenzije
    all_stats = {}
    
    # Tabela A.8: Brzina
    table_a8, stats_a8 = generate_wilcoxon_table(
        df_raw, 'brzina', pairs, 'Tabela A.8'
    )
    stats_a8['name'] = pairs['brzina']['name']
    all_stats['brzina'] = stats_a8
    
    # Tabela A.9: Stabilnost
    table_a9, stats_a9 = generate_wilcoxon_table(
        df_raw, 'stabilnost', pairs, 'Tabela A.9'
    )
    stats_a9['name'] = pairs['stabilnost']['name']
    all_stats['stabilnost'] = stats_a9
    
    # Tabela A.10: Offline
    table_a10, stats_a10 = generate_wilcoxon_table(
        df_raw, 'offline', pairs, 'Tabela A.10'
    )
    stats_a10['name'] = pairs['offline']['name']
    all_stats['offline'] = stats_a10
    
if __name__ == "__main__":
    main()