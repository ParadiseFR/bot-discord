import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Canvas, GuildSettings, Logger, event } from '../../tools'

export default event(Events.GuildMemberAdd, async (_, member) => {
  if (!member.user.bot) {
    const { LOGS } = GuildSettings.get(member.guild)
    const channel = member.guild.channels.cache.get(LOGS.WELCOME_CHANNEL_ID)

    if (channel != null && channel instanceof TextChannel) {
      const previousJoins = member.guild.members.cache.get(member.id)?.joinedTimestamp
      const isReturning = Boolean(previousJoins) && member.joinedTimestamp !== previousJoins
      const title = isReturning ? 'Bon retour' : 'Bienvenue'
      const description = isReturning ? 'heureux que vous soyez de retour ' : 'nous sommes ravis de vous accueillir'

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`${title} ${member.guild.name} 🎉 !`)
        .setDescription(`Hey ${member.user.tag}, ${description} parmi nous !`)
        .setImage(`attachment://welcome.png`)
        .setTimestamp()

      const attachment = await Canvas.create(member, (ctx): void => {
        ctx.fillText(`${title}, ${member.user.username} !`, 250, 100)
      })

      try {
        await channel.send({
          embeds: [embed],
          files: [{ attachment, name: 'welcome.png' }]
        })
      } catch (error) {
        Logger.error('Error sending member join log message:', error)
      }
    } else {
      return Logger.error('Log channel not found or is not a text channel!')
    }
  }
})
