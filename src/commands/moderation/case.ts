import { Message, MessageEmbed } from 'discord.js';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import database from '../../database/database';
import { guildMember, initModels } from '../../database/models/init-models';
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
        /*
        if (args[0] === 'check') {
            // check a case, args 1 is the case number
            return caseCheck (message, args[1])
            // only returns local cases, so you can't just check random cases for fun lol
            // returns one case
        }

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
                    return message.channel.send(`You can't check users who haven't been or aren't on your server`)
                }
                } catch {
                    return message.channel.send(`User mention or userID is invalid`)
                }
            }

            if (caseType === 'overview') {
                // short overview of a user. Must only be available for all servers where the user is there
                // only shows numbers and last time an offense occurred if any
                // so we sort after showing the most recent event.
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
                let k = 1;
                const embeds = [];
                for(let i =0; i < input.length; i += 1) {
                    const current = input[i]
                    let j = i;
                    k += 1;

                    // for each case we fetch the caseGlobal table to check if the server allows to show server name and reason for case
                    // so we need to create a db table with
                    // guildID: bigint, serverName: boolean, reason: boolean
                    // so a server got a choice for if they want to share name and reason or nah

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
                }
                return embeds;
            }
        }
        /*
        async function caseCheck (message: Message, caseNumber: string): Promise<Message> {
            
        }

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