import { Guild, GuildMember, Message, MessageEmbed, User } from 'discord.js';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import database from '../../database/database';
import { ban, caseGlobal, guildMember, initModels, kick, mute, warning } from '../../database/models/init-models';
import { Command } from '../../interfaces';
import { urlToColours } from '../../utils';

export const command: Command = {
    name: 'case',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'case',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }
        // you need to be able to specify if it's kick/ban/mute/warn

        if (args[0] === 'user') {
            // check a user, args 1 is the user, args 2 is the type of case, args 3 is global option
            return userCheck (message, args[1], args[2], args[3])
            // returns a list of a user's cases 
        }
        
        if (args[0] === 'check') {
            // check a case, args 1 is the case type, args 2 is the case number
            return caseCheck (message, args[1], args[2])
            // only returns local cases, so you can't just check random cases for fun lol
            // returns one case
        }
        /*
        if (args[0] === 'edit') {
            // edit a case, args 1 is the case number
            return caseEdit (message, args[1])
            // only works with local cases, so you can't just edit random cases for fun lol
            // edits one case
        }

        if (args[0] === 'delete') {
            // delete a case, args 1 is the case number
            return caseDelete (message, args[1])
            // only works with local cases, so you can't just delete random cases for fun lol
            // deletes one case
        }

        if (args[0] === 'search') {
            // search after a case, args 1 is what type to search after (ban, warning etc.)
            // args 2 is the column to search in
            // args 3 is the query
            return caseSearch (message, args[1], args[2], args[3])
            // only works with local cases, so you can't just delete random cases for fun lol
            // deletes one case
        }

        if (args[0] === 'list') {
            // list of cases
            // no argument = all cases, sorted after the most recent first
            // args 1 = one of the types of cases (mute, kick), or overall
            // args 2 = dates (first date to be between)
            // args 3 = dates (first date to be between)
            return caseList (message, args[1], args[2], args[3])
            // only works with local cases, so you can't just delete random cases for fun lol
        }
        */
        if (!args.length) {
            return message.channel.send(`No argument listed. Use the help command with case to see possible arguments.`)
        }

        async function userCheck (message: Message, user: string, caseType: string, global?: string): Promise<Message> {
            if (!user) {
                return message.channel.send('You need to specify a user to check');
            }

            if (!caseType) {
                return message.channel.send('You need to specify a case type to check');
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning', 'overview']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to check');
            }

            let userID: string;

            if (!global) {
                try {
                    const theUser = message.mentions.members.first() || await message.guild.members.fetch(user);
                    if (theUser.user.bot === true) return message.channel.send(`A bot doesn't have any cases.`)
                    userID = theUser.id
                } catch {
                    return message.channel.send(`User mention or userID is invalid`)
                }
            } else {
                try {
                    const theUser = client.users.cache.get(user);
                if (theUser.bot === true) return message.channel.send(`A bot doesn't have any cases.`)
                userID = theUser.id
                initModels(database)
                const userExists = await guildMember.findOne({raw: true, where: {userID: userID, guildID: message.guild.id}})
                if (!userExists) { // here we can implement servers or users who may be authorised to check for any user, by e.g. !userExists && message.guild.id !== ID
                    return message.channel.send(`You can't check users who haven't been or aren't on your server.`)
                }
                } catch {
                    return message.channel.send(`User mention or userID is invalid`)
                }
            }

            if (caseType === 'overview') {
                if (!global) {
                    initModels(database)
                    const bans = await ban.findAndCountAll({raw: true, where: {userID: userID, guildID: message.guild.id}, order: [['date', 'DESC']]})
                    const kicks = await kick.findAndCountAll({raw: true, where: {userID: userID, guildID: message.guild.id}, order: [['date', 'DESC']]})
                    const mutes = await mute.findAndCountAll({raw: true, where: {userID: userID, guildID: message.guild.id}, order: [['date', 'DESC']]})
                    const warnings = await warning.findAndCountAll({raw: true, where: {userID: userID, guildID: message.guild.id}, order: [['date', 'DESC']]})
                    const overviewObject = {bans: bans, kicks: kicks, mutes: mutes, warnings: warnings, status: 'local'}
                    const embeds = generateOverviewEmbedding(overviewObject)
                    return await message.channel.send((await embeds));
                } else {
                    initModels(database)
                    const bans = await ban.findAndCountAll({raw: true, where: {userID: userID}, order: [['date', 'DESC']]})
                    const kicks = await kick.findAndCountAll({raw: true, where: {userID: userID}, order: [['date', 'DESC']]})
                    const mutes = await mute.findAndCountAll({raw: true, where: {userID: userID}, order: [['date', 'DESC']]})
                    const warnings = await warning.findAndCountAll({raw: true, where: {userID: userID}, order: [['date', 'DESC']]})
                    const overviewObject = {bans: bans, kicks: kicks, mutes: mutes, warnings: warnings, status: 'global'}
                    const embeds = generateOverviewEmbedding(overviewObject)
                    return await message.channel.send((await embeds));
                }
            }

            interface caseTables {
                muteCase?: number,
                kickCase?: number,
                banCase?: number,
                warningCase?: number,
                userID: bigint,
                guildID: bigint,
                date: Date,
                muteEnd?: Date,
                note: string,
                actor: bigint,
                reason: string,
                muteStatus?: boolean
            }

            let theCaseType: string = caseType

            const caseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE ${caseType}."userID" = :user${!global ? ` AND ${caseType}."guildID" = :guild;` : `;`}`, {
                replacements: { case: theCaseType, user: userID, guild: message.guild.id },
                type: QueryTypes.SELECT
            })

            if (!caseQuery.length) {
                return message.channel.send(!global ? `${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname} (${message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator})` : message.guild.members.cache.get(userID).user.username + '#' + message.guild.members.cache.get(userID).user.discriminator}(userID: ${userID}) does not have any ${caseType} cases.` : `${client.users.cache.get(`${userID}`).username}#${client.users.cache.get(`${userID}`).discriminator}(userID: ${userID}) does not have any ${caseType} cases.`)
            }

            let caseWording: string
            if (caseType === 'mute') {
                caseWording = 'muted'
            }

            if (caseType === 'ban') {
                caseWording = 'banned'
            }

            if (caseType === 'warning') {
                caseWording = 'warned'
            }

            if (caseType === 'kick') {
                caseWording = 'kicked'
            }

            let currentPage = 0;
            const embeds = generateCaseEmbedding(caseQuery)
            const queueEmbed = await message.channel.send(`Amount of ${caseType}s: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < (await embeds).length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Amount of ${caseType}s: ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    } 
                  } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Amount of ${caseType}s ${currentPage+1}/${(await embeds).length}`, (await embeds)[currentPage]);
                    }
                  } else {
                    collector.stop();
                    await queueEmbed.delete();
                  }
            })

            async function generateCaseEmbedding (input) {
                const embeds = [];
                for(let i =0; i < input.length; i += 1) {
                    const current = input[i]

                    if (message.guild.id == current.guildID) {
                        const embed = new MessageEmbed()
                        embed.setAuthor(client.guilds.cache.get(`${current.guildID}`).name, client.guilds.cache.get(`${current.guildID}`).iconURL())
                        embed.setColor(`${await urlToColours(client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Reason for ${caseType}**\n${current.reason}`)
                        embed.addField('Date of occurence', moment(current.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                        embed.setTitle(message.guild.id == current.guildID ? `${message.guild.members.cache.get(`${current.userID}`).nickname ? `${message.guild.members.cache.get(`${current.userID}`).nickname} (${message.guild.members.cache.get(`${current.userID}`).user.username + '#' + message.guild.members.cache.get(`${current.userID}`).user.discriminator})` : message.guild.members.cache.get(`${current.userID}`).user.username + '#' + message.guild.members.cache.get(`${current.userID}`).user.discriminator}`:`${client.users.cache.get(`${current.userID}`).username}#${client.users.cache.get(`${current.userID}`).discriminator} was ${caseWording} in the server ${client.guilds.cache.get(`${current.guildID}`).name}`)
                        embed.setThumbnail(client.users.cache.get(`${current.userID}`).avatarURL({size: 1024, format: 'png', dynamic: true}));
                        if (caseType === 'mute') {
                            embed.setFooter(`Mute Case Number: ${current.muteCase}`, client.user.avatarURL())
                            embed.addField('Date of unmute', current.muteEnd != null ? moment(current.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A z') : 'The mute was on indefinite time' )
                            embed.addField('Mute activity', current.muteStatus === true ? 'Currently muted for this case' : 'Unmuted')
                        }
                        if (caseType === 'kick') {
                            embed.setFooter(`Kick Case Number: ${current.kickCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'ban') {
                            embed.setFooter(`Ban Case Number: ${current.banCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'warning') {
                            embed.setFooter(`Warning Case Number: ${current.warningCase}`, client.user.avatarURL())
                        }
                        if (message.guild.id == current.guildID) {
                            embed.addField(`User who gave the ${caseType}`, `${message.guild.members.cache.get(`${current.actor}`).nickname ? `${message.guild.members.cache.get(`${current.actor}`).nickname} (${message.guild.members.cache.get(`${current.actor}`).user.username + '#' + message.guild.members.cache.get(`${current.actor}`).user.discriminator})` : message.guild.members.cache.get(`${current.actor}`).user.username + '#' + message.guild.members.cache.get(`${current.actor}`).user.discriminator}`)
                            embed.addField('Notes about this case', current.note ? current.note : 'No notes made for this case')
                        }
                        embeds.push(embed)
                    } else {
                        const caseGlobalData = await caseGlobal.findOne({raw: true, where: {guildID: current.guildID}})
                        const embed = new MessageEmbed()
                        embed.setAuthor(caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).name : 'Anonymous Server', caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) : client.user.avatarURL({ format: 'png'}))
                        embed.setColor(`${caseGlobalData.serverName === true ? await urlToColours(client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'})) : await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Reason for ${caseType}**\n${caseGlobalData.reason === true ? current.reason : 'Reason not public'}`)
                        embed.addField('Date of occurence', moment(current.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                        embed.setTitle(message.guild.id == current.guildID ? `${message.guild.members.cache.get(`${current.userID}`).nickname ? `${message.guild.members.cache.get(`${current.userID}`).nickname} (${message.guild.members.cache.get(`${current.userID}`).user.username + '#' + message.guild.members.cache.get(`${current.userID}`).user.discriminator})` : message.guild.members.cache.get(`${current.userID}`).user.username + '#' + message.guild.members.cache.get(`${current.userID}`).user.discriminator}`:`${client.users.cache.get(`${current.userID}`).username}#${client.users.cache.get(`${current.userID}`).discriminator} was ${caseWording} in the server ${caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).name : 'Anonymous Server'}`)
                        embed.setThumbnail(client.users.cache.get(`${current.userID}`).avatarURL({size: 1024, format: 'png', dynamic: true}));
                        if (caseType === 'mute') {
                            embed.setFooter(`Mute Case Number: ${current.muteCase}`, client.user.avatarURL())
                            embed.addField('Date of unmute', current.muteEnd != null ? moment(current.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A z') : 'The mute was on indefinite time' )
                            embed.addField('Mute activity', current.muteStatus === true ? 'Currently muted for this case' : 'Unmuted')
                        }
                        if (caseType === 'kick') {
                            embed.setFooter(`Kick Case Number: ${current.kickCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'ban') {
                            embed.setFooter(`Ban Case Number: ${current.banCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'warning') {
                            embed.setFooter(`Warning Case Number: ${current.warningCase}`, client.user.avatarURL())
                        }
                        if (message.guild.id == current.guildID) {
                            embed.addField(`User who gave the ${caseType}`, `${message.guild.members.cache.get(`${current.actor}`).nickname ? `${message.guild.members.cache.get(`${current.actor}`).nickname} (${message.guild.members.cache.get(`${current.actor}`).user.username + '#' + message.guild.members.cache.get(`${current.actor}`).user.discriminator})` : message.guild.members.cache.get(`${current.actor}`).user.username + '#' + message.guild.members.cache.get(`${current.actor}`).user.discriminator}`)
                            embed.addField('Notes about this case', current.note ? current.note : 'No notes made for this case')
                        }
                        embeds.push(embed)
                    }
                }
                return embeds;
            }

            async function generateOverviewEmbedding (input) {
                const embed = new MessageEmbed()
                embed.setAuthor(input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).name : client.user.username, input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).iconURL() : client.user.avatarURL({ format: 'png'}))
                embed.setColor(`${await urlToColours(input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).iconURL({ format: 'png'}) : client.user.avatarURL({ format: 'png'}))}`)
                embed.setFooter(`UserID: ${userID}`)
                embed.setTimestamp()
                embed.addField('Bans', `This user has received ${input.bans.count > 1 || (input.bans.count === 0) ? `${input.bans.count} bans` : `${input.bans.count} ban`}\n${!input.bans.rows.length ? `` : `Last ban was on ${moment(input.bans.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Kicks', `This user has received ${input.kicks.count > 1 || (input.kicks.count === 0) ? `${input.kicks.count} kicks` : `${input.kicks.count} kick`}\n${!input.kicks.rows.length ? `` : `Last kick was on ${moment(input.kicks.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Mutes', `This user has received ${input.mutes.count > 1 || (input.mutes.count === 0) ? `${input.mutes.count} mutes` : `${input.mutes.count} mute`}\n${!input.mutes.rows.length ? `` : `Last mute was on ${moment(input.mutes.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Warnings', `This user has received ${input.warnings.count > 1 || (input.warnings.count === 0) ? `${input.warnings.count} warnings` : `${input.warnings.count} warning`}\n${!input.warnings.rows.length ? `` : `Last warning was on ${moment(input.warnings.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.setTitle(input.status === 'local' ? `Overview for ${message.guild.members.cache.get(userID).nickname ? `${message.guild.members.cache.get(userID).nickname}(${message.guild.members.cache.get(userID).user.username}#${message.guild.members.cache.get(userID).user.discriminator})` : `${message.guild.members.cache.get(userID).user.username}#${message.guild.members.cache.get(userID).user.discriminator}`}` : `Global Overview for ${client.users.cache.get(userID).username}#${client.users.cache.get(userID).discriminator}`)
                embed.setThumbnail(client.users.cache.get(`${userID}`).avatarURL({size: 1024, format: 'png', dynamic: true}));
                return embed
            }
        }
        
        async function caseCheck (message: Message, caseType: string, caseNumber: string): Promise<Message> {
            if (!caseType) {
                return message.channel.send('You need to specify a type of case to check')
            }
            if (!caseNumber) {
                return message.channel.send('You need to specify a case number')
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to check');
            }

            let caseNumbered: number = parseInt(caseNumber)

            interface caseTables {
                muteCase?: number,
                kickCase?: number,
                banCase?: number,
                warningCase?: number,
                userID: bigint,
                guildID: bigint,
                date: Date,
                muteEnd?: Date,
                note: string,
                actor: bigint,
                reason: string,
                muteStatus?: boolean
            }

            const caseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE ${caseType}."${caseType}Case" = :caseNumber;`, {
                replacements: { caseNumber: caseNumbered },
                type: QueryTypes.SELECT
            })

            if (!caseQuery.length) {
                return message.channel.send(`Case number \`${caseNumbered}\` for the case type \`${caseType}\` does not exist.`);
            }

            if (`${caseQuery[0].guildID}` !== message.guild.id) {
                return message.channel.send(`Case number \`${caseNumbered}\` for the case type \`${caseType}\` is not a case from your server and therefore not available for you.`)
            }

            let actorNickname;
            let actorUsername;
            let actorDiscri;
            let actorPfp;
            let caseUserNickname;
            let caseUsername;
            let caseUserDiscri;
            let caseUserPfp;

            try {
                const data = message.guild.members.cache.get(`${caseQuery[0].actor}`) as GuildMember
                actorNickname = data.nickname ? data.nickname : ``
                actorUsername = data.user.username
                actorDiscri = data.user.discriminator
                actorPfp = data.user.avatarURL({format: 'png', dynamic: true})
            } catch {
                try {
                    const data = client.users.cache.get(`${caseQuery[0].actor}`) as User
                    actorUsername = data.username
                    actorDiscri = data.discriminator
                    actorPfp = data.avatarURL({format: 'png', dynamic: true})
                } catch {
                    actorUsername = 'Username'
                    actorDiscri = 'Not in our system'
                    actorPfp = client.user.avatarURL({format: 'png', dynamic: true})
                }
            }
            try {
                const data = message.guild.members.cache.get(`${caseQuery[0].userID}`) as GuildMember
                caseUserNickname = data.nickname ? data.nickname : ``
                caseUsername = data.user.username
                caseUserDiscri = data.user.discriminator
                caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
            } catch {
                try {
                    const data = client.users.cache.get(`${caseQuery[0].userID}`) as User
                    caseUsername = data.username
                    caseUserDiscri = data.discriminator
                    caseUserPfp = data.avatarURL({format: 'png', size: 1024, dynamic: true})
                } catch {
                    caseUsername = 'Username'
                    caseUserDiscri = 'Not in our system'
                    caseUserPfp = client.user.avatarURL({format: 'png'})
                }
            }

            const embed = new MessageEmbed()
            embed.setAuthor(actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`, actorPfp)
            embed.setColor(`${await urlToColours(actorPfp)}`)
            embed.setTimestamp()
            embed.setDescription(`**Reason for ${caseType}**\n${caseQuery[0].reason}`)
            embed.addField('Date of occurence', moment(caseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
            embed.setTitle(`${caseType} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
            embed.setThumbnail(caseUserPfp)
            if (caseType === 'mute') {
                embed.setFooter(`Mute Case Number: ${caseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                embed.addField('Date of unmute', caseQuery[0].muteEnd != null ? moment(caseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z') : 'The mute was on indefinite time' )
                embed.addField('Mute activity', caseQuery[0].muteStatus === true ? 'Currently muted for this case' : 'Unmuted')
            }
            if (caseType === 'kick') {
                embed.setFooter(`Kick Case Number: ${caseQuery[0].kickCase}`, client.user.avatarURL())
            }
            if (caseType === 'ban') {
                embed.setFooter(`Ban Case Number: ${caseQuery[0].banCase}`, client.user.avatarURL())
            }
            if (caseType === 'warning') {
                embed.setFooter(`Warning Case Number: ${caseQuery[0].warningCase}`, client.user.avatarURL())
            }
            if (message.guild.id == `${caseQuery[0].guildID}`) {
                embed.addField(`User who gave the ${caseType}`, actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                embed.addField('Notes about this case', caseQuery[0].note ? caseQuery[0].note : 'No notes made for this case')
            }
            return await message.channel.send(embed)

        }
        /*
        async function caseEdit (message: Message, caseNumber: string): Promise<Message> {
            
        }

        async function caseDelete (message: Message, caseNumber: string): Promise<Message> {
            
        }

        async function caseSearch (message: Message, caseType: string, column: string, query: string): Promise<Message> {
            
        }

        async function caseList (message: Message, caseType: string, firstDate: string, secondDate: string): Promise<Message> {
            
        }
        */
    }
}