<script setup lang="ts">
interface Warning { type: number, level: number, text: string, validFrom: number, validTo: number | null }

const props = defineProps<{ warnings: Warning[] }>()

const shown = computed(() => props.warnings.slice(0, 2))
const more = computed(() => props.warnings.length - shown.value.length)

function summary(text: string) {
  // Erste Zeile ("- Mögliche Auswirkungen: ...") ohne Aufzählungszeichen
  return (text.split('\n').find(l => l.trim()) ?? '').replace(/^\s*-\s*/, '')
}

function period(w: Warning) {
  const from = w.validFrom <= Date.now() ? 'jetzt' : formatDateTime(w.validFrom)
  return w.validTo ? `${from} – ${formatDateTime(w.validTo)}` : `ab ${from}`
}
</script>

<template>
  <section class="banner">
    <div v-for="(w, i) in shown" :key="i" class="warning">
      <svg class="warn-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        <path d="M12 10v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="18" r="1.2" fill="currentColor" />
      </svg>
      <div class="body">
        <div class="title">
          <strong>{{ WARN_TYPES[w.type] ?? 'Unwetter' }}warnung</strong>
          <span class="level">Stufe {{ w.level }} · {{ WARN_LEVELS[w.level] }}</span>
          <span class="period">{{ period(w) }}</span>
        </div>
        <p class="text">{{ summary(w.text) }}</p>
      </div>
    </div>
    <div v-if="more > 0" class="more">+ {{ more }} weitere Warnung{{ more > 1 ? 'en' : '' }}</div>
  </section>
</template>

<style scoped>
.banner {
  background: linear-gradient(90deg, #b91c1c, #dc2626);
  border-radius: 24px;
  padding: 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 0 60px rgba(220, 38, 38, 0.25);
}
.warning {
  display: flex;
  align-items: center;
  gap: 24px;
}
.warn-icon {
  width: 52px;
  height: 52px;
  flex: none;
  color: #fff;
  animation: pulse 2s ease-in-out infinite;
}
.body { min-width: 0; flex: 1; }
.title {
  display: flex;
  align-items: baseline;
  gap: 20px;
  font-size: 30px;
}
.title strong { font-weight: 600; }
.level, .period { font-size: 24px; opacity: 0.85; }
.period { margin-left: auto; font-variant-numeric: tabular-nums; }
.text {
  margin: 4px 0 0;
  font-size: 21px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.more { font-size: 20px; opacity: 0.8; padding-left: 76px; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
