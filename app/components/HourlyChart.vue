<script setup lang="ts">
export interface HourPoint { time: string, temp: number, prob: number, code: number, isDay: boolean }

const props = defineProps<{ hours: HourPoint[] }>()

const el = ref<HTMLElement>()
const size = reactive({ w: 1100, h: 440 })

onMounted(() => {
  const ro = new ResizeObserver(([e]) => {
    size.w = e!.contentRect.width
    size.h = e!.contentRect.height
  })
  ro.observe(el.value!)
  onBeforeUnmount(() => ro.disconnect())
})

const STEP = 3

const geo = computed(() => {
  const { w, h } = size
  const n = props.hours.length || 1
  const pad = 28
  const col = (w - pad * 2) / n
  const x = (i: number) => pad + col * (i + 0.5)

  const temps = props.hours.map(p => p.temp)
  const tMin = Math.min(...temps)
  const tMax = Math.max(...temps)
  const span = Math.max(tMax - tMin, 4)
  const mid = (tMax + tMin) / 2

  const barBottom = h - 34
  const barTop = barBottom - Math.min(90, h * 0.2)
  const lineTop = 164
  const lineBottom = Math.max(lineTop + 40, barTop - 40)
  const y = (t: number) => lineBottom - ((t - (mid - span / 2)) / span) * (lineBottom - lineTop)

  const pts = props.hours.map((p, i) => [x(i), y(p.temp)] as const)
  // Weiche Kurve (Catmull-Rom -> Bezier)
  let d = ''
  pts.forEach(([px, py], i) => {
    if (i === 0) { d = `M${px},${py}`; return }
    const p0 = pts[i - 2] ?? pts[i - 1]!
    const p1 = pts[i - 1]!
    const p3 = pts[i + 1] ?? [px, py]
    const c1x = p1[0] + (px - p0[0]) / 6
    const c1y = p1[1] + (py - p0[1]) / 6
    const c2x = px - (p3[0] - p1[0]) / 6
    const c2y = py - (p3[1] - p1[1]) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${px},${py}`
  })
  const area = pts.length ? `${d} L${pts.at(-1)![0]},${lineBottom + 30} L${pts[0]![0]},${lineBottom + 30} Z` : ''

  const bars = props.hours.map((p, i) => {
    const bh = (Math.max(p.prob, 0) / 100) * (barBottom - barTop)
    return { x: x(i) - col * 0.32, w: col * 0.64, y: barBottom - bh, h: Math.max(bh, 2) }
  })

  return { x, y, d, area, bars, barTop, barBottom, lineBottom, col }
})

const labels = computed(() => props.hours
  .map((p, i) => ({ ...p, i }))
  .filter(p => p.i % STEP === 0))
</script>

<template>
  <div ref="el" class="chart">
    <svg :width="size.w" :height="size.h" :viewBox="`0 0 ${size.w} ${size.h}`">
      <defs>
        <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fbbf24" stop-opacity="0.28" />
          <stop offset="1" stop-color="#fbbf24" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="barFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#60a5fa" />
          <stop offset="1" stop-color="#3b82f6" stop-opacity="0.5" />
        </linearGradient>
      </defs>

      <!-- Zeiten + Icons -->
      <g v-for="p in labels" :key="p.time">
        <text :x="geo.x(p.i)" y="24" class="time" text-anchor="middle">
          {{ p.i === 0 ? 'Jetzt' : p.time.slice(11, 13) + ' Uhr' }}
        </text>
        <image :href="weatherIcon(p.code, p.isDay)" :x="geo.x(p.i) - 40" y="36" width="80" height="80" />
      </g>

      <!-- Temperatur -->
      <path :d="geo.area" fill="url(#tempFill)" />
      <path :d="geo.d" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
      <g v-for="p in labels" :key="'t' + p.time">
        <circle :cx="geo.x(p.i)" :cy="geo.y(p.temp)" r="7" fill="#0f172a" stroke="#fbbf24" stroke-width="4" />
        <text :x="geo.x(p.i)" :y="geo.y(p.temp) - 20" class="temp" text-anchor="middle">{{ Math.round(p.temp) }}°</text>
      </g>

      <!-- Niederschlagswahrscheinlichkeit -->
      <line x1="0" :x2="size.w" :y1="geo.barBottom" :y2="geo.barBottom" stroke="rgba(255,255,255,0.08)" />
      <rect
        v-for="(b, i) in geo.bars" :key="'b' + i"
        :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="4"
        fill="url(#barFill)" :opacity="hours[i]!.prob > 0 ? 1 : 0.25"
      />
      <text
        v-for="p in labels" :key="'p' + p.time"
        :x="geo.x(p.i)" :y="size.h - 4" class="prob" text-anchor="middle"
      >{{ p.prob }}%</text>
    </svg>
  </div>
</template>

<style scoped>
.chart { position: relative; flex: 1; min-height: 0; overflow: hidden; }
svg { position: absolute; inset: 0; display: block; }
.time { fill: var(--muted); font-size: 20px; }
.temp { fill: var(--text); font-size: 26px; font-weight: 500; }
.prob { fill: #93c5fd; font-size: 19px; font-variant-numeric: tabular-nums; }
</style>
