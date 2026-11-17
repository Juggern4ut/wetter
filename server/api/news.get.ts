// Liefert die neuesten Lokalnews aus dem Niederamt (RSS-Feed des Oltner Tagblatts)
// inkl. Teaser und Bild. Gecacht für 30 Minuten, damit mehrere Screens den Feed nicht
// unnötig abfragen.

const FEED_URL = 'https://www.oltnertagblatt.ch/solothurn/niederamt.rss'
const SOURCE = 'Oltner Tagblatt'
const MAX_ITEMS = 6

export interface NewsItem {
  title: string
  teaser: string
  image: string | null
  source: string
  publishedAt: number
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ' }
function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&(\w+);/g, (m, n) => ENTITIES[n] ?? m)
    .replace(/<[^>]+>/g, '') // evtl. HTML im Teaser
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`))
  return m ? decode(m[1]!) : ''
}

function image(xml: string) {
  const m = xml.match(/<media:(?:thumbnail|content)\b[^>]*\burl="([^"]+)"/)
  return m ? decode(m[1]!) : null
}

const getNews = defineCachedFunction(async () => {
  const xml = await $fetch<string>(FEED_URL, {
    responseType: 'text',
    headers: { 'User-Agent': 'Mozilla/5.0 (Wetterdisplay)' },
    timeout: 15000,
    retry: 2,
  })

  const items: NewsItem[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => ({
      title: tag(item!, 'title'),
      teaser: tag(item!, 'description'),
      image: image(item!),
      source: SOURCE,
      publishedAt: Date.parse(tag(item!, 'pubDate')),
    }))
    .filter(n => n.title && !Number.isNaN(n.publishedAt))
    // Der Feed ist nicht streng chronologisch (z.B. angepinnte Sammelartikel)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_ITEMS)

  return { items, fetchedAt: Date.now() }
}, {
  maxAge: 60 * 30,
  swr: true,
  name: 'news',
  getKey: () => 'oltnertagblatt-niederamt',
})

export default defineEventHandler(async () => {
  try {
    return await getNews()
  }
  catch (err) {
    console.error('[news] Niederamt-Feed nicht abrufbar:', err)
    return { items: [] as NewsItem[], fetchedAt: 0 }
  }
})
