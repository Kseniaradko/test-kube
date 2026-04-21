type StatusCardProps = {
  title: string
  environment: string
  banner: string
  version: string
  highlightLabel: string
  emphasized: boolean
}

export const StatusCard = ({
  title,
  environment,
  banner,
  version,
  highlightLabel,
  emphasized,
}: StatusCardProps) => {
  return (
    <section className={`status-card${emphasized ? ' status-card--emphasized' : ''}`}>
      <div className="status-card__header">
        <span className="status-card__eyebrow">Runtime config</span>
        <span className="status-card__badge">{environment}</span>
      </div>

      <h2>{title}</h2>
      <p>{banner}</p>

      <dl className="status-card__meta">
        <div>
          <dt>Image tag</dt>
          <dd>{version}</dd>
        </div>
        <div>
          <dt>Release label</dt>
          <dd>{highlightLabel}</dd>
        </div>
      </dl>
    </section>
  )
}
