import { Event } from '../../types'
import counter from './counter'
import welcome from './welcome'

const events: Array<Event<any>> = [counter, welcome]

export default events
