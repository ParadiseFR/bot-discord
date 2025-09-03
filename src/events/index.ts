import { Event } from '../types'
import interactionCreate from './interactionCreate'
import guildMemberUpdate from './guildMemberUpdate'
import guildMemberRemove from './guildMemberRemove'
import guildMemberAdd from './guildMemberAdd'
import channelDelete from './channelDelete'
import ready from './ready'

const events: Array<Event<any>> = [
  ready,
  ...interactionCreate,
  ...guildMemberUpdate,
  ...guildMemberRemove,
  ...channelDelete,
  ...guildMemberAdd
]

export default events
