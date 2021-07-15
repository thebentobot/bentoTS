import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import { mute, muteCreationAttributes } from '../../database/models/mute';
import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, modLog, muteRole } from '../../database/models/init-models';

export const command: Command = {
    name: 'mute',
    aliases: [],
    category: 'moderation',
    description: 'Mutes a user until unmute or for a specific time',
    usage: 'mute <user id or mention user> [reason]\nmute <time> <user id or mention user> [reason]',
    run: async (client, message, args): Promise<Message> => {
        if (args[0] === 'time') {
            return timedMute (message, args[1], args[2], args.slice(3).join(' '))
        } else {
            return regularMute (message, args[0], args.slice(1).join(' '))
        }

        async function timedMute (message: Message, time: string, user: string, reason?: string) {
            return message.channel.send('lmao')
        }

        async function regularMute (message: Message, user: string, reason?: string) {
            if (!message.member.hasPermission('BAN_MEMBERS')) {
                return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
            }
    
            if (!user) {
                return message.channel.send(`You need to specify a user to mute.\nUse the help command with mute to check options when using the mute command.`)
            }
    
            let mutedUser: GuildMember;
            let mutedUserID: string;
    
            try {
                mutedUser = message.mentions.members.first() || await message.guild.members.fetch(user);
                mutedUserID = mutedUser.id
            } catch {
                return message.channel.send('I cannot find the specified member. Please mention a valid member in this Discord server.')
            }
    
            if (message.member.roles.highest.position <= mutedUser.roles.highest.position) {
                return message.channel.send('You cannot mute someone with a higher role than you.')
            }
    
            const muteAttr: muteCreationAttributes = {
                userID: BigInt(mutedUserID),
                guildID: BigInt(message.guild.id),
                date: new Date(),
                actor: BigInt(message.author.id),
                reason: reason
            }
    
            initModels(database);
    
            const muted = await mute.create(muteAttr)
            const muteCount = await mute.findAndCountAll({where: {guildID: message.guild.id, userID: mutedUserID}})
                try {
                    let logChannel: TextChannel;
                    const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                    logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                    const embed = new MessageEmbed()
                    .setColor('#000000')
                    .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                    .setThumbnail(mutedUser.user.avatarURL())
                    .setTitle(`${mutedUser.nickname ? `${mutedUser.nickname} (${mutedUser.user.username}#${mutedUser.user.discriminator})` : `${mutedUser.user.username}#${mutedUser.user.discriminator}`} was muted!`)
                    .setDescription(`This user has been muted **${muteCount.count > 1 ? `${muteCount.count} times` : `once`}** on this server\n**Reason**\n${reason ? reason : 'Reason not listed'}`)
                    .addField('Username', mutedUser.user.username + '#' + mutedUser.user.discriminator)
                    .addField('User ID', mutedUser.id)
                    .addField('Muted by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                    .setFooter(`Mute Case Number: ${muted.muteCase}`)
                    .setTimestamp();
                    logChannel.send(embed);
                    (await client.users.fetch(mutedUserID)).send(`😶 You were \`muted\` from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`)
                    message.channel.send(`${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`} was successfully muted on this server.\nCase number: ${muted.muteCase}.\nReason: ${reason ? reason : 'No reason specified'}\nYou can add notes for this mute by using the case command together with the case number.`)
                    const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})
                    const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)
                    mutedUser.roles.add(role)
                } catch {
                    (await client.users.fetch(mutedUserID)).send(`😶 You were \`muted\` from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`)
                    message.channel.send(`${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`} was successfully muted on this server.\nCase number: ${muted.muteCase}.\nReason: ${reason ? reason : 'No reason specified'}\nYou can add notes for this mute by using the case command together with the case number.`)
                    const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})
                    const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)
                    mutedUser.roles.add(role)
                }
        }
    }
}