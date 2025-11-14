import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { BOT_INSTANCE } from './app'

const app = express()
const PORT = process.env.API_PORT || 3000

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false // Disable CSP for API
  })
)

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // In production, set to your GitHub Pages domain
    methods: ['GET'],
    credentials: false
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/stats', limiter)
app.use('/health', limiter)

app.use(express.json())

// Health check endpoint for uptime monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Stats endpoint
app.get('/stats', async (_req: Request, res: Response) => {
  try {
    const client = BOT_INSTANCE.client

    // Calculate stats
    const guilds = client.guilds.cache.size
    const users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
    const channels = client.channels.cache.size
    const uptime = process.uptime() * 1000 // in milliseconds

    const stats = {
      status: client.readyAt ? 'online' : 'offline',
      uptime: Math.floor(uptime),
      guilds,
      users,
      channels,
      lastUpdate: new Date().toISOString(),
      readyAt: client.readyAt?.toISOString()
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export function startAPIServer() {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`)
  })
}
