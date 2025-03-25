# discord-mass-dm

### Overview
This Discord bot allows authorized users to send announcements to all members of a Discord server via direct messages.

### Prerequisites
- Node.js installed
- Discord Bot Token
- Basic understanding of Discord bot setup

### Installation and Setup
1. Unzip the project files
2. Open `config.json` and configure:
   ```json
   {
     "token": "YOUR_DISCORD_BOT_TOKEN",
     "authorizedUserId": "YOUR_DISCORD_USER_ID"
   }
   ```
   - `token`: Your Discord Bot Token
   - `authorizedUserId`: Your Discord User ID (the only user who can send announcements)

3. Double-click `start.bat`
   - This script will automatically:
     * Install required npm packages
     * Start the bot

### Usage
In a Discord server, use the command: `!announce #channel [message]`
- `#channel`: Channel for the summary report
- `[message]`: Announcement content

### Security
- Only the configured authorized user can send announcements
- Prevents bot users from receiving announcements

### Features
- Send announcements to all server members
- Embedded announcement messages
- Logging of transmission statistics
- Progress tracking during announcement

## Discord Support Server
- Join our Discord support server for help and updates: [Support Server](https://discord.gg/n3BnCfVBeA)

