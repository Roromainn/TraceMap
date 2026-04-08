export type SpeedUnit = 'min_km' | 'km_h' | 'min_mile' | 'mph';

export const SPEED_UNIT_LABELS: Record<SpeedUnit, string> = {
  min_km: 'min/km',
  km_h: 'km/h',
  min_mile: 'min/mi',
  mph: 'mph',
};

/**
 * Formate une vitesse en m/s dans l'unité choisie.
 * min/km et min/mile retournent "5:30", km/h et mph retournent "10.8"
 */
export function formatSpeed(speedMs: number, unit: SpeedUnit): string {
  if (speedMs <= 0) return unit === 'min_km' || unit === 'min_mile' ? '--:--' : '0.0';

  switch (unit) {
    case 'min_km': {
      const secPerKm = 1000 / speedMs;
      const min = Math.floor(secPerKm / 60);
      const sec = Math.round(secPerKm % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
    }
    case 'km_h':
      return (speedMs * 3.6).toFixed(1);
    case 'min_mile': {
      const secPerMile = 1609.34 / speedMs;
      const min = Math.floor(secPerMile / 60);
      const sec = Math.round(secPerMile % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
    }
    case 'mph':
      return (speedMs * 2.23694).toFixed(1);
  }
}

/**
 * Convertit m/s en valeur numérique dans l'unité (pour les graphiques).
 */
export function speedToUnit(speedMs: number, unit: SpeedUnit): number {
  if (speedMs <= 0) return 0;
  switch (unit) {
    case 'min_km':
      return parseFloat((1000 / (speedMs * 60)).toFixed(2)); // min/km
    case 'km_h':
      return parseFloat((speedMs * 3.6).toFixed(2));
    case 'min_mile':
      return parseFloat((1609.34 / (speedMs * 60)).toFixed(2));
    case 'mph':
      return parseFloat((speedMs * 2.23694).toFixed(2));
  }
}

/**
 * Label de l'axe Y pour les graphiques selon l'unité.
 */
export function speedAxisLabel(unit: SpeedUnit): string {
  return SPEED_UNIT_LABELS[unit];
}
