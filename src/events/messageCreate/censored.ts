import { readFile } from 'node:fs/promises'

import { Events } from 'discord.js'

import { ASSETS_DIR, AutoMod, GuildSettings, Logger, event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  if (!message.author.bot) {
    if (message.guild != null) {
      const { AUTOMOD } = GuildSettings.get(message.guild)

      if (Boolean(AUTOMOD.IGNORED_CHANNEL_IDS.includes(message.channel.id))) return
      if (message.member?.roles.cache.some((role): boolean => AUTOMOD.IGNORED_ROLE_IDS.includes(role.id)) === true)
        return

      if (!AutoMod.isDeleted(message.id)) {
        const badWords = await readFile(ASSETS_DIR('censored.txt')).then((data): string[] =>
          data.toString().split('\n')
        )
        const badWordRegex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi')

        if (message.content.length < Math.min(...badWords.map((word): number => word.length))) return

        if (Boolean(message.content.match(badWordRegex))) {
          try {
            await AutoMod.delete(message, 'Mots inappropriés')
          } catch (error) {
            Logger.error('Error handling censored message:', error)
          }
        }
      }
    }
  }
})
