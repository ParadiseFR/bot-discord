import { EmbedBuilder, Events, TextChannel } from 'discord.js'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Canvas, Config, Logger, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberAdd, async (_, member) => {
  Logger.log(`New member: ${member.user.tag}`)

  let fullMember = member

  if (member.partial) {
    Logger.warn(`Member ${member.user.tag} is partial, not catched yet, fetching full data...`)
    try {
      fullMember = await member.fetch()
      Logger.log(`Fetched member data: joinedAt = ${fullMember.joinedAt?.toISOString()}`)
    } catch (error) {
      Logger.error(`Failed to fetch full member data for ${member.user.tag}:`, error)
    }
  }

  const channel = member.guild.channels.cache.get(Config.WELCOME_CHANNEL_ID)

  if (channel != null && channel instanceof TextChannel) {
    const count = (await BOT_INSTANCE.membersCount(member.guild)).toString()
    const attachment = await Canvas.create(fullMember, (ctx): void => {
      ctx.fillText(`Aurevoir, ${member.user.username}!`, 250, 100)
      ctx.fillText(`We now have ${count} members.`, 250, 150)
    })
    const joinedSince = formatDistanceToNow(fullMember.joinedAt as Date, { locale: fr, addSuffix: true })

    // TODO: add welcome back message
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`${fullMember.user.username} has left ${fullMember.guild.name}`)
      .setDescription(`Sad to see you go, ${fullMember.user.tag}!`)
      .setImage(`attachment://welcome.png`)
      .setFooter({ text: `Avait rejoint le serveur ${joinedSince}` })
      .setTimestamp()

    await channel.send({
      embeds: [embed],
      files: [{ attachment, name: 'welcome.png' }]
    })
  } else {
    Logger.error('No channel was found using welcome channel ID')
  }
})
