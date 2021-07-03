import { Event } from '../interfaces';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import database from '../database/database.js';
import { initModels, messageLog } from '../database/models/init-models.js';

export const event: Event = {
    name: 'messageUpdate',
    run: async (client, oldMessage: Message, newMessage: Message): Promise<any> => {
        if (oldMessage.author.bot) return;
        initModels(database);

        try {
            const log = await messageLog.findOne({where: { guildID: oldMessage.guild.id}})
            const messageLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;

            const embed = new MessageEmbed()
            .setAuthor(`${oldMessage.author.username + '#' + oldMessage.author.discriminator} (userID: ${oldMessage.author.id})`, oldMessage.author.displayAvatarURL())
            .setColor('#FFF000')
            .setDescription(`Message edited in <#${oldMessage.channel.id}>\n**Before:** ${oldMessage.content}\n**After:** ${newMessage.content}`)
            .setFooter('Edited at')
            .setTimestamp(oldMessage.createdAt)

            await messageLogChannel.send(embed)
        } catch {
            return
        }

    }
}