import {
  APIEmbedField,
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Collection,
  ComponentType,
  EmbedBuilder,
  Events,
  Guild,
  GuildBasedChannel,
  GuildMember,
  MessageActionRowComponentBuilder,
  MessageFlags,
  OverwriteData,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  TextChannel,
  User
} from 'discord.js'

import { GuildSettings, HttpUtils, Logger, event } from '../../tools'

const parseTicketDetails = async (
  channel: BaseGuildTextChannel
): Promise<{ user: User; catName: string } | undefined> => {
  if (channel.topic == null || channel.topic.length === 0) return

  const split = channel.topic?.split('|')
  const userId = split[1]
  const catName = split[2] ?? 'Default'
  const user = await channel.client.users.fetch(userId, { cache: false })

  return { user, catName }
}

const isTicketChannel = (channel: GuildBasedChannel): channel is TextChannel => {
  return (
    channel.type === ChannelType.GuildText &&
    channel.name.startsWith('ticket-') &&
    channel.topic != null &&
    channel.topic.length > 0
  )
}

const closeTicket = async (channel: TextChannel, closedBy: User, reason?: string): Promise<string> => {
  if (
    !channel.deletable ||
    !channel
      .permissionsFor(channel.guild.members.me as GuildMember)
      .has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory])
  ) {
    return 'MISSING_PERMISSIONS'
  }

  try {
    const messages = await channel.messages.fetch()
    const reversed = Array.from(messages.values()).reverse()

    let content = ''

    for (const m of reversed) {
      content += `[${new Date(m.createdAt).toLocaleString('en-US')}] - ${m.author.username}\n`
      if (m.cleanContent !== '') content += `${m.cleanContent}\n`
      if (m.attachments.size > 0) content += `${m.attachments.map((att) => att.proxyURL).join(', ')}\n`
      content += '\n'
    }

    const logsUrl = await HttpUtils.uploadFile(content, `Ticket Logs for ${channel.name}`)
    const ticketDetails = await parseTicketDetails(channel)
    const components = []

    if (logsUrl != null) {
      components.push(
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(new ButtonBuilder().setLabel('Transcript').setURL(logsUrl).setStyle(ButtonStyle.Link))
          .toJSON()
      )
    }

    if (channel.deletable) await channel.delete()

    const embed = new EmbedBuilder().setAuthor({ name: 'Ticket Closed' }).setColor('#e17055')
    const fields = [] as APIEmbedField[]

    if (reason != null && reason.length > 0) {
      fields.push({ name: 'Reason', value: reason, inline: false })
    }

    fields.push(
      {
        name: 'Opened By',
        value: ticketDetails?.user != null ? ticketDetails.user.username : 'Unknown',
        inline: true
      },
      {
        name: 'Closed By',
        value: closedBy != null ? closedBy.username : 'Unknown',
        inline: true
      }
    )

    embed.setFields(fields)

    const { LOGS } = GuildSettings.get(channel.guild)
    if (LOGS.TICKET_CHANNEL_ID != null && LOGS.TICKET_CHANNEL_ID.length > 0) {
      const logChannel = channel.guild.channels.cache.get(LOGS.TICKET_CHANNEL_ID)

      if (logChannel != null && logChannel instanceof TextChannel) {
        await logChannel.send({ embeds: [embed], components })
      }
    }

    if (ticketDetails?.user != null) {
      const dmEmbed = embed
        .setDescription(`**Server:** ${channel.guild.name}\n**Category:** ${ticketDetails.catName}`)
        .setThumbnail(channel.guild.iconURL())

      await ticketDetails.user.send({ embeds: [dmEmbed], components })
    }

    return 'SUCCESS'
  } catch (error) {
    Logger.error('closeTicket', error)
    return 'ERROR'
  }
}

const getTicketChannels = (guild: Guild): Collection<string, TextChannel> => {
  return guild.channels.cache.filter((ch): ch is TextChannel => isTicketChannel(ch))
}

const getExistingTicketChannel = (guild: Guild, userId: string): TextChannel | undefined => {
  const tktChannels = getTicketChannels(guild)
  return tktChannels?.filter((ch): boolean => ch.topic?.split('|')[1] === userId).first()
}

