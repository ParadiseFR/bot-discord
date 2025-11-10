import { Colors, EmbedBuilder, Events, TextChannel } from 'discord.js'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { GuildSettings, Logger, Text, event } from '../../tools'

export default event(Events.GuildMemberAdd, async (_, member) => {
  if (!member.user.bot) {
    const { LOGS } = GuildSettings.get(member.guild)
    const logChannel = member.guild.channels.cache.get(LOGS.LOG_CHANNEL_ID)

    if (logChannel != null && logChannel instanceof TextChannel) {
      const joinedSince = formatDistanceToNow(member.user.createdAt, { locale: fr, addSuffix: true })
      const embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setAuthor({
          name: `${member.user.displayName} (@${member.user.tag})`,
          iconURL: member.user.displayAvatarURL()
        })
        .setDescription(`${Text.mention.user(member.id)} est arrivé sur le serveur !`)
        .setFooter({ text: `Compte créé ${joinedSince}`, iconURL: logChannel.guild.iconURL() as string })
        .setTimestamp()

      try {
        await logChannel.send({ embeds: [embed] })
      } catch (error) {
        Logger.error('Error sending member leave log message:', error)
      }
    } else {
      Logger.error('Log channel not found or is not a text channel!')
    }
  }

  return member.guild
})
