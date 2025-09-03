import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Config, event } from '../../tools'

export default event(Events.GuildMemberUpdate, async (_, oldMember, newMember) => {
  if (oldMember.nickname !== newMember.nickname) {
    const logChannel = newMember.guild.channels.cache.get(Config.LOG_CHANNEL_ID)

    if (logChannel != null && logChannel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Pseudo ${newMember.user.tag} changé (${newMember.user.id})`)
        .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
        .setDescription(
          `Le pseudo de @${newMember.user.tag} (${newMember.user.id}) a été changé de \`${oldMember.nickname}\` en \`${newMember.nickname}\``
        )
        .setTimestamp()
        .setFooter({ text: `User ID: ${newMember.user.id}`, iconURL: newMember.guild.iconURL() as string })

      try {
        await logChannel.send({ embeds: [embed] })
      } catch (error) {
        console.error('Error sending log message:', error)
      }
    }
  }
})
