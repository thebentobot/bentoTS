import { Event } from '../interfaces';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import database from '../database/database';
import { initModels, messageLog } from '../database/models/init-models';

export const event: Event = {
    name: 'messageDelete',
    run: async (client, message: Message): Promise<any> => {
        if (message.author.bot) return;
        initModels(database);

        try {
            const log = await messageLog.findOne({where: { guildID: message.guild.id}})
            const messageLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;

            const embed = new MessageEmbed()
            .setAuthor(`${message.author.username} (userID: ${message.author.id})`, message.author.displayAvatarURL())
            .setColor('#FF2D00')
            .setDescription(`Message deleted in <#${message.channel.id}>\n**Deleted message:**\n${message.content}`)
            .addField('Channel ID', message.channel.id)
            .addField('Message ID', message.id)
            .setFooter('Deleted at')
            .setTimestamp(message.createdAt)

            await messageLogChannel.send(embed)
        } catch {
            return
        }

    }
}