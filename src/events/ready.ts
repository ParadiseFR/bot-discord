import { ActivityType, Events } from 'discord.js'

import { Logger, event, registerCommands, GuildSettings, Config } from '../tools'
import commands from '../commands'
import { BOT_INSTANCE } from '../app'
import { Randomizer } from '../tools'

export default event(Events.ClientReady, async ({ client }) => {
  const servers = client.guilds.cache
    .map((g): string => (g.id === process.env.TEST_GUILD_ID ? `${g.name} [🐛]` : g.name))
    .join(', ')

    Logger.custom('init', `${client.user.tag} is connected on ${client.guilds.cache.size} servers! (${servers})`)
    
    client.user?.setActivity({ name: Randomizer.getRandomElement(Config.MOODS_LIST), type: ActivityType.Watching })

  await registerCommands(client, commands)

  for (const guild of client.guilds.cache.values()) {
    try {
      GuildSettings.get(guild)
      await BOT_INSTANCE.updateMemberCount(guild)
    } catch (error) {
      Logger.error(`Error updating member count for guild ${guild.name}:`, error)
    }
  }
})
