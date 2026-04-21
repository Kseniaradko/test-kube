import { useMemo, useState } from 'react'
import { getRuntimeConfig } from './config'
import { StatusCard } from './components/StatusCard'
import './styles.css'

const labSteps = [
  'Измени React-компонент и проверь локально через Vite.',
  'Собери production-версию через npm run build.',
  'Упакуй приложение в Docker-образ и отправь его в registry.',
  'Обнови релиз в Kubernetes через Helm и проверь сервис.',
]

function App() {
  const config = useMemo(() => getRuntimeConfig(), [])
  const [emphasized, setEmphasized] = useState(false)

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <span className="hero__eyebrow">Demo pipeline</span>
          <h1>{config.appTitle}</h1>
          <p className="hero__lead">
            Небольшая витрина для лабы: показывает изменение UI-компонента,
            runtime-конфиг и путь доставки до Kubernetes.
          </p>
        </div>

        <button
          className="hero__button"
          type="button"
          onClick={() => setEmphasized((current) => !current)}
        >
          {emphasized ? 'Вернуть базовый вид карточки' : 'Подсветить компонент'}
        </button>
      </section>

      <section className="content-grid">
        <StatusCard
          title={config.appTitle}
          environment={config.appEnv}
          banner={config.appBanner}
          version={config.appVersion}
          highlightLabel={config.appHighlightLabel}
          emphasized={emphasized}
        />

        <section className="info-panel">
          <h2>Что можно показать на демо</h2>
          <ul>
            {labSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}

export default App
