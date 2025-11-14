import { category } from '../../tools/Command'
import logger from './logger'
import membercount from './membercount'
import language from './language'

export default category({
  name: 'Autres',
  commands: [logger, membercount, language]
})
