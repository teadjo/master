# Poređenje SPA i PWA pristupa – eksperimentalno istraživanje

Ovaj repozitorijum sadrži izvorni kod, podatke i prateće skripte korišćene u izradi master rada:

**„Progresivna web aplikacija protiv tradicionalnog SPA: eksperimentalna ocjena performansi i korisničkog iskustva“**

Cilj projekta je eksperimentalno poređenje tradicionalne SPA (Single Page Application) i PWA (Progressive Web Application) verzije iste veb aplikacije, uz očuvanje funkcionalnosti i sadržaja aplikacije. Poređenjem se ispituju tehničke performanse, ponašanje aplikacije u različitim mrežnim uslovima i pri različitom opterećenju procesora, kao i korisničko iskustvo.

---

## 1. Opis projekta

Za potrebe istraživanja razvijene su dvije verzije iste aplikacije:

- **SPA verzija** – tradicionalna jednostranična web aplikacija;
- **PWA verzija** – verzija iste aplikacije proširena mogućnostima progresivnih web aplikacija.

Obje verzije koriste isti serverski dio sistema i istu bazu podataka. Na taj način je omogućeno da se razlike u rezultatima prvenstveno posmatraju u kontekstu karakteristika SPA i PWA pristupa.

PWA verzija uključuje mogućnosti kao što su:

- servisni radnik;
- keširanje resursa;
- rad u uslovima bez mrežne veze u određenoj mjeri;
- Background Sync;
- push notifikacije;
- mogućnost instalacije aplikacije;
- prilagođavanje mobilnim uređajima.

---

## 2. Struktura repozitorijuma

