import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Config, Logger, event } from '../../tools'

export default event(Events.ChannelDelete, async (_, channel) => {
  if (!('guild' in channel)) {
    return Logger.error('Deleted channel is a DM channel, skipping log.')
  }

  const logChannel = channel.guild.channels.cache.get(Config.LOG_CHANNEL_ID)

  if (logChannel == null || !(logChannel instanceof TextChannel)) {
    return Logger.error('Log channel not found or is not a text channel!')
  }

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle("Suppression d'un salon")
    .setDescription(`Le salon ${channel.isTextBased() ? 'textuel' : 'vocal'} <@${channel.id}> a été supprimé.`)
    .setTimestamp()
    .setFooter({ text: `Channel ID: ${channel.id}` })

  try {
    await logChannel.send({ embeds: [embed] })
  } catch (error) {
    Logger.error('Error sending channel deletion log message:', error)
  }
})
