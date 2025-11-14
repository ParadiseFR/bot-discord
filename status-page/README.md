# Bot Status Page

A SolidJS-based status page for the Discord bot, deployed on GitHub Pages.

## Features

- Real-time bot status (online/offline)
- Live statistics (uptime, servers, users, channels)
- Auto-refresh every 30 seconds
- Responsive design
- Error handling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Create a `.env` file in this directory:

```env
VITE_API_URL=https://your-bot-api.com
```

The API should provide endpoints:
- `GET /stats` - Returns bot statistics
- `GET /health` - Health check for uptime monitoring

## API Response Format

`/stats` should return:

```json
{
  "status": "online",
  "uptime": 3600000,
  "guilds": 42,
  "users": 12345,
  "channels": 6789,
  "lastUpdate": "2025-11-14T12:00:00Z",
  "readyAt": "2025-11-14T10:00:00Z"
}
```

## Deployment

The status page is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

To set up a custom domain:
1. Add a `CNAME` file to the `status-page/public/` directory with your domain
2. Update the GitHub repository settings to use GitHub Pages with your custom domain
3. Update the CORS settings in the bot's API to allow requests from your domain# Test
# Test 2
# Test 3
# Test 4
# Test 5
# Test 6
# Test 7
