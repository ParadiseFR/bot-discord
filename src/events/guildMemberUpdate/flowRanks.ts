import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Config, GuildSettings, Logger, Text, event } from '../../tools'

export default event(Events.GuildMemberUpdate, async (_, oldMember, newMember) => {
  // TODO: migrate to guild settings
  for (const roleId of Config.LISTEN_ROLE_IDS) {
    const hadRole = oldMember.roles.cache.has(roleId)
    const hasRole = newMember.roles.cache.has(roleId)
    const role = newMember.guild.roles.cache.get(roleId)

    if (role != null) {
      const { LOGS } = GuildSettings.get(newMember.guild)
      const channel = newMember.guild.channels.cache.get(LOGS.ADMIN_ANNOUNCE_CHANNEL_ID)

      if (channel != null && channel instanceof TextChannel) {
        const roleIcon =
          role.iconURL?.() ??
          'https://message.style/cdn/images/76818f017e8ed0e17d882ec7f0bf16b0f787dc2736c9bd9d3063c5780f79d3c2.png'

        if (!hadRole && hasRole) {
          const username = Text.bold(newMember.user.username)
          const rank = Text.bold(role.name)
          const embed = new EmbedBuilder()
            .setTitle('Pôle ')
            .setDescription(`${username} rejoint l'équipe en tant que ${rank} !`)
            .setImage(roleIcon)
            .setColor('Green')

          await channel.send({ embeds: [embed] }).catch(Logger.error)
        } else if (hadRole && !hasRole) {
          const username = Text.bold(newMember.user.username)
          const rank = Text.bold(role.name)
          const embed = new EmbedBuilder()
            .setTitle('Pôle ')
            .setDescription(`${username} est démis de ses fonctions de ${rank} !`)
            .setImage(roleIcon)
            .setColor('Red')

          await channel.send({ embeds: [embed] }).catch(Logger.error)
        }
      }
    }
  }
})
