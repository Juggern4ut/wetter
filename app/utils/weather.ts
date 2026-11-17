export const TZ = 'Europe/Zurich'

const CODES: Record<number, { label: string, day: string, night: string }> = {
  0: { label: 'Klar', day: 'clear-day', night: 'clear-night' },
  1: { label: 'Überwiegend sonnig', day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  2: { label: 'Teilweise bewölkt', day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  3: { label: 'Bedeckt', day: 'overcast-day', night: 'overcast-night' },
  45: { label: 'Nebel', day: 'fog-day', night: 'fog-night' },
  48: { label: 'Gefrierender Nebel', day: 'fog-day', night: 'fog-night' },
  51: { label: 'Leichter Nieselregen', day: 'partly-cloudy-day-drizzle', night: 'partly-cloudy-night-drizzle' },
  53: { label: 'Nieselregen', day: 'drizzle', night: 'drizzle' },
  55: { label: 'Starker Nieselregen', day: 'drizzle', night: 'drizzle' },
  56: { label: 'Gefrierender Niesel', day: 'sleet', night: 'sleet' },
  57: { label: 'Gefrierender Niesel', day: 'sleet', night: 'sleet' },
  61: { label: 'Leichter Regen', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain' },
  63: { label: 'Regen', day: 'rain', night: 'rain' },
  65: { label: 'Starker Regen', day: 'rain', night: 'rain' },
  66: { label: 'Gefrierender Regen', day: 'sleet', night: 'sleet' },
  67: { label: 'Gefrierender Regen', day: 'sleet', night: 'sleet' },
  71: { label: 'Leichter Schneefall', day: 'partly-cloudy-day-snow', night: 'partly-cloudy-night-snow' },
  73: { label: 'Schneefall', day: 'snow', night: 'snow' },
  75: { label: 'Starker Schneefall', day: 'snow', night: 'snow' },
  77: { label: 'Schneegriesel', day: 'snow', night: 'snow' },
  80: { label: 'Regenschauer', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain' },
  81: { label: 'Regenschauer', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain' },
  82: { label: 'Heftige Regenschauer', day: 'rain', night: 'rain' },
  85: { label: 'Schneeschauer', day: 'partly-cloudy-day-snow', night: 'partly-cloudy-night-snow' },
  86: { label: 'Starke Schneeschauer', day: 'snow', night: 'snow' },
  95: { label: 'Gewitter', day: 'thunderstorms-day-rain', night: 'thunderstorms-night-rain' },
  96: { label: 'Gewitter mit Hagel', day: 'hail', night: 'hail' },
  99: { label: 'Gewitter mit Hagel', day: 'hail', night: 'hail' },
}

export function weatherLabel(code: number) {
  return CODES[code]?.label ?? 'Unbekannt'
}

export function weatherIcon(code: number, isDay = true) {
  const c = CODES[code]
  return `/icons/${c ? (isDay ? c.day : c.night) : 'not-available'}.svg`
}

export const WARN_TYPES: Record<number, string> = {
  0: 'Sturm',
  1: 'Gewitter',
  2: 'Regen',
  3: 'Schnee',
  4: 'Strassenglätte',
  5: 'Frost',
  6: 'Massenbewegungen',
  7: 'Hitze',
  8: 'Lawinen',
  9: 'Erdbeben',
  10: 'Waldbrand',
  11: 'Hochwasser',
}

export const WARN_LEVELS: Record<number, string> = {
  2: 'Mässige Gefahr',
  3: 'Erhebliche Gefahr',
  4: 'Grosse Gefahr',
  5: 'Sehr grosse Gefahr',
}

export function compass(deg: number) {
  return ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8]
}

/** Aktuelle Zürcher Ortszeit als "YYYY-MM-DDTHH" (Format wie Open-Meteo, ohne Minuten). */
export function zurichHourKey(date = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map(x => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day}T${p.hour}`
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

/** "2026-11-18" -> { weekday: "Mittwoch", short: "Mi", date: "18.11." } */
export function parseDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]!
  return { weekday: wd, short: wd.slice(0, 2), date: `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.` }
}

export function formatTime(ts: number | Date) {
  return new Intl.DateTimeFormat('de-CH', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(ts)
}

export function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(ts)
}

export function formatLongDate(ts: number | Date) {
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(ts)
}
