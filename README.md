Un simulatore interattivo in tempo reale di buchi neri relativistici, ispirato fedelmente alla fisica visiva di **Gargantua** nel film *Interstellar*. Sviluppato in **React**, **TypeScript** e ottimizzato per **HTML5 Canvas**, questo motore simula accuratamente gli effetti visivi estremi dettati dalla Relatività Generale di Einstein.

---

## 🌟 Caratteristiche Principali

- **Lente Gravitazionale (Gravitational Lensing):** Deflessione dinamica della luce di fondo (starfield) ed effetto "Einstein Ring" calcolati in tempo reale tramite approssimazione relativistica.
- **Doppler Beaming Relativistico (Doppler Boost & Redshift):** Asimmetria termica e luminosa realistica del disco di accrescimento dovuta alla velocità relativistica del plasma (più luminoso a sinistra in avvicinamento, debole e spostato verso il rosso cupo a destra in allontanamento).
- **Metriche di Spazio-Tempo (Schwarzschild vs. Kerr):** Supporto per buchi neri statici ed rotanti (Kerr Metric) con contrazione asimmetrica dell'orizzonte degli eventi e trascinamento dei sistemi di riferimento (Frame Dragging).
- **Rendering ad Alte Prestazioni:** Gestione di oltre 3000 particelle con sprite pre-renderizzati per un effetto fluido a 60fps, arricchito da sfocature cinematiche di tipo "Bloom".
- **Interattività Avanzata (Mouse & Touch):** Esplora il buco nero in 3D orbitando liberamente attorno al disco tramite trascinamento o tocco sullo schermo.
- **Esperienza Immersiva:** Pulsante integrato per la modalità a **Schermo Intero** cinetico, ideale per esposizioni o perdersi nel cosmo.

---

## 🛠️ Tecnologie Utilizzate

- **React 18** & **TypeScript** per la logica dell'interfaccia e la gestione degli stati fisici.
- **Tailwind CSS** per un'interfaccia di controllo (Lab Console) moderna ed elegante.
- **Motion (framer-motion)** per micro-animazioni fluide nei pannelli educativi.
- **HTML5 Canvas (2D Context)** con formule di proiezione relativistica 4D e Painter's Algorithm ottimizzato per la profondità (Z-sorting).

---

## 🚀 Come Avviare il Progetto in Locale

1. Clona il repository:
   ```bash
   git clone https://github.com/PajtimBajrami/blackhole-simulator.git
   cd nome-repo
Installa le dipendenze:
code
Bash
npm install
Avvia il server di sviluppo:
code
Bash
npm run dev
