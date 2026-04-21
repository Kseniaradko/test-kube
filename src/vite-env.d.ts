/// <reference types="vite/client" />

interface RuntimeConfig {
  APP_TITLE?: string
  APP_ENV?: string
  APP_BANNER?: string
  APP_VERSION?: string
  APP_HIGHLIGHT_LABEL?: string
}

interface Window {
  __RUNTIME_CONFIG__?: RuntimeConfig
}
