import { Command } from '../../interfaces';
import { MessageEmbed } from 'discord.js';
import { trim, urlToColours } from '../../utils/index';

export const command: Command = {
    name: 'whois',
    aliases: ['profile', 'user'],
    category: 'info',
    description: 'Displays info about the mentioned user or the user who uses the command.',
    usage: 'whois <@user/userID> to find a user. If no user is specified it shows your own profile',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(message.author.avatarURL({ format: 'png'}))}`)
            .setTitle(`Profile for ${message.author.tag}`)
            .setThumbnail(message.author.avatarURL({ format: 'png', dynamic: true }))
            .setTimestamp()
            .addFields(
              { name: 'Nickname on the server', value: message.member.displayName},
              { name: 'Status', value: message.member.presence.status, inline: true},
              { name: 'Last message', value: message.author.lastMessage, inline: true},
              { name: 'User ID', value: message.author.id},
              { name: 'Account created at', value: message.author.createdAt},
              { name: 'Joined server at', value: message.member.joinedAt, inline: true},
              { name: 'Highest role', value: message.member.roles.highest},
              { name: 'All roles', value: trim(message.member.roles.cache.map(r => `${r}`).join(' | '), 1024), inline: true},
            )
            return message.channel.send(embed)
        }

        let userID = args[0]
        const user = message.mentions.members.first() || await message.guild.members.fetch(userID)
        if (user) {
            const colour = await urlToColours(user.user.avatarURL({ format: 'png'}))
            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(user.user.avatarURL({ format: 'png'}))}`)
            .setTitle(`Profile for ${user.user.username + '#' + user.user.discriminator}`)
            .setThumbnail(user.user.avatarURL({ format: 'png', dynamic: true }))
            .setTimestamp()
            .addFields(
                { name: 'Nickname on the server', value: user.displayName},
                { name: 'Status', value: user.presence.status, inline: true},
                { name: 'Last message', value: user.lastMessage, inline: true},
                { name: 'User ID', value: user.id},
                { name: 'Account created at', value: user.user.createdAt},
                { name: 'Joined server at', value: user.joinedAt, inline: true},
                { name: 'Highest role', value: user.roles.highest},
                { name: 'All roles', value: trim(user.roles.cache.map(r => `${r}`).join(' | '), 1024), inline: true},
            )
            return message.channel.send(embed)
        }
    }
}