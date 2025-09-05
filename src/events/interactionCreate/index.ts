import { Event } from '../../types'
import commands from './commands'
import ticket from './ticket'

const events: Array<Event<any>> = [commands, ticket]

export default events
