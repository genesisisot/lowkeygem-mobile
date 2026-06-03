// Polling-based "realtime" — works on Vercel serverless (no WebSockets).
// Keeps the same channel shape and callback message envelopes the services expect:
//   { event: 'message', message }     and     { event: 'notification', notification }
// so the existing subscribeTo* methods barely change.

import { rawRequest } from './api'

export interface RealtimeChannel {
  send: (msg: unknown) => void
  close: () => void
}

type Handler = (msg: any) => void

/** Run `fn` immediately, then every `ms`. Returns a closable channel. */
export function poll(fn: () => void | Promise<void>, ms: number): RealtimeChannel {
  let stopped = false
  const tick = async () => {
    if (stopped) return
    try {
      await fn()
    } catch {
      /* swallow transient errors; next tick retries */
    }
  }
  void tick()
  const handle = setInterval(tick, ms)
  return {
    send: () => {},
    close: () => {
      stopped = true
      clearInterval(handle)
    },
  }
}

const CHAT_MS = 3000
const NOTIF_MS = 6000

export const realtime = {
  /** Poll a match's messages; emit {event:'message'} for each new one. */
  chat(matchId: string, onMessage: Handler): RealtimeChannel {
    const seen = new Set<string>()
    let primed = false
    return poll(async () => {
      const rows = await rawRequest<any[]>(`/api/matches/${matchId}/messages`)
      for (const m of rows) {
        if (seen.has(m.id)) continue
        seen.add(m.id)
        if (primed) onMessage({ event: 'message', message: m })
      }
      primed = true
    }, CHAT_MS)
  },

  /** Poll the current user's notifications; emit {event:'notification'} for new ones. */
  notifications(onMessage: Handler): RealtimeChannel {
    const seen = new Set<string>()
    let primed = false
    return poll(async () => {
      const rows = await rawRequest<any[]>(`/api/notifications?limit=30`)
      // rows are newest-first; emit oldest new first
      for (const n of [...rows].reverse()) {
        if (seen.has(n.id)) continue
        seen.add(n.id)
        if (primed) onMessage({ event: 'notification', notification: n })
      }
      primed = true
    }, NOTIF_MS)
  },

  close(channel: RealtimeChannel | null | undefined) {
    channel?.close()
  },
}
