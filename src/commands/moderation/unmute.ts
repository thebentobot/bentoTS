import { GuildMember, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import moment from 'moment';
import database from '../../database/database';
import { initModels, modLog, mute, muteRole } from '../../database/models/init-models';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'unmute',
    aliases: [],
    category: 'moderation',
    description: 'Unmutes a user. The reason argument does not overwrite the reason for the mute but rather shows in the mod log as a reason for unmute, if it was a manual unmute.',
    usage: 'unmute <user id or mention user> [reason]',
    website: 'https://www.bentobot.xyz/commands#unmute',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        if (!args[0]) {
            return message.channel.send(`You need to specify a user to unmute.\nUse the help command with unmute to check options when using the unban command.`)
        }

        const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})

        if (!muteRoleData.roleID) {
            return message.channel.send(`You haven't set a mute role.\nPlease use the muterole command.\nIf you need help, use the help command with muterole.`)
        }

        const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)

        if (message.guild.members.resolve(client.user).roles.highest.position < role.position) {
            return message.channel.send(`Your mute role is positioned hieracally higher than Bento Bot.\nPlease positon Bento Bot's role higher than the mute role.\nIf not, you are not able to mute.`)
        }

        let unmutedUser: GuildMember;
        let unmutedUserID: string;

        try {
            unmutedUser = message.mentions.members.first() || await message.guild.members.fetch(args[0]);
            unmutedUserID = unmutedUser.id
        } catch {
            return message.channel.send('I cannot find the specified member. Please mention a valid member in this Discord server.')
        }

        let reason: string;
        
        if (args.length > 1) {
            reason = args.slice(1).join(' ');
        }

        initModels(database);

        const muted = await mute.findOne({raw: true, where: {userID: unmutedUserID, guildID: message.guild.id, MuteStatus: true}})

        const unmutedUserObject = await client.users.fetch(`${unmutedUserID}`).catch(() => console.error('fetch user error in unban.ts line 28')) as User

        if (!muted) {
            try {
                return message.channel.send(`${unmutedUserObject.username + '#' + unmutedUserObject.discriminator} isn't muted on this server.`);
            } catch {
                return message.channel.send(`${unmutedUserID} is an invalid ID.`);
            }
        } else {
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#00ff4a')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(unmutedUser.user.avatarURL())
                .setTitle(`${unmutedUser.nickname ? `${unmutedUser.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})` : `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`} was unmuted!`)
                .setDescription(`**Reason for unmute**\n${reason ? reason : 'No reason for the unmute specified'}`)
                .addField('Username', unmutedUserObject.username + '#' + unmutedUserObject.discriminator)
                .addField('User ID', unmutedUser.id)
                .addField('Muted by', message.guild.members.cache.get(`${muted.actor}`).nickname ? `${message.guild.members.cache.get(`${muted.actor}`).nickname} (${message.guild.members.cache.get(`${muted.actor}`).user.username}#${message.guild.members.cache.get(`${muted.actor}`).user.discriminator})` : `${(await client.users.fetch(`${muted.actor}`)).username}#${(await client.users.fetch(`${muted.actor}`)).discriminator}`)
                .addField('Mute date', moment(muted.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                .addField('Original mute end date', muted.muteEnd != null ? moment(muted.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A z') : 'The mute was on indefinite time')
                .addField('Reason for mute', muted.reason != null ? 'No reason specified for mute' : muted.reason)
                .addField('Unmuted by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .addField('Notes about the mute case', muted.note ? muted.note : 'No notes made for this mute case')
                .setFooter(`Mute Case Number: ${muted.muteCase}`)
                .setTimestamp();
                await logChannel.send(embed);
                try {
                    (await client.users.fetch(unmutedUserID)).send(`🙏You were \`unmuted\` from **${message.guild.name}** \n**Reason**: ${reason ? reason : 'No reason for the unmute specified'}.`).catch(error => { console.error(`Could not send unmute DM`, error)})
                    await unmutedUser.roles.remove(role)
                    await mute.update({MuteStatus: false}, {where: {userID: unmutedUserID, guildID: message.guild.id, MuteStatus: true}})
                    return await message.channel.send(`**${unmutedUser.nickname ? `${unmutedUser.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})` : `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`}** was successfully **unmuted** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unmuted specified'}.`)
                } catch {
                    await unmutedUser.roles.remove(role)
                    await mute.update({MuteStatus: false}, {where: {userID: unmutedUserID, guildID: message.guild.id, MuteStatus: true}})
                    return await message.channel.send(`**${unmutedUser.nickname ? `${unmutedUser.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})` : `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`}** was successfully **unmuted** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unmuted specified'}.`)
                }
            } catch {
                try {
                    (await client.users.fetch(unmutedUserID)).send(`🙏You were \`unmuted\` from **${message.guild.name}** \n**Reason**: ${reason ? reason : 'No reason for the unmute specified'}.`).catch(error => { console.error(`Could not send unmute DM`, error)})
                    await unmutedUser.roles.remove(role)
                    await mute.update({MuteStatus: false}, {where: {userID: unmutedUserID, guildID: message.guild.id, MuteStatus: true}})
                    return await message.channel.send(`**${unmutedUser.nickname ? `${unmutedUser.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})` : `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`}** was successfully **unmuted** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unmuted specified'}.`)
                } catch {
                    await unmutedUser.roles.remove(role)
                    await mute.update({MuteStatus: false}, {where: {userID: unmutedUserID, guildID: message.guild.id, MuteStatus: true}})
                    return await message.channel.send(`**${unmutedUser.nickname ? `${unmutedUser.nickname} (${unmutedUser.user.username}#${unmutedUser.user.discriminator})` : `${unmutedUserObject.username}#${unmutedUserObject.discriminator}`}** was successfully **unmuted** on this server.\n**Reason:** ${reason ? reason : 'No reason for the unmuted specified'}.`)
                }
            }
        }
    }
}