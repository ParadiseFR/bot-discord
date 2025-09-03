import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Config, Logger, event } from '../../tools'

export default event(Events.GuildMemberUpdate, async (_, oldMember, newMember) => {
  for (const roleId of Config.LISTEN_ROLE_IDS) {
    const hadRole = oldMember.roles.cache.has(roleId)
    const hasRole = newMember.roles.cache.has(roleId)

    const role = newMember.guild.roles.cache.get(roleId)
    if (role == null) continue

    const channel = newMember.guild.channels.cache.get(Config.ADMIN_ANNOUNCE_CHANNEL_ID)

    if (channel != null && channel instanceof TextChannel) {
      const roleIcon =
        role.iconURL?.() ??
        'https://message.style/cdn/images/76818f017e8ed0e17d882ec7f0bf16b0f787dc2736c9bd9d3063c5780f79d3c2.png'

      if (!hadRole && hasRole) {
        const embed = new EmbedBuilder()
          .setTitle('Pôle ')
          .setDescription(`**${newMember.user.username}** rejoint l'équipe en tant que **${role.name}** !`)
          .setImage(roleIcon)
          .setColor('Green')

        await channel.send({ embeds: [embed] }).catch(Logger.error)
      } else if (hadRole && !hasRole) {
        const embed = new EmbedBuilder()
          .setTitle('Pôle ')
          .setDescription(`**${newMember.user.username}** est démis de ses fonctions de **${role.name}** !`)
          .setImage(roleIcon)
          .setColor('Red')

        await channel.send({ embeds: [embed] }).catch(Logger.error)
      }
    }
  }
})
