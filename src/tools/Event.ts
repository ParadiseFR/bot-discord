import { Client } from 'discord.js'

import { Event, EventExec, EventKeys, EventProps } from '../types'
import { Logger } from './Logger'
import { Text } from './Text'

export const event = <T extends EventKeys>(id: T, exec: EventExec<T>): Event<T> => {
  return { id, exec }
}

const eventHandlers = new Map<EventKeys, Array<EventExec<any>>>()

export const registerEvents = (client: Client<true>, events: Array<Event<any>>): void => {
  for (const event of events) {
    if (!eventHandlers.has(event.id)) eventHandlers.set(event.id, [])
    eventHandlers.get(event.id)?.push(event.exec)
  }

  for (const [eventId, handlers] of eventHandlers.entries()) {
    client.on(eventId, async (...args) => {
      const props: EventProps = {
        client,
        disabled: false
      }

      try {
        if (!props.disabled) {
          const eventKey = Text.capitalize(eventId)
          const eventName = Text.toUpperSnakeCase(eventKey)

          for (const handler of handlers) {
            await handler(props, ...args)
          }

          Logger.events(`Event ${eventName} dispatched (${handlers.length} handlers)`)
        }
      } catch (error) {
        Logger.error('Uncaught error:', error)
      }
    })
  }

  Logger.events('Events registered')
}
