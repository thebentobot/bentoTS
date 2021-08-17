import { Guild, GuildMember, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import database from '../../database/database';
import { ban, caseGlobal, guildMember, initModels, kick, modLog, mute, muteRole, warning } from '../../database/models/init-models';
import { Command } from '../../interfaces';
import { capitalize, urlToColours } from '../../utils';

export const command: Command = {
    name: 'case',
    aliases: [],
    category: 'moderation',
    description: 'A Case-style logging system for bans, kicks, mutes and warnings. You can only check, search, list edit and delete individual cases from your own server, but you are able to check global cases for a user as long as they are on your server.',
    usage: ' is the prefix.\n**case user <userID or user mention> <ban/kick/mute/warning> [global]** shows all cases for a case type where the user has record. Global only shows server names and reasosn if the server has enabled it.\n**case check <ban/kick/mute/warning> <case number>** shows information for an individual case. Only works for your own server.\n**case edit <ban/kick/mute/warning> <case number> <reason/note/muteStatus> <content to edit>** Edit reason or note info for an existing case. You can only edit muteStatus if you are editing a mute case, and you can only edit with true and false with muteStatus.\n**case delete <ban/kick/mute/warning> <case number>** delete a case from your server. Confirmation appears before deleting.\n**case search <ban/kick/mute/warning> <note/reason/muteStatus/userID/date/muteEnd/actor> <your search input>** search for cases by choosing a column to search in and it will return as many that matches your query.\n**case list <ban/kick/mute/warning> [start date: YYYY-MM-DD] [end date: YYYY-MM-DD]** list all the type of cases on the server, with an option to list between a time period (time period needs to be YYYY-MM-DD)',
    website: 'https://www.bentobot.xyz/commands#case',
    run: async (client, message, args): Promise<Message> => {
        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You do not have permission to use this command.\nYou are not a mod.').then(m => m.delete({timeout: 5000}));
        }

        if (args[0] === 'user') {
            return userCheck (message, args[1], args[2], args[3])
        }
        
        if (args[0] === 'check') {
            return caseCheck (message, args[1], args[2])
        }

        if (args[0] === 'edit') {
            return caseEdit (message, args[1], args[2], args[3], args.slice(4).join(' '))
        }

        if (args[0] === 'delete') {
            return caseDelete (message, args[1], args[2])
        }
        
        if (args[0] === 'search') {
            return caseSearch (message, args[1], args[2], args.slice(3).join(' '))
        }
        
        if (args[0] === 'list') {
            return caseList (message, args[1], args[2], args[3])
        }

        if (!args.length) {
            return message.channel.send(`No argument listed. Use the help command with case to see possible arguments.\nHighly recommended to check out examples for this command here: https://www.bentobot.xyz/commands#case`)
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

                    let actorNickname;
                    let actorUsername;
                    let actorDiscri;
                    //let actorPfp;
                    let caseUserNickname;
                    let caseUsername;
                    let caseUserDiscri;
                    let caseUserPfp;

                    try {
                        const data = message.guild.members.cache.get(`${current.actor}`) as GuildMember
                        actorNickname = data.nickname ? data.nickname : ``
                        actorUsername = data.user.username
                        actorDiscri = data.user.discriminator
                        //actorPfp = data.user.avatarURL({format: 'png', dynamic: true})
                    } catch {
                        try {
                            const data = client.users.cache.get(`${current.actor}`) as User
                            actorUsername = data.username
                            actorDiscri = data.discriminator
                            //actorPfp = data.avatarURL({format: 'png', dynamic: true})
                        } catch {
                            actorUsername = 'Username'
                            actorDiscri = 'Not in our system'
                            //actorPfp = client.user.avatarURL({format: 'png', dynamic: true})
                        }
                    }
                    try {
                        const data = message.guild.members.cache.get(`${current.userID}`) as GuildMember
                        caseUserNickname = data.nickname ? data.nickname : ``
                        caseUsername = data.user.username
                        caseUserDiscri = data.user.discriminator
                        caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
                    } catch {
                        try {
                            const data = client.users.cache.get(`${current.userID}`) as User
                            caseUsername = data.username
                            caseUserDiscri = data.discriminator
                            caseUserPfp = data.avatarURL({format: 'png', size: 1024, dynamic: true})
                        } catch {
                            caseUsername = 'Username'
                            caseUserDiscri = 'Not in our system'
                            caseUserPfp = client.user.avatarURL({format: 'png'})
                        }
                    }

                    if (message.guild.id == current.guildID) {
                        const embed = new MessageEmbed()
                        embed.setAuthor(client.guilds.cache.get(`${current.guildID}`).name, client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}))
                        embed.setColor(`${await urlToColours(client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) ? client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) : client.user.avatarURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Reason for ${capitalize(caseType)}**\n${current.reason}`)
                        embed.addField('Date of occurence', moment(current.date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.setTitle(message.guild.id == current.guildID ? `${caseUserNickname ? `${caseUserNickname} (${caseUsername + '#' + caseUserDiscri})` : caseUsername + '#' + caseUserDiscri}`:`${caseUsername}#${caseUserDiscri} was ${caseWording} in the server ${client.guilds.cache.get(`${current.guildID}`).name}`)
                        embed.setThumbnail(caseUserPfp);
                        if (caseType === 'mute') {
                            embed.setFooter(`Mute Case Number: ${current.muteCase}`, client.user.avatarURL())
                            embed.addField('Date of unmute', current.muteEnd != null ? moment(current.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z') : 'The mute was on indefinite time' )
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
                            embed.addField(`User who gave the ${caseType}`, `${actorNickname ? `${actorNickname} (${actorUsername + '#' + actorDiscri})` : actorUsername + '#' + actorDiscri}`)
                            embed.addField('Notes about this case', current.note ? current.note : 'No notes made for this case')
                        }
                        embeds.push(embed)
                    } else {
                        const caseGlobalData = await caseGlobal.findOne({raw: true, where: {guildID: current.guildID}})
                        const embed = new MessageEmbed()
                        embed.setAuthor(caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).name : 'Anonymous Server', caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) : client.user.avatarURL({ format: 'png'}))
                        embed.setColor(`${caseGlobalData.serverName === true ? await urlToColours(client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'})) : await urlToColours(client.user.avatarURL({ format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Reason for ${capitalize(caseType)}**\n${caseGlobalData.reason === true ? current.reason : 'Reason not public'}`)
                        embed.addField('Date of occurence', moment(current.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                        embed.setTitle(message.guild.id == current.guildID ? `${caseUserNickname ? `${caseUserNickname} (${caseUsername + '#' + caseUserDiscri})` : caseUsername + '#' + caseUserDiscri}`:`${caseUsername}#${caseUserDiscri} was ${caseWording} in the server ${caseGlobalData.serverName === true ? client.guilds.cache.get(`${current.guildID}`).name : 'Anonymous Server'}`)
                        embed.setThumbnail(caseUserPfp);
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
                            embed.addField(`User who gave the ${caseType}`, `${actorNickname ? `${actorNickname} (${actorUsername + '#' + actorDiscri})` : actorUsername + '#' + actorDiscri}`)
                            embed.addField('Notes about this case', current.note ? current.note : 'No notes made for this case')
                        }
                        embeds.push(embed)
                    }
                }
                return embeds;
            }

            async function generateOverviewEmbedding (input) {
                let caseUserNickname;
                let caseUsername;
                let caseUserDiscri;
                let caseUserPfp;
                try {
                    const data = message.guild.members.cache.get(`${userID}`) as GuildMember
                    caseUserNickname = data.nickname ? data.nickname : ``
                    caseUsername = data.user.username
                    caseUserDiscri = data.user.discriminator
                    caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
                } catch {
                    try {
                        const data = client.users.cache.get(`${userID}`) as User
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
                embed.setAuthor(input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).name : client.user.username, input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).iconURL() : client.user.avatarURL({ format: 'png'}))
                embed.setColor(`${await urlToColours(input.status === 'local' ? client.guilds.cache.get(`${message.guild.id}`).iconURL({ format: 'png'}) : client.user.avatarURL({ format: 'png'}))}`)
                embed.setFooter(`UserID: ${userID}`)
                embed.setTimestamp()
                embed.addField('Bans', `This user has received ${input.bans.count > 1 || (input.bans.count === 0) ? `${input.bans.count} bans` : `${input.bans.count} ban`}\n${!input.bans.rows.length ? `` : `Last ban was on ${moment(input.bans.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Kicks', `This user has received ${input.kicks.count > 1 || (input.kicks.count === 0) ? `${input.kicks.count} kicks` : `${input.kicks.count} kick`}\n${!input.kicks.rows.length ? `` : `Last kick was on ${moment(input.kicks.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Mutes', `This user has received ${input.mutes.count > 1 || (input.mutes.count === 0) ? `${input.mutes.count} mutes` : `${input.mutes.count} mute`}\n${!input.mutes.rows.length ? `` : `Last mute was on ${moment(input.mutes.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.addField('Warnings', `This user has received ${input.warnings.count > 1 || (input.warnings.count === 0) ? `${input.warnings.count} warnings` : `${input.warnings.count} warning`}\n${!input.warnings.rows.length ? `` : `Last warning was on ${moment(input.warnings.rows[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z')}`}`)
                embed.setTitle(input.status === 'local' ? `Overview for ${caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}` : `Global Overview for ${caseUsername}#${caseUserDiscri}`)
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
            embed.setDescription(`**Reason for ${capitalize(caseType)}**\n${caseQuery[0].reason}`)
            embed.addField('UserID', caseQuery[0].userID)
            embed.addField('Date of occurence', moment(caseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
            embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
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
                embed.addField(`UserID for the User who gave the ${caseType}`, caseQuery[0].actor)
                embed.addField('Notes about this case', caseQuery[0].note ? caseQuery[0].note : 'No notes made for this case')
            }
            return await message.channel.send(embed)

        }

        async function caseEdit (message: Message, caseType: string, caseNumber: string, column: string, editedContent: string): Promise<Message> {
            if (!caseType) {
                return message.channel.send('You need to specify a type of case to edit')
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to edit');
            }

            if (!caseNumber) {
                return message.channel.send('You need to specify a case number')
            }

            const columnArray = ['note', 'reason', 'muteStatus']

            if (!columnArray.includes(column)) {
                return message.channel.send('You need to specify a valid column type to edit in');
            }

            const editedContentMuteStatus = ['true', 'false']

            if (column === 'muteStatus' && caseType !== 'mute') {
                return message.channel.send('You can only edit muteStatus in mute cases.');
            } else if (column === 'muteStatus' && caseType === 'mute' && !editedContentMuteStatus.includes(editedContent)) {
                return message.channel.send('You can only edit muteStatus with true and false, nothing else.');
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

            const testCaseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE ${caseType}."${caseType}Case" = :caseNumber;`, {
                replacements: { caseNumber: caseNumbered },
                type: QueryTypes.SELECT
            })

            if (!testCaseQuery.length) {
                return message.channel.send(`Case number \`${caseNumbered}\` for the case type \`${caseType}\` does not exist.`);
            }

            if (`${testCaseQuery[0].guildID}` !== message.guild.id) {
                return message.channel.send(`Case number \`${caseNumbered}\` for the case type \`${caseType}\` is not a case from your server and therefore not available for you.`)
            }

            let actorNickname;
            let actorUsername;
            let actorDiscri;
            let caseUserNickname;
            let caseUsername;
            let caseUserDiscri;
            let caseUserPfp;

            try {
                const data = message.guild.members.cache.get(`${testCaseQuery[0].actor}`) as GuildMember
                actorNickname = data.nickname ? data.nickname : ``
                actorUsername = data.user.username
                actorDiscri = data.user.discriminator
            } catch {
                try {
                    const data = client.users.cache.get(`${testCaseQuery[0].actor}`) as User
                    actorUsername = data.username
                    actorDiscri = data.discriminator
                } catch {
                    actorUsername = 'Username'
                    actorDiscri = 'Not in our system'
                }
            }
            try {
                const data = message.guild.members.cache.get(`${testCaseQuery[0].userID}`) as GuildMember
                caseUserNickname = data.nickname ? data.nickname : ``
                caseUsername = data.user.username
                caseUserDiscri = data.user.discriminator
                caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
            } catch {
                try {
                    const data = client.users.cache.get(`${testCaseQuery[0].userID}`) as User
                    caseUsername = data.username
                    caseUserDiscri = data.discriminator
                    caseUserPfp = data.avatarURL({format: 'png', size: 1024, dynamic: true})
                } catch {
                    caseUsername = 'Username'
                    caseUserDiscri = 'Not in our system'
                    caseUserPfp = client.user.avatarURL({format: 'png'})
                }
            }

            if (caseType === 'ban') {
                if (column === 'note') {
                    const banUpdate = await ban.update({note: editedContent}, {where: {guildID: message.guild.id, banCase: caseNumbered}, returning: true})
                    if (banUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original note**\n${testCaseQuery[0].note}\n**New note**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Reason', testCaseQuery[0].reason ? testCaseQuery[0].reason : `No reason listed for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who banned', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who banned', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Ban Case Number: ${testCaseQuery[0].banCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }
                    }
                }

                if (column === 'reason') {
                    const banUpdate = await ban.update({reason: editedContent}, {where: {guildID: message.guild.id, banCase: caseNumbered}, returning: true})
                    if (banUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original reason**\n${testCaseQuery[0].reason}\n**New reason**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Note', testCaseQuery[0].note ? testCaseQuery[0].note : `No notes made for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who banned', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who banned', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Ban Case Number: ${testCaseQuery[0].banCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }
                    }
                }
            }

            if (caseType === 'kick') {
                if (column === 'note') {
                    const kickUpdate = await kick.update({note: editedContent}, {where: {guildID: message.guild.id, kickCase: caseNumbered}, returning: true})
                    if (kickUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original note**\n${testCaseQuery[0].note}\n**New note**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Reason', testCaseQuery[0].reason ? testCaseQuery[0].reason : `No reason listed for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who kicked', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who kicked', testCaseQuery[0].actor)
                        embed.setTitle(`${caseType} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Kick Case Number: ${testCaseQuery[0].kickCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }

                if (column === 'reason') {
                    const kickUpdate = await kick.update({reason: editedContent}, {where: {guildID: message.guild.id, kickCase: caseNumbered}, returning: true})
                    if (kickUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original reason**\n${testCaseQuery[0].reason}\n**New reason**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Note', testCaseQuery[0].note ? testCaseQuery[0].note : `No notes made for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who kicked', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who kicked', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Kick Case Number: ${testCaseQuery[0].kickCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }
            }

            if (caseType === 'mute') {
                if (column === 'note') {
                    const muteUpdate = await mute.update({note: editedContent}, {where: {guildID: message.guild.id, muteCase: caseNumbered}, returning: true})
                    if (muteUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original note**\n${testCaseQuery[0].note}\n**New note**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Reason', testCaseQuery[0].reason ? testCaseQuery[0].reason : `No reason listed for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('Mute Status', testCaseQuery[0].muteStatus ? `Currently muted for this case` : `Unmuted for this case`)
                        embed.addField('Mute end date', moment(testCaseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who muted', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who muted', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Mute Case Number: ${testCaseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }

                if (column === 'reason') {
                    const muteUpdate = await mute.update({note: editedContent}, {where: {guildID: message.guild.id, muteCase: caseNumbered}, returning: true})
                    if (muteUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original reason**\n${testCaseQuery[0].reason}\n**New reason**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Note', testCaseQuery[0].note ? testCaseQuery[0].note : `No notes made for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('Mute Status', testCaseQuery[0].muteStatus ? `Currently muted for this case` : `Unmuted for this case`)
                        embed.addField('Mute end date', moment(testCaseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who muted', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who muted', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Mute Case Number: ${testCaseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }

                if (column === 'muteStatus') {
                    let muteStatusConv: boolean;
                    if (editedContent === 'true') {
                        muteStatusConv = true
                    } else if (editedContent === 'false') {
                        muteStatusConv = false
                    }
                    const muteUpdate = await mute.update({MuteStatus: muteStatusConv}, {where: {guildID: message.guild.id, muteCase: caseNumbered}, returning: true})
                    if (muteUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original muteStatus**\n${testCaseQuery[0].muteStatus}\n**New muteStatus**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Note', testCaseQuery[0].note ? testCaseQuery[0].note : `No notes made for this case.`)
                        embed.addField('Reason', testCaseQuery[0].reason ? testCaseQuery[0].reason : `No reason listed for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('Mute end date', moment(testCaseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who muted', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who muted', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Mute Case Number: ${testCaseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }
            }

            if (caseType === 'warning') {
                if (column === 'note') {
                    const warningUpdate = await warning.update({note: editedContent}, {where: {guildID: message.guild.id, warningCase: caseNumbered}, returning: true})
                    if (warningUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original note**\n${testCaseQuery[0].note}\n**New note**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Reason', testCaseQuery[0].reason ? testCaseQuery[0].reason : `No reason listed for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who warned', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who warned', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Warning Case Number: ${testCaseQuery[0].warningCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }

                if (column === 'reason') {
                    const warningUpdate = await warning.update({note: editedContent}, {where: {guildID: message.guild.id, warningCase: caseNumbered}, returning: true})
                    if (warningUpdate[0] === 0) {
                        return message.channel.send(`Couldn't update ${caseType} case number \`${caseNumbered}\`\nAttempted column: ${column}.\nAttempted content: ${editedContent}`)
                    } else {
                        const embed = new MessageEmbed()
                        embed.setAuthor(message.guild.name, message.guild.iconURL({format: 'png', dynamic: true}))
                        embed.setColor(`${await urlToColours(message.guild.iconURL({format: 'png'}))}`)
                        embed.setTimestamp()
                        embed.setDescription(`**Original reason**\n${testCaseQuery[0].reason}\n**New reason**\n${editedContent}`)
                        embed.addField('Case User', caseUserNickname ? `${caseUserNickname} (${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        embed.addField('UserID', testCaseQuery[0].userID)
                        embed.addField('Note', testCaseQuery[0].note ? testCaseQuery[0].note : `No notes made for this case.`)
                        embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        embed.addField('User who warned', actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                        embed.addField('UserID for the user who warned', testCaseQuery[0].actor)
                        embed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}'s ${column} was updated!`)
                        embed.setThumbnail(caseUserPfp)
                        embed.setFooter(`Warning Case Number: ${testCaseQuery[0].warningCase}`, client.user.avatarURL({format: 'png'}))
                        try {
                            let logChannel: TextChannel;
                            const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                            logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                            await logChannel.send(embed);
                            return await message.channel.send(embed)
                        } catch {
                            return await message.channel.send(embed)
                        }                    }
                }
            }
        }
        
        async function caseDelete (message: Message, caseType: string, caseNumber: string): Promise<Message> {
            if (!caseType) {
                return message.channel.send('You need to specify a type of case to delete')
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to delete');
            }

            if (!caseNumber) {
                return message.channel.send('You need to specify a case number')
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

            const testCaseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE ${caseType}."${caseType}Case" = :caseNumber;`, {
                replacements: { caseNumber: caseNumbered },
                type: QueryTypes.SELECT
            })

            if (!testCaseQuery.length) {
                return message.channel.send(`Case number \`${caseNumbered}\` for the case type \`${caseType}\` does not exist.`);
            }

            if (`${testCaseQuery[0].guildID}` !== message.guild.id) {
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
                const data = message.guild.members.cache.get(`${testCaseQuery[0].actor}`) as GuildMember
                actorNickname = data.nickname ? data.nickname : ``
                actorUsername = data.user.username
                actorDiscri = data.user.discriminator
                actorPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
            } catch {
                try {
                    const data = client.users.cache.get(`${testCaseQuery[0].actor}`) as User
                    actorUsername = data.username
                    actorDiscri = data.discriminator
                    actorPfp = data.avatarURL({format: 'png', size: 1024, dynamic: true})
                } catch {
                    actorUsername = 'Username'
                    actorDiscri = 'Not in our system'
                    actorPfp = client.user.avatarURL({format: 'png'})
                }
            }
            try {
                const data = message.guild.members.cache.get(`${testCaseQuery[0].userID}`) as GuildMember
                caseUserNickname = data.nickname ? data.nickname : ``
                caseUsername = data.user.username
                caseUserDiscri = data.user.discriminator
                caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
            } catch {
                try {
                    const data = client.users.cache.get(`${testCaseQuery[0].userID}`) as User
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
            embed.setDescription(`**Reason for ${caseType}**\n${testCaseQuery[0].reason ? testCaseQuery[0].reason : 'No reason specified'}`)
            embed.addField('UserID', testCaseQuery[0].userID)
            embed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
            embed.setTitle(`Are you sure that you want to delete ${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
            embed.setThumbnail(caseUserPfp)
            if (caseType === 'mute') {
                embed.setFooter(`Mute Case Number: ${testCaseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                embed.addField('Date of unmute', testCaseQuery[0].muteEnd != null ? moment(testCaseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z') : 'The mute was on indefinite time' )
                embed.addField('Mute activity', testCaseQuery[0].muteStatus === true ? 'Currently muted for this case' : 'Unmuted')
            }
            if (caseType === 'kick') {
                embed.setFooter(`Kick Case Number: ${testCaseQuery[0].kickCase}`, client.user.avatarURL())
            }
            if (caseType === 'ban') {
                embed.setFooter(`Ban Case Number: ${testCaseQuery[0].banCase}`, client.user.avatarURL())
            }
            if (caseType === 'warning') {
                embed.setFooter(`Warning Case Number: ${testCaseQuery[0].warningCase}`, client.user.avatarURL())
            }
            if (message.guild.id == `${testCaseQuery[0].guildID}`) {
                embed.addField(`User who gave the ${caseType}`, actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                embed.addField(`UserID for the User who gave the ${caseType}`, testCaseQuery[0].actor)
                embed.addField('Notes about this case', testCaseQuery[0].note ? testCaseQuery[0].note : 'No notes made for this case')
            }
            const confirmEmbed = await message.channel.send(embed)
            await confirmEmbed.react('✅');
            await confirmEmbed.react('❌');
            const filter = (reaction, user) => ['✅', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = confirmEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '✅') {
                    reaction.users.remove(user);
                    let newEmbed: MessageEmbed;
                    if (caseType === 'ban') {
                        const banDelete = await ban.destroy({where: {guildID: message.guild.id, banCase: caseNumbered}})
                        if (banDelete === 0) {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`Error deleting ${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
                        } else {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`} was successfully deleted.`)
                        }
                    }
                    if (caseType === 'kick') {
                        const kickDelete = await kick.destroy({where: {guildID: message.guild.id, kickCase: caseNumbered}})
                        if (kickDelete === 0) {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`Error deleting ${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
                        } else {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`} was successfully deleted.`)
                        }
                    }
                    if (caseType === 'mute') {
                        const muteDelete = await mute.destroy({where: {guildID: message.guild.id, muteCase: caseNumbered}})
                        if (muteDelete === 0) {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`Error deleting ${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
                        } else {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`} was successfully deleted.`)
                        }
                        const unmutedUser = await message.guild.members.fetch(`${testCaseQuery[0].userID}`)
                        const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: message.guild.id}})
                        const role = message.guild.roles.cache.get(`${muteRoleData.roleID}`)
                        await unmutedUser.roles.remove(role)
                    }
                    if (caseType === 'warning') {
                        const warningDelete = await warning.destroy({where: {guildID: message.guild.id, warningCase: caseNumbered}})
                        if (warningDelete === 0) {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`Error deleting ${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`}`)
                        } else {
                            newEmbed = new MessageEmbed()
                            .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                            .setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                            .setTimestamp()
                            .setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`} was successfully deleted.`)
                        }
                    }
                    try {
                        let logChannel: TextChannel;
                        const channel = await modLog.findOne({raw: true, where: { guildID: message.guild.id}})
                        logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                        const deletedDataEmbed = new MessageEmbed()
                        deletedDataEmbed.setColor(`${await urlToColours(client.user.avatarURL({format: 'png'}))}`)
                        deletedDataEmbed.setAuthor(message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`, message.author.avatarURL())
                        deletedDataEmbed.setThumbnail(caseUserPfp)
                        deletedDataEmbed.setTitle(`${capitalize(caseType)} Case Number ${caseNumbered}: ${caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`} was successfully deleted by ${message.guild.members.cache.get(message.author.id).nickname ? `${message.guild.members.cache.get(message.author.id).nickname} (${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator})` : `${message.guild.members.cache.get(message.author.id).user.username}#${message.guild.members.cache.get(message.author.id).user.discriminator}`}`)
                        deletedDataEmbed.setDescription(`**Deleted information below**`)
                        deletedDataEmbed.addField('Username', caseUserNickname ? `${caseUserNickname}(${caseUsername}#${caseUserDiscri})` : `${caseUsername}#${caseUserDiscri}`)
                        deletedDataEmbed.addField('User ID', testCaseQuery[0].userID)
                        deletedDataEmbed.addField('Date of occurence', moment(testCaseQuery[0].date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                        deletedDataEmbed.setTimestamp()
                        if (caseType === 'mute') {
                            deletedDataEmbed.setFooter(`Mute Case Number: ${testCaseQuery[0].muteCase}`, client.user.avatarURL({format: 'png'}))
                            deletedDataEmbed.addField('Date of unmute', testCaseQuery[0].muteEnd != null ? moment(testCaseQuery[0].muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z') : 'The mute was on indefinite time' )
                            deletedDataEmbed.addField('Mute activity', testCaseQuery[0].muteStatus === true ? 'Currently muted for this case' : 'Unmuted')
                        }
                        if (caseType === 'kick') {
                            deletedDataEmbed.setFooter(`Kick Case Number: ${testCaseQuery[0].kickCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'ban') {
                            deletedDataEmbed.setFooter(`Ban Case Number: ${testCaseQuery[0].banCase}`, client.user.avatarURL())
                        }
                        if (caseType === 'warning') {
                            deletedDataEmbed.setFooter(`Warning Case Number: ${testCaseQuery[0].warningCase}`, client.user.avatarURL())
                        }
                        if (message.guild.id == `${testCaseQuery[0].guildID}`) {
                            deletedDataEmbed.addField(`User who gave the ${caseType}`, actorNickname ? `${actorNickname} (${actorUsername}#${actorDiscri})` : `${actorUsername}#${actorDiscri}`)
                            deletedDataEmbed.addField(`UserID for the User who gave the ${caseType}`, testCaseQuery[0].actor)
                            deletedDataEmbed.addField('Notes about this case', testCaseQuery[0].note ? testCaseQuery[0].note : 'No notes made for this case')
                        }
                        await logChannel.send(deletedDataEmbed);
                        await confirmEmbed.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                        await confirmEmbed.edit(newEmbed);
                    } catch {
                        await confirmEmbed.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                        await confirmEmbed.edit(newEmbed);
                    }
                } else if (reaction.emoji.name === '❌') {
                    collector.stop();
                    return await confirmEmbed.delete();
                }
            })
        }
        
        async function caseSearch (message: Message, caseType: string, column: string, query: string): Promise<Message> {
            if (!caseType) {
                return message.channel.send('You need to specify a type of case to check')
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to check');
            }

            const columnArray = ['note', 'reason', 'muteStatus', 'userID', 'date', 'muteEnd', 'actor']

            if (!columnArray.includes(column)) {
                return message.channel.send('You need to specify a valid column type to edit in');
            }

            const editedContentMuteStatus = ['true', 'false']

            if (column === 'muteStatus' && caseType !== 'mute') {
                return message.channel.send('You can only search muteStatus in mute cases.');
            } else if (column === 'muteStatus' && caseType === 'mute' && !editedContentMuteStatus.includes(query)) {
                return message.channel.send('You can only search muteStatus with true and false, nothing else.');
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

            const testCaseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE "guildID" = :guild AND CAST(${column} AS varchar) ILIKE :query
            ORDER BY CAST(${column} AS varchar) ILIKE :query, date DESC;`, {
                replacements: { guild: message.guild.id, query: '%' + query + '%' },
                type: QueryTypes.SELECT
            })

            if (!testCaseQuery.length) {
                return message.channel.send(`No results found for the query ${query} under ${column} for the ${caseType} cases.`);
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

            let currentPage: number = 0;
            const embeds = await generateCaseEmbedding(testCaseQuery)
            const queueEmbed = await message.channel.send(`Result: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < embeds.length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Result: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    } 
                } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Result: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
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

                    let actorNickname;
                    let actorUsername;
                    let actorDiscri;
                    //let actorPfp;
                    let caseUserNickname;
                    let caseUsername;
                    let caseUserDiscri;
                    let caseUserPfp;

                    try {
                        const data = message.guild.members.cache.get(`${current.actor}`) as GuildMember
                        actorNickname = data.nickname ? data.nickname : ``
                        actorUsername = data.user.username
                        actorDiscri = data.user.discriminator
                        //actorPfp = data.user.avatarURL({format: 'png', dynamic: true})
                    } catch {
                        try {
                            const data = client.users.cache.get(`${current.actor}`) as User
                            actorUsername = data.username
                            actorDiscri = data.discriminator
                            //actorPfp = data.avatarURL({format: 'png', dynamic: true})
                        } catch {
                            actorUsername = 'Username'
                            actorDiscri = 'Not in our system'
                            //actorPfp = client.user.avatarURL({format: 'png', dynamic: true})
                        }
                    }
                    try {
                        const data = message.guild.members.cache.get(`${current.userID}`) as GuildMember
                        caseUserNickname = data.nickname ? data.nickname : ``
                        caseUsername = data.user.username
                        caseUserDiscri = data.user.discriminator
                        caseUserPfp = data.user.avatarURL({format: 'png', size: 1024, dynamic: true})
                    } catch {
                        try {
                            const data = client.users.cache.get(`${current.userID}`) as User
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
                    embed.setAuthor(client.guilds.cache.get(`${current.guildID}`).name, client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}))
                    embed.setColor(`${await urlToColours(client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) ? client.guilds.cache.get(`${current.guildID}`).iconURL({ format: 'png'}) : client.user.avatarURL({format: 'png'}))}`)
                    embed.setTimestamp()
                    embed.setDescription(`**Reason for ${capitalize(caseType)}**\n${current.reason}`)
                    embed.addField('Date of occurence', moment(current.date).format('dddd, MMMM Do YYYY, HH:mm:ss A Z'))
                    embed.setTitle(message.guild.id == current.guildID ? `${caseUserNickname ? `${caseUserNickname} (${caseUsername + '#' + caseUserDiscri})` : caseUsername + '#' + caseUserDiscri}`:`${caseUsername}#${caseUserDiscri} was ${caseWording} in the server ${client.guilds.cache.get(`${current.guildID}`).name}`)
                    embed.setThumbnail(caseUserPfp);
                    if (caseType === 'mute') {
                        embed.setFooter(`Mute Case Number: ${current.muteCase}`, client.user.avatarURL())
                        embed.addField('Date of unmute', current.muteEnd != null ? moment(current.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A Z') : 'The mute was on indefinite time' )
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
                        embed.addField(`User who gave the ${caseType}`, `${actorNickname ? `${actorNickname} (${actorUsername + '#' + actorDiscri})` : actorUsername + '#' + actorDiscri}`)
                        embed.addField('Notes about this case', current.note ? current.note : 'No notes made for this case')
                    }
                    embeds.push(embed)
                }
                return embeds;
            }

        }
        
        async function caseList (message: Message, caseType: string, firstDate?: string, secondDate?: string): Promise<Message> {
            if (!caseType) {
                return message.channel.send('You need to specify a type of case to check')
            }

            const caseTypesArray = ['ban', 'kick', 'mute', 'warning']

            if (!caseTypesArray.includes(caseType)) {
                return message.channel.send('You need to specify a valid case type to check');
            }

            if (firstDate && !secondDate) {
                return message.channel.send('You need to specify an end date to list between two dates');
            }

            if (firstDate && secondDate) {
                if (moment(firstDate, 'YYYY-MM-DD', true).isValid() === false) {
                    return message.channel.send('You need to specify a valid start date to create a list. The format is YYYY-MM-DD');
                }
    
                if (moment(secondDate, 'YYYY-MM-DD', true).isValid() === false) {
                    return message.channel.send('You need to specify a valid start date to create a list. The format is YYYY-MM-DD');
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

            const testCaseQuery: Array<caseTables> = await database.query(`
            SELECT *
            FROM ${caseType}
            WHERE "guildID" = :guild${firstDate ? ` AND date >= :startDate AND date < :endDate` : ``}
            ORDER BY date DESC;`, {
                replacements: { guild: message.guild.id, startDate: firstDate, endDate: secondDate },
                type: QueryTypes.SELECT
            })

            if (!testCaseQuery.length) {
                return message.channel.send(`No ${caseType} case results found${firstDate ? ` between ${firstDate} and ${secondDate}` : `.`}`);
            }

            let currentPage: number = 0;
            const embeds = await generateCaseListEmbed(testCaseQuery)
            const queueEmbed = await message.channel.send(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
            await queueEmbed.react('⬅️');
            await queueEmbed.react('➡️');
            await queueEmbed.react('❌');
            const filter = (reaction, user) => ['⬅️', '➡️', '❌'].includes(reaction.emoji.name) && (message.author.id === user.id);
            const collector = queueEmbed.createReactionCollector(filter);

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '➡️') {
                    if (currentPage < embeds.length-1) {
                      currentPage++;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page: ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    } 
                } else if (reaction.emoji.name === '⬅️') {
                    if (currentPage !== 0) {
                      --currentPage;
                      reaction.users.remove(user);
                      queueEmbed.edit(`Current Page ${currentPage+1}/${embeds.length}`, embeds[currentPage]);
                    }
                } else {
                    collector.stop();
                    await queueEmbed.delete();
                }
            })

            async function generateCaseListEmbed (data) {
                const embeds = [];
                let k = 10;
                for(let i =0; i < data.length; i += 10) {
                    const current = data.slice(i, k);
                    let j = i;
                    k += 10;
                    let info;
                    if (caseType === 'ban') {
                        info = current.map(caseList => `**Ban Case Number ${caseList.banCase}:** ${client.users.cache.get(`${caseList.userID}`).username ? `${client.users.cache.get(`${caseList.userID}`).username}#${client.users.cache.get(`${caseList.userID}`).discriminator}` : `Anonymous user`}. ${moment(caseList.date).format('MMMM Do YYYY')}.`).join(`\n`)
                    }
                    if (caseType === 'kick') {
                        info = current.map(caseList => `**Kick Case Number ${caseList.kickCase}:** ${client.users.cache.get(`${caseList.userID}`).username ? `${client.users.cache.get(`${caseList.userID}`).username}#${client.users.cache.get(`${caseList.userID}`).discriminator}` : `Anonymous user`}. ${moment(caseList.date).format('MMMM Do YYYY')}.`).join(`\n`)
                    }
                    if (caseType === 'mute') {
                        info = current.map(caseList => `**Mute Case Number ${caseList.muteCase}:** ${client.users.cache.get(`${caseList.userID}`).username ? `${client.users.cache.get(`${caseList.userID}`).username}#${client.users.cache.get(`${caseList.userID}`).discriminator}` : `Anonymous user`}. ${moment(caseList.date).format('MMMM Do YYYY')}.`).join(`\n`)
                    }
                    if (caseType === 'warning') {
                        info = current.map(caseList => `**Warning Case Number ${caseList.warningCase}:** ${client.users.cache.get(`${caseList.userID}`).username ? `${client.users.cache.get(`${caseList.userID}`).username}#${client.users.cache.get(`${caseList.userID}`).discriminator}` : `Anonymous user`}. ${moment(caseList.date).format('MMMM Do YYYY')}.`).join(`\n`)
                    }
                    const embed = new MessageEmbed()
                    .setDescription(`${await info}`)
                    .setColor(message.guild.iconURL() ? `${await urlToColours(message.guild.iconURL({ format: 'png'}))}` : `${await urlToColours(client.user.displayAvatarURL({ format: 'png'}))}`)
                    .setTitle(`${capitalize(caseType)} Case List for ${message.guild.name}${firstDate ? ` between ${firstDate} and ${secondDate}` : ``}`)
                    .setThumbnail(message.guild.iconURL({format: 'png', dynamic: true, size: 1024}) ? message.guild.iconURL({format: 'png', dynamic: true, size: 1024}) : '')
                    .setAuthor(client.user.username, client.user.avatarURL({format: 'png'}))
                    .setFooter(`Amount of ${caseType} cases: ${data.length}`)
                    .setTimestamp()
                    embeds.push(embed)
                }
                return embeds;
            }
        }
        
    }
}