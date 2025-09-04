import { Event } from '../../types'
import caps from './caps'
import censored from './censored'
import flood from './flood'
import invite from './invite'
import react from './react'

const events: Array<Event<any>> = [censored, flood, react, invite, caps]

export default events
