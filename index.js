const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

class AnnouncementBot {
    constructor() {
        this.configFile = path.join(__dirname, 'config.json');
        this.logFile = path.join(__dirname, 'announcement_logs.json');
        this.config = null;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.initializeBot();
    }

    async initializeBot() {
        try {
            await this.loadConfig();

            if (!this.config.token || !this.config.authorizedUserId) {
                throw new Error('Missing token or authorized user ID in configuration');
            }

            this.setupEventListeners();

            this.start();
        } catch (error) {
            console.error('Bot initialization error:', error);
        }
    }

    async loadConfig() {
        try {
            const data = await fs.readFile(this.configFile, 'utf8');
            this.config = JSON.parse(data);
        } catch (error) {
            console.error('Error reading config file:', error);
            
            this.config = {
                token: '',
                authorizedUserId: ''
            };
            await this.saveConfig();
        }
    }

    async saveConfig() {
        try {
            await fs.writeFile(
                this.configFile, 
                JSON.stringify(this.config, null, 2), 
                'utf8'
            );
        } catch (error) {
            console.error('Error saving config file:', error);
        }
    }

    createAnnouncementEmbed(message, author) {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📢 Announcement')
            .setDescription(message)
            .setAuthor({
                name: author.username,
                iconURL: author.displayAvatarURL()
            })
            .setFooter({ 
                text: 'saguard.com.tr', 
                iconURL: 'https://cdn.discordapp.com/attachments/1353807223565979670/1353819110567448646/logo.jpg?ex=67e309cc&is=67e1b84c&hm=5c06306a195b8f6838d44bba59c4af8c673c680580b60a1f4f9a54eccf211dd7&' 
            })
            .setTimestamp();
    }

    createProgressEmbed(total, successful, failed) {
        const progressColor = failed > 0 ? '#e74c3c' : '#2ecc71';
        
        return new EmbedBuilder()
            .setColor(progressColor)
            .setTitle('📡 Announcement Transmission')
            .setDescription('Sending announcement to server members...')
            .addFields(
                { name: '📊 Total Members', value: total.toString(), inline: true },
                { name: '✅ Successful', value: successful.toString(), inline: true },
                { name: '❌ Failed', value: failed.toString(), inline: true }
            )
            .setTimestamp();
    }

    async logAnnouncement(stats) {
        try {
            const logs = await this.readLogs();
            logs.push({
                timestamp: new Date().toISOString(),
                successCount: stats.successful,
                failedCount: stats.failed
            });

            await fs.writeFile(
                this.logFile, 
                JSON.stringify(logs, null, 2), 
                'utf8'
            );
        } catch (error) {
            console.error('Log saving error:', error);
        }
    }

    async readLogs() {
        try {
            const data = await fs.readFile(this.logFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return []; 
        }
    }

    setupEventListeners() {
        this.client.once('ready', () => {
            console.log(`Bot logged in as ${this.client.user.tag}!`);
        });

        this.client.on('messageCreate', async (message) => {
            if (!message.content.startsWith('!announce')) return;

            if(message.author.id === this.client.user.id) {
                return;
            }

            if (message.author.id !== this.config.authorizedUserId && message.author.id != this.client.user.id) {
                return message.reply('❌ You do not have permission to use this command.');
            }

            const args = message.content.split(' ');
            if (args.length < 3) {
                return message.reply('!announce #channel [message]');
            }

            const channel = message.mentions.channels.first();
            if (!channel && message.author.id != this.client.user.id) {
                return message.reply('You must specify a valid channel.');
            }
            const announcementMessage = args.slice(2).join(' ');
            await this.sendAnnouncement(message, announcementMessage, channel);
        });
    }

    async sendAnnouncement(message, announcementMessage, channel) {
        const progressEmbed = this.createProgressEmbed(0, 0, 0);
        const progressMessage = await message.reply({ embeds: [progressEmbed] });
        const guild = message.guild;

        const announcementEmbed = this.createAnnouncementEmbed(announcementMessage, message.author);

        const members = await guild.members.fetch();
        let successful = 0;
        let failed = 0;

        const sendAnnouncement = async (member) => {
            try {
                if (!member.user.bot) {
                    await member.send({ 
                        content: 'ANNOUNCEMENT!',
                        embeds: [announcementEmbed] 
                    });
                    successful++;
                }
            } catch (error) {
                failed++;
            }
        };

        for (const member of members.values()) {
            await sendAnnouncement(member);
            
            const updatedProgressEmbed = this.createProgressEmbed(members.size, successful, failed);
            await progressMessage.edit({ embeds: [updatedProgressEmbed] });
        }

        const summaryEmbed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('📊 Announcement Report')
            .setDescription(
                `**Total Members:** ${members.size}\n` +
                `**Successful Transmissions:** ${successful}\n` +
                `**Failed Transmissions:** ${failed}`
            )
            .setTimestamp();

        await channel.send({ embeds: [summaryEmbed] });

        await this.logAnnouncement({ successful, failed });

        const finalProgressEmbed = this.createProgressEmbed(members.size, successful, failed);
        finalProgressEmbed.setTitle('✅ Announcement Completed');
        await progressMessage.edit({ embeds: [finalProgressEmbed] });
    }

    start() {
        this.client.login(this.config.token);
    }
}

const bot = new AnnouncementBot();
module.exports = AnnouncementBot;