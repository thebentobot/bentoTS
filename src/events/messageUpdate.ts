import { Event } from '../interfaces';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import database from '../database/database';
import { initModels, messageLog } from '../database/models/init-models';

export const event: Event = {
    name: 'messageUpdate',
    run: async (client, oldMessage: Message, newMessage: Message): Promise<any> => {
        initModels(database);

        try {
            const log = await messageLog.findOne({where: { guildID: oldMessage.guild.id}})
            const messageLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;

            const embed = new MessageEmbed()
            .setAuthor(`${oldMessage.author.username} (userID: ${oldMessage.author.id})`, oldMessage.author.displayAvatarURL())
            .setColor('#FFF000')
            .setTitle(`Message edited in <#${oldMessage.channel.id}>`)
            .setDescription(`**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`)
            .setFooter('Edited at')
            .setTimestamp(oldMessage.createdAt)

            await messageLogChannel.send(embed)
        } catch {
            return
        }

    }
}