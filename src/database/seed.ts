import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function main(): Promise<void> {
  // Create a sample guild configuration
  const guild = await prisma.guild.upsert({
    where: { discordId: '123456789012345678' },
    update: {},
    create: {
      discordId: '123456789012345678',
      name: 'Sample Discord Server',
      prefix: '!',
      isActive: true
    }
  })

  console.log('Seeded guild:', guild)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
