import { EmbedBuilder, Events, TextChannel } from 'discord.js'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Canvas, Config, Logger, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberAdd, async (_, partialMember) => {
  const member = await BOT_INSTANCE.refinePartialMember(partialMember)

  if (!member.user.bot) {
    const channel = member.guild.channels.cache.get(Config.WELCOME_CHANNEL_ID)

    if (channel != null && channel instanceof TextChannel) {
      const count = (await BOT_INSTANCE.membersCount(member.guild)).toString()
      const attachment = await Canvas.create(member, (ctx): void => {
        ctx.fillText(`Aurevoir, ${member.user.username}!`, 250, 100)
        ctx.fillText(`We now have ${count} members.`, 250, 150)
      })

      const joinedSince = formatDistanceToNow(member.joinedAt as Date, { locale: fr, addSuffix: true })
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`${member.user.username} has left ${member.guild.name}`)
        .setDescription(`Sad to see you go, ${member.user.tag}!`)
        .setImage(`attachment://welcome.png`)
        .setFooter({ text: `Avait rejoint ${joinedSince}` })
        .setTimestamp()

      await channel.send({
        embeds: [embed],
        files: [{ attachment, name: 'welcome.png' }]
      })
    } else {
      Logger.error('No channel was found using welcome channel ID')
    }
  }
})
