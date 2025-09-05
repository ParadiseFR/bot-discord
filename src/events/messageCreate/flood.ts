import { Events } from 'discord.js'

import { AutoMod, GuildSettings, event } from '../../tools'

const userMessageTimestamps = new Map()

export default event(Events.MessageCreate, async (_, message) => {
  if (!message.author.bot) {
    if (message.guild != null) {
      const { AUTOMOD } = GuildSettings.get(message.guild)

      if (Boolean(AUTOMOD.IGNORED_CHANNEL_IDS.includes(message.channel.id))) return
      if (message.member?.roles.cache.some((role): boolean => AUTOMOD.IGNORED_ROLE_IDS.includes(role.id)) === true)
        return
      if (!AutoMod.isDeleted(message.id)) {
        const userId = message.author.id
        const now = Date.now()

        if (!userMessageTimestamps.has(userId)) {
          userMessageTimestamps.set(userId, [])
        }

        const timestamps = userMessageTimestamps.get(userId)
        timestamps.push(now)

        // Remove timestamps older than the time interval
        while (timestamps.length > 0 && now - timestamps[0] > AUTOMOD.FLOOD.TIME_INTERVAL) {
          timestamps.shift()
        }

        if (timestamps.length > AUTOMOD.FLOOD.MESSAGE_LIMIT) {
          try {
            await message.member?.timeout(10 * 60 * 1000, 'Flooding detected')
            await message.channel.send(
              `${message.author.username}, you've been timed out for 10 minutes due to excessive messaging.`
            )

            userMessageTimestamps.set(userId, [])
          } catch (error) {
            console.error('Error handling flood detection:', error)
          }
        }

        userMessageTimestamps.set(userId, timestamps)

        setInterval(() => {
          const now = Date.now()
          for (const [userId, timestamps] of userMessageTimestamps) {
            while (timestamps.length > 0 && now - timestamps[0] > AUTOMOD.FLOOD.TIME_INTERVAL) {
              timestamps.shift()
            }
            if (timestamps.length === 0) {
              userMessageTimestamps.delete(userId)
            }
          }
        }, AUTOMOD.FLOOD.TIME_INTERVAL)
      }
    }
  }
})
