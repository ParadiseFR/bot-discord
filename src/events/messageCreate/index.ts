import { Event } from '../../types'
import censored from './censored'
import flood from './flood'
import react from './react'

const events: Array<Event<any>> = [censored, flood, react]

export default events
