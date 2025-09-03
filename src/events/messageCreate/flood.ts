import { Events } from 'discord.js'

import { event } from '../../tools'

const userMessageTimestamps = new Map()
const TIME_INTERVAL = 30 * 1000
const MESSAGE_LIMIT = 15

export default event(Events.MessageCreate, async (_, message) => {
  const ignoredChannelIds = ['channelId1', 'channelId2']
  const ignoredRoleIds = ['roleId1', 'roleId2']

  if (message.author.bot) return
  if (ignoredChannelIds.includes(message.channel.id)) return
  if (message.member?.roles.cache.some((role): boolean => ignoredRoleIds.includes(role.id)) === true) return

  const userId = message.author.id
  const now = Date.now()

  if (!userMessageTimestamps.has(userId)) {
    userMessageTimestamps.set(userId, [])
  }

  const timestamps = userMessageTimestamps.get(userId)
  timestamps.push(now)

  // Remove timestamps older than the time interval
  while (timestamps.length > 0 && now - timestamps[0] > TIME_INTERVAL) {
    timestamps.shift()
  }

  // Check if user exceeded message limit
  if (timestamps.length > MESSAGE_LIMIT) {
    try {
      // Timeout user for 10 minutes (requires MANAGE_ROLES permission)
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
})

setInterval(() => {
  const now = Date.now()
  for (const [userId, timestamps] of userMessageTimestamps) {
    while (timestamps.length > 0 && now - timestamps[0] > TIME_INTERVAL) {
      timestamps.shift()
    }
    if (timestamps.length === 0) {
      userMessageTimestamps.delete(userId)
    }
  }
}, TIME_INTERVAL)
