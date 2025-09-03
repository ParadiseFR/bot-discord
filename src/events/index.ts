import { Event } from '../types'
import interactionCreate from './interactionCreate'
import guildMemberUpdate from './guildMemberUpdate'
import guildMemberRemove from './guildMemberRemove'
import guildMemberAdd from './guildMemberAdd'
import channelDelete from './channelDelete'
import channelCreate from './channelCreate'
import voiceStateUpdate from './voiceStateUpdate'
import ready from './ready'

const events: Array<Event<any>> = [
  ready,
  ...interactionCreate,
  ...guildMemberUpdate,
  ...guildMemberRemove,
  ...guildMemberAdd,
  ...channelCreate,
  ...channelDelete,
  ...voiceStateUpdate
]

export default events