export default event(Events.InteractionCreate, async (_, interaction) => {
  if (interaction.isButton()) {
    const { guild, user, channel, customId } = interaction

    switch (customId) {
      case 'TICKET_CREATE':
        if (channel != null && 'guild' in channel && guild != null && user != null) {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral })

          if (Boolean(guild?.members.me?.permissions.has(PermissionFlagsBits.ManageChannels))) {
            return await interaction.followUp('Cannot create ticket channel, missing `Manage Channel` permission')
          }

          if (getExistingTicketChannel(guild, user.id) != null) {
            return await interaction.followUp(`You already have an open ticket`)
          }

          const { TICKET } = GuildSettings.get(guild)

          const existing = getTicketChannels(guild).size
          if (existing != null && existing > TICKET.LIMIT)
            return await interaction.followUp('There are too many open tickets. Try again later')

          let catName: string | null = null
          let catPerms = [] as string[]

          if (TICKET.CATEGORIES.length > 0) {
            const options = TICKET.CATEGORIES.map((cat) => ({
              label: cat.name,
              value: cat.name
            }))

            const menuRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('ticket-menu')
                .setPlaceholder('Choose the ticket category')
                .addOptions(options)
            )

            await interaction.followUp({ content: 'Please choose a ticket category', components: [menuRow] })

            const res = await channel.awaitMessageComponent({
              componentType: ComponentType.StringSelect,
              time: 60 * 1000
            })
            /* .catch((error) => {
                if (error.message.includes('time')) return
              }) */

            if (res == null) return await interaction.editReply({ content: 'Timed out. Try again', components: [] })

            await interaction.editReply({ content: 'Processing', components: [] })

            catName = res.values[0]
            catPerms = TICKET.CATEGORIES.find((cat) => cat.name === catName)?.roles ?? []
          }

          try {
            const ticketNumber = (existing + 1).toString()
            const permissionOverwrites = [
              { id: guild.roles.everyone, deny: ['ViewChannel'] },
              { id: user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
              {
                id: guild.members.me?.roles.highest.id as string,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
              }
            ] satisfies OverwriteData[]

            if (catPerms?.length > 0) {
              if (catPerms != null && catPerms.length > 0)
                for (const roleId of catPerms) {
                  const role = guild.roles.cache.get(roleId)

                  if (role == null) continue

                  permissionOverwrites.push({
                    id: role.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                  })
                }
            }

            const tktChannel = await guild.channels.create({
              name: `ticket-${ticketNumber}`,
              type: ChannelType.GuildText,
              topic: `ticket|${user.id}|${catName ?? 'Default'}`,
              permissionOverwrites
            })

            const embed = new EmbedBuilder()
              .setAuthor({ name: `Ticket #${ticketNumber}` })
              .setDescription(
                `Hello ${user.toString()}
              Support will be with you shortly
              ${catName != null ? `\n**Category:** ${catName}` : ''}
              `
              )
              .setFooter({ text: 'You may close your ticket anytime by clicking the button below' })

            const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('Close Ticket')
                .setCustomId('TICKET_CLOSE')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Primary)
            )

            const sent = await tktChannel.send({ content: user.toString(), embeds: [embed], components: [buttonsRow] })

            const dmEmbed = new EmbedBuilder()
              .setColor('Blue')
              .setAuthor({ name: 'Ticket Created' })
              .setThumbnail(guild.iconURL())
              .setDescription(
                `**Server:** ${guild.name}
              ${catName != null ? `**Category:** ${catName}` : ''}
              `
              )

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setLabel('View Channel').setURL(sent.url).setStyle(ButtonStyle.Link)
            )

            await user.send({ embeds: [dmEmbed], components: [row] })

            await interaction.editReply(`Ticket created! 🔥`)
          } catch (error_) {
            Logger.error('handleTicketOpen', error_)
            return await interaction.editReply('Failed to create ticket channel, an error occurred!')
          }
        }

        break
      case 'TICKET_CLOSE':
        if (channel != null && 'guild' in channel) {
          if (channel.type === ChannelType.GuildText) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral })

            const status = await closeTicket(channel, user)

            if (status === 'MISSING_PERMISSIONS') {
              return await interaction.followUp('Cannot close the ticket, missing permissions.')
            } else if (status === 'ERROR') {
              return await interaction.followUp('Failed to close the ticket, an error occurred!')
            }
          }
        }

        break
    }
  }

  return interaction.guild
})
