import { resourceMeta, type ResourceKey } from '../../pages/integration/gameUi'

interface ResourceBarProps {
  resourceKey: ResourceKey
  value: number
  compact?: boolean
}

export function ResourceBar({ resourceKey, value, compact = false }: ResourceBarProps) {
  const meta = resourceMeta[resourceKey]
  const health = value >= 60 ? 'healthy' : value >= 30 ? 'caution' : 'critical'
  const healthLabel = health === 'healthy' ? 'Healthy' : health === 'caution' ? 'Caution' : 'Critical'

  return (
    <div className={`resource-bar resource-bar--${health} ${compact ? 'resource-bar--compact' : ''}`}>
      <div className="resource-bar__heading">
        <span className="resource-bar__icon" aria-hidden="true">{meta.icon}</span>
        <span className="resource-bar__label">{meta.label}</span>
        <strong>{value}</strong>
      </div>
      <div
        className="resource-bar__track"
        role="progressbar"
        aria-label={`${meta.label}: ${value} out of 100, ${healthLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span className="resource-bar__fill" style={{ width: `${value}%` }} />
      </div>
      {!compact && <span className="resource-bar__state"><span aria-hidden="true">●</span> {healthLabel}</span>}
    </div>
  )
}
