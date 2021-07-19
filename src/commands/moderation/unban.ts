import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import moment from 'moment';
import database from '../../database/database';
import { ban, banCreationAttributes } from '../../database/models/ban';
import { initModels } from '../../database/models/init-models';
import { modLog } from '../../database/models/modLog';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'unban',
    aliases: [],
    category: 'moderation',
    description: 'Unbans the mentioned user from your server. The reason argument does not overwrite the reason for the ban but rather shows in the mod log as a reason for unban, if it was a manual unban.',
    usage: 'unban <user id or mention user> [reason]',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        if (!args[0]) {
            return message.channel.send(`You need to specify a user to unban.\nUse the help command with unban to check options when using the unban command.`)
        }

        let unbannedUser: GuildMember;
        let unbannedUserID: string;

        try {
            unbannedUser = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
            unbannedUserID = unbannedUser.id
        } catch {
            return message.channel.send('I cannot find the specified member. Please mention a valid member in this Discord server.')
        }

        let reason: string;
        
        if (args.length > 1) {
            reason = args.slice(1).join(' ');
        }

        initModels(database);

        const banned = await ban.findOne({raw: true, where: {userID: unbannedUserID, guildID: message.guild.id}})

        if (!banned) {
            return message.channel.send(`${message.guild.members.cache.get(`${unbannedUserID}`).user.username + '#' + message.guild.members.cache.get(`${unbannedUserID}`).user.discriminator} isn't banned on this server.`);
        } else {
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#f5ec42')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(unbannedUser.user.avatarURL())
                .setTitle(`${unbannedUser.nickname ? `${unbannedUser.nickname} (${unbannedUser.user.username}#${unbannedUser.user.discriminator})` : `${unbannedUser.user.username}#${unbannedUser.user.discriminator}`} was unbanned!`)
                .setDescription(`**Reason for unban**\n${reason ? reason : 'No reason for the unban specified'}`)
                .addField('Username', unbannedUser.user.username + '#' + unbannedUser.user.discriminator)
                .addField('User ID', unbannedUser.id)
                .addField('Banned by', message.guild.members.cache.get(`${banned.actor}`).nickname ? `${message.guild.members.cache.get(`${banned.actor}`).nickname} (${message.guild.members.cache.get(`${banned.actor}`).user.username}#${message.guild.members.cache.get(`${banned.actor}`).user.discriminator})` : `${message.guild.members.cache.get(`${banned.actor}`).user.username}#${message.guild.members.cache.get(`${banned.actor}`).user.discriminator}`)
                .addField('Ban date', moment(banned.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                .addField('Reason for ban', banned.reason != null ? 'No reason specified for mute' : banned.reason)
                .addField('Unbanned by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .addField('Notes about the ban case', banned.note ? banned.note : 'No notes made for this ban case')
                .setFooter(`Ban Case Number: ${banned.banCase}`)
                .setTimestamp();
                await logChannel.send(embed);
                await message.channel.send(`**${message.guild.members.cache.get(unbannedUserID).user.username}#${message.guild.members.cache.get(unbannedUserID).user.discriminator}** was successfully **unbanned** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unban specified'}.`)
                try {
                    (await client.users.fetch(unbannedUserID)).send(`🙏You were \`unbanned\` from **${message.guild.name}** \n**Reason**: ${reason ? reason : 'No reason for the unban specified'}.`)
                    await message.guild.members.unban(unbannedUserID, reason)

                } catch {
                    await message.guild.members.unban(unbannedUserID, reason)
                }
            } catch {
                await message.channel.send(`**${message.guild.members.cache.get(unbannedUserID).user.username}#${message.guild.members.cache.get(unbannedUserID).user.discriminator}** was successfully **unbanned** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unban specified'}.`)
                try {
                    (await client.users.fetch(unbannedUserID)).send(`🙏You were \`unbanned\` from **${message.guild.name}** \n**Reason**: ${reason ? reason : 'No reason for the unban specified'}.`)
                    await message.guild.members.unban(unbannedUserID, reason)

                } catch {
                    await message.guild.members.unban(unbannedUserID, reason)
                }
            }
        }
    }
}