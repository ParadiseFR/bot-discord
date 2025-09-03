import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Config, Logger, Text, event } from '../../tools'

export default event(Events.ChannelDelete, async (_, channel) => {
  if ('guild' in channel) {
    const logChannel = channel.guild.channels.cache.get(Config.LOG_CHANNEL_ID)

    if (logChannel != null && logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor('#e17055')
        .setTitle("Suppression d'un salon")
        .setDescription(
          `Le salon ${channel.isVoiceBased() ? 'vocal' : 'textuel'} ${Text.bold(channel.name)} a été supprimé.`
        )
        .setTimestamp()
        .setFooter({ text: channel.guild.name, iconURL: channel.guild.iconURL() as string })

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