Glavni direktorijumi projekta su:
```
master/
│
├── backend/
│
├── frontend_pwa/
│   └── tests/
│       └── lighthouse/
│           └── flow.spec.js
│
├── frontend_spa/
│   └── tests/
│       └── lighthouse/
│           └── flow.spec.js
│
└── new_metrics/
```
**backend/**

Sadrži serverski dio aplikacije.

Serverski dio je zajednički za SPA i PWA verziju aplikacije i obezbjeđuje komunikaciju sa bazom podataka i potrebne API krajnje tačke.

U okviru ovog direktorijuma nalaze se:

- serverska logika aplikacije;
- API rute;
- modeli i pristup podacima;
- obrada zahtjeva;
- rad sa bazom podataka;
- funkcionalnosti potrebne za rad obje klijentske verzije.

**frontend_spa/**

Sadrži tradicionalnu SPA verziju aplikacije.

Aplikacija je razvijena pomoću React biblioteke i predstavlja osnovu za poređenje sa PWA verzijom. U okviru direktorijuma nalazi se i tests direktorijum sa skriptama za automatizovano testiranje i mjerenje performansi pomoću Puppeteer-a i Lighthouse-a.

**frontend_pwa/**

Sadrži PWA verziju iste aplikacije.

Osnovna funkcionalnost i izgled aplikacije odgovaraju SPA verziji, dok su dodatno implementirane funkcionalnosti karakteristične za PWA pristup.

U okviru direktorijuma nalazi se i tests direktorijum. Skripta tests/lighthouse/flow.spec.js koristi Puppeteer za automatizaciju procesa mjerenja i Lighthouse za prikupljanje rezultata performansi u definisanim eksperimentalnim scenarijima.

U zavisnosti od funkcionalnosti, ovaj direktorijum obuhvata:

- konfiguraciju PWA aplikacije;
- web manifest;
- servisnog radnika;
- strategije keširanja;
- Background Sync;
- push notifikacije;
- registraciju servisnog radnika;
- obavještenje o mogućnosti instalacije aplikacije;
- indikator dostupnosti mreže.

PWA verzija koristi Workbox za dio funkcionalnosti servisnog radnika i upravljanje keširanjem.

**new_metrics/**

Direktorijum new_metrics sadrži podatke i skripte korišćene za obradu eksperimentalnih rezultata i izradu tabela i grafičkih prikaza predstavljenih u master radu.

Njegova struktura je:
```
new_metrics/
│
├── data/
├── data_artwork/
├── data_competition/
│
├── A16,17,18.py
├── slika10.py
├── slika15.py
├── slika16.py
├── slike11,12,13.py
├── summarize.py
│
├── tabela8.py
├── tabelaA3.py
├── tabele9,10,11,12.py
├── tabele13,14.py
├── tabele15,16,17.py
├── tabeleA1abc.py
│
└── PWA vs SPA - 1. одговори из упитника.csv
```
**data/**

Sadrži podatke dobijene mjerenjem performansi aplikacija.

Podaci obuhvataju rezultate mjerenja za SPA i PWA verziju u različitim eksperimentalnim uslovima.

**data_artwork/**

Sadrži podatke i rezultate mjerenja koji se odnose na stranicu pojedinačnog umjetničkog djela.

**data_competition/**

Sadrži podatke i rezultate mjerenja koji se odnose na stranicu takmičenja.

**PWA vs SPA - 1. одговори из упитника.csv**

Sadrži odgovore ispitanika prikupljene tokom evaluacije korisničkog iskustva SPA i PWA verzije aplikacije.

## 3. Skripte za obradu podataka

Skripte u direktorijumu new_metrics korišćene su za obradu rezultata i automatsko generisanje tabela i grafikona koji se pojavljuju u radu.

- summarize.py - Koristi se za sažimanje rezultata mjerenja i izračunavanje zbirnih statističkih pokazatelja.
- tabela8.py - Služi za generisanje podataka za tabelu 8 u master radu. 
- tabele9,10,11,12.py - Sadrži obradu i generisanje podataka za tabele 9–12.
- tabele13,14.py - Služi za generisanje podataka za tabele 13 i 14.
- tabele15,16,17.py - Služi za generisanje podataka za tabele 15–17.
- A16,17,18.py - Sadrži obradu podataka korišćenih za tabele 16–18 u okviru priloga.
- tabeleA1abc.py - Služi za obradu i generisanje podataka prikazanih u tabelama A1a, A1b i A1c.
- tabelaA3.py - Služi za generisanje podataka za tabelu A3.
- slika10.py - Sadrži obradu podataka i generisanje grafičkog prikaza korišćenog kao slika 10.
- slike11,12,13.py - Služi za generisanje grafičkih prikaza 11, 12 i 13.
- slika15.py - Sadrži obradu podataka za grafički prikaz 15.
- slika16.py - Sadrži obradu podataka za grafički prikaz 16.

## 4. Eksperimentalno mjerenje

Performanse SPA i PWA verzije mjerene su pomoću Lighthouse alata, uz automatizaciju pomoću Puppeteer-a.

Za svaku testiranu stranicu korišćeno je osam scenarija:

Mreža	  CPU	Početak
Fast 4G	  1×	hladan / topao
Fast 4G	  4×	hladan / topao
Slow 4G	  1×	hladan / topao
Slow 4G	  4×	hladan / topao

Mjerenja su sprovedena za SPA i PWA verziju aplikacije, a dobijeni rezultati korišćeni su za poređenje tehničkih performansi.

Posmatrane metrike uključuju:
- Performance skor;
- First Contentful Paint (FCP);
- Largest Contentful Paint (LCP);
- Speed Index;
- Total Blocking Time (TBT);
- Cumulative Layout Shift (CLS);
- Time to First Byte (TTFB).
## 5. Evaluacija korisničkog iskustva

Pored tehničkih mjerenja, sprovedena je evaluacija korisničkog iskustva pomoću upitnika sa Likertovom skalom od 1 do 5.

Upitnik je obuhvatio poređenje SPA i PWA verzije u pogledu:

- brzine prelaska između stranica;
- stabilnosti pri slabijoj mrežnoj vezi;
- mogućnosti nastavka korišćenja bez internet veze;
- korisnosti funkcionalnosti Background Sync;
- jednostavnosti instalacije PWA aplikacije;
- konačne preferencije ispitanika.

Rezultati upitnika nalaze se u CSV datoteci u direktorijumu new_metrics.

## 6. Obrada i prikaz rezultata

Rezultati mjerenja i odgovori iz upitnika obrađeni su pomoću Python skripti.

Na osnovu dobijenih podataka izračunati su odgovarajući deskriptivni i inferencijalni statistički pokazatelji, nakon čega su izrađene tabele i grafički prikazi korišćeni u master radu.

Ovakav način organizacije omogućava da se rezultati rada mogu ponovo generisati iz dostupnih podataka i pratećih skripti.

## 7. Tehnologije

Projekat koristi sljedeće tehnologije i alate:

- React
- Vite
- Node.js
- Express
- PostgreSQL
- Axios
- React Router
- Workbox
- Service Worker
- PWA manifest
- Puppeteer
- Lighthouse
- Python
- Git

## 8. Pokretanje projekta

Za pokretanje projekta potrebno je posebno pokrenuti serverski dio i odgovarajuću klijentsku verziju aplikacije.

Serverski dio
- cd backend
- npm install
- npm start

SPA verzija
- cd frontend_spa
- npm install
- npm run dev

PWA verzija
- cd frontend_pwa
- npm install
- npm run dev

Za pravilno povezivanje aplikacija sa serverskim dijelom potrebno je podesiti odgovarajuće varijable okruženja.

## 9. Napomena o rezultatima

Ovaj repozitorijum predstavlja prateći materijal master rada i omogućava uvid u implementaciju obje verzije aplikacije, eksperimentalne podatke i postupke korišćene za obradu rezultata.

Rezultati prikazani u master radu dobijeni su u unaprijed definisanom eksperimentalnom okruženju i odnose se na testiranu aplikaciju i opisane scenarije mjerenja.