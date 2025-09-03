import { Event } from '../../types'
import counter from './goodbye'
import goodbye from './counter'

const events: Array<Event<any>> = [counter, goodbye]

export default events
