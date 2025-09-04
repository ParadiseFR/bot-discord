import { Client } from 'discord.js'

import { Event, EventExec, EventKeys, EventProps } from '../types'
import { Logger } from './Logger'
import { Text } from './Text'

export const event = <T extends EventKeys>(id: T, exec: EventExec<T>): Event<T> => {
  return { id, exec }
}

export const registerEvents = (client: Client<true>, events: Array<Event<any>>): void => {
  for (const event of events)
    client.on(event.id, async (...args) => {
      const props: EventProps = {
        client,
        disabled: false
      }

      try {
        if (!props.disabled) {
          const eventKey = Text.capitalize(event.id)
          const eventName = Text.toUpperSnakeCase(eventKey)

          await event.exec(props, ...args)

          Logger.events(`Event ${eventName} dispatched`)
        }
      } catch (error) {
        Logger.error('Uncaught error:', error)
      }
    })

  Logger.events('Events registered')
}
