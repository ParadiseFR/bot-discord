import { Events } from 'discord.js'

import { event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  const badWords = ['badword1', 'badword2', 'badword3']
  const badWordRegex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi')
  const ignoredChannelIds = ['channelId1', 'channelId2']
  const ignoredRoleIds = ['roleId1', 'roleId2']

  if (message.author.bot) return
  if (ignoredChannelIds.includes(message.channel.id)) return
  if (message.member?.roles.cache.some((role): boolean => ignoredRoleIds.includes(role.id)) === true) return

  if (Boolean(message.content.match(badWordRegex))) {
    try {
      await message.delete()
      await message.channel.send(`${message.author.username}, please avoid using inappropriate words!`)
    } catch (error) {
      console.error('Error handling censored message:', error)
    }
  }
})
