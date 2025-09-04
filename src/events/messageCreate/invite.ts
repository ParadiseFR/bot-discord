import { Events } from 'discord.js'

import { event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  if (message.author.bot) return
  // TODO: ignore certain roles & channels

  const content = message.content.toLowerCase()

  if (content.includes('discord.gg/') || content.includes('discord.com/invite')) {
    await message.delete()
  }
})
