// Liefert Prognose (Open-Meteo) und offizielle Warnungen (MeteoSwiss) für 5013 Niedergösgen.
// Gecacht für 10 Minuten, damit mehrere Screens die APIs nicht unnötig belasten.

const LAT = 47.3725
const LON = 7.9969
const PLZ = '501300' // MeteoSwiss erwartet PLZ + "00"

interface MeteoSwissWarning {
  warnType: number
  warnLevel: number
  text: string
  validFrom: number
  validTo: number | null
  outlook: boolean
}

export interface WeatherWarning {
  type: number
  level: number
  text: string
  validFrom: number
  validTo: number | null
}

async function fetchForecast() {
  return await $fetch<any>('https://api.open-meteo.com/v1/forecast', {
    query: {
      latitude: LAT,
      longitude: LON,
      timezone: 'Europe/Zurich',
      forecast_days: 8,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'weather_code',
        'is_day', 'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m', 'precipitation',
      ].join(','),
      hourly: ['temperature_2m', 'precipitation_probability', 'precipitation', 'weather_code', 'is_day'].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
        'precipitation_sum', 'sunrise', 'sunset', 'wind_gusts_10m_max', 'uv_index_max',
      ].join(','),
    },
    timeout: 15000,
    retry: 2,
  })
}

async function fetchWarnings(): Promise<WeatherWarning[]> {
  try {
    const data = await $fetch<{ warnings?: MeteoSwissWarning[] }>(
      `https://app-prod-ws.meteoswiss-app.ch/v1/plzDetail?plz=${PLZ}`,
      { headers: { 'Accept-Language': 'de' }, timeout: 15000, retry: 2 },
    )
    const now = Date.now()
    return (data.warnings ?? [])
      .filter(w => !w.outlook && w.warnLevel >= 2 && (!w.validTo || w.validTo > now))
      .sort((a, b) => b.warnLevel - a.warnLevel || a.validFrom - b.validFrom)
      .map(w => ({ type: w.warnType, level: w.warnLevel, text: w.text, validFrom: w.validFrom, validTo: w.validTo }))
  }
  catch (err) {
    console.error('[weather] MeteoSwiss-Warnungen nicht abrufbar:', err)
    return []
  }
}

const getWeather = defineCachedFunction(async () => {
  const [forecast, warnings] = await Promise.all([fetchForecast(), fetchWarnings()])
  return { forecast, warnings, fetchedAt: Date.now() }
}, {
  maxAge: 60 * 10,
  swr: true,
  name: 'weather',
  getKey: () => 'niedergoesgen',
})

// Build-ID wird ausserhalb des Caches angehängt, damit Clients einen neuen Deploy
// sofort erkennen und sich selbst neu laden (siehe app.vue).
export default defineEventHandler(async () => {
  const data = await getWeather()
  return { ...data, build: useRuntimeConfig().app.buildId as string }
})
