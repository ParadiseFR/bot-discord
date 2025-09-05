import { category } from '../../tools/Command'
import kick from './kick'
import purge from './purge'
import config from './config'

export default category({ name: 'Modération', commands: [purge, kick, config], emoji: '🛡️' })
