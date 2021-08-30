import { GuildMember, MessageEmbed, TextChannel, User } from "discord.js";
import moment from "moment";
import { QueryTypes } from "sequelize";
import database from "../database/database";
import { initModels, modLog, reminder, user, guildMember, guild, } from "../database/models/init-models";
import { mute } from "../database/models/mute";
import { muteRole } from "../database/models/muteRole";
import { Event } from "../interfaces";
import { Webhook } from '@top-gg/sdk'
import express from 'express'
import * as dotenv from "dotenv";
import http from 'http'
import { bento, bentoCreationAttributes } from '../database/models/bento';
dotenv.config();
//import fs from 'fs'

export const event: Event = {
    name: 'ready',
    run: async (client): Promise<any> => {
        console.log(`${client.user.tag} is online! Let\'s get this bread!`);
        client.user.setActivity(`🍱 - Feeding in ${client.channels.cache.size} channels, serving on ${client.guilds.cache.size} servers`, {type: 'PLAYING'});
        
        const app = express()
        // top.gg
        const webhook = new Webhook(process.env.topgg)

        app.post("/dblwebhook", webhook.listener(async vote => {
            // vote will be your vote object, e.g
            console.log(vote)
            console.log(vote.user + ' has voted on top.gg') // 395526710101278721 < user who voted\
            
            const now: Date = new Date()
            const newUserDate = moment(now).add(-12, 'hour').toDate()
            const bentoAttrTarget: bentoCreationAttributes = {
                userID: BigInt(vote.user),
                bento: 0,
                bentoDate: new Date(newUserDate)
            }
            const bentoDataTarget = await bento.findOrCreate({raw: true, where: {userID: vote.user}, defaults: bentoAttrTarget})
            if (vote.isWeekend === true) {
                await bento.increment('bento', {by: 10, where: { userID: bentoDataTarget[0].userID}});
            } else {
                await bento.increment('bento', {by: 5, where: { userID: bentoDataTarget[0].userID}});
            }
            const webhookChannel: TextChannel = client.channels.cache.get(`881566124993544232`) as TextChannel;
            webhookChannel.send(`<@${vote.user}> has voted on top.gg 👏`)
            // You can also throw an error to the listener callback in order to resend the webhook after a few seconds
        }))

        // ko-fi
        app.post("/kofi", (req, res, next) => {
            const data = req.body.data;
            if (!data) return;

            try {
                const obj = JSON.parse(data);
                console.log(obj)
                if (obj.is_public === false) return
                const webhookChannel: TextChannel = client.channels.cache.get(`881566124993544232`) as TextChannel;
                webhookChannel.send(`"${obj.message}"\nI have received a **${obj.amount}$** **Ko-fi ☕ tip** from **${obj.from_name}**. Thank you so much! 🥺\nIn return, you will ASAP receive ${parseInt(obj.amount)} Bento 🍱 in returns, as a huge thanks 💖`)
            } catch (err) {
                console.error(err);
                return res.json({success: false, error: err});
            }
            return res.json({success: true});
        })

        const httpServer = http.createServer(app); //Setting up the server
        httpServer.listen(6969, function() {
            console.log(`Bento Webhook Server online on port ${6969}`);
        });

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