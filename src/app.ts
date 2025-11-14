import { fileURLToPath } from 'node:url'

import { Client, GatewayIntentBits, Partials } from 'discord.js'
import i18next from 'i18next'
import Backend from 'i18next-fs-backend'

import { Bot } from './Bot'
import { Logger } from './tools'
import { startAPIServer } from './api'

Logger.setPrefix('init', { bg: '#3742fa', text: '#FFF', icon: '📥', title: 'INIT' })
Logger.setPrefix('commands', { bg: '#803DC1', text: '#FFF', icon: '💻', title: 'COMMANDS' })
Logger.setPrefix('env', { bg: '#337022', text: '#FFF', icon: '🌱', title: 'ENV' })
Logger.addMainPrefix('all', { bg: '#000000', text: '#ffffff', label: 'ALL' })

// Initialize i18next
await i18next.use(Backend).init({
  backend: {
    loadPath: fileURLToPath(new URL('locales/{{lng}}/{{ns}}.json', import.meta.url))
  },
  cleanCode: true,
  fallbackLng: ['en-US'],
  defaultNS: 'commands',
  lng: 'en-US',
  ns: ['commands', 'events', 'messages']
})

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

// Start API server
startAPIServer()
