import { Events, GuildMember, TextChannel } from 'discord.js'

import { Config, event } from '../../tools'

export default event(Events.VoiceStateUpdate, async ({ client }, oldState, newState) => {
  const logChannel = client.channels.cache.get(Config.LOG_CHANNEL_ID)

  if (logChannel != null && logChannel instanceof TextChannel) {
    const member = newState.member as GuildMember
    const oldChannel = oldState.channel
    const newChannel = newState.channel

    // Cas 1 : Un membre rejoint un salon vocal
    if (oldChannel == null && newChannel != null) {
      await logChannel.send(`${member.user.tag} a rejoint le salon vocal ${newChannel.name}.`)
    }
    // Cas 2 : Un membre quitte un salon vocal
    else if (oldChannel != null && newChannel == null) {
      await logChannel.send(`${member.user.tag} a quitté le salon vocal ${oldChannel.name}.`)
    }
    // Cas 3 : Un membre se déplace d’un salon vocal à un autre
    else if (oldChannel != null && newChannel != null && oldChannel.id !== newChannel.id) {
      await logChannel.send(`${member.user.tag} s'est déplacé de ${oldChannel.name} vers ${newChannel.name}.`)
    }
  }
})
