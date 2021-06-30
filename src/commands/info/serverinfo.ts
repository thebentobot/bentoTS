import { Command } from '../../interfaces';
import { MessageEmbed } from 'discord.js';
import { capitalize, urlToColours } from '../../utils/index';

export const command: Command = {
    name: 'serverinfo',
    aliases: [],
    category: 'info',
    description: 'Displays info about the current server.',
    usage: 'serverinfo',
    run: async (client, message, args): Promise<any> => {
        const embed = new MessageEmbed()
        .setTitle(message.guild.name)
        .setColor(`${await urlToColours(message.guild.iconURL({ format: 'png'}))}`)
        .setThumbnail(message.guild.iconURL({ dynamic: true, format: 'png'}))
        .setDescription('Here is some information I found for this server.')
        .addField('Server ID', message.guild.id)
        .addField('Server owner', `${(message.guild.owner.user.username)} (${message.guild.ownerID})`)
        .addField('Server region', capitalize(message.guild.region))
        .addField("Total members", message.guild.memberCount.toLocaleString())
        .addField('Server boost level', message.guild.premiumTier)
        .addField('Server boosters', message.guild.premiumSubscriptionCount, true)
        .addField('Text channels | Voice channels', `${message.guild.channels.cache.filter(channel => channel.type === 'text').size} | ${message.guild.channels.cache.filter(channel => channel.type === 'voice').size}`)
        .addField('Amount of roles', message.guild.roles.cache.size)
        .addField('Created at', message.guild.createdAt)
        .addField('Emotes', `${message.guild.emojis.cache.size} in total.\n${message.guild.emojis.cache.array().filter(e=>e.animated).length} animated emotes.`);
        return message.channel.send(embed)
    }
}