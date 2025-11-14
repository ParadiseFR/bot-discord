#!/bin/bash

source "$(dirname "$0")/common.sh"

REMOTE_FILE_PATH="$BOT_PATH/guilds.json"
LOCAL_FILE_PATH="$LOCAL_BOT_PATH/guilds.json"

sshpass -p "$VPS_PASSWORD" ssh -o LogLevel=ERROR "$VPS_NETWORK" "docker cp $CONTAINER_NAME:$REMOTE_FILE_PATH $TEMP_REMOTE_PATH"
sshpass -p "$VPS_PASSWORD" scp -o LogLevel=ERROR "$VPS_NETWORK:$TEMP_REMOTE_PATH" "$LOCAL_FILE_PATH"

echo "guilds.json fetched successfully to $LOCAL_FILE_PATH"