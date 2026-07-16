import React, { useRef, useEffect, useState } from 'react';
import { BlackHoleParams } from '../types';

interface RayTracerCanvasProps {
  params: BlackHoleParams;
}

export const RayTracerCanvas: React.FC<RayTracerCanvasProps> = ({ params }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [activeImpactParam, setActiveImpactParam] = useState<number>(75); // on-screen pixels, representing b
  const [showMultipleRays, setShowMultipleRays] = useState<boolean>(true);

  // Handle resizing dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height: Math.max(350, height || 400) });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute photon path using Schwarzschild geodesic solver
  // Equations of motion for light:
  // d^2x/dt^2 = -3 * M * L^2 * x / r^5
  // d^2y/dt^2 = -3 * M * L^2 * y / r^5
  const solveRayPath = (
    startY: number,
    center: { x: number; y: number },
    Rs: number,
    M: number
  ): { x: number; y: number }[] => {
    const path: { x: number; y: number }[] = [];
    
    // Initial conditions
    let px = -dimensions.width / 2; // start from far left
    let py = startY;
    
    let vx = 1.2; // light speed proxy
    let vy = 0.0;
    
    const dt = 2.5; // step size
    const maxSteps = 400;
    
    path.push({ x: px + center.x, y: py + center.y });

    for (let step = 0; step < maxSteps; step++) {
      const r2 = px * px + py * py;
      const r = Math.sqrt(r2);

      // Stop if photon hits the singularity / falls into event horizon
      if (r <= Rs) {
        // Add final point hitting horizon
        path.push({ x: px + center.x, y: py + center.y });
        break;
      }

      // Stop if photon escapes the screen
      if (Math.abs(px) > dimensions.width || Math.abs(py) > dimensions.height) {
        break;
      }

      // Angular momentum L = x * vy - y * vx
      const L = px * vy - py * vx;

      // Schwarzschild GR bending factor (cubic 1/r^5 force term)
      // a_rel = -3 * M * L^2 * r_vec / r^5
      const forceScale = -3.0 * M * (L * L) / (r2 * r2 * r);
      
      const ax = forceScale * px;
      const ay = forceScale * py;

      // Update velocities
      vx += ax * dt;
      vy += ay * dt;

      // Ensure velocity magnitude is conserved (light travels at c)
      // Normalizing velocity back to constant speed keeps the geodesic physics-bound
      const vMag = Math.sqrt(vx * vx + vy * vy);
      if (vMag > 0) {
        vx = (vx / vMag) * 1.5;
        vy = (vy / vMag) * 1.5;
      }

      // Update positions
      px += vx * dt;
      py += vy * dt;

      path.push({ x: px + center.x, y: py + center.y });
    }

    return path;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#050505'; // Pure theme black
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const center = { x: centerX, y: centerY };

    // Mass scaled parameter
    const baseRs = 40 + Math.log10(params.mass) * 12;
    const Rs = baseRs;
    const photonSphereRadius = 1.5 * Rs;
    const M = Rs / 2; // In GR units G = c = 1, Rs = 2M => M = Rs/2

    // 1. Draw Space-Time Grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Draw standard ray bundles if enabled
    if (showMultipleRays) {
      const stepSize = 18;
      const rayOffsets = [-120, -100, -80, -60, -40, -20, 20, 40, 60, 80, 100, 120];
      
      rayOffsets.forEach(offset => {
        const rayPath = solveRayPath(offset, center, Rs, M);
        
        ctx.beginPath();
        ctx.moveTo(rayPath[0].x, rayPath[0].y);
        for (let i = 1; i < rayPath.length; i++) {
          ctx.lineTo(rayPath[i].x, rayPath[i].y);
        }

        // Determine if captured (it ends inside Rs)
        const lastPt = rayPath[rayPath.length - 1];
        const lastDist = Math.sqrt((lastPt.x - centerX) ** 2 + (lastPt.y - centerY) ** 2);
        
        if (lastDist <= Rs + 2) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)'; // captured rays: faint red
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)'; // bent rays: faint cyan
        }
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // 3. Draw ACTIVE user ray
    const activeRayPath = solveRayPath(activeImpactParam, center, Rs, M);
    ctx.beginPath();
    ctx.moveTo(activeRayPath[0].x, activeRayPath[0].y);
    for (let i = 1; i < activeRayPath.length; i++) {
      ctx.lineTo(activeRayPath[i].x, activeRayPath[i].y);
    }
    
    const lastPt = activeRayPath[activeRayPath.length - 1];
    const lastDist = Math.sqrt((lastPt.x - centerX) ** 2 + (lastPt.y - centerY) ** 2);
    const isCaptured = lastDist <= Rs + 2;

    ctx.strokeStyle = isCaptured ? '#f87171' : '#38bdf8'; // bright red or bright cyan
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isCaptured ? '#ef4444' : '#0ea5e9';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset glow

    // 4. Draw Photon Sphere (1.5 * Rs)
    ctx.beginPath();
    ctx.arc(centerX, centerY, photonSphereRadius, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Draw Event Horizon (Rs)
    ctx.beginPath();
    ctx.arc(centerX, centerY, Rs, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Draw annotations
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('EVENT HORIZON (Rs)', centerX + Rs + 8, centerY + 18);
    ctx.fillText('PHOTON SPHERE (1.5 Rs)', centerX + photonSphereRadius + 8, centerY - 15);

    // Active Ray tag
    ctx.fillStyle = isCaptured ? '#f87171' : '#38bdf8';
    ctx.fillText(
      `ACTIVE BEAM: b = ${Math.abs(activeImpactParam).toFixed(0)} km ${isCaptured ? '(CAPTURED 🔴)' : '(DEFLECTED 🔵)'}`,
      10,
      20
    );

    // Theoretical notes on critical b
    const criticalB = 3 * Math.sqrt(3) * M;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.fillText(`CRITICAL IMPACT PARAMETER (b_crit) = ${criticalB.toFixed(0)} km`, 10, canvas.height - 15);

  }, [dimensions, activeImpactParam, showMultipleRays, params]);

  // Click or drag to change active ray impact parameter
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const offsetFromCenter = clickY - dimensions.height / 2;
    setActiveImpactParam(offsetFromCenter);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-black rounded-sm overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative">
      {/* Simulation Screen */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleCanvasInteraction}
          onMouseMove={(e) => e.buttons === 1 && handleCanvasInteraction(e)}
          className="block cursor-ns-resize max-w-full h-full"
        />
        
        <div className="absolute top-4 right-4 bg-black/80 border border-white/10 px-3 py-1.5 rounded-sm text-[9px] font-mono text-white/40 select-none backdrop-blur-sm pointer-events-none uppercase tracking-widest font-bold">
          ✨ Click or drag vertically to fire photons
        </div>
      </div>

      {/* Trajectory Controls */}
      <div className="bg-black/60 border-t border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold">Impact Parameter (b):</label>
          <input
            type="range"
            min={-180}
            max={180}
            value={activeImpactParam}
            onChange={(e) => setActiveImpactParam(Number(e.target.value))}
            className="w-32 sm:w-48 accent-[#F27D26] cursor-ew-resize bg-white/10 h-[2px] rounded-sm appearance-none"
          />
          <span className="text-xs font-mono text-[#F27D26] font-bold w-12">{activeImpactParam.toFixed(0)}km</span>
        </div>

        <button
          onClick={() => setShowMultipleRays(prev => !prev)}
          className={`px-3.5 py-2 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all duration-150 border cursor-pointer font-bold ${
            showMultipleRays
              ? 'bg-[#F27D26] text-black border-[#F27D26]'
              : 'bg-white/[0.02] text-white/40 border-white/10 hover:text-white/80'
          }`}
        >
          {showMultipleRays ? 'Hide Ray Bundles' : 'Show Ray Bundles'}
        </button>
      </div>
    </div>
  );
};
