import { category } from '../../tools/Command'
import kick from './kick'
import purge from './purge'

export default category({ name: 'Modération', commands: [purge, kick], emoji: '🛡️' })
