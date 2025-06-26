import { category } from '../../tools/Command'
import purge from './purge'

export default category({ name: 'Modération', commands: [purge], emoji: '🛡️' })
