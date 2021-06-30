import { MessageEmbed } from 'discord.js';
import { Command } from '../../interfaces';
import { urlToColours } from '../../utils';

export const command: Command = {
    name: 'avatar',
    aliases: ['pfp'],
    category: 'info',
    description: 'Shows user\'s avatars, or your own if you don\'t mention anyone. You can also check the server avatar and banner.',
    usage: 'avatar [userID or mention a user]\navatar server\navatar banner',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
            const embed = new MessageEmbed()
                .setColor(`${await urlToColours(message.author.avatarURL({ format: 'png'}))}`)
                .setTitle(`${message.author.tag}'s avatar`)
                .setImage(message.author.avatarURL({ format: 'png', size: 1024, dynamic: true }))
                .setTimestamp()
            return message.channel.send(embed)
        }

        if (args[0] === 'server') {
            if (message.guild.iconURL() === null) return
            const embed = new MessageEmbed()
                .setColor(`${await urlToColours(message.guild.iconURL({ format: 'png'}))}`)
                .setTitle(`${message.guild.name}'s avatar`)
                .setImage(message.guild.iconURL({ format: 'png', size: 1024, dynamic: true }))
                .setTimestamp()
            return message.channel.send(embed)
        }

        if (args[0] === 'banner') {
            if (message.guild.bannerURL() === null) return
            const embed = new MessageEmbed()
                .setColor(`${await urlToColours(message.guild.bannerURL({ format: 'png'}))}`)
                .setTitle(`${message.guild.name}'s banner`)
                .setImage(message.guild.bannerURL({ format: 'png', size: 1024 }))
                .setTimestamp()
            return message.channel.send(embed)
        }

        let userID = args[0]
        const user = message.mentions.members.first() || await message.guild.members.fetch(userID)
        if (user) {
            const embed = new MessageEmbed()
                .setColor(`${await urlToColours(user.user.avatarURL({ format: 'png'}))}`)
                .setTitle(`${user.user.username + '#' + user.user.discriminator}'s avatar`)
                .setImage(user.user.avatarURL({ format: 'png', size: 1024, dynamic: true }))
                .setTimestamp()
            return message.channel.send(embed)
        }
    }
}