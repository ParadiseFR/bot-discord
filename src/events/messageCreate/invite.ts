import { Events } from 'discord.js'

import { AutoMod, event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  if (!message.author.bot) {
    const content = message.content.toLowerCase()

    if (content.includes('discord.gg/') || content.includes('discord.com/invite')) {
      await AutoMod.delete(message, "Lien d'invitation")
    }
  }
})
