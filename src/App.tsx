/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BlackHoleParams } from './types';
import { SimulationCanvas } from './components/SimulationCanvas';
import { RayTracerCanvas } from './components/RayTracerCanvas';
import { ControlPanel } from './components/ControlPanel';
import { EducationalPanel } from './components/EducationalPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Orbit, Compass } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState<BlackHoleParams>({
    mass: 100000000, // Gargantua (100M solar masses)
    spin: 0.99,
    distance: 4.5,
    inclination: 85, // Almost edge-on like Interstellar
    diskRadiusMax: 22,
    diskBrightness: 0.85,
    dopplerEffect: true,
    starDensity: 800,
    einsteinRingEnabled: true,
    selectedPreset: 'gargantua',
    viewMode: 'space-time',
    showGrid: false, // Pure cinematic view
    showPhotonSphere: false, // Pure cinematic view
    showAccretionDisk: true,
    showMobileSource: false,
    cinematicCamera: true,
    timeDilation: 1.0,
    cinematicBloom: true
  });

  return (
    <div id="app-root" className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans antialiased flex flex-col selection:bg-[#F27D26]/30 selection:text-[#F27D26]">
      
      {/* BOLD TYPOGRAPHY HEADER */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50 select-none">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tighter text-white">
              SINGULARITY
            </h1>
            <span className="text-[10px] font-mono text-[#F27D26] border border-[#F27D26]/30 px-2 py-0.5 uppercase tracking-wider bg-[#F27D26]/5 rounded-xs">
              Simulatore Buchi Neri v4.2
            </span>
          </div>

          {/* FLAT BOLD VIEW MODE TABS */}
          <div className="flex bg-black border border-white/10 p-1 rounded-sm shrink-0">
            <button
              onClick={() => setParams(prev => ({ ...prev, viewMode: 'space-time' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                params.viewMode === 'space-time'
                  ? 'bg-[#F27D26] text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Compass size={12} />
              <span className="hidden sm:inline">Lente Gravitazionale</span>
              <span className="sm:hidden">Lente</span>
            </button>
            <button
              onClick={() => setParams(prev => ({ ...prev, viewMode: 'ray-tracer' }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                params.viewMode === 'ray-tracer'
                  ? 'bg-[#F27D26] text-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Orbit size={12} />
              <span className="hidden sm:inline">Orbite Fotoni</span>
              <span className="sm:hidden">Orbite</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PRIMARY VISUALIZER & EDUCATIONAL MODULE */}
        <div className="lg:col-span-8 space-y-6 flex flex-col h-full">
          
          {/* Simulation Stage (with AnimatePresence for transitions) */}
          <div className="aspect-square sm:aspect-video lg:aspect-[4/3] w-full shrink-0">
            <AnimatePresence mode="wait">
              {params.viewMode === 'space-time' ? (
                <motion.div
                  key="space-time"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <SimulationCanvas params={params} setParams={setParams} />
                </motion.div>
              ) : (
                <motion.div
                  key="ray-tracer"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <RayTracerCanvas params={params} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Educational Textbook */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EducationalPanel />
          </motion.div>
        </div>

        {/* RIGHT COLUMN: LAB CONTROL CONSOLE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ControlPanel params={params} setParams={setParams} />
          </motion.div>
        </div>

      </main>

      {/* SCIENTIFIC BANNER / FOOTER */}
      <footer className="border-t border-white/10 bg-black py-5 select-none mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-[10px] font-mono tracking-widest text-white/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span>ENGINE STATUS: ONLINE • PROJECTION READY</span>
          </div>
          <div>© {new Date().getFullYear()} INSTITUTE OF THEORETICAL PHYSICS • LIVE ASTROPHYSICS LAB</div>
        </div>
      </footer>

    </div>
  );
}
