import { Command } from '../../interfaces';
import { Message, MessageEmbed, User } from 'discord.js';
import { trim, urlToColours } from '../../utils/index';
import moment from 'moment';

export const command: Command = {
    name: 'whois',
    aliases: ['user', 'userinfo'],
    category: 'info',
    description: 'Displays info about the mentioned user or the user who uses the command.',
    usage: 'whois <@user/userID> to find a user. If no user is specified it shows info for you',
    website: 'https://www.bentobot.xyz/commands#whois',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) {
            const embed = new MessageEmbed()
            .setColor(`${await urlToColours(message.author.avatarURL({ format: 'png'}))}`)
            .setTitle(`Profile for ${message.author.tag}`)
            .setThumbnail(message.author.avatarURL({ format: 'png', dynamic: true }))
            .setTimestamp()
            .addFields(
              { name: 'Nickname on the server', value: message.member.displayName},
              { name: 'Last message', value: message.author.lastMessage, inline: true},
              { name: 'User ID', value: message.author.id},
              { name: 'Account created on', value: `<t:${moment(message.author.createdAt).format("X")}:F>`},
              { name: 'Joined server at', value: `<t:${moment(message.member.joinedAt).format("X")}:F>`, inline: true},
              { name: 'Highest role', value: message.member.roles.highest},
              { name: 'All roles', value: trim(message.member.roles.cache.map(r => `${r}`).join(' | '), 1024), inline: true},
            )
            return message.channel.send(embed)
        }

        if (args[0]) {
            let user = args[0]

            let userID = getUserFromMention(user)

            if (message.guild.members.cache.has(userID)) {
                const user = message.guild.members.cache.get(userID)
                const embed = new MessageEmbed()
                .setColor(`${await urlToColours(user.user.avatarURL({ format: 'png'}))}`)
                .setTitle(`Profile for ${user.user.username + '#' + user.user.discriminator}`)
                .setThumbnail(user.user.avatarURL({ format: 'png', dynamic: true }))
                .setTimestamp()
                .addFields(
                    { name: 'Nickname on the server', value: user.displayName},
                    { name: 'Last message', value: user.lastMessage, inline: true},
                    { name: 'User ID', value: user.id},
                    { name: 'Account created on', value: `<t:${moment(user.user.createdAt).format("X")}:F>`},
                    { name: 'Joined server at', value: `<t:${moment(user.joinedAt).format("X")}:F>`, inline: true},
                    { name: 'Highest role', value: user.roles.highest},
                    { name: 'All roles', value: trim(user.roles.cache.map(r => `${r}`).join(' | '), 1024), inline: true},
                )
            return message.channel.send(embed)
            } else {
                try {
                    const globalUser = await client.users.fetch(userID).catch(() => console.error('fetch user error in whois.ts line 56')) as User
                    if (globalUser.bot === true) return
                    const embed = new MessageEmbed()
                    .setColor(`${await urlToColours(globalUser.avatarURL({ format: 'png'}))}`)
                    .setTitle(`Profile for ${globalUser.username + '#' + globalUser.discriminator}`)
                    .setThumbnail(globalUser.avatarURL({ format: 'png', dynamic: true }))
                    .setTimestamp()
                    .addFields(
                        { name: 'User ID', value: globalUser},
                        { name: 'Account created on', value: `<t:${moment(globalUser.createdAt).format("X")}:F>`},
                    )
                    return message.channel.send(embed)
                } catch {
                    return message.channel.send('This user does not exist.')
                }
            }
        }

        function getUserFromMention(mention: string) {
            if (!mention) return;
        
            if (mention.startsWith('<@') && mention.endsWith('>')) {
                mention = mention.slice(2, -1);
        
                if (mention.startsWith('!')) {
                    mention = mention.slice(1);
                }
        
                return client.users.cache.get(mention).id;
            } else {
                return mention
            }
        }
    }
}