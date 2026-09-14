"""
ANALIZA UPITNIKA - SPA vs PWA
Bar chart prosečnih ocena po dimenzijama
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import warnings
warnings.filterwarnings('ignore')

COLORS = {
    'pwa': '#FFB3BA',          
    'pwa_dark': '#E88A95',     
    'spa': '#BAE1FF',         
    'spa_dark': '#8AB8E8',    
    'background': '#FAFAFA',
    'grid': '#E8E8E8',
    'text': '#4A4A4A',
    'title': '#333333',
    'highlight': '#FFD700',
}

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans', 'Arial', 'Helvetica'],
    'font.size': 11,
    'axes.facecolor': COLORS['background'],
    'figure.facecolor': 'white',
    'axes.grid': True,
    'grid.alpha': 0.3,
    'grid.color': COLORS['grid'],
    'axes.edgecolor': '#E0E0E0',
    'axes.linewidth': 1.0,
    'xtick.color': COLORS['text'],
    'ytick.color': COLORS['text'],
})

# ============================================================
# PODACI UPITNIKA
# ============================================================
data = {
    'timestamp': [
        '06.06.2026. 21:28:59', '06.06.2026. 21:46:55', '07.06.2026. 20:03:57',
        '07.06.2026. 20:05:17', '07.06.2026. 20:06:39', '07.06.2026. 20:07:26',
        '07.06.2026. 20:11:36', '07.06.2026. 20:19:02', '07.06.2026. 20:30:24',
        '07.06.2026. 21:00:19', '07.06.2026. 21:01:06', '07.06.2026. 21:09:42',
        '07.06.2026. 21:11:15', '07.06.2026. 21:35:31', '08.06.2026. 10:42:01',
        '08.06.2026. 10:42:39', '08.06.2026. 10:43:25', '08.06.2026. 10:44:22',
        '08.06.2026. 12:47:56', '08.06.2026. 13:25:33'
    ],
    # SPA ocene (prve 3 kolone)
    'SPA_Brzina': [5, 2, 5, 4, 4, 5, 4, 4, 4, 4, 4, 4, 5, 4, 4, 5, 3, 2, 4, 5],
    'SPA_Stabilnost': [5, 1, 2, 2, 4, 5, 2, 2, 2, 2, 2, 2, 3, 4, 2, 4, 3, 3, 2, 3],
    'SPA_Offline': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    # PWA ocene (sledeće 3 kolone)
    'PWA_Brzina': [5, 5, 4, 5, 4, 4, 5, 4, 4, 5, 5, 5, 4, 4, 4, 5, 4, 3, 5, 4],
    'PWA_Stabilnost': [5, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3, 4, 3, 3, 4, 4],
    'PWA_Offline': [5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    # Dodatna pitanja
    'Korisnost_offline': [5, 5, 4, 5, 4, 3, 5, 5, 5, 5, 5, 5, 4, 3, 5, 5, 4, 5, 5, 4],
    'Jednostavnost_instalacije': [5, 5, 4, 5, 4, 4, 5, 5, 5, 5, 5, 5, 4, 4, 5, 4, 5, 5, 5, 4],
    'Preferira_prvu_aplikaciju': [None, None, 2, 1, 1, 2, 1, 2, 2, 1, 1, 1, 2, 3, 2, 3, 2, 2, 1, 2]
}

df = pd.DataFrame(data)

# ============================================================
# ANALIZA
# ============================================================

def calculate_statistics(df):
    """Izračunaj proseke i standardne devijacije"""
    
    dimensions = [
        ('Brzina prelaska\nizmeđu stranica', 'SPA_Brzina', 'PWA_Brzina'),
        ('Stabilnost pri\nslabijoj vezi', 'SPA_Stabilnost', 'PWA_Stabilnost'),
        ('Mogućnost rada\nbez interneta (Offline)', 'SPA_Offline', 'PWA_Offline'),
    ]
    
    results = []
    for label, spa_col, pwa_col in dimensions:
        spa_mean = df[spa_col].mean()
        spa_std = df[spa_col].std()
        pwa_mean = df[pwa_col].mean()
        pwa_std = df[pwa_col].std()
        
        results.append({
            'dimenzija': label,
            'spa_mean': spa_mean,
            'spa_std': spa_std,
            'pwa_mean': pwa_mean,
            'pwa_std': pwa_std,
        })
    
    return results

# ============================================================
# GRAFIK 5: PREFERENCIJA KORISNIKA
# ============================================================

def create_preference_chart():
    """Kreira pie chart za preferenciju korisnika"""
    
    print("📊 Kreiranje preference charta...")
    
    # Analiziraj preferencije (1 = preferira prvu, 2 = drugu, 3 = nema preferencu)
    if 'Preferira_prvu_aplikaciju' in df.columns:
        pref_data = df['Preferira_prvu_aplikaciju'].dropna()
        
        if len(pref_data) > 0:
            # Mapiraj vrednosti
            pref_labels = []
            for val in pref_data:
                if val == 1:
                    pref_labels.append('Preferira PWA')
                elif val == 2:
                    pref_labels.append('Preferira PWA')
                elif val == 4:
                    pref_labels.append('Preferira SPA')
                elif val == 5:
                    pref_labels.append('Preferira SPA')
                else:
                    pref_labels.append('Nema preferencu')
            
            pref_counts = pd.Series(pref_labels).value_counts()
            
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
            
            # Pie chart
            colors_pie = [COLORS['pwa'], COLORS['spa'], '#E0E0E0']
            wedges, texts, autotexts = ax1.pie(
                pref_counts.values,
                labels=pref_counts.index,
                colors=colors_pie[:len(pref_counts)],
                autopct='%1.1f%%',
                startangle=90,
                textprops={'fontsize': 12, 'fontweight': 'bold'},
                explode=[0.05] * len(pref_counts)
            )
            
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontsize(13)
                autotext.set_fontweight('bold')
            
            ax1.set_title('Preferencija korisnika\n(SPA vs PWA)', fontsize=14,
                         fontweight='bold', color=COLORS['title'])
            
            # Bar chart preferencije
            x = np.arange(len(pref_counts))
            bars = ax2.bar(x, pref_counts.values, 0.6,
                          color=colors_pie[:len(pref_counts)],
                          edgecolor='white', linewidth=2)
            
            for bar, val in zip(bars, pref_counts.values):
                ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.2,
                        f'{val}', ha='center', va='bottom', fontsize=13,
                        fontweight='bold')
            
            ax2.set_xticks(x)
            ax2.set_xticklabels(pref_counts.index, fontsize=11)
            ax2.set_ylabel('Broj korisnika', fontsize=12, fontweight='bold')
            ax2.set_title('Broj korisnika po preferenciji', fontsize=14,
                         fontweight='bold', color=COLORS['title'])
            ax2.grid(True, alpha=0.2)
            ax2.spines['top'].set_visible(False)
            ax2.spines['right'].set_visible(False)
            
            plt.tight_layout()
            plt.savefig('upitnik_05_preferencija.png', dpi=200,
                        bbox_inches='tight', facecolor='white')
            plt.close()
            
            print("   ✓ Preference chart završen")
        else:
            print("   ⚠ Nema podataka o preferencijama")
    else:
        print("   ⚠ Kolona 'Preferira_prvu_aplikaciju' ne postoji")

def main():

    create_preference_chart()

if __name__ == "__main__":
    main()