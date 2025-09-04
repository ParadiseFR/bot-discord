import { EmbedBuilder, Events, Guild, TextChannel } from 'discord.js'

import { Config, Text, event } from '../../tools'

export default event(Events.MessageUpdate, async ({ client }, oldMessage, newMessage) => {
  if (!newMessage.author.bot) {
    if (oldMessage.content !== newMessage.content) {
      const logChannel = client.channels.cache.get(Config.LOG_CHANNEL_ID)

      if (logChannel != null && logChannel instanceof TextChannel) {
        const embed = new EmbedBuilder()
          .setColor('#e17055')
          .setTitle("Modification d'un message")
          .setDescription(
            `${Text.bold('Auteur :')} ${Text.mention.user(newMessage.author.id)}\n` +
              `${Text.bold('Ancien message :')} ${oldMessage.content}\n` +
              `${Text.bold('Nouveau message :')} ${newMessage.content}`
          )
          .setTimestamp()
          .setFooter({
            text: (newMessage.guild as Guild).name,
            iconURL: (newMessage.guild as Guild).iconURL() as string
          })

        try {
          await logChannel.send({ embeds: [embed] })
        } catch (error) {
          console.error('Error sending message update log message:', error)
        }
      }
    }
  }
})
