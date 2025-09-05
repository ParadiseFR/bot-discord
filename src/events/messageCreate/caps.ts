import { Events } from 'discord.js'

import { AutoMod, GuildSettings, event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  if (!message.author.bot) {
    if (message.guild != null) {
      const { AUTOMOD } = GuildSettings.get(message.guild)

      if (Boolean(AUTOMOD.IGNORED_CHANNEL_IDS.includes(message.channel.id))) return
      if (message.member?.roles.cache.some((role): boolean => AUTOMOD.IGNORED_ROLE_IDS.includes(role.id)) === true)
        return

      if (!AutoMod.isDeleted(message.id)) {
        if (message.content.length >= AUTOMOD.CAPS.MIN_LENGTH) {
          const letters = message.content.replace(/[^A-Za-z]/g, '')

          if (letters.length > 0) {
            const upper = letters.replace(/[^A-Z]/g, '').length
            const percent = (upper / letters.length) * 100

            if (percent >= AUTOMOD.CAPS.PERCENT) {
              await AutoMod.delete(message, 'Majuscules excessives')
            }
          }
        }
      }
    }
  }
})
