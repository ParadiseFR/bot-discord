#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 {on|off|restart}"
    exit 1
fi

ACTION=$1

if [ "$ACTION" != "on" ] && [ "$ACTION" != "off" ] && [ "$ACTION" != "restart" ]; then
    echo "Invalid action. Use 'on', 'off', or 'restart'."
    exit 1
fi

source "$(dirname "$0")/common.sh"

CHECK_COMMAND="docker ps -q --filter name=$CONTAINER_NAME --filter status=running"

case $ACTION in
    on)
        # Check if container is already running
        if sshpass -p "$VPS_PASSWORD" ssh -o LogLevel=ERROR "$VPS_NETWORK" "$CHECK_COMMAND" | grep -q .; then
            echo "Bot is already on, there is nothing to do"
            exit 0
        else
            COMMAND="docker compose -f $BOT_PATH/compose.yml up -d"
        fi
        ;;
    off)
        # Check if container is running
        if sshpass -p "$VPS_PASSWORD" ssh -o LogLevel=ERROR "$VPS_NETWORK" "$CHECK_COMMAND" | grep -q .; then
            COMMAND="docker compose -f $BOT_PATH/compose.yml down"
        else
            echo "Bot is already off, there is nothing to do"
            exit 0
        fi
        ;;
    restart)
        COMMAND="docker compose -f $BOT_PATH/compose.yml restart"
        ;;
esac

sshpass -p "$VPS_PASSWORD" ssh -o LogLevel=ERROR "$VPS_NETWORK" "$COMMAND"

if [ $? -eq 0 ]; then
    echo "VPS connected successfully."
else
    echo "Failed to connect to VPS."
fi