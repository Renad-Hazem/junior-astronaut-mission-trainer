import { ResourceBar } from './ResourceBar'
import type { Resources, ResourceKey } from '../../game/uiAdapter'

const resourceOrder: ResourceKey[] = ['oxygen', 'water', 'food', 'energy', 'radiationProtection', 'temperature']

interface ResourceDashboardProps {
  resources: Resources
  title?: string
  compact?: boolean
}

export function ResourceDashboard({ resources, title = 'Base Resources', compact = false }: ResourceDashboardProps) {
  return (
    <section className="resource-dashboard panel" aria-labelledby="resource-title">
      <div className="section-kicker">LIVE SYSTEMS</div>
      <h2 id="resource-title">{title}</h2>
      <div className="resource-dashboard__list">
        {resourceOrder.map((key) => <ResourceBar key={key} resourceKey={key} value={resources[key]} compact={compact} />)}
      </div>
      <p className="micro-note">Game values are a 0–100 learning simulation.</p>
    </section>
  )
}
