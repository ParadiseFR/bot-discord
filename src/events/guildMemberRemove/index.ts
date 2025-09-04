import { Event } from '../../types'
import counter from './goodbye'
import goodbye from './counter'
import logger from './logger'

const events: Array<Event<any>> = [counter, goodbye, logger]

export default events
