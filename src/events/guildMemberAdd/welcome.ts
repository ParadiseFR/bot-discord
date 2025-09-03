import { EmbedBuilder, Events, TextChannel } from 'discord.js'

import { Canvas, Config, event } from '../../tools'
import { BOT_INSTANCE } from '../../app'

export default event(Events.GuildMemberAdd, async (_, member) => {
  // Logger.debug(`New member: ${member.user.tag}`)

  const channel = member.guild.channels.cache.get(Config.WELCOME_CHANNEL_ID)

  if (channel != null && channel instanceof TextChannel) {
    const count = (await BOT_INSTANCE.membersCount(member.guild)).toString()
    const attachment = await Canvas.create(member, (ctx): void => {
      ctx.fillText(`Bienvenue, ${member.user.username}!`, 250, 100)
      ctx.fillText(`Member #${count}`, 250, 150)
    })

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`Bienvenue ${member.guild.name} 🎉 !`)
      .setDescription(`Hey ${member.user.tag}, nous sommes ravis de vous accueillir parmi nous !`) // TODO: welcome back user message
      .setImage(`attachment://welcome.png`)
      .setTimestamp()

    await channel.send({
      embeds: [embed],
      files: [{ attachment, name: 'welcome.png' }]
    })
  }
})
