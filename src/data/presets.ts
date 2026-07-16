import { Preset } from '../types';

export const PRESETS: Preset[] = [
  {
    id: 'gargantua',
    name: 'Gargantua (Cinema / Interstellar)',
    description: 'Ispirato al film Interstellar. Buco nero supermassiccio di Kerr rotante al limite, con un disco di accrescimento sottile, inclinato ed estremamente brillante, che mostra la classica doppia curvatura orbitale.',
    mass: 100000000, // 100 milioni di masse solari
    spin: 0.99,
    distance: 4.5,
    inclination: 85, // quasi di taglio
    diskRadiusMax: 22,
    diskBrightness: 0.85,
    dopplerEffect: true
  },
  {
    id: 'sgr-a',
    name: 'Sagittarius A* (Via Lattea)',
    description: 'Il buco nero supermassiccio al centro della nostra galassia. Massa moderata rispetto ad altri colossi, circondato da polveri e gas caldi osservati dal telescopio Event Horizon.',
    mass: 4100000, // 4.1 milioni di masse solari
    spin: 0.45,
    distance: 2.2,
    inclination: 50,
    diskRadiusMax: 16,
    diskBrightness: 0.65,
    dopplerEffect: true
  },
  {
    id: 'cygnus-x1',
    name: 'Cygnus X-1 (Stellare)',
    description: 'Uno dei primi buchi neri scoperti. È un buco nero di massa stellare che "ciba" gas dalla sua stella gigante compagna, ruotando a velocità vertiginosa e generando intensi flussi energetici.',
    mass: 21, // 21 masse solari
    spin: 0.92,
    distance: 1.0,
    inclination: 30,
    diskRadiusMax: 10,
    diskBrightness: 0.75,
    dopplerEffect: true
  },
  {
    id: 'primordial',
    name: 'Buco Nero Primordiale (Solo Lente)',
    description: 'Ipotetico buco nero formatosi nelle prime fasi dell\'universo. Non possiede un disco di accrescimento, permettendo di osservare la pura deflessione della luce (lente gravitazionale) delle stelle di sfondo.',
    mass: 50, // 50 masse solari
    spin: 0.0,
    distance: 3.0,
    inclination: 0,
    diskRadiusMax: 3, // invisibile
    diskBrightness: 0.0,
    dopplerEffect: false
  }
];
