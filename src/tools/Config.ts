import 'dotenv/config'

import { readFileSync } from 'node:fs'

import { z } from 'zod'
import { load } from 'js-yaml'

export const ROOT_DIR = (path?: string): string => {
  return process.cwd().concat(path != null ? `/${path}` : '')
}

export const ASSETS_DIR = (asset: string): string => {
  return `${ROOT_DIR('/assets')}/${asset}`
}

const ConfigSchema = z.strictObject({
  PREFIX: z.string(),

  LISTEN_ROLE_IDS: z.array(z.string()),

  MEMBER_COUNTER_PATTERN: z.string()
})

const configPath = load(readFileSync(`${ROOT_DIR()}/config.yml`, 'utf8'))

export const Config = ConfigSchema.parse(configPath)
