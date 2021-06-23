import { Command } from '../../interfaces';
import { MessageEmbed } from 'discord.js';
const { Sequelize } = require('sequelize');
import ConfigJson from '../../../config.json'

export const command: Command = {
    name: 'ping',
    aliases: [],
    category: 'info',
    description: 'Shows the latency for Bento Bot, the Discord API and the bot\'s database in PostgreSQL',
    usage: 'ping',
    run: async (client, message, args) => {
        const msg = await message.channel.send('🏓 Pinging...');

        let dbTimeStart = new Date().getTime();
        const db = new Sequelize(ConfigJson.postgreSQL);
        try {
            await db.authenticate();
            let dbTimeEnd = new Date().getTime();
            const dbTime = dbTimeEnd - dbTimeStart;

            const embed = new MessageEmbed()
            .setColor('#ff8956')
            .setTitle('🏓 Pong!')
            .setDescription(`Bot Latency is **${Math.floor(msg.createdTimestamp - message.createdTimestamp)} ms** \nAPI Latency is **${Math.round(client.ws.ping)} ms**\nPostgreSQL Latency is **${dbTime} ms**`);

            message.channel.send(embed);
        } catch (error) {
            const embed = new MessageEmbed()
            .setColor('#ff8956')
            .setTitle('🏓 Pong!')
            .setDescription(`Bot Latency is **${Math.floor(msg.createdTimestamp - message.createdTimestamp)} ms** \nAPI Latency is **${Math.round(client.ws.ping)} ms**\nPostgreSQL connection was not established, error: ${error}`);

            message.channel.send(embed);
        }
    }
}