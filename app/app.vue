<script setup lang="ts">
import type { HourPoint } from '~/components/HourlyChart.vue'

const REFRESH_MS = 5 * 60 * 1000 // Daten alle 5 Min. neu laden (Server cached 10 Min.)
const RELOAD_MS = 6 * 60 * 60 * 1000 // Kompletter Seiten-Reload alle 6 Std. (neue Deploys, Speicher)
const STALE_MS = 60 * 60 * 1000

const { data, refresh, error } = await useFetch('/api/weather')

// ---- Uhr ----
const now = ref(Date.now())

// ---- Skalierung der 1920x1080-Bühne auf beliebige Bildschirme ----
const scale = ref(1)
function fit() {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
}

let tick: ReturnType<typeof setInterval>
let poll: ReturnType<typeof setInterval>
let reload: ReturnType<typeof setTimeout>
onMounted(() => {
  fit()
  window.addEventListener('resize', fit)
  tick = setInterval(() => (now.value = Date.now()), 1000)
  poll = setInterval(() => refresh(), REFRESH_MS)
  reload = setTimeout(() => location.reload(), RELOAD_MS)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', fit)
  clearInterval(tick)
  clearInterval(poll)
  clearTimeout(reload)
})

// ---- Aufbereitung ----
const f = computed(() => data.value?.forecast)
const warnings = computed(() => data.value?.warnings ?? [])

const current = computed(() => {
  const c = f.value?.current
  if (!c) return null
  return {
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    wind: Math.round(c.wind_speed_10m),
    gusts: Math.round(c.wind_gusts_10m),
    windDir: compass(c.wind_direction_10m),
    code: c.weather_code,
    isDay: !!c.is_day,
  }
})

const today = computed(() => {
  const d = f.value?.daily
  if (!d) return null
  return {
    max: Math.round(d.temperature_2m_max[0]),
    min: Math.round(d.temperature_2m_min[0]),
    sunrise: d.sunrise[0].slice(11, 16),
    sunset: d.sunset[0].slice(11, 16),
    prob: d.precipitation_probability_max[0],
  }
})

const hours = computed<HourPoint[]>(() => {
  const h = f.value?.hourly
  if (!h) return []
  const key = zurichHourKey(new Date(now.value))
  let start = h.time.findIndex((t: string) => t.startsWith(key))
  if (start < 0) start = 0
  return h.time.slice(start, start + 24).map((t: string, i: number) => ({
    time: t,
    temp: h.temperature_2m[start + i],
    prob: h.precipitation_probability[start + i] ?? 0,
    code: h.weather_code[start + i],
    isDay: !!h.is_day[start + i],
  }))
})

const days = computed(() => {
  const d = f.value?.daily
  if (!d) return []
  const todayKey = zurichHourKey(new Date(now.value)).slice(0, 10)
  let start = d.time.indexOf(todayKey)
  if (start < 0) start = 0
  return d.time.slice(start, start + 7).map((t: string, i: number) => {
    const j = start + i
    const info = parseDay(t)
    return {
      key: t,
      name: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : info.weekday,
      date: info.date,
      code: d.weather_code[j],
      max: Math.round(d.temperature_2m_max[j]),
      min: Math.round(d.temperature_2m_min[j]),
      prob: d.precipitation_probability_max[j] ?? 0,
      sum: d.precipitation_sum[j] ?? 0,
    }
  })
})

const stale = computed(() => !!error.value || (data.value && now.value - data.value.fetchedAt > STALE_MS))
</script>

<template>
  <div class="viewport">
    <main class="stage" :style="{ transform: `translate(-50%, -50%) scale(${scale})` }">
      <!-- Kopfzeile -->
      <header class="header">
        <div>
          <h1>Niedergösgen</h1>
          <p class="sub">5013 · Kanton Solothurn</p>
        </div>
        <div class="clock">
          <div class="time">{{ formatTime(now) }}</div>
          <div class="date">{{ formatLongDate(now) }}</div>
        </div>
      </header>

      <WarningBanner v-if="warnings.length" :warnings="warnings" />

      <!-- Aktuell + 24h -->
      <section class="main">
        <div v-if="current && today" class="now panel">
          <div class="now-top">
            <img :src="weatherIcon(current.code, current.isDay)" class="now-icon" alt="">
            <div>
              <div class="now-temp">{{ current.temp }}<span>°</span></div>
              <div class="now-label">{{ weatherLabel(current.code) }}</div>
            </div>
          </div>
          <div class="stats">
            <div class="stat">
              <span class="k">Min / Max</span>
              <span class="v"><span class="cold">{{ today.min }}°</span> / <span class="warm">{{ today.max }}°</span></span>
            </div>
            <div class="stat">
              <span class="k">Gefühlt</span>
              <span class="v">{{ current.feels }}°</span>
            </div>
            <div class="stat">
              <span class="k">Regenrisiko</span>
              <span class="v rain">{{ today.prob }}%</span>
            </div>
            <div class="stat">
              <span class="k">Wind {{ current.windDir }}</span>
              <span class="v">{{ current.wind }} <small>km/h</small></span>
            </div>
            <div class="stat">
              <span class="k">Böen</span>
              <span class="v">{{ current.gusts }} <small>km/h</small></span>
            </div>
            <div class="stat">
              <span class="k">Feuchte</span>
              <span class="v">{{ current.humidity }}%</span>
            </div>
            <div class="stat">
              <span class="k">Sonne</span>
              <span class="v sun">{{ today.sunrise }} – {{ today.sunset }}</span>
            </div>
          </div>
        </div>

        <div class="hourly panel">
          <div class="panel-head">
            <h2>Nächste 24 Stunden</h2>
            <div class="legend">
              <span><i class="dot warm-bg" /> Temperatur</span>
              <span><i class="dot rain-bg" /> Niederschlagswahrscheinlichkeit</span>
            </div>
          </div>
          <HourlyChart v-if="hours.length" :hours="hours" />
        </div>
      </section>

      <!-- 7 Tage -->
      <section class="days">
        <article v-for="d in days" :key="d.key" class="day panel" :class="{ today: d.name === 'Heute' }">
          <div class="day-name">{{ d.name }}</div>
          <div class="day-date">{{ d.date }}</div>
          <img :src="weatherIcon(d.code)" class="day-icon" alt="">
          <div class="day-temp">
            <span class="max">{{ d.max }}°</span>
            <span class="min">{{ d.min }}°</span>
          </div>
          <div class="day-rain">
            <img src="/icons/raindrop.svg" alt="">
            <span class="pct">{{ d.prob }}%</span>
            <span class="mm">{{ d.sum.toFixed(1) }} mm</span>
          </div>
          <div class="bar"><div :style="{ width: d.prob + '%' }" /></div>
        </article>
      </section>

      <footer class="status" :class="{ stale }">
        <template v-if="stale">⚠ Verbindung gestört – letzte Daten: </template>
        <template v-else>Aktualisiert </template>
        {{ data ? formatTime(data.fetchedAt) : '–' }} · Daten: Open-Meteo, MeteoSwiss
      </footer>
    </main>
  </div>
