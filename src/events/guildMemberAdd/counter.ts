import { Events } from 'discord.js'

import { Logger, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberAdd, async (_, member): Promise<void> => {
  try {
    await BOT_INSTANCE.updateMemberCount(member.guild)
  } catch (error) {
    Logger.error('Error updating member count:', error)
  }
})
