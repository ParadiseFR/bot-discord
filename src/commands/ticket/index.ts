import { category } from '../../tools'
import config from './config'
import setup from './setup'

export default category({ name: 'Ticket', commands: [setup, config], emoji: '🎫' })
