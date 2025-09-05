import { Client, GatewayIntentBits, Partials } from 'discord.js'

import { RypiBot } from './Bot'
import { Logger } from './tools'

Logger.setPrefix('init', { bg: '#3742fa', text: '#FFF', icon: '📥', title: 'INIT' })
Logger.setPrefix('commands', { bg: '#00FF00', text: '#FFF', icon: '🖥️', title: 'COMMANDS' })
Logger.setPrefix('env', { bg: '#337022', text: '#FFF', icon: '🌱', title: 'ENV' })

export const BOT_INSTANCE = new RypiBot(
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
