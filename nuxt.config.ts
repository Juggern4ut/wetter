// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  telemetry: false,
  css: ['~/assets/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'de-CH' },
      title: 'Wetter Niedergösgen',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/partly-cloudy-day.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap',
        },
      ],
    },
  },
})
