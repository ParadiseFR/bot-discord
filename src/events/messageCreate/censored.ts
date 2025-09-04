import { readFile } from 'node:fs/promises'

import { Events } from 'discord.js'

import { ASSETS_DIR, event } from '../../tools'

export default event(Events.MessageCreate, async (_, message) => {
  if (message.author.bot) return

  const ignoredChannelIds = ['channelId1', 'channelId2']
  if (ignoredChannelIds.includes(message.channel.id)) return

  const ignoredRoleIds = ['roleId1', 'roleId2']
  if (message.member?.roles.cache.some((role): boolean => ignoredRoleIds.includes(role.id)) === true) return

  const badWords = await readFile(ASSETS_DIR('censored.txt')).then((data): string[] => data.toString().split('\n'))
  const badWordRegex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'gi')

  if (message.content.length < Math.min(...badWords.map((word): number => word.length))) return

  if (Boolean(message.content.match(badWordRegex))) {
    try {
      await message.delete()
      await message.channel.send(`${message.author.username}, please avoid using inappropriate words!`)
    } catch (error) {
      console.error('Error handling censored message:', error)
    }
  }
})
