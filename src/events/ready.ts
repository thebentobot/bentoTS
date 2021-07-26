import { GuildMember, MessageEmbed, TextChannel, User } from "discord.js";
import moment from "moment";
import { QueryTypes } from "sequelize";
import database from "../database/database";
import { initModels, modLog, reminder } from "../database/models/init-models";
import { mute } from "../database/models/mute";
import { muteRole } from "../database/models/muteRole";
import { Event } from "../interfaces";

export const event: Event = {
    name: 'ready',
    run: async (client): Promise<any> => {
        console.log(`${client.user.tag} is online! Let\'s get this bread!`);
        client.user.setActivity(`🍱 - Feeding in ${client.channels.cache.size} channels, serving on ${client.guilds.cache.size} servers`, {type: 'PLAYING'});
        
        async function checkMutes() {
            interface muteDataTypes {
                muteCase: number,
                userID: bigint,
                guildID: bigint,
                date: Date,
                muteEnd: Date,
                note: string,
                actor: bigint,
                reason: string,
                muteStatus: boolean
            }
        
            const unmutes: Array<muteDataTypes> = await database.query(`
            SELECT *
            FROM mute
            WHERE mute."muteEnd" < now()::timestamp at time zone  'utc' AND mute."MuteStatus" = true AND "muteEnd" is not null;`, {
                type: QueryTypes.SELECT
            })
            
            //const now = new Date()
        
            //const unmutes = await mute.findAll({raw: true, where: { muteEnd: {[lt]: now}, MuteStatus: true }})
        
            if (unmutes) {
                for (const unmute of unmutes) {
                    initModels(database);
        
                    let member: GuildMember;
                    const guild = client.guilds.cache.get(`${unmute.guildID}`)
                    try {
                        member = guild.members.cache.get(`${unmute.userID}`)
                    } catch {
                        return
                    }
        
                    const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: unmute.guildID}})
                    const role = guild.roles.cache.get(`${muteRoleData.roleID}`)
                    try {
                        let logChannel: TextChannel;
                        const channel = await modLog.findOne({raw: true, where: { guildID: guild.id}})
                        logChannel = client.channels.cache.get(`${channel.channel}`) as TextChannel;
                        const embed = new MessageEmbed()
                        .setColor('#00ff4a')
                        .setAuthor(guild.members.cache.get(`${unmute.actor}`).nickname ? `${guild.members.cache.get(`${unmute.actor}`).nickname} (${guild.members.cache.get(`${unmute.actor}`).user.username}#${guild.members.cache.get(`${unmute.actor}`).user.discriminator})` : `${guild.members.cache.get(`${unmute.actor}`).user.username}#${guild.members.cache.get(`${unmute.actor}`).user.discriminator}`, guild.members.cache.get(`${unmute.actor}`).user.avatarURL())
                        .setThumbnail(member.user.avatarURL())
                        .setTitle(`${member.nickname ? `${member.nickname} (${member.user.username}#${member.user.discriminator})` : `${member.user.username}#${member.user.discriminator}`} was unmuted!`)
                        .setDescription(`**Reason for unmute**\nMute expired`)
                        .addField('Username', member.user.username + '#' + member.user.discriminator)
                        .addField('User ID', member.id)
                        .addField('Muted by', guild.members.cache.get(`${unmute.actor}`).nickname ? `${guild.members.cache.get(`${unmute.actor}`).nickname} (${guild.members.cache.get(`${unmute.actor}`).user.username}#${guild.members.cache.get(`${unmute.actor}`).user.discriminator})` : `${guild.members.cache.get(`${unmute.actor}`).user.username}#${guild.members.cache.get(`${unmute.actor}`).user.discriminator}`)
                        .addField('Mute date', moment(unmute.date).format('dddd, MMMM Do YYYY, HH:mm:ss A z'))
                        .addField('Original mute end date', unmute.muteEnd != null ? moment(unmute.muteEnd).format('dddd, MMMM Do YYYY, HH:mm:ss A z') : 'The mute was on indefinite time')
                        .addField('Reason for mute', unmute.reason != null ? 'No reason specified for mute' : unmute.reason)
                        .addField('Notes about the mute case', unmute.note ? unmute.note : 'No notes made for this mute case')
                        .setFooter(`Mute Case Number: ${unmute.muteCase}`)
                        .setTimestamp();
                        await logChannel.send(embed);
                        try {
                            (await client.users.fetch(`${unmute.userID}`)).send(`🙏You were automatically \`unmuted\` from **${guild.name}**`).catch(error => { console.error(`Could not send unmute DM`, error)})
                            await member.roles.remove(role)
                            await mute.update({MuteStatus: false}, {where: {userID: unmute.userID, guildID: unmute.guildID, MuteStatus: true}})
                        } catch {
                            await member.roles.remove(role)
                            await mute.update({MuteStatus: false}, {where: {userID: unmute.userID, guildID: unmute.guildID, MuteStatus: true}})
                        }
                    } catch {
                        try {
                            (await client.users.fetch(`${unmute.userID}`)).send(`🙏You were automatically \`unmuted\` from **${guild.name}**`).catch(error => { console.error(`Could not send unmute DM`, error)})
                            await member.roles.remove(role)
                            await mute.update({MuteStatus: false}, {where: {userID: unmute.userID, guildID: unmute.guildID, MuteStatus: true}})
                        } catch {
                            await member.roles.remove(role)
                            await mute.update({MuteStatus: false}, {where: {userID: unmute.userID, guildID: unmute.guildID, MuteStatus: true}})
                        }
                    }
                }
            }
            //console.log('checkMute TRIGGERED')
        }
        checkMutes();

        setInterval(checkMutes, 5000) // 5 seconds

        async function checkReminders () {
            interface muteDataTypes {
                id: number,
                userID: bigint,
                date: Date,
                reminder: string
            }
        
            const reminders: Array<muteDataTypes> = await database.query(`
            SELECT *
            FROM reminder
            WHERE reminder.date < now()::timestamp at time zone 'utc';`, {
                type: QueryTypes.SELECT
            })

            if (reminders) {
                for (const remind of reminders) {
                    initModels(database);
        
                    let user: User;
                    try {
                        user = client.users.cache.get(`${remind.userID}`)
                        await user.send(`**Reminder!** ${remind.reminder}`).catch(error => { console.error(`Could not send unmute DM`, error)})
                        await reminder.destroy({where: {id: remind.id, userID: remind.userID, reminder: remind.reminder, date: remind.date}})
                    } catch {
                        return
                    }
                }
            }
        }

        checkReminders();

        setInterval(checkReminders, 5000) // 5 seconds
    }
}