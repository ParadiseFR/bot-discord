import { Events } from 'discord.js'

import { event } from '../../tools'

export default event(Events.MessageCreate, async (_, message): Promise<void> => {
  const words = ['hey', 'coucou', 'salut', 'hello', 'cc']

  if (words.includes(message.content.toLowerCase())) {
    await message.react('👋')
  }
})
