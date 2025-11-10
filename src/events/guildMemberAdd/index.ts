import { Event } from '../../types'
import counter from './counter'
import logger from './logger'
import raid from './raid'
import welcome from './welcome'

const events: Array<Event<any>> = [counter, welcome, raid, logger]

export default events
