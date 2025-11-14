import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Logger, event, Text, GuildSettings } from '../../tools'

export default event(Events.ChannelCreate, async (_, channel) => {
  if ('guild' in channel) {
    const { LOGS } = GuildSettings.get(channel.guild)
    const logChannel = channel.guild.channels.cache.get(LOGS.LOG_CHANNEL_ID)

    if (logChannel != null && logChannel instanceof TextChannel) {
      const permissionFields = channel.permissionOverwrites.cache.map((overwrite) => {
        let name: string

        if (overwrite.type === 0) {
          name = overwrite.id === channel.guild.id ? '@everyone' : Text.channel(overwrite.id)
        } else {
          name = Text.mention.user(overwrite.id)
        }

        const allowed = overwrite.allow.toArray().map((p): string => `✅ ${p}`)
        const denied = overwrite.deny.toArray().map((p): string => `❌ ${p}`)

        return { name, value: [...allowed, ...denied].join('\n'), inline: false }
      })

      const embed = new EmbedBuilder()
        .setColor('#e17055')
        .setTitle("Création d'un salon")
        .setDescription(
          `Le salon ${channel.isVoiceBased() ? 'vocal' : 'textuel'} ${Text.channel(channel.id)} a été créé.`
        )
        .addFields(permissionFields)
        .setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL() as string })
        .setTimestamp()

      try {
        await logChannel.send({ embeds: [embed] })
      } catch (error) {
        Logger.error('Error sending channel deletion log message:', error)
      }
    } else {
      return Logger.error('Log channel not found or is not a text channel!')
    }
  }
})
