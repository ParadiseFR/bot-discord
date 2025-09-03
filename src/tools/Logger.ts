import { green, yellow, dim, bgRed } from 'ansi-colors'
import type { ClientUser } from 'discord.js'

import { Config } from './Config'

const PREFIX_INIT = green.bold(`${Config.PREFIX} [INIT] > `)
const PREFIX_WARN = yellow.bold(`${Config.PREFIX} [WARN] > `)
const PREFIX_DEBUG = dim(`${Config.PREFIX} [DEBUG] > `)
const PREFIX_ERROR = bgRed(`${Config.PREFIX} [ERROR] > `)

const error = (...messages: Array<string | Error | unknown>): void => {
  return console.error(
    `${PREFIX_ERROR} ${messages
      .map((m): string => (typeof m === 'string' ? m : m instanceof Error ? m.stack ?? m.message : String(m)))
      .join(' ')}`
  )
}

const warn = (...messages: Array<string | Error | unknown>): void => {
  return console.warn(
    `${PREFIX_WARN} ${messages
      .map((m): string => (typeof m === 'string' ? m : m instanceof Error ? m.stack ?? m.message : String(m)))
      .join(' ')}`
  )
}

const debug = (...messages: Array<string | Error | unknown>): void => {
  return console.log(
    `${PREFIX_DEBUG} ${messages
      .map((m): string => (typeof m === 'string' ? m : m instanceof Error ? m.stack ?? m.message : String(m)))
      .join(' ')}`
  )
}

const init = (user: ClientUser): void => {
  return console.log(`${PREFIX_INIT} ${user.tag} is connected!`)
}

export const Logger = { error, debug, warn, init }
