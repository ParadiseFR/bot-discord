import { green, yellow, dim, bgRed } from 'ansi-colors'
import type { ClientUser } from 'discord.js'

import { Config } from './Config'

const PREFIX_INIT = green.bold(`${Config.PREFIX} [INIT] > `)
const PREFIX_WARN = yellow.bold(`${Config.PREFIX} [WARN] > `)
const PREFIX_DEBUG = dim(`${Config.PREFIX} [DEBUG] > `)
const PREFIX_ERROR = bgRed(`${Config.PREFIX} [ERROR] > `)

const error = (message: string | Error | unknown): void => {
  return console.error(`\n${PREFIX_ERROR} ${String(message)}\n`)
}

const warn = (message: string): void => {
  return console.warn(`\n${PREFIX_WARN} ${message}\n`)
}

const debug = (message: string): void => {
  return console.log(`\n${PREFIX_DEBUG} ${message}\n`)
}

const init = (user: ClientUser): void => {
  return console.log(`\n${PREFIX_INIT} ${user.tag} is connected!\n`)
}

export const Logger = { error, debug, warn, init }