</template>

<style scoped>
.viewport { position: fixed; inset: 0; overflow: hidden; }
.stage {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1920px;
  height: 1080px;
  transform-origin: center;
  padding: 48px 64px 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  background:
    radial-gradient(1200px 700px at 85% -10%, rgba(59, 130, 246, 0.14), transparent 60%),
    radial-gradient(900px 600px at 0% 110%, rgba(251, 191, 36, 0.07), transparent 60%),
    var(--bg);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 28px;
}

/* Kopf */
.header { display: flex; justify-content: space-between; align-items: flex-end; }
h1 { margin: 0; font-size: 56px; font-weight: 300; letter-spacing: -1px; line-height: 1; }
.sub { margin: 10px 0 0; color: var(--muted); font-size: 22px; }
.clock { text-align: right; }
.clock .time { font-size: 72px; font-weight: 200; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -2px; }
.clock .date { color: var(--muted); font-size: 22px; margin-top: 8px; }

/* Hauptbereich */
.main { flex: 1; min-height: 0; display: grid; grid-template-columns: 720px minmax(0, 1fr); gap: 28px; }

.now { padding: 28px 36px; display: flex; flex-direction: column; justify-content: center; gap: 24px; min-height: 0; }
.now-top { display: flex; align-items: center; gap: 12px; }
.now-icon { width: 240px; height: 240px; margin: -30px -10px -30px -30px; }
.now-temp { font-size: 160px; font-weight: 200; line-height: 0.9; letter-spacing: -6px; }
.now-temp span { color: var(--muted); font-weight: 100; }
.now-label { font-size: 32px; color: var(--muted); margin-top: 8px; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px 16px; }
.stat { display: flex; flex-direction: column; gap: 4px; }
.stat:last-child { grid-column: span 2; }
.k { color: var(--muted); font-size: 18px; text-transform: uppercase; letter-spacing: 1.5px; }
.v { font-size: 30px; font-weight: 400; font-variant-numeric: tabular-nums; white-space: nowrap; }
.v small { font-size: 18px; color: var(--muted); }
.warm { color: var(--warm); }
.cold { color: var(--cold); }
.rain { color: var(--rain); }

.hourly { padding: 24px 32px 20px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.panel-head { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0; font-size: 22px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }
.legend { display: flex; gap: 28px; color: var(--muted); font-size: 18px; }
.legend span { display: flex; align-items: center; gap: 10px; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.warm-bg { background: var(--warm); }
.rain-bg { background: var(--rain); }

/* 7 Tage */
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 20px; height: 300px; flex: none; }
.day { padding: 20px 22px; display: flex; flex-direction: column; align-items: center; }
.day.today { background: rgba(96, 165, 250, 0.08); border-color: rgba(96, 165, 250, 0.25); }
.day-name { font-size: 26px; font-weight: 500; }
.day-date { font-size: 17px; color: var(--muted); margin-top: 2px; }
.day-icon { width: 120px; height: 120px; margin: -2px 0 -10px; }
.day-temp { display: flex; gap: 16px; align-items: baseline; font-variant-numeric: tabular-nums; }
.day-temp .max { font-size: 38px; font-weight: 400; }
.day-temp .min { font-size: 28px; color: var(--muted); font-weight: 300; }
.day-rain { display: flex; align-items: center; gap: 6px; margin-top: auto; width: 100%; }
.day-rain img { width: 34px; height: 34px; margin: -6px -4px -6px -8px; }
.day-rain .pct { font-size: 24px; color: var(--rain); font-weight: 500; font-variant-numeric: tabular-nums; }
.day-rain .mm { margin-left: auto; font-size: 18px; color: var(--muted); }
.bar { width: 100%; height: 6px; background: rgba(255, 255, 255, 0.07); border-radius: 3px; margin-top: 10px; overflow: hidden; }
.bar div { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 3px; transition: width 0.6s; }

.status { margin-top: -12px; text-align: right; color: rgba(140, 151, 171, 0.6); font-size: 15px; }
.status.stale { color: #f87171; }
</style>
