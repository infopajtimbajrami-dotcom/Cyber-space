import React from 'react';
import { BlackHoleParams, Preset } from '../types';
import { PRESETS } from '../data/presets';
import { Settings, Sliders, Layers, RotateCcw, Info, Orbit, Sparkles } from 'lucide-react';

interface ControlPanelProps {
  params: BlackHoleParams;
  setParams: React.Dispatch<React.SetStateAction<BlackHoleParams>>;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ params, setParams }) => {
  
  const handlePresetSelect = (presetId: string) => {
    const selected = PRESETS.find(p => p.id === presetId);
    if (!selected) return;

    setParams(prev => ({
      ...prev,
      selectedPreset: presetId,
      mass: selected.mass,
      spin: selected.spin,
      distance: selected.distance,
      inclination: selected.inclination,
      diskRadiusMax: selected.diskRadiusMax,
      diskBrightness: selected.diskBrightness,
      dopplerEffect: selected.dopplerEffect,
      // Keep interactive layers as they were or set defaults
      showAccretionDisk: selected.diskBrightness > 0,
      showMobileSource: presetId === 'primordial' ? true : prev.showMobileSource
    }));
  };

  const handleSliderChange = (key: keyof BlackHoleParams, value: any) => {
    setParams(prev => ({
      ...prev,
      [key]: value,
      selectedPreset: 'custom' // reset preset tag to custom on manual change
    }));
  };

  // Reset all parameters to original default
  const handleReset = () => {
    setParams({
      mass: 4100000,
      spin: 0.45,
      distance: 2.2,
      inclination: 50,
      diskRadiusMax: 16,
      diskBrightness: 0.65,
      dopplerEffect: true,
      starDensity: 800,
      einsteinRingEnabled: true,
      selectedPreset: 'sgr-a',
      viewMode: 'space-time',
      showGrid: true,
      showPhotonSphere: true,
      showAccretionDisk: true,
      showMobileSource: false,
      cinematicCamera: true,
      timeDilation: 1.0,
      cinematicBloom: true
    });
  };

  // Astronomical physics calculation helpers for educational sidebar
  // Rs = 2GM/c^2 ~ 2.95 * Mass km
  const rsCalculated = 2.953 * params.mass;
  const photonSphereRadius = 1.5 * rsCalculated;
  
  // Hawking Temperature: T_H = h_bar * c^3 / (8 * pi * G * k_B * M)
  // T_H ~ 1.227e23 / M kelvin (for solar mass)
  const hawkingTemp = params.mass > 0 ? (1.227e23 / (params.mass * 1.989e30)) : 0;

  // Innermost Stable Circular Orbit (ISCO) in Rs units
  // For Schwarzschild = 3.0 Rs, for extreme Kerr = 0.5 Rs
  const isco = 3.0 - (params.spin * 2.2);

  return (
    <div className="bg-black/40 border border-white/10 rounded-sm p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6 select-none">
      
      {/* PRESET CONFIGURATOR */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Orbit size={11} className="text-[#F27D26]" /> Celestial Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`p-2.5 rounded-sm border text-left transition-all duration-150 cursor-pointer ${
                params.selectedPreset === preset.id
                  ? 'bg-[#F27D26] border-[#F27D26] text-black font-bold'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/25 text-white/60 hover:text-white'
              }`}
            >
              <div className="text-[11px] font-mono font-bold uppercase tracking-tight leading-none mb-1">
                {preset.name.split(' (')[0]}
              </div>
              <p className={`text-[9px] font-sans leading-tight line-clamp-1 opacity-80 ${
                params.selectedPreset === preset.id ? 'text-black/80' : 'text-white/40'
              }`}>
                {preset.name.includes('(') ? preset.name.split('(')[1].replace(')', '') : 'Model Config'}
              </p>
            </button>
          ))}
        </div>
        
        {/* Preset Description Display */}
        {params.selectedPreset !== 'custom' && (
          <div className="bg-white/[0.02] border border-white/5 px-3 py-2 rounded-sm text-[10px] font-mono text-white/60 leading-relaxed italic">
            &gt; {PRESETS.find(p => p.id === params.selectedPreset)?.description}
          </div>
        )}
      </div>

      <hr className="border-white/10" />

      {/* PARAMETERS SLIDERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders size={11} className="text-[#F27D26]" /> System Parameters
          </h3>
          <button
            onClick={handleReset}
            className="text-[9px] font-mono text-white/40 hover:text-white flex items-center gap-1 transition-colors cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw size={9} /> Reset Engine
          </button>
        </div>

        {/* MASS SLIDER (Logarithmic-like representation for display) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-medium text-white/70">Mass (M☉)</span>
            <span className="font-mono text-lg font-black text-[#F27D26]">
              {params.mass < 1000 
                ? `${params.mass.toFixed(0)}` 
                : params.mass < 1000000 
                  ? `${(params.mass / 1000).toFixed(1)}k` 
                  : `${(params.mass / 1000000).toFixed(1)}M`}
            </span>
          </div>
          {/* We use a multi-step range mapper so they can slides smoothly from stellar to supermassive */}
          <input
            type="range"
            min={1}
            max={9}
            step={0.1}
            // map log scale: 10^x
            value={Math.log10(params.mass)}
            onChange={(e) => {
              const val = Math.round(Math.pow(10, Number(e.target.value)));
              // Snap or adjust values slightly to look clean
              let cleanVal = val;
              if (val < 100) cleanVal = Math.round(val);
              else if (val < 10000) cleanVal = Math.round(val / 100) * 100;
              else if (val < 10000000) cleanVal = Math.round(val / 10000) * 10000;
              else cleanVal = Math.round(val / 1000000) * 1000000;
              
              handleSliderChange('mass', cleanVal);
            }}
            className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
          />
          <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest">
            <span>Stellar</span>
            <span>Intermediate</span>
            <span>Supermassive</span>
          </div>
        </div>

        {/* SPIN SLIDER (0.0 to 0.99) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-medium text-white/70">Angular Spin (a)</span>
            <span className="font-mono text-lg font-black text-white">{params.spin.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={params.spin}
            onChange={(e) => handleSliderChange('spin', Number(e.target.value))}
            className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
          />
          <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest">
            <span>Schwarzschild (0.0)</span>
            <span>Kerr Medium</span>
            <span>Kerr Limit (0.99)</span>
          </div>
        </div>

        {/* DISK INCLINATION */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-medium text-white/70">Disk Inclination (θ)</span>
            <span className="font-mono text-lg font-black text-white">{params.inclination}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={90}
            step={1}
            value={params.inclination}
            onChange={(e) => handleSliderChange('inclination', Number(e.target.value))}
            className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
          />
          <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest">
            <span>Face-on (0°)</span>
            <span>Inclined (45°)</span>
            <span>Edge-on (90°)</span>
          </div>
        </div>

        {/* DISK OUTER RADIUS */}
        {params.showAccretionDisk && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-medium text-white/70">Outer Disk Boundary</span>
              <span className="font-mono text-md font-bold text-[#F27D26]">{params.diskRadiusMax} Rs</span>
            </div>
            <input
              type="range"
              min={8}
              max={30}
              step={1}
              value={params.diskRadiusMax}
              onChange={(e) => handleSliderChange('diskRadiusMax', Number(e.target.value))}
              className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
            />
          </div>
        )}

        {/* DISK BRIGHTNESS */}
        {params.showAccretionDisk && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-medium text-white/70">Luminosity Intensity</span>
              <span className="font-mono text-md font-bold text-white">{(params.diskBrightness * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.5}
              step={0.05}
              value={params.diskBrightness}
              onChange={(e) => handleSliderChange('diskBrightness', Number(e.target.value))}
              className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
            />
          </div>
        )}
      </div>

      <hr className="border-white/10" />

      {/* CINEMATIC 3D / 4D CONTROLS */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles size={11} className="text-[#F27D26]" /> Cinematic 3D / 4D Space-Time
        </h3>

        <div className="space-y-3.5">
          {/* CAMERA ORBIT */}
          <label className="flex items-center justify-between cursor-pointer text-xs font-mono text-white/80 select-none">
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={params.cinematicCamera || false}
                onChange={(e) => handleSliderChange('cinematicCamera', e.target.checked)}
                className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Cinematic Camera Orbit (3D)</span>
            </span>
            <span className="text-[9px] text-[#F27D26] font-bold uppercase tracking-wider">
              {params.cinematicCamera ? 'ACTIVE 🟢' : 'STATIC ⚪'}
            </span>
          </label>

          {/* CINEMATIC BLOOM */}
          <label className="flex items-center justify-between cursor-pointer text-xs font-mono text-white/80 select-none">
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={params.cinematicBloom || false}
                onChange={(e) => handleSliderChange('cinematicBloom', e.target.checked)}
                className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Spacetime Bloom & Ripples (4D)</span>
            </span>
            <span className="text-[9px] text-[#F27D26] font-bold uppercase tracking-wider">
              {params.cinematicBloom ? 'ON 🌟' : 'OFF 🌑'}
            </span>
          </label>

          {/* TIME DILATION SLIDER */}
          <div className="space-y-1.5 pt-1.5 border-t border-white/5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-mono text-white/70">Time Dilatation Factor (t'/t)</span>
              <span className="font-mono text-md font-bold text-[#F27D26]">
                {params.timeDilation ? params.timeDilation.toFixed(1) : '1.0'}x
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={params.timeDilation || 1.0}
              onChange={(e) => handleSliderChange('timeDilation', Number(e.target.value))}
              className="w-full accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] appearance-none"
            />
            <div className="flex justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest">
              <span>Minkowski (1.0x)</span>
              <span>Gravitational Slower (10.0x)</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* VISUAL LAYERS / OPTIONS */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Layers size={11} className="text-[#F27D26]" /> Active Viewports & Layers
        </h3>
        
        <div className="grid grid-cols-1 gap-2.5">
          {/* ACCRETION DISK TOGGLE */}
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-white/80 select-none">
            <input
              type="checkbox"
              checked={params.showAccretionDisk}
              onChange={(e) => handleSliderChange('showAccretionDisk', e.target.checked)}
              className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Accretion Flow Disk</span>
          </label>

          {/* DOPPLER BEAMING TOGGLE */}
          {params.showAccretionDisk && (
            <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-white/80 pl-6 select-none animate-fadeIn">
              <input
                type="checkbox"
                checked={params.dopplerEffect}
                onChange={(e) => handleSliderChange('dopplerEffect', e.target.checked)}
                className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span className="text-[#F27D26]">Doppler Beaming & Redshift</span>
            </label>
          )}

          {/* SPACE-TIME GRID TOGGLE */}
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-white/80 select-none">
            <input
              type="checkbox"
              checked={params.showGrid}
              onChange={(e) => handleSliderChange('showGrid', e.target.checked)}
              className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Space-time Grid Geometry</span>
          </label>

          {/* PHOTON SPHERE LABELS */}
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-white/80 select-none">
            <input
              type="checkbox"
              checked={params.showPhotonSphere}
              onChange={(e) => handleSliderChange('showPhotonSphere', e.target.checked)}
              className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Photon Orbit Sphere (1.5 Rs)</span>
          </label>

          {/* EINSTEIN RING ENABLER */}
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-white/80 select-none">
            <input
              type="checkbox"
              checked={params.einsteinRingEnabled}
              onChange={(e) => handleSliderChange('einsteinRingEnabled', e.target.checked)}
              className="rounded-none bg-black border-white/20 text-[#F27D26] focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Warped Secondary Image (Einstein Ring)</span>
          </label>

          {/* DRAGGABLE STAR TOGGLE */}
          <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-sky-400 select-none">
            <input
              type="checkbox"
              checked={params.showMobileSource}
              onChange={(e) => handleSliderChange('showMobileSource', e.target.checked)}
              className="rounded-none bg-black border-white/20 text-sky-400 focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>Interactive Lensing Beacon</span>
          </label>
        </div>
      </div>

      <hr className="border-white/10" />

      {/* METRIC INFORMATION BOARD (REAL PHYSICS LABELS) */}
      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-4 select-none">
        <h4 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Info size={11} className="text-[#F27D26]" /> Spacetime Telemetry
        </h4>
        
        {/* BIG HERO ANALYTIC AS IN THE SPECIFICATION HTML */}
        <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="text-3xl font-black tracking-tighter text-white font-display">
              {params.mass < 1000 
                ? params.mass.toFixed(0) 
                : params.mass < 1000000 
                  ? `${(params.mass / 1000).toFixed(1)}k` 
                  : `${(params.mass / 1000000).toFixed(1)}M`}
            </div>
            <div className="text-[8px] font-mono text-[#F27D26] uppercase tracking-wider">Mass Factor</div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tighter text-white font-display">
              {rsCalculated > 1000000 ? `${(rsCalculated / 1000000).toFixed(2)}M` : rsCalculated > 1000 ? `${(rsCalculated / 1000).toFixed(1)}k` : rsCalculated.toFixed(0)}
            </div>
            <div className="text-[8px] font-mono text-[#F27D26] uppercase tracking-wider">R_s Radius (km)</div>
          </div>
        </div>

        <div className="space-y-1.5 font-mono text-[10px] text-white/60 leading-relaxed">
          <div className="flex justify-between">
            <span>Photon Orbit (1.5 Rs):</span>
            <span className="text-white font-semibold">{photonSphereRadius.toLocaleString('it-IT', { maximumFractionDigits: 1 })} km</span>
          </div>
          <div className="flex justify-between">
            <span>Stable Boundary (ISCO):</span>
            <span className="text-white font-semibold">{ (isco * rsCalculated).toLocaleString('it-IT', { maximumFractionDigits: 1 }) } km ({isco.toFixed(1)} Rs)</span>
          </div>
          <div className="flex justify-between">
            <span>Hawking Radiance:</span>
            <span className="text-white font-semibold">
              {hawkingTemp === 0 
                ? 'N/A' 
                : hawkingTemp < 1e-10 
                  ? `${hawkingTemp.toExponential(2)} K` 
                  : `${hawkingTemp.toFixed(2)} K`}
            </span>
          </div>
          {params.spin > 0 && (
            <div className="flex justify-between text-[#F27D26] border-t border-white/5 pt-1.5 mt-1.5">
              <span>Ergosphere Outer Edge:</span>
              <span className="font-bold">{ rsCalculated.toLocaleString('it-IT', { maximumFractionDigits: 0 }) } km</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
