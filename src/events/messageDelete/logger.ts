import { EmbedBuilder, Events, Guild, TextChannel, User } from 'discord.js'

import { Config, Text, event } from '../../tools'

export default event(Events.MessageDelete, async ({ client }, message) => {
  if ((message.author as User).bot) return

  const logChannel = client.channels.cache.get(Config.LOG_CHANNEL_ID)

  if (logChannel != null && logChannel instanceof TextChannel) {
    {
      const embed = new EmbedBuilder()
        .setColor('#e17055')
        .setTitle("Suppression d'un message")
        .setDescription(
          `Le message ${Text.bold(message.content as string)} a été supprimé par ${Text.mention(
            (message.author as User).id
          )}.`
        )
        .setTimestamp()
        .setFooter({ text: (message.guild as Guild).name, iconURL: (message.guild as Guild).iconURL() as string })

      try {
        await logChannel.send({ embeds: [embed] })
      } catch (error) {
        console.error('Error sending message deletion log message:', error)
      }
    }
  }
})
