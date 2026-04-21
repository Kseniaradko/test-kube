const defaults = {
  appTitle: 'React Kubernetes Demo',
  appEnv: 'local',
  appBanner: 'Local preview configuration',
  appVersion: 'dev',
  appHighlightLabel: 'Ready to deploy',
}

const readValue = (value: string | undefined, fallback: string) => {
  if (!value || /^__.*__$/.test(value)) {
    return fallback
  }

  return value
}

export const getRuntimeConfig = () => {
  const runtimeConfig = window.__RUNTIME_CONFIG__ ?? {}

  return {
    appTitle: readValue(runtimeConfig.APP_TITLE, defaults.appTitle),
    appEnv: readValue(runtimeConfig.APP_ENV, defaults.appEnv),
    appBanner: readValue(runtimeConfig.APP_BANNER, defaults.appBanner),
    appVersion: readValue(runtimeConfig.APP_VERSION, defaults.appVersion),
    appHighlightLabel: readValue(
      runtimeConfig.APP_HIGHLIGHT_LABEL,
      defaults.appHighlightLabel,
    ),
  }
}
