import React, { useRef, useEffect, useState } from 'react';
import { BlackHoleParams } from '../types';
import { Maximize, Minimize } from 'lucide-react';

interface Star {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: string;
}

interface DiskParticle {
  radius: number; // in units of Rs
  angle: number;
  speed: number;
  size: number;
  baseColor: string;
  type?: 'glow' | 'whiteHot' | 'dust';
}

interface SimulationCanvasProps {
  params: BlackHoleParams;
  setParams?: React.Dispatch<React.SetStateAction<BlackHoleParams>>;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ params, setParams }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [stars, setStars] = useState<Star[]>([]);
  const [particles, setParticles] = useState<DiskParticle[]>([]);
  const [mobileSource, setMobileSource] = useState({ x: 120, y: -100, isDragging: false });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drag and touch camera control references
  const manualAzimuthRef = useRef(0);
  const manualInclinationRef = useRef(0);
  const isDraggingCameraRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Esc key listener to exit pseudo-fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Generate starfield once or when density changes
  useEffect(() => {
    const newStars: Star[] = [];
    const colors = ['#ffffff', '#ffffff', '#eaf1ff', '#ffeae0', '#fff9e6', '#c4d7ff'];
    for (let i = 0; i < params.starDensity; i++) {
      // Distribute stars evenly in polar coordinates to avoid clustering, but with some density
      const angle = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 400; // avoid very center initially
      newStars.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        brightness: 0.4 + Math.random() * 0.6,
        size: 0.5 + Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setStars(newStars);
  }, [params.starDensity]);

  // Generate accretion disk particles
  useEffect(() => {
    const newParticles: DiskParticle[] = [];
    const count = 3000; // Increased to 3000 for high-density Interstellar Gargantua cinema look
    for (let i = 0; i < count; i++) {
      // Disk starts outside the ISCO (Innermost Stable Circular Orbit).
      // For Schwarzschild, ISCO is at 3.0 * Rs. For high spin Kerr, it can be closer to 0.5 * Rs.
      const isco = 2.4 - (params.spin * 1.6); // approx ISCO ranging down to ~0.8 Rs
      const radius = isco + Math.pow(Math.random(), 1.6) * (params.diskRadiusMax - isco);
      const angle = Math.random() * Math.PI * 2;
      
      // Keplerian velocity: orbital speed v is proportional to 1/sqrt(radius)
      const speed = 0.09 / Math.sqrt(radius);
      
      const relativeDist = (radius - isco) / (params.diskRadiusMax - isco);
      let type: 'glow' | 'whiteHot' | 'dust' = 'glow';
      let baseColor = '';

      // Gargantua gas vs dust lanes
      const isDustLane = Math.random() < 0.32; // 32% of particles are absorbing dust clouds
      if (isDustLane) {
        type = 'dust';
        baseColor = 'rgba(15, 8, 4, ';
      } else {
        if (relativeDist < 0.18) {
          type = 'whiteHot';
          baseColor = 'rgba(255, 250, 230, '; // hot white-yellow (like Gargantua)
        } else if (relativeDist < 0.55) {
          type = 'glow';
          baseColor = 'rgba(255, 165, 25, '; // glowing gold-orange
        } else {
          type = 'glow';
          baseColor = 'rgba(215, 85, 15, '; // warm amber-red
        }
      }

      // Vary the sizes: dust is larger/fuzzier, whiteHot is smaller and concentrated
      let size = 1.0 + Math.random() * 1.8;
      if (type === 'dust') {
        size = 2.5 + Math.random() * 3.5; // fuzzier dust particles
      } else if (type === 'whiteHot') {
        size = 0.8 + Math.random() * 1.2;
      }

      newParticles.push({
        radius,
        angle,
        speed,
        size,
        baseColor,
        type
      });
    }
    setParticles(newParticles);
  }, [params.diskRadiusMax, params.spin, params.showAccretionDisk]);

  // Handle ResizeObserver to maintain fluid dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height || 600);
        setDimensions({ width: size, height: size });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Animation and physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Pre-render soft glowing sprites for extreme performance and cinematic quality
    const spriteGlow = document.createElement('canvas');
    spriteGlow.width = 32;
    spriteGlow.height = 32;
    const ctxGlow = spriteGlow.getContext('2d')!;
    const gradGlow = ctxGlow.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradGlow.addColorStop(0, 'rgba(255, 235, 180, 1.0)'); // hot core
    gradGlow.addColorStop(0.25, 'rgba(255, 160, 20, 0.75)'); // golden plasma
    gradGlow.addColorStop(0.55, 'rgba(242, 125, 38, 0.3)'); // orange halo
    gradGlow.addColorStop(1, 'rgba(242, 125, 38, 0)');
    ctxGlow.fillStyle = gradGlow;
    ctxGlow.fillRect(0, 0, 32, 32);

    const spriteWhiteHot = document.createElement('canvas');
    spriteWhiteHot.width = 32;
    spriteWhiteHot.height = 32;
    const ctxWhiteHot = spriteWhiteHot.getContext('2d')!;
    const gradWhiteHot = ctxWhiteHot.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradWhiteHot.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); // ultra-hot core
    gradWhiteHot.addColorStop(0.25, 'rgba(255, 240, 180, 0.9)'); // white-gold
    gradWhiteHot.addColorStop(0.55, 'rgba(255, 170, 30, 0.45)'); // orange fringe
    gradWhiteHot.addColorStop(1, 'rgba(255, 170, 30, 0)');
    ctxWhiteHot.fillStyle = gradWhiteHot;
    ctxWhiteHot.fillRect(0, 0, 32, 32);

    const spriteDust = document.createElement('canvas');
    spriteDust.width = 32;
    spriteDust.height = 32;
    const ctxDust = spriteDust.getContext('2d')!;
    const gradDust = ctxDust.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradDust.addColorStop(0, 'rgba(12, 6, 3, 0.95)'); // opaque black-brown core
    gradDust.addColorStop(0.4, 'rgba(12, 6, 3, 0.7)'); // dusty smoke
    gradDust.addColorStop(0.8, 'rgba(12, 6, 3, 0.2)'); // faint silhouette
    gradDust.addColorStop(1, 'rgba(12, 6, 3, 0)');
    ctxDust.fillStyle = gradDust;
    ctxDust.fillRect(0, 0, 32, 32);

    // Physics parameters scaled to pixels
    const center = dimensions.width / 2;
    // Base Event Horizon (Rs) on screen pixels, scaled with mass
    // Mass goes from 4 to 100 (log-like scaling on screen)
    const baseRs = 25 + Math.log10(params.mass) * 15;
    const Rs = baseRs;
    const photonSphereRadius = 1.5 * Rs;
    // Einstein Radius is proportional to sqrt(Mass) or Rs. Let's make it proportional to Rs for visualization
    const RE = Rs * 1.8;

    const render = () => {
      const time = performance.now();
      let cameraAzimuth = manualAzimuthRef.current;
      let dynamicInclination = params.inclination + manualInclinationRef.current;

      if (params.cinematicCamera) {
        // Slow cinematic camera orbit around the accretion disk plus manual offset
        cameraAzimuth = time * 0.00018 + manualAzimuthRef.current;
        // Gently oscillate inclination between (params.inclination - 12) and (params.inclination + 12) degrees plus manual offset
        dynamicInclination = params.inclination + Math.sin(time * 0.0003) * 12 + manualInclinationRef.current;
      }
      dynamicInclination = Math.max(3, Math.min(88, dynamicInclination));

      ctx.fillStyle = '#050505'; // Pure theme black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 0. DRAW 4D SPACE-TIME GRAVITY WAVE RIPPLES (Cinematic spacetime distortion)
      if (params.cinematicBloom) {
        const rippleCount = 3;
        ctx.strokeStyle = 'rgba(242, 125, 38, 0.04)';
        ctx.lineWidth = 1.2;
        for (let rIdx = 0; rIdx < rippleCount; rIdx++) {
          const phase = (time * 0.0008 + rIdx / rippleCount) % 1.0;
          const rippleR = Rs * (1.3 + phase * 4.5);
          ctx.beginPath();
          ctx.arc(center, center, rippleR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 1. DRAW BACKGROUND STARS WITH GRAVITATIONAL LENSING
      stars.forEach(star => {
        let sx = star.x;
        let sy = star.y;

        // Apply Frame-Dragging (Kerr metric rotation) near the hole
        const rInitial = Math.sqrt(sx * sx + sy * sy);
        if (params.spin > 0 && rInitial < Rs * 8) {
          // Frame dragging angular frequency omega ~ spin / r^3
          const dragStrength = params.spin * 4.0;
          const dragAngle = (dragStrength * Rs * Rs) / (rInitial * rInitial * rInitial);
          const currentAngle = Math.atan2(sy, sx);
          const newAngle = currentAngle + dragAngle;
          sx = Math.cos(newAngle) * rInitial;
          sy = Math.sin(newAngle) * rInitial;
        }

        const dx = sx;
        const dy = sy;
        const r = Math.sqrt(dx * dx + dy * dy);

        if (r < 0.1) return; // avoid division by zero

        // POINT-MASS GRAVITATIONAL LENSING FORMULA (General Relativity deflection)
        // Einstein ring radius: RE
        // Lensed positions: theta' = (theta + sqrt(theta^2 + 4*theta_E^2)) / 2
        // We also render the secondary (inner) image on the opposite side!
        const u = r / RE; // normalized impact parameter
        const factor1 = (r + Math.sqrt(r * r + 4 * RE * RE)) / (2 * r);
        const factor2 = (r - Math.sqrt(r * r + 4 * RE * RE)) / (2 * r);

        // Primary image (outer)
        const px1 = center + dx * factor1;
        const py1 = center + dy * factor1;
        
        // Magnification factors for brightness adjustment
        // A = (u^2 + 2) / (u * sqrt(u^2 + 4))
        const u2 = u * u;
        const denom = u * Math.sqrt(u2 + 4);
        const mag1 = denom > 0 ? (u2 + 2) / denom + 1 : 1;
        const mag2 = denom > 0 ? Math.max(0, (u2 + 2) / denom - 1) : 0;

        // Draw primary image if outside event horizon
        const dist1 = Math.sqrt((px1 - center) ** 2 + (py1 - center) ** 2);
        if (dist1 > Rs) {
          ctx.beginPath();
          ctx.arc(px1, py1, star.size * Math.sqrt(mag1), 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = Math.min(1.0, star.brightness * mag1);
          ctx.fill();
        }

        // Secondary image (inner, opposite side) - only rendered if lensing is enabled
        if (params.einsteinRingEnabled) {
          const px2 = center + dx * factor2;
          const py2 = center + dy * factor2;
          const dist2 = Math.sqrt((px2 - center) ** 2 + (py2 - center) ** 2);

          // Render secondary image only if it escapes the event horizon (usually very close to it)
          if (dist2 > Rs && dist2 < RE * 2) {
            ctx.beginPath();
            ctx.arc(px2, py2, star.size * Math.sqrt(mag2), 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = Math.min(0.8, star.brightness * mag2 * 0.5); // dimmer
            ctx.fill();
          }
        }
      });
      ctx.globalAlpha = 1.0;

      // 2. DRAW DRAGGABLE MOBILE LIGHT SOURCE (SORGENTE MOBILE)
      if (params.showMobileSource) {
        const mx = mobileSource.x;
        const my = mobileSource.y;
        const mr = Math.sqrt(mx * mx + my * my);

        if (mr > 0.5) {
          const factor1 = (mr + Math.sqrt(mr * mr + 4 * RE * RE)) / (2 * mr);
          const factor2 = (mr - Math.sqrt(mr * mr + 4 * RE * RE)) / (2 * mr);

          const px1 = center + mx * factor1;
          const py1 = center + my * factor1;
          const px2 = center + mx * factor2;
          const py2 = center + my * my * factor2 / my; // opposite side direction

          // Einstein ring condition: if extremely close to center, draw ring!
          if (mr < 4 && params.einsteinRingEnabled) {
            ctx.beginPath();
            ctx.arc(center, center, RE, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'; // beautiful neon cyan ring
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0; // reset shadow
          } else {
            // Draw warped primary image as an arc or lens shape
            ctx.beginPath();
            ctx.arc(px1, py1, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw secondary image (dimmer, opposite)
            const d2 = Math.sqrt((center + mx * factor2) ** 2 + (center + my * factor2) ** 2);
            if (d2 > Rs && params.einsteinRingEnabled) {
              ctx.beginPath();
              ctx.arc(center + mx * factor2, center + my * factor2, 4, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
              ctx.fill();
            }
          }
        }
      }

      // 3. DRAW SPACE-TIME GRID (GRIGLIA SPADO-TEMPO DEFORMATA)
      if (params.showGrid) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)'; // very subtle grid lines
        ctx.lineWidth = 1;

        // Draw concentric circles lensed
        const gridRadii = [40, 80, 120, 160, 200, 240, 280];
        gridRadii.forEach(gridR => {
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.05) {
            const gx = Math.cos(a) * gridR;
            const gy = Math.sin(a) * gridR;
            const gr = Math.sqrt(gx * gx + gy * gy);
            const factor = (gr + Math.sqrt(gr * gr + 4 * RE * RE)) / (2 * gr);
            
            const px = center + gx * factor;
            const py = center + gy * factor;
            if (a === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        });

        // Draw radial grid lines
        const radialLinesCount = 16;
        for (let l = 0; l < radialLinesCount; l++) {
          const angle = (l / radialLinesCount) * Math.PI * 2;
          ctx.beginPath();
          for (let rStep = Rs + 5; rStep < 300; rStep += 10) {
            const gx = Math.cos(angle) * rStep;
            const gy = Math.sin(angle) * rStep;
            const gr = Math.sqrt(gx * gx + gy * gy);
            const factor = (gr + Math.sqrt(gr * gr + 4 * RE * RE)) / (2 * gr);
            
            const px = center + gx * factor;
            const py = center + gy * factor;
            if (rStep === Rs + 5) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.stroke();
        }
      }

      // 4. DRAW ACCRETION DISK (DISCO DI ACCRESCIMENTO) WITH RELATIVISTIC WARPING & DOPPLER BEAMING
      if (params.showAccretionDisk) {
        const radInc = (dynamicInclination * Math.PI) / 180;
        const cosInc = Math.cos(radInc);
        const sinInc = Math.sin(radInc);

        // Map and project the particles to screen coordinates
        const projectedParticles = particles.map(p => {
          // Update rotation angle with Spacetime Time Dilation (slower near critical horizons)
          p.angle += p.speed / (params.timeDilation || 1.0);
          if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;

          // 3D position of disk element in disk plane
          const diskX = p.radius * Rs * Math.cos(p.angle);
          const diskY = p.radius * Rs * Math.sin(p.angle);
          
          // Apply Azimuthal Camera Rotation in 3D around Z-axis
          let diskX_cam = diskX;
          let diskY_cam = diskY;
          if (params.cinematicCamera) {
            const cosAz = Math.cos(cameraAzimuth);
            const sinAz = Math.sin(cameraAzimuth);
            diskX_cam = diskX * cosAz - diskY * sinAz;
            diskY_cam = diskX * sinAz + diskY * cosAz;
          }

          // Rotate around X-axis by inclination
          const rotX = diskX_cam;
          const rotY = diskY_cam * cosInc;
          const rotZ = diskY_cam * sinInc; // Depth: positive is in the background (behind the BH), negative is in front

          // Frame dragging twisting effect for accretion disk (twist angle increases as radius decreases)
          let finalRotX = rotX;
          let finalRotY = rotY;
          if (params.spin > 0) {
            const twistFactor = params.spin * 1.8 / (p.radius * p.radius);
            const cosTwist = Math.cos(twistFactor);
            const sinTwist = Math.sin(twistFactor);
            finalRotX = rotX * cosTwist - rotY * sinTwist;
            finalRotY = rotX * sinTwist + rotY * cosTwist;
          }

          // Unlensed projected radius and angle
          const rUnlensed = Math.sqrt(finalRotX * finalRotX + finalRotY * finalRotY);
          const phiUnlensed = Math.atan2(finalRotY, finalRotX);

          // Apply General Relativistic Lensing Warping to the accretion disk!
          // Light from the back side (rotZ > 0) wraps around the event horizon, creating the halo!
          const lensMultiplier = rotZ > 0 ? 1.0 : 0.4; // differential lensing by depth
          const customRE = RE * lensMultiplier;
          
          // Lensing equation for disk radius
          const rLensed = (rUnlensed + Math.sqrt(rUnlensed * rUnlensed + 4 * customRE * customRE)) / 2;

          // Compute final projected screen coordinates
          const screenX = center + rLensed * Math.cos(phiUnlensed);
          const screenY = center + rLensed * Math.sin(phiUnlensed);

          // Relativistic Doppler Beaming & Redshift
          // Left side of disk rotates TOWARDS the observer (moving out of screen)
          const cosPhi = Math.cos(p.angle);
          const beta = 0.38 / Math.sqrt(p.radius); // very fast near inner edge!
          const dopplerFactor = 1.0 - beta * cosPhi * sinInc; // 1 + boost for left side, 1 - dim for right side
          
          // Boost brightness
          let brightnessFactor = 1.0;
          let pType = p.type || 'glow';

          if (params.dopplerEffect) {
            // Relativistic beaming scales brightness by D^3.5
            const boost = Math.pow(1.0 / dopplerFactor, 3.5);
            brightnessFactor = boost * params.diskBrightness;

            // Shift color spectrum (Doppler shift)
            if (dopplerFactor < 0.9 && pType !== 'dust') {
              pType = 'whiteHot';
            }
          } else {
            brightnessFactor = params.diskBrightness;
          }

          // Particle opacity gets stronger near the inner edge but drops in very high speed regions
          let opacity = Math.min(0.9, (0.48 / Math.sqrt(p.radius)) * brightnessFactor);
          if (pType === 'dust') {
            opacity = Math.min(0.7, (0.55 / Math.sqrt(p.radius)) * (params.diskBrightness * 0.8));
          }

          return {
            x: screenX,
            y: screenY,
            z: rotZ, // depth for Painter's sorting
            radius: p.radius,
            size: p.size * (rLensed / rUnlensed) * Math.min(1.4, Math.sqrt(brightnessFactor)), // size expands with lensing magnification
            type: pType,
            opacity: opacity
          };
        });

        // Sort by Z descending: background particles (z > 0) first, foreground particles (z < 0) last
        projectedParticles.sort((a, b) => b.z - a.z);

        // --- PHASE 4A: BACK LUMINOUS HALO BACKGROUND GLOW ---
        // Generates the smooth background plasma fog before individual gas grains are painted
        ctx.save();
        const haloGrad = ctx.createRadialGradient(
          center - Rs * 0.35 * (params.dopplerEffect ? 1 : 0), center, Rs * 0.95,
          center - Rs * 0.1 * (params.dopplerEffect ? 1 : 0), center, Rs * 4.8
        );
        haloGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        haloGrad.addColorStop(0.06, 'rgba(255, 235, 180, 0.85)'); // very bright gold near photon sphere
        haloGrad.addColorStop(0.16, 'rgba(255, 155, 20, 0.7)');  // bright orange
        haloGrad.addColorStop(0.42, 'rgba(242, 125, 38, 0.35)');  // warm amber
        haloGrad.addColorStop(0.78, 'rgba(180, 50, 10, 0.12)');  // outer red-brown smoke
        haloGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(center, center, Rs * 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- PHASE 4B: DRAW BACKGROUND PARTICLES (z >= 0) ---
        projectedParticles.forEach(p => {
          if (p.z < 0) return; // skip foreground for now

          // If background particle is lensed inside event horizon shadow, it's blocked!
          const dCenter = Math.sqrt((p.x - center) ** 2 + (p.y - center) ** 2);
          if (dCenter <= Rs - 0.5) return;

          // Stamp the appropriate sprite based on particle type for extremely fast soft blending
          let sprite = spriteGlow;
          if (p.type === 'whiteHot') {
            sprite = spriteWhiteHot;
          } else if (p.type === 'dust') {
            sprite = spriteDust;
          }

          ctx.globalAlpha = p.opacity;
          ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        });
        ctx.globalAlpha = 1.0;

        // --- PHASE 4C: DRAW EVENT HORIZON (BLACK SHADOW) ---
        ctx.beginPath();
        let shadowOffsetX = 0;
        let shadowRadius = Rs;
        if (params.spin > 0) {
          const spinFactor = 0.5 * (1.0 + Math.sqrt(1.0 - params.spin * params.spin));
          shadowRadius = Rs * spinFactor;
          shadowOffsetX = params.spin * Rs * 0.15;
          ctx.arc(center + shadowOffsetX, center, shadowRadius, 0, Math.PI * 2);
        } else {
          ctx.arc(center, center, Rs, 0, Math.PI * 2);
        }
        ctx.fillStyle = '#000000'; // Pure, absolute physical blackness
        ctx.fill();

        // --- PHASE 4D: DRAW GLOWING PHOTON SPHERE RING (Gargantua's razor-thin boundary ring) ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(center + shadowOffsetX, center, shadowRadius + 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 245, 200, 0.95)'; // brilliant white-gold core
        ctx.lineWidth = 1.2;
        if (params.cinematicBloom) {
          ctx.shadowColor = '#F27D26';
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.restore();

        // --- PHASE 4E: DRAW HORIZONTAL EQUATORIAL FLARE GLOW (Crossing in front of BH) ---
        ctx.save();
        const flareGrad = ctx.createLinearGradient(
          center - Rs * 5.0, center,
          center + Rs * 5.0, center
        );
        if (params.dopplerEffect) {
          flareGrad.addColorStop(0.0, 'rgba(215, 85, 15, 0.0)');
          flareGrad.addColorStop(0.15, 'rgba(215, 85, 15, 0.15)');
          flareGrad.addColorStop(0.35, 'rgba(255, 185, 30, 0.8)'); // left-center is extremely bright
          flareGrad.addColorStop(0.48, 'rgba(255, 245, 210, 0.95)'); // near the left edge of BH shadow
          flareGrad.addColorStop(0.52, 'rgba(255, 155, 20, 0.6)');   // crossing front of BH shadow
          flareGrad.addColorStop(0.75, 'rgba(215, 85, 15, 0.35)');   // right side is dimmer
          flareGrad.addColorStop(1.0, 'rgba(15, 8, 4, 0.0)');
        } else {
          flareGrad.addColorStop(0.0, 'rgba(242, 125, 38, 0.0)');
          flareGrad.addColorStop(0.3, 'rgba(242, 125, 38, 0.6)');
          flareGrad.addColorStop(0.5, 'rgba(255, 235, 180, 0.95)');
          flareGrad.addColorStop(0.7, 'rgba(242, 125, 38, 0.6)');
          flareGrad.addColorStop(1.0, 'rgba(242, 125, 38, 0.0)');
        }

        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        const ellipseHeight = Rs * 0.48 * Math.max(0.08, cosInc);
        ctx.ellipse(center, center, Rs * 4.8, ellipseHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- PHASE 4F: DRAW FOREGROUND PARTICLES (z < 0) ---
        projectedParticles.forEach(p => {
          if (p.z >= 0) return; // skip background particles (already drawn)

          // Foreground particles pass in front of the shadow and look stunning
          let sprite = spriteGlow;
          if (p.type === 'whiteHot') {
            sprite = spriteWhiteHot;
          } else if (p.type === 'dust') {
            sprite = spriteDust;
          }

          ctx.globalAlpha = p.opacity;
          ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        });
        ctx.globalAlpha = 1.0;
      }

      // 5. DRAW GLOWING PHOTON SPHERE (SFERA DEI FOTONI, 1.5 * Rs - Dotted helper line)
      if (params.showPhotonSphere) {
        ctx.beginPath();
        ctx.arc(center, center, photonSphereRadius, 0, Math.PI * 2);
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'; // faint red dashed ring
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]); // restore solid lines

        // Add small text label
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.fillText('PHOTON ORBIT SPHERE (1.5 Rs)', center + photonSphereRadius + 5, center - 5);
      }

      // 6. DRAW EVENT HORIZON ONLY IF NO ACCRETION DISK (Otherwise drawn inside sorted phases)
      if (!params.showAccretionDisk) {
        ctx.beginPath();
        let shadowOffsetX = 0;
        let shadowRadius = Rs;
        if (params.spin > 0) {
          const spinFactor = 0.5 * (1.0 + Math.sqrt(1.0 - params.spin * params.spin));
          shadowRadius = Rs * spinFactor;
          shadowOffsetX = params.spin * Rs * 0.15;
          ctx.arc(center + shadowOffsetX, center, shadowRadius, 0, Math.PI * 2);
        } else {
          ctx.arc(center, center, Rs, 0, Math.PI * 2);
        }
        ctx.fillStyle = '#000000'; // Pure, absolute physical blackness
        ctx.fill();

        // Add elegant faint orange inner glow around the event horizon boundary
        ctx.beginPath();
        ctx.arc(center, center, Rs + 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.25)'; // delicate orange ring
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, stars, particles, params, mobileSource]);

  // Unified drag, orbit, touch and double-click camera handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dimensions.width / 2;
    const y = e.clientY - rect.top - dimensions.height / 2;
 
    if (params.showMobileSource) {
      const distanceToSource = Math.sqrt((x - mobileSource.x) ** 2 + (y - mobileSource.y) ** 2);
      if (distanceToSource < 25) {
        setMobileSource(prev => ({ ...prev, isDragging: true }));
        return;
      }
    }

    isDraggingCameraRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };
 
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mobileSource.isDragging && params.showMobileSource) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dimensions.width / 2;
      const y = e.clientY - rect.top - dimensions.height / 2;
      setMobileSource(prev => ({ ...prev, x, y }));
      return;
    }

    if (isDraggingCameraRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      
      manualAzimuthRef.current += dx * 0.007;
      manualInclinationRef.current -= dy * 0.35;

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };
 
  const handleMouseUp = () => {
    setMobileSource(prev => ({ ...prev, isDragging: false }));
    isDraggingCameraRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left - dimensions.width / 2;
    const y = touch.clientY - rect.top - dimensions.height / 2;

    if (params.showMobileSource) {
      const distanceToSource = Math.sqrt((x - mobileSource.x) ** 2 + (y - mobileSource.y) ** 2);
      if (distanceToSource < 35) {
        setMobileSource(prev => ({ ...prev, isDragging: true }));
        return;
      }
    }

    isDraggingCameraRef.current = true;
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];

    if (mobileSource.isDragging && params.showMobileSource) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - dimensions.width / 2;
      const y = touch.clientY - rect.top - dimensions.height / 2;
      setMobileSource(prev => ({ ...prev, x, y }));
      return;
    }

    if (isDraggingCameraRef.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
      const dx = touch.clientX - lastMousePosRef.current.x;
      const dy = touch.clientY - lastMousePosRef.current.y;
      
      manualAzimuthRef.current += dx * 0.008;
      manualInclinationRef.current -= dy * 0.4;

      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    setMobileSource(prev => ({ ...prev, isDragging: false }));
    isDraggingCameraRef.current = false;
  };

  const handleDoubleClick = () => {
    manualAzimuthRef.current = 0;
    manualInclinationRef.current = 0;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };



  return (
    <div 
      id="sim-canvas-container" 
      ref={containerRef} 
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-black overflow-hidden"
          : "w-full h-full flex items-center justify-center bg-black rounded-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10 relative"
      }
    >
      <canvas
        id="black-hole-canvas"
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className="block cursor-pointer max-w-full touch-none"
      />
      
      {params.cinematicBloom && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] mix-blend-multiply opacity-80" />
      )}

      {params.cinematicCamera && (
        <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/30 text-[#F27D26] px-2.5 py-1.5 rounded-sm text-[9px] font-mono select-none backdrop-blur-sm pointer-events-none uppercase tracking-widest font-bold flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          Cinematica 4D
        </div>
      )}

      {/* Floating control buttons */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          className="bg-black/80 hover:bg-white/10 text-white border border-white/15 px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm transition-all flex items-center gap-1.5 select-none cursor-pointer active:scale-95"
          title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
        >
          {isFullscreen ? <Minimize size={13} className="text-[#F27D26]" /> : <Maximize size={13} className="text-[#F27D26]" />}
          <span>{isFullscreen ? 'Esci' : 'Schermo Intero'}</span>
        </button>

        <div className="hidden md:block bg-black/80 border border-white/10 px-3 py-1.5 rounded-sm text-[9px] font-mono text-white/50 select-none backdrop-blur-sm pointer-events-none uppercase tracking-widest leading-normal">
          🖐️ Trascina / Tocca per ruotare • Doppio clic per resettare
        </div>
      </div>

      {params.showMobileSource && (
        <div className="absolute top-16 left-4 bg-black/80 border border-white/10 px-3 py-1.5 rounded-sm text-xs font-mono text-sky-400 select-none backdrop-blur-sm pointer-events-none uppercase tracking-wider font-bold">
          ✨ Trascina il faro per simulare la Lente Gravitazionale
        </div>
      )}

      {/* Decorative scale banner to match astrophysical laboratory theme */}
      <div className="absolute bottom-4 left-4 bg-black/80 border border-white/10 px-3 py-1.5 rounded-sm text-[9px] font-mono text-white/40 select-none backdrop-blur-sm pointer-events-none uppercase tracking-widest leading-normal">
        <div>Proiezione: Orbita Relativistica 3D + Tempo Dilatato 4D</div>
        <div>Metrica: Schwarzschild / Kerr (Spin: {params.spin.toFixed(2)})</div>
      </div>
    </div>
  );
};
