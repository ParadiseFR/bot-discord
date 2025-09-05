import { ClientEvents, Awaitable, Client, Guild } from 'discord.js'

export interface EventProps {
  client: Client<true>
  disabled: boolean
}

export type EventKeys = keyof ClientEvents
export type EventExec<T extends EventKeys> = (
  props: EventProps,
  ...args: ClientEvents[T]
) => Awaitable<Guild | undefined>
export interface Event<T extends EventKeys> {
  id: T
  exec: EventExec<T>
}
