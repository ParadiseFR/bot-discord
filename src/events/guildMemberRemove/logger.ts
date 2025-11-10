import { Colors, EmbedBuilder, Events, TextChannel } from 'discord.js'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { GuildSettings, Logger, Text, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberRemove, async (_, partialMember) => {
  const member = await BOT_INSTANCE.refinePartialMember(partialMember)

  if (!member.user.bot) {
    const { LOGS } = GuildSettings.get(partialMember.guild)
    const logChannel = partialMember.guild.channels.cache.get(LOGS.LOG_CHANNEL_ID)

    console.log(logChannel?.name)

    if (logChannel != null && logChannel instanceof TextChannel) {
      // exclude @everyone role from cached roles map
      const roles = member.roles.cache
        .filter((role): boolean => role.id !== partialMember.guild.id)
        .map((role): string => Text.mention.role(role.id))

      const joinedSince = formatDistanceToNow(member.joinedAt as Date, { locale: fr, addSuffix: true })
      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setAuthor({ name: partialMember.user.tag, iconURL: partialMember.user.displayAvatarURL() })
        .setDescription(
          `${partialMember.user.displayName} \`(@${partialMember.user.tag})\` vient de quitter le serveur !`
        )
        .addFields({ name: 'Rôles', value: roles.length > 0 ? roles.join(', ') : 'Aucun', inline: true })
        .setFooter({ text: `Avait rejoint ${joinedSince}`, iconURL: logChannel.guild.iconURL() as string })
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
