import { Event } from '../../types'
import counter from './counter'
import raid from './raid'
import welcome from './welcome'

const events: Array<Event<any>> = [counter, welcome, raid]

export default events
