import { Command } from '../../interfaces';
import { Message, MessageEmbed } from 'discord.js';
import database from '../../database/database';
import { urlToColours } from '../../utils/urlToColours';

export const command: Command = {
    name: 'ping',
    aliases: [],
    category: 'info',
    description: 'Shows the latency for Bento Bot, the Discord API and the bot\'s database in PostgreSQL',
    usage: 'ping',
    run: async (client, message, args): Promise<Message> => {
        const msg = await message.channel.send('🏓 Pinging...');

        let dbTimeStart = new Date().getTime();
        try {
            await database.authenticate();
            let dbTimeEnd = new Date().getTime();
            const dbTime = dbTimeEnd - dbTimeStart;

            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
            .setTitle('🏓 Pong!')
            .setDescription(`Bot Latency is **${Math.floor(msg.createdTimestamp - message.createdTimestamp)} ms** \nAPI Latency is **${Math.round(client.ws.ping)} ms**\nPostgreSQL Latency is **${dbTime} ms**`);

            return message.channel.send(embed);
        } catch (error) {
            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
            .setTitle('🏓 Pong!')
            .setDescription(`Bot Latency is **${Math.floor(msg.createdTimestamp - message.createdTimestamp)} ms** \nAPI Latency is **${Math.round(client.ws.ping)} ms**\nPostgreSQL connection was not established, error: ${error}`);

            return message.channel.send(embed);
        }
    }
}