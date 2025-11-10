import { Client, GatewayIntentBits, Partials } from 'discord.js'

import { Bot } from './Bot'
import { Logger } from './tools'

Logger.setPrefix('init', { bg: '#3742fa', text: '#FFF', icon: '📥', title: 'INIT' })
Logger.setPrefix('commands', { bg: '#803DC1', text: '#FFF', icon: '💻', title: 'COMMANDS' })
Logger.setPrefix('env', { bg: '#337022', text: '#FFF', icon: '🌱', title: 'ENV' })
Logger.addMainPrefix('all', { bg: '#000000', text: '#ffffff', label: 'ALL' })

export const BOT_INSTANCE = new Bot(
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.GuildMember]
  })
)
