#!/bin/bash

ENV_FILE="$(dirname "$(dirname "$0")")/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo ".env file not found in project root" && exit 1
fi

if [ -z "$VPS_NETWORK" ] || [ -z "$VPS_PASSWORD" ]; then
    echo "VPS_NETWORK and VPS_PASSWORD must be set in .env file" && exit 1
fi

BOT_PATH="/home/debian/discord-bot"
LOCAL_BOT_PATH="$HOME/.mybot"
CONTAINER_NAME="discord_bot"
TEMP_REMOTE_PATH="/tmp/guilds.json"