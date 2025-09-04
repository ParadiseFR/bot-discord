import { category } from '../../tools'
import limit from './limit'
import setup from './setup'

export default category({ name: 'Ticket', commands: [setup, limit], emoji: '🎫' })
