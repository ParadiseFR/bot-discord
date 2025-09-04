import { Events } from 'discord.js'

import { Logger, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberRemove, async (_, member) => {
  try {
    await BOT_INSTANCE.updateMemberCount(member.guild)
  } catch (error) {
    Logger.error('Error updating member count:', error)
  }
})
