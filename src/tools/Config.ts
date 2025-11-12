import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { z } from 'zod'
import { load } from 'js-yaml'

export const GUILDS_CONFIG_DIR = `${homedir()}/.mybot`
export const GUILDS_CONFIG_PATH = join(GUILDS_CONFIG_DIR, 'guilds.json')

export const ROOT_DIR = (path?: string): string => {
  return process.cwd().concat(path != null ? `/${path}` : '')
}

export const ASSETS_DIR = (asset: string): string => {
  return `${ROOT_DIR('/assets')}/${asset}`
}

const ConfigSchema = z.strictObject({
  PREFIX: z.string(),
  MOODS_LIST: z.array(z.string()),
  WRITE_LOGS: z.boolean()
})

const configPath = load(readFileSync(`${ROOT_DIR()}/config.yml`, 'utf8'))

export const Config = ConfigSchema.parse(configPath)
