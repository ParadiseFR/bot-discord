import type { Guild, User, Ticket, Message } from '@prisma/client'

import { prisma } from './prisma'

export class DatabaseService {
  // Guild operations
  static async getOrCreateGuild(discordId: string, name: string): Promise<Guild> {
    return await prisma.guild.upsert({
      where: { discordId },
      update: { name },
      create: {
        discordId,
        name,
        isActive: true
      }
    })
  }

  static async updateGuildPrefix(discordId: string, prefix: string): Promise<Guild> {
    return await prisma.guild.update({
      where: { discordId },
      data: { prefix }
    })
  }

  // User operations
  static async getOrCreateUser(discordId: string, username: string, email?: string): Promise<User> {
    return await prisma.user.upsert({
      where: { discordId },
      update: { username, email },
      create: {
        discordId,
        username,
        email
      }
    })
  }

  // Ticket operations
  static async createTicket(
    discordId: string,
    userDiscordId: string,
    title: string,
    description?: string
  ): Promise<Ticket> {
    const user = await this.getOrCreateUser(userDiscordId, 'Unknown User')

    return await prisma.ticket.create({
      data: {
        discordId,
        userId: user.id,
        title,
        description
      },
      include: {
        user: true
      }
    })
  }

  static async getTicketsByUser(userDiscordId: string): Promise<Ticket[]> {
    const user = await prisma.user.findUnique({
      where: { discordId: userDiscordId }
    })

    if (!user) return []

    return await prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async updateTicketStatus(
    discordId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  ): Promise<Ticket> {
    return await prisma.ticket.update({
      where: { discordId },
      data: {
        status,
        closedAt: status === 'CLOSED' || status === 'RESOLVED' ? new Date() : null
      }
    })
  }

  // Message logging
  static async logMessage(
    discordId: string,
    userDiscordId: string,
    content: string,
    channelId: string,
    guildId: string
  ): Promise<Message> {
    const user = await this.getOrCreateUser(userDiscordId, 'Unknown User')

    return await prisma.message.create({
      data: {
        discordId,
        userId: user.id,
        content,
        channelId,
        guildId
      }
    })
  }

  static async getUserMessageCount(userDiscordId: string, guildId?: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { discordId: userDiscordId }
    })

    if (!user) return 0

    const where: any = { userId: user.id }
    if (guildId) where.guildId = guildId

    return await prisma.message.count({ where })
  }

  // Utility methods
  static async isGuildActive(discordId: string): Promise<boolean> {
    const guild = await prisma.guild.findUnique({
      where: { discordId },
      select: { isActive: true }
    })

    return guild?.isActive ?? false
  }

  static async closeInactiveTickets(hoursOld: number = 24): Promise<number> {
    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000)

    const result = await prisma.ticket.updateMany({
      where: {
        status: 'OPEN',
        createdAt: {
          lt: cutoffDate
        }
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    })

    return result.count
  }
}

export default DatabaseService
