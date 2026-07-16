export interface BlackHoleParams {
  mass: number; // in solar masses (e.g., 4M to 10B)
  spin: number; // Kerr spin parameter (0.0 to 0.99)
  distance: number; // Observer distance in AU
  inclination: number; // Inclination of the accretion disk (0 to 90 degrees)
  diskRadiusMax: number; // Accretion disk outer radius in Schwarzschild units
  diskBrightness: number; // Disk luminosity slider
  dopplerEffect: boolean; // Toggle relativistic Doppler beaming/redshift
  starDensity: number; // Number of background stars (500 to 2000)
  einsteinRingEnabled: boolean; // Toggle Einstein ring visualization
  selectedPreset: string; // Active configuration preset
  viewMode: 'space-time' | 'ray-tracer'; // View toggler
  showGrid: boolean; // Toggle space-time grid
  showPhotonSphere: boolean; // Toggle photon sphere guide (1.5 Rs)
  showAccretionDisk: boolean; // Toggle disk visibility
  showMobileSource: boolean; // Toggle interactive drag-and-drop star
  cinematicCamera?: boolean; // Cinematic auto-orbit camera
  timeDilation?: number; // Spacetime time scale factor (1.0 to 10.0)
  cinematicBloom?: boolean; // Enable bloom filters and glares
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  mass: number; // in solar masses (used for display, scale is represented relative)
  spin: number;
  distance: number;
  inclination: number;
  diskRadiusMax: number;
  diskBrightness: number;
  dopplerEffect: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
