import { ChannelType, EmbedBuilder, Events, TextChannel } from 'discord.js'

import { event, GuildSettings, Text } from '../../tools'

export default event(Events.ChannelUpdate, async ({ client }, oldChannel, newChannel) => {
  if ('guild' in newChannel && 'guild' in oldChannel) {
    if (oldChannel.type === ChannelType.GuildText && newChannel.type === ChannelType.GuildText) {
      const { LOGS } = GuildSettings.get(newChannel.guild)
      const logChannel = client.channels.cache.get(LOGS.LOG_CHANNEL_ID)

      if (logChannel != null && logChannel instanceof TextChannel) {
        const embed = new EmbedBuilder()
          .setColor('#e17055')
          .setTitle("Modification d'un salon")
          .setDescription(`${Text.channel(oldChannel.id)} a été modifié !`)
          .setTimestamp()
          .setFooter({ text: newChannel.guild.name, iconURL: newChannel.guild.iconURL() as string })

        if (oldChannel.topic !== newChannel.topic) {
          embed.addFields({
            name: 'Topic',
            value: `${Text.bold('Ancien topic :')} ${oldChannel.topic}\n${Text.bold('Nouveau topic :')} ${
              newChannel.topic
            }`,
            inline: false
          })
        }
      }
    }
  }
})
