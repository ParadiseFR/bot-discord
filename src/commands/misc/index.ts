import { category } from '../../tools/Command'
import logger from './logger'
import membercount from './membercount'

export default category({
  name: 'Autres',
  commands: [logger, membercount]
})
