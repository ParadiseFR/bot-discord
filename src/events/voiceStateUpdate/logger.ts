import { EmbedBuilder, Events, GuildMember, TextChannel } from 'discord.js'

import { Config, Text, event } from '../../tools'

export default event(Events.VoiceStateUpdate, async ({ client }, oldState, newState) => {
  const logChannel = client.channels.cache.get(Config.LOG_CHANNEL_ID)

  if (logChannel != null && logChannel instanceof TextChannel) {
    const member = newState.member as GuildMember
    const oldChannel = oldState.channel
    const newChannel = newState.channel

    const embed = new EmbedBuilder()
      .setColor('#e17055')
      .setFooter({ text: logChannel.guild.name, iconURL: logChannel.guild.iconURL() as string })
      .setTimestamp()

    // scenario 1 : user joins any voice channel
    if (oldChannel == null && newChannel != null) {
      embed
        .setAuthor({ name: `Connexion - ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`${Text.mention(member.id)} vient de rejoindre le salon ${Text.channel(newChannel.id)}.`)
    }
    // scenario 2 : user leaves voice channel
    else if (oldChannel != null && newChannel == null) {
      embed
        .setAuthor({ name: `Déconnexion - ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
        .setDescription(`${Text.mention(member.id)} vient de quitter le salon ${Text.channel(oldChannel.id)}.`)
    }
    // scenario 3 : user moves from one voice channel to another
    else if (oldChannel != null && newChannel != null && oldChannel.id !== newChannel.id) {
      embed
        .setAuthor({ name: `Déplacement - ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
        .setDescription(
          `${Text.mention(member.id)} vient de se déplacer du salon ${Text.channel(
            oldChannel.id
          )} vers le salon ${Text.channel(newChannel.id)}.`
        )
    }

    await logChannel.send({ embeds: [embed] })
  }
})
