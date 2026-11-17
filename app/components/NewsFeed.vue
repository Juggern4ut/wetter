<script setup lang="ts">
export interface NewsItem { title: string, teaser: string, image: string | null, source: string, publishedAt: number }

const props = defineProps<{ items: NewsItem[], now: number }>()

const SLIDE_MS = 12 * 1000 // Anzeigedauer pro Artikel

const index = ref(0)
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    if (props.items.length) index.value = (index.value + 1) % props.items.length
  }, SLIDE_MS)
})
onBeforeUnmount(() => clearInterval(timer))

// Nach einem Refresh kann die Liste kürzer sein
watch(() => props.items.length, (n) => {
  if (index.value >= n) index.value = 0
})

function ago(ts: number) {
  const min = Math.max(0, Math.round((props.now - ts) / 60000))
  if (min < 60) return min <= 1 ? 'gerade eben' : `vor ${min} Min.`
  const h = Math.round(min / 60)
  if (h < 24) return `vor ${h} Std.`
  const d = Math.round(h / 24)
  return d === 1 ? 'gestern' : `vor ${d} Tagen`
}
</script>

<template>
  <aside class="news panel">
    <div class="head">
      <h2>News Niederamt</h2>
      <span v-if="items.length" class="count">{{ index + 1 }} / {{ items.length }}</span>
    </div>

    <div v-if="items.length" class="slides">
      <!-- Alle Slides bleiben im DOM, damit die Bilder vorgeladen sind -->
      <article
        v-for="(n, i) in items" :key="n.publishedAt + n.title"
        class="slide" :class="{ active: i === index }"
      >
        <div class="image">
          <img v-if="n.image" :src="n.image" alt="">
        </div>
        <div class="meta">
          <span class="source">{{ n.source }}</span>
          <span class="ago">{{ ago(n.publishedAt) }}</span>
        </div>
        <h3 class="title">{{ n.title }}</h3>
        <p v-if="n.teaser" class="teaser">{{ n.teaser }}</p>
      </article>
    </div>
    <p v-else class="empty">Zurzeit keine News verfügbar</p>

    <div v-if="items.length > 1" class="progress">
      <span v-for="(n, i) in items" :key="'p' + i" :class="{ done: i < index, active: i === index }">
        <i v-if="i === index" :key="index" :style="{ animationDuration: SLIDE_MS + 'ms' }" />
      </span>
    </div>
  </aside>
</template>

<style scoped>
.news { padding: 24px 32px 28px; display: flex; flex-direction: column; gap: 18px; min-height: 0; overflow: hidden; }
.head { display: flex; justify-content: space-between; align-items: baseline; }
h2 { margin: 0; font-size: 22px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 2px; }
.count { color: var(--muted); font-size: 18px; font-variant-numeric: tabular-nums; }

.slides { position: relative; flex: 1; min-height: 0; }
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateX(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.slide.active { opacity: 1; transform: none; }

.image {
  flex: none;
  aspect-ratio: 16 / 9;
  max-height: 45%;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}
.image img { width: 100%; height: 100%; object-fit: cover; display: block; }

.meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 20px; font-size: 15px; text-transform: uppercase; letter-spacing: 1.2px; }
.source { color: var(--rain); font-weight: 500; }
.ago { color: var(--muted); white-space: nowrap; }

.title {
  margin: 10px 0 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: none;
}
.teaser {
  margin: 14px 0 0;
  font-size: 21px;
  line-height: 1.45;
  color: #c3cad6;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 0;
}

.progress { display: flex; gap: 8px; flex: none; }
.progress span { flex: 1; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.progress span.done { background: rgba(96, 165, 250, 0.6); }
.progress i { display: block; height: 100%; background: var(--rain); animation: fill linear forwards; transform-origin: left; }
@keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.empty { color: var(--muted); font-size: 20px; }
</style>
