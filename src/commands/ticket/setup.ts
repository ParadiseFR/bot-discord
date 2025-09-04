import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ActionRowBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  MessageActionRowComponentBuilder,
  TextInputStyle
} from 'discord.js'

import { command } from '../../tools/Command'

const meta = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configurer le système de tickets')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

meta.addChannelOption((option) =>
  option.setName('salon').setDescription('Salon où envoyer le message de ticket').setRequired(true)
)

export default command({
  meta,
  cooldown: 5,
  execute: async ({ interaction }) => {
    const channel = interaction.options.getChannel('salon', true)

    if (channel instanceof TextChannel) {
      const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder().setCustomId('open').setLabel('📩 Créer un ticket').setStyle(ButtonStyle.Success)
      )

      const sentMessage = await channel.send({
        content: 'Please click the button below to setup ticket message',
        components: [buttonRow]
      })

      if (sentMessage == null) return

      const btnInteract = await channel.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i): boolean =>
          i.customId === 'open' && i.member.id === interaction.user.id && i.message.id === sentMessage.id,
        time: 20000
      })

      if (btnInteract == null) {
        return await sentMessage.edit({ content: 'No response received, cancelling setup', components: [] })
      }

      await btnInteract.showModal(
        new ModalBuilder({
          customId: 'ticket-modal',
          title: 'Ticket Setup',
          components: [
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Embed Title')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Embed Description')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Embed Footer')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            )
          ]
        })
      )

      // receive modal input
      const modal = await btnInteract.awaitModalSubmit({
        time: 1 * 60 * 1000,
        filter: (m): boolean =>
          m.customId === 'ticket-modal' && m.member?.user.id === interaction.user.id && m.message?.id === sentMessage.id
      })

      if (modal == null) {
        return await sentMessage.edit({ content: 'No response received, cancelling setup', components: [] })
      }

      await modal.reply('Setting up ticket message ...')
      const title = modal.fields.getTextInputValue('title')
      const description = modal.fields.getTextInputValue('description')
      const footer = modal.fields.getTextInputValue('footer')

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(description ?? 'Please use the button below to create a ticket')
        .setAuthor({ name: title ?? 'Support Ticket' })
        .setFooter({ text: footer ?? 'You can only have 1 open ticket at a time!' })

      const tktBtnRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder().setLabel('Open a ticket').setCustomId('TICKET_CREATE').setStyle(ButtonStyle.Success)
      )

      await channel.send({ embeds: [embed], components: [tktBtnRow] })
      await modal.deleteReply()
      await sentMessage.edit({ content: 'Done! Ticket Message Created', components: [] })
    }
  }
})
