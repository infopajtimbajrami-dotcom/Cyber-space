import React, { useState } from 'react';
import { BookOpen, HelpCircle, Eye, ShieldAlert, Sparkles, Orbit } from 'lucide-react';

export const EducationalPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lens' | 'horizon' | 'disk' | 'kerr'>('lens');

  const content = {
    lens: {
      title: "Lente Gravitazionale",
      subtitle: "La deflessione della luce secondo Einstein",
      icon: <Eye size={18} className="text-sky-400" />,
      paragraphs: [
        "Secondo la Teoria della Relatività Generale di Albert Einstein (1915), la massa non esercita semplicemente una forza di attrazione, ma curva la trama stessa dello spazio-tempo circostante. La luce, viaggiando nello spaziotempo curvo, segue queste traiettorie deformate chiamate geodetiche.",
        "Quando una stella di sfondo si trova dietro un buco nero, i suoi raggi di luce vengono piegati attorno ad esso. Per l'osservatore, la luce sembra provenire da posizioni diverse, sdoppiandosi in due immagini distinte (una primaria esterna e una secondaria speculare interna).",
        "Se l'allineamento tra sorgente di luce, buco nero e osservatore è perfetto, la luce si distribuisce in modo simmetrico attorno al buco nero, formando un anello luminoso continuo noto come Anello di Einstein. Puoi sperimentarlo nel simulatore attivando la 'Sorgente Mobile' e trascinandola esattamente al centro."
      ],
      formulas: [
        { name: "Angolo di deflessione di Einstein", expr: "θ = 4GM / (c² b)" },
        { name: "Raggio dell'Anello di Einstein", expr: "θ_E = √[ (4GM/c²) * (D_LS / (D_L * D_S)) ]" }
      ]
    },
    horizon: {
      title: "Orizzonte degli Eventi",
      subtitle: "La superficie di non ritorno",
      icon: <ShieldAlert size={18} className="text-red-400" />,
      paragraphs: [
        "L'Orizzonte degli Eventi è il confine teorico attorno a un buco nero oltre il quale la velocità di fuga supera la velocità della luce. Nulla, nemmeno la luce o l'informazione, può sfuggire una volta attraversato questo limite, lasciando l'interno inaccessibile all'universo esterno.",
        "Il raggio di questo confine sferico per un buco nero non rotante è chiamato Raggio di Schwarzschild. Nel simulatore, l'orizzonte degli eventi corrisponde alla zona di oscurità assoluta centrale (la 'shadow' o ombra del buco nero).",
        "Poco sopra l'orizzonte, a 1.5 volte il raggio di Schwarzschild, si trova la Sfera dei Fotoni. In questa regione estrema, la gravità è così intensa che i fotoni sono costretti a orbitare in cerchio in orbite instabili. Teoricamente, se ti trovassi sulla sfera dei fotoni e puntassi una torcia di lato, vedresti la luce fare il giro del buco nero e colpirti alle spalle!"
      ],
      formulas: [
        { name: "Raggio di Schwarzschild", expr: "Rs = 2GM / c²" },
        { name: "Raggio della Sfera dei Fotoni", expr: "R_photon = 3GM / c² = 1.5 Rs" }
      ]
    },
    disk: {
      title: "Disco di Accrescimento",
      subtitle: "Gas super-riscaldato a velocità relativistiche",
      icon: <Orbit size={18} className="text-orange-400" />,
      paragraphs: [
        "Il disco di accrescimento è una struttura formata da gas, polveri e plasma che orbitano a velocità elevatissime vicino al buco nero. L'enorme attrito viscoso e le forze tidali riscaldano questo materiale a milioni di gradi Kelvin, facendolo brillare intensamente nello spettro visibile, UV e nei raggi X.",
        "Perché il disco sembra avvolgere il buco nero in un 'halo' sopra e sotto, come visto nel film Interstellar? Questo è un puro effetto di lente gravitazionale forte! La luce proveniente dalla parte posteriore del disco (che sarebbe nascosta dietro il buco nero) viene piegata dalla gravità verso l'alto e verso il basso, raggiungendo l'osservatore e creando l'illusione di un anello che sormonta l'orizzonte.",
        "Inoltre, poiché il disco ruota a una velocità vicina a quella della luce, si manifesta l'effetto Doppler Relativistico (beaming). Il lato del disco che ruota verso di noi (il lato sinistro nel simulatore) appare notevolmente più luminoso e spostato verso il blu (blueshift), mentre il lato che si allontana (destro) appare fioco e spostato verso il rosso (redshift)."
      ],
      formulas: [
        { name: "Fattore di Doppler Relativistico", expr: "D = 1 / [ γ * (1 - β * cos(θ)) ]" },
        { name: "Orbita stabile interna (ISCO)", expr: "R_isco = 6GM / c² = 3 Rs (Schwarzschild)" }
      ]
    },
    kerr: {
      title: "Rotazione di Kerr",
      subtitle: "Il trascinamento dello spaziotempo",
      icon: <Sparkles size={18} className="text-purple-400" />,
      paragraphs: [
        "Nel 1963, il matematico Roy Kerr trovò la soluzione esatta per un buco nero rotante (buco nero di Kerr). A differenza dei buchi neri statici, un buco nero rotante possiede un momento angolare (spin) contrassegnato dal parametro 'a' (da 0 a 1).",
        "La rotazione trascina letteralmente lo spaziotempo circostante in un vortice irresistibile, un effetto noto come effetto Lense-Thirring o Frame-Dragging. Nel simulatore, aumentando lo spin del buco nero, noterai che le stelle e il disco vicino all'orizzonte vengono distorti asimmetricamente in una spirale direzionale.",
        "Attorno a un buco nero di Kerr si forma l'Ergosfera: una regione a forma di ellissoide schiacciato situata all'esterno dell'orizzonte degli eventi. All'interno dell'ergosfera, lo spazio viene trascinato così velocemente che nessun oggetto può rimanere fermo rispetto all'universo esterno, ed è teoricamente possibile estrarre energia dal buco nero tramite il processo Penrose."
      ],
      formulas: [
        { name: "Orizzonte degli Eventi di Kerr", expr: "R_plus = M + √(M² - a²)" },
        { name: "Ergosfera (limite statico equatoriale)", expr: "R_static = M + √(M² - a² * cos²(θ))" }
      ]
    }
  };

  const active = content[activeTab];

  return (
    <div className="bg-black/40 border border-white/10 rounded-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] select-none">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/10 bg-black/60">
        {(Object.keys(content) as Array<keyof typeof content>).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 px-1.5 text-center text-[10px] font-mono font-bold tracking-widest uppercase transition-all duration-150 border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === tab
                ? 'border-[#F27D26] text-[#F27D26] bg-black/80'
                : 'border-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
            }`}
          >
            {content[tab].icon}
            <span className="hidden sm:inline">{content[tab].title}</span>
            <span className="sm:hidden">{content[tab].title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-5 space-y-4">
        <div>
          <div className="text-[9px] font-mono text-[#F27D26] uppercase tracking-widest font-bold">{active.subtitle}</div>
          <h3 className="text-lg font-display font-black text-white flex items-center gap-2 mt-1 uppercase tracking-tight">
            {active.title}
          </h3>
        </div>

        <div className="space-y-3 text-xs text-white/70 leading-relaxed font-sans">
          {active.paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Formulas display */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-2">
          <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">Key Relativity Formulae (G = c = 1)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {active.formulas.map((form, idx) => (
              <div key={idx} className="space-y-1 bg-black/40 p-2.5 rounded-sm border border-white/5">
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{form.name}:</div>
                <div className="text-xs font-mono text-[#F27D26] font-bold bg-black px-2 py-1.5 rounded-xs select-all border border-white/5">
                  {form.expr}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
