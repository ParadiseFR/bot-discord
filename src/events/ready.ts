import { ActivityType, Events } from 'discord.js'

import { Logger, event, registerCommands } from '../tools'
import commands from '../commands'
import { BOT_INSTANCE } from '../app'

export default event(Events.ClientReady, async ({ client }): Promise<void> => {
  const servers = client.guilds.cache.map((g): string => g.name).join(', ')
  Logger.custom('init', `${client.user.tag} is connected on ${client.guilds.cache.size} servers! (${servers})`)

  client.user?.setActivity({ name: 'Rypî', type: ActivityType.Watching })

  await registerCommands(client, commands)

  for (const guild of client.guilds.cache.values()) {
    try {
      await BOT_INSTANCE.updateMemberCount(guild)
    } catch (error) {
      Logger.error(`Error updating member count for guild ${guild.name}:`, error)
    }
  }
})
