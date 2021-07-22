import { MessageEmbed } from 'discord.js';
import { Command } from '../../interfaces';
import { trim } from '../../utils';

export const command: Command = {
    name: 'roles',
    aliases: ['role'],
    category: 'info',
    description: 'Shows list of roles on the server.',
    usage: 'roles',
    run: async (client, message, args): Promise<any> => {
        const embed = new MessageEmbed()
        .setAuthor(message.guild.name, message.guild.iconURL({format: 'png'}))
        .setTitle(`All roles in ${message.guild.name}`)
        .setThumbnail(message.guild.iconURL({format: 'png', size: 1024, dynamic: true}))
        .setFooter(`Amount of roles - ${message.guild.roles.cache.size}`)
        .setTimestamp()
        .setDescription(trim(message.guild.roles.cache.map(role => `${role}`).join(' | '), 4096))
        return await message.channel.send(embed)
    }
}