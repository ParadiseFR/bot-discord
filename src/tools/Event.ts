import { Client } from 'discord.js'

import { Event, EventExec, EventKeys } from '../types'
import { Logger } from './Logger'

export const event = <T extends EventKeys>(id: T, exec: EventExec<T>): Event<T> => {
  return { id, exec }
}

export const registerEvents = (client: Client<true>, events: Array<Event<any>>): void => {
  for (const event of events)
    client.on(event.id, async (...args) => {
      const props = { client }
      try {
        Logger.debug(`Event ${event.id} triggered`)
        await event.exec(props, ...args)
      } catch (error) {
        Logger.error('Uncaught error:', error)
      }
    })
}
