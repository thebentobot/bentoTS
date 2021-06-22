import { Command } from '../../interfaces';
import { MessageEmbed } from 'discord.js';

export const command: Command = {
    name: 'ping',
    aliases: [],
    run: async(client, message, args) => {
        const msg = await message.channel.send('🏓 Pinging...');

        const embed = new MessageEmbed()
        .setColor('#ff8956')
        .setTitle('🏓 Pong!')
        .setDescription(`Bot Latency is **${Math.floor(msg.createdTimestamp - message.createdTimestamp)} ms** \nAPI Latency is **${Math.round(client.ws.ping)} ms**`);

        message.channel.send(embed);
    }
}