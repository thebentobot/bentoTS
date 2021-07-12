import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import database from '../../database/database';

import { initModels, kick, kickCreationAttributes } from '../../database/models/init-models';
import { modLog } from '../../database/models/modLog';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'kick',
    aliases: [],
    category: 'moderation',
    description: 'Kicks the mentioned user from your server.',
    usage: 'kick <user id or mention user> [reason]',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        if (!args[0]) {
            return message.channel.send(`You need to specify a user to kick.\nUse the help command with kick to check options when using the kick command.`)
        }

        let kickedUser: GuildMember;
        let kickedUserID: string;

        try {
            kickedUser = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
            kickedUserID = kickedUser.id
        } catch {
            return message.channel.send('I cannot find the specified member. Please mention a valid member in this Discord server.')
        }

        if (!kickedUser.kickable) {
            return message.channel.send('This member is not kickable.')
        }

        if (message.member.roles.highest.position < kickedUser.roles.highest.position) {
            return message.channel.send('You cannot kick someone with a higher role than you.')
        }

        let reason: string;
        
        if (args.length > 1) {
            reason = args.slice(1).join(' ');
        }

        const kickAttr: kickCreationAttributes = {
            userID: BigInt(kickedUserID),
            guildID: BigInt(message.guild.id),
            date: new Date(),
            actor: BigInt(message.author.id),
            reason: reason
        }

        initModels(database);

        const kicked = await kick.findOrCreate({raw: true, where: {userID: kickedUserID, guildID: message.guild.id}, defaults: kickAttr})

        if (kicked[1] === false) {
            return message.channel.send(`${message.guild.members.cache.get(`${kickedUserID}`).nickname ? `${message.guild.members.cache.get(`${kickedUserID}`).nickname} (${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator}`} is already kicked from this server.\nThe case number for this kick is: \`${kicked[0].kickCase}\` if you want to look up details for this kick use the case check command.`);
        } else {
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#ff8000')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(kickedUser.user.avatarURL())
                .setTitle(`${kickedUser.nickname ? `${kickedUser.nickname} (${kickedUser.user.username}#${kickedUser.user.discriminator})` : `${kickedUser.user.username}#${kickedUser.user.discriminator}`} was kicked!`)
                .setDescription(`**Reason**\n${reason}`)
                .addField('Username', kickedUser.user.username + '#' + kickedUser.user.discriminator)
                .addField('User ID', kickedUser.id)
                .addField('Kicked by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .setTimestamp();
                logChannel.send(embed);
                (await client.users.fetch(kickedUserID)).send(`🦶You were \`kicked\` from **${message.guild.name}** \n**Reason**: ${reason}.`)
                message.channel.send(`${message.guild.members.cache.get(`${kickedUserID}`).nickname ? `${message.guild.members.cache.get(`${kickedUserID}`).nickname} (${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator}`} was successfully banned on this server.\nCase number: ${kicked[0].kickCase}.\nReason: ${kicked[0].reason}\nYou can add notes for this kick by using the case command together with the case number.`)
                kickedUser.kick(reason);
            } catch {
                (await client.users.fetch(kickedUserID)).send(`🦶You were \`kicked\` from **${message.guild.name}** \n**Reason**: ${reason}.`)
                message.channel.send(`${message.guild.members.cache.get(`${kickedUserID}`).nickname ? `${message.guild.members.cache.get(`${kickedUserID}`).nickname} (${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${kickedUserID}`).user.username + '#' + message.guild.members.cache.get(`${kickedUserID}`).user.discriminator}`} was successfully banned on this server.\nCase number: ${kicked[0].kickCase}.\nReason: ${kicked[0].reason}\nYou can add notes for this kick by using the case command together with the case number.`)
                kickedUser.kick(reason);
            }
        }
    }
}