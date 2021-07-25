import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import { mute, muteCreationAttributes } from '../../database/models/mute';
import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, modLog, muteRole } from '../../database/models/init-models';
import moment from 'moment';

const momentTimeUnitBases = [
    "year", "years", "y",
    "month", "months", "M" ,
    "week", "weeks", "w" ,
    "day", "days", "d" ,
    "hour", "hours", "h" ,
    "minute", "minutes", "m" ,
    "second", "seconds", "s" ,
    "millisecond", "milliseconds", "ms"
]

export const command: Command = {
    name: 'mute',
    aliases: [],
    category: 'moderation',
    description: 'Mutes a user until unmute or for a specific time.\nPossible timeframes: millisecond/milliseconds/ms, second/seconds/s, minute/minutes/m, hour/hours/h, day/days/d, month/months/M, year/years/y.',
    usage: 'mute <user id or mention user> [reason]\nmute time <amount of time> <timeframe> <user id or mention user> [reason]',
    run: async (client, message, args): Promise<Message> => {
        if (args[0] === 'time') {
            return timedMute (message, args[1], args[2], args[3], args.slice(4).join(' '))
        } else {
            return regularMute (message, args[0], args.slice(1).join(' '))
        }

        async function timedMute (message: Message, amountOfTime: string, timeframe: string, user: string, reason?: string) {
            if (!message.member.hasPermission('BAN_MEMBERS')) {
                return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
            }

            if (!amountOfTime) {
                return message.channel.send(`You need to specify an amount of time, timeframe and a user to mute.\nUse the help command with mute to check options when using the mute command.`)
            }

            if (!timeframe) {
                return message.channel.send(`You need to specify a timeframe and a user to mute.\nUse the help command with mute to check options when using the mute command.`)
            }

            if (!momentTimeUnitBases.includes(timeframe)) {
                return message.channel.send(`Your specified timeframe \`${timeframe}\` is invalid.\nUse the help command with mute to check options when using the mute command.`)
            }
    
            if (!user) {
                return message.channel.send(`You need to specify a user to mute for ${amountOfTime} ${timeframe}.\nUse the help command with mute to check options when using the mute command.`)
            }

            const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})

            if (!muteRoleData.roleID) {
                return message.channel.send(`You haven't set a mute role.\nPlease use the muterole command.\nIf you need help, use the help command with muterole.`)
            }

            const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)

            if (message.guild.members.resolve(client.user).roles.highest.position < role.position) {
                return message.channel.send(`Your mute role is positioned hieracally higher than Bento Bot.\nPlease positon Bento Bot's role higher than the mute role.\nIf not, you are not able to mute.`)
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
                muteEnd: moment(new Date()).add(amountOfTime, timeframe as moment.unitOfTime.DurationConstructor).toDate(), //https://stackoverflow.com/questions/41768864/moment-add-only-works-with-literal-values
                actor: BigInt(message.author.id),
                reason: reason,
                MuteStatus: true
            }
    
            initModels(database);
    
            const muted = await mute.findOrCreate({raw: true, where: {userID: mutedUserID, guildID: message.guild.id, MuteStatus: true}, defaults: muteAttr})
            
            if (muted[1] === false) {
                return message.channel.send(`${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`} is already muted on this server.\nThe case number for this mute is: \`${muted[0].muteCase}\` if you want to look up details for this mute use the case check command.`);
            }

            const muteCount = await mute.findAndCountAll({where: {guildID: message.guild.id, userID: mutedUserID}})
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#000000')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(mutedUser.user.avatarURL())
                .setTitle(`${mutedUser.nickname ? `${mutedUser.nickname} (${mutedUser.user.username}#${mutedUser.user.discriminator})` : `${mutedUser.user.username}#${mutedUser.user.discriminator}`} was muted for ${amountOfTime} ${timeframe}!`)
                .setDescription(`This user has been muted **${muteCount.count > 1 ? `${muteCount.count} times` : `once`}** on this server\n**Reason**\n${reason ? reason : 'Reason not listed'}`)
                .addField('Username', mutedUser.user.username + '#' + mutedUser.user.discriminator)
                .addField('User ID', mutedUser.id)
                .addField('Muted by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .setFooter(`Mute Case Number: ${muted[0].muteCase}`)
                .setTimestamp();
                await logChannel.send(embed);
                await message.channel.send(`**${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${reason ? reason : 'No reason specified'}.\nYou can add notes for this mute by using the case command together with the case number.`)
                try {
                    (await client.users.fetch(mutedUserID)).send(`😶 You have been \`muted\` for ${amountOfTime} ${timeframe} from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.\nYou will be unmuted at approx. ${moment(muted[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}.`).catch(console.error)
                    await mutedUser.roles.add(role)
                } catch {
                    await mutedUser.roles.add(role)
                }
            } catch {
                await message.channel.send(`**${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`}** was successfully **muted** on this server.\n**Case number: ${muted[0].muteCase}**.\n**Reason:** ${reason ? reason : 'No reason specified'}.\nYou can add notes for this mute by using the case command together with the case number.`)
                try {
                    (await client.users.fetch(mutedUserID)).send(`😶 You have been \`muted\` for ${amountOfTime} ${timeframe} from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.\nYou will be unmuted at approx. ${moment(muted[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}.`).catch(console.error)
                    await mutedUser.roles.add(role)
                } catch {
                    await mutedUser.roles.add(role)
                }                
            }
        }

        async function regularMute (message: Message, user: string, reason?: string) {
            if (!message.member.hasPermission('BAN_MEMBERS')) {
                return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
            }
    
            if (!user) {
                return message.channel.send(`You need to specify a user to mute.\nUse the help command with mute to check options when using the mute command.`)
            }

            const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})

            if (!muteRoleData.roleID) {
                return message.channel.send(`You haven't set a mute role.\nPlease use the muterole command.\nIf you need help, use the help command with muterole.`)
            }

            const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)

            if (message.guild.members.resolve(client.user).roles.highest.position < role.position) {
                return message.channel.send(`Your mute role is positioned hieracally higher than Bento Bot.\nPlease positon Bento Bot's role higher than the mute role.\nIf not, you are not able to mute.`)
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
                reason: reason,
                MuteStatus: true
            }
    
            initModels(database);
    
            const muted = await mute.findOrCreate({raw: true, where: {userID: mutedUserID, guildID: message.guild.id}, defaults: muteAttr})

            if (muted[1] === false) {
                return message.channel.send(`${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`} is already muted on this server.\nThe case number for this mute is: \`${muted[0].muteCase}\` if you want to look up details for this mute use the case check command.`);
            }

            const muteCount = await mute.findAndCountAll({where: {guildID: message.guild.id, userID: mutedUserID}})
            try {
                let logChannel: TextChannel;
                const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setColor('#000000')
                .setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                .setThumbnail(mutedUser.user.avatarURL())
                .setTitle(`${mutedUser.nickname ? `${mutedUser.nickname} (${mutedUser.user.username}#${mutedUser.user.discriminator})` : `${mutedUser.user.username}#${mutedUser.user.discriminator}`} has been muted for indefinite time!`)
                .setDescription(`This user has been muted **${muteCount.count > 1 ? `${muteCount.count} times` : `once`}** on this server\n**Reason**\n${reason ? reason : 'Reason not listed'}`)
                .addField('Username', mutedUser.user.username + '#' + mutedUser.user.discriminator)
                .addField('User ID', mutedUser.id)
                .addField('Muted by', message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`)
                .setFooter(`Mute Case Number: ${muted[0].muteCase}`)
                .setTimestamp();
                await logChannel.send(embed);
                await message.channel.send(`**${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`}** was successfully **muted** on this server.\n**Case number:** ${muted[0].muteCase}.\n**Reason:** ${reason ? reason : 'No reason specified'}.\nYou can add notes for this mute by using the case command together with the case number.`)
                try {
                    (await client.users.fetch(mutedUserID)).send(`😶 You have been \`muted\` for indefinite time from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`)
                    await mutedUser.roles.add(role)
                } catch {
                    await mutedUser.roles.add(role)

                }
            } catch {
                await message.channel.send(`**${message.guild.members.cache.get(`${mutedUserID}`).nickname ? `${message.guild.members.cache.get(`${mutedUserID}`).nickname} (${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator})` : `${message.guild.members.cache.get(`${mutedUserID}`).user.username + '#' + message.guild.members.cache.get(`${mutedUserID}`).user.discriminator}`}** was successfully **muted** on this server.\n**Case number:** ${muted[0].muteCase}.\n**Reason:** ${reason ? reason : 'No reason specified'}.\nYou can add notes for this mute by using the case command together with the case number.`)
                try {
                    (await client.users.fetch(mutedUserID)).send(`😶 You have been \`muted\` for indefinite time from **${message.guild.name}** 😶 \n**Reason**: ${reason}.\nThis is mute number ${muteCount.count} that you have received from this server.`)
                    await mutedUser.roles.add(role)
                } catch {
                    await mutedUser.roles.add(role)

                }                
            }
        }
    }
}