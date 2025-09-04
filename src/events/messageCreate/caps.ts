import { Events } from 'discord.js'

import { event } from '../../tools'

const MIN_CAPS_LENGTH = 8
const CAPS_PERCENT = 70

export default event(Events.MessageCreate, async (_, message) => {
  if (message.author.bot) return
  // TODO: ignore certain roles & channels

  if (message.content.length >= MIN_CAPS_LENGTH) {
    const letters = message.content.replace(/[^A-Za-z]/g, '')

    if (letters.length > 0) {
      const upper = letters.replace(/[^A-Z]/g, '').length
      const percent = (upper / letters.length) * 100

      if (percent >= CAPS_PERCENT) {
        return await message.delete()
      }
    }
  }
})
