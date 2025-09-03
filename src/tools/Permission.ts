import { ChatInputCommandInteraction, Guild, PermissionResolvable } from 'discord.js'

import { Command } from '../types'

export interface PermissionResult {
  result: boolean
  missing: string[]
}

export class MissingPermissionsExceptionError extends Error {
  constructor(public permissions: string[]) {
    super(`Missing permissions: ${permissions.join(', ')}`)
    this.name = 'MissingPermissionsExceptionError'
  }

  public toString(): string {
    return this.message
  }
}

export const checkPermissions = async (
  command: Command,
  interaction: ChatInputCommandInteraction
): Promise<PermissionResult> => {
  const { members } = interaction.guild as Guild
  const member = await members.fetch({ user: interaction.client.user.id })
  const requiredPermissions = command.permissions as PermissionResolvable[]

  if (command.permissions == null) return { result: true, missing: [] }

  const missing = member.permissions.missing(requiredPermissions)

  return { result: missing.length === 0, missing }
}
