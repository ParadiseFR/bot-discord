import { JSX, Show, createResource, onMount } from 'solid-js'

interface BotStats {
  status: 'online' | 'offline' | 'loading'
  uptime: number
  guilds: number
  users: number
  channels: number
  lastUpdate: string
  readyAt?: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const fetchStats = async (): Promise<BotStats> => {
  const response = await fetch(`${API_URL}/stats`)
  if (!Boolean(response.ok)) throw new Error('Failed to fetch stats')
  else return response.json()
}

const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export default function App(): JSX.Element {
  const [stats, { refetch }] = createResource(fetchStats)

  onMount(() => {
    // Poll every 30 seconds
    const interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refetch()
    }, 30_000)

    return () => clearInterval(interval)
  })

  const statusClass = (): BotStats['status'] => {
    if (stats.loading) return 'loading'
    if (Boolean(stats.error)) return 'offline'
    return stats()?.status === 'online' ? 'online' : 'offline'
  }

  const statusText = (): string => {
    if (stats.loading) return 'Loading...'
    if (Boolean(stats.error)) return 'Offline'
    return stats()?.status === 'online' ? 'Online' : 'Offline'
  }

  return (
    <div class='container'>
      <h1>Discord Bot Status</h1>

      <div class='status'>
        <div class={`status-dot ${statusClass()}`}></div>
        <span>Bot is {statusText()}</span>
      </div>

      <Show when={stats.error}>
        <div class='error'>
          <p>Unable to connect to bot API. The bot may be offline.</p>
          <p>Error: {stats.error.message}</p>
        </div>
      </Show>

      <Show when={stats()}>
        <>
          <div class='stats-grid'>
            <div class='stat-card'>
              <div class='stat-value'>{formatUptime(stats()?.uptime ?? 0)}</div>
              <div class='stat-label'>Uptime</div>
            </div>
            <div class='stat-card'>
              <div class='stat-value'>{formatUptime(stats()?.guilds ?? 0)}</div>
              <div class='stat-label'>Servers</div>
            </div>
            <div class='stat-card'>
              <div class='stat-value'>{formatUptime(stats()?.users ?? 0)}</div>
              <div class='stat-label'>Users</div>
            </div>
            <div class='stat-card'>
              <div class='stat-value'>{formatUptime(stats()?.channels ?? 0)}</div>
              <div class='stat-label'>Channels</div>
            </div>
          </div>

          <p style='text-align: center; color: #666; margin-top: 20px;'>
            Last updated: {new Date(stats()?.lastUpdate ?? '').toLocaleString()}
          </p>
        </>
      </Show>
    </div>
  )
}
 
