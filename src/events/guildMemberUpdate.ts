import { Event } from "../interfaces";
import database from '../database/database';
import { guildMember, initModels, memberLog, modLog, user } from '../database/models/init-models';
import { TextChannel, GuildMember, MessageEmbed } from "discord.js";

export const event: Event = {
    name: 'guildMemberUpdate',
    run: async (client, oldMember: GuildMember, newMember: GuildMember): Promise<any> => {
        initModels(database);

        if (oldMember.nickname !== newMember.nickname) {
            try {
                const log = await memberLog.findOne({where: { guildID: oldMember.guild.id}})
                const memberLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setAuthor(`${oldMember.user.username + '#' + oldMember.user.discriminator} (userID: ${oldMember.id})`, oldMember.user.displayAvatarURL())
                .setColor('#39FF14')
                .setDescription(`Nickname updated for this user.\n**Previous nickname:**\n${oldMember.nickname}\n**New nickname:**\n${newMember.nickname}`)
                .setFooter('Updated at')
                .setTimestamp()
                await memberLogChannel.send(embed)
            } catch {
                return
            }
        }

        if (oldMember.user.avatarURL({dynamic: true, format: "png", size: 1024}) !== newMember.user.avatarURL({dynamic: true, format: "png", size: 1024})) {
            try {
                const log = await memberLog.findOne({where: { guildID: oldMember.guild.id}})
                const memberLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setAuthor(`${oldMember.user.username + '#' + oldMember.user.discriminator} (userID: ${oldMember.id})`, oldMember.user.displayAvatarURL({dynamic: true, format: "png", size: 1024}))
                .setThumbnail(newMember.user.avatarURL({dynamic: true, format: "png", size: 1024}))
                .setColor('#39FF14')
                .setDescription(`Avatar updated for this user.\n**Previous avatar:**\n${oldMember.user.avatarURL({dynamic: true, format: "png", size: 1024})}\n**New avatar:**\n${newMember.user.avatarURL({dynamic: true, format: "png", size: 1024})}`)
                .setFooter('Updated at')
                .setTimestamp()
                await user.update({avatarURL: newMember.user.avatarURL({dynamic: true, format: "png", size: 1024})}, {where: {userID: oldMember.id}})
                await guildMember.update({avatarURL: newMember.user.avatarURL()}, {where: {userID: oldMember.id, guildID: oldMember.guild.id}})
                await memberLogChannel.send(embed)
            } catch {
                return
            }
        }

        if (oldMember.user.username !== newMember.user.username) {
            try {
                const log = await memberLog.findOne({where: { guildID: oldMember.guild.id}})
                const memberLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setAuthor(`${oldMember.user.username + '#' + oldMember.user.discriminator} (userID: ${oldMember.id})`, oldMember.user.displayAvatarURL())
                .setColor('#39FF14')
                .setDescription(`Username updated for this user.\n**Previous username:**\n${oldMember.user.username}\n**New username:**\n${newMember.user.username}`)
                .setFooter('Updated at')
                .setTimestamp()
                await user.update({username: newMember.user.username}, {where: {userID: oldMember.id}})
                await memberLogChannel.send(embed)
            } catch {
                return
            }
        }

        if (oldMember.user.discriminator !== newMember.user.discriminator) {
            try {
                const log = await memberLog.findOne({where: { guildID: oldMember.guild.id}})
                const memberLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
                const embed = new MessageEmbed()
                .setAuthor(`${oldMember.user.username + '#' + oldMember.user.discriminator} (userID: ${oldMember.id})`, oldMember.user.displayAvatarURL())
                .setColor('#39FF14')
                .setDescription(`Discriminator updated for this user.\n**Previous discriminator:**\n${oldMember.user.discriminator}\n**New discriminator:**\n${newMember.user.discriminator}`)
                .setFooter('Updated at')
                .setTimestamp()
                await user.update({discriminator: newMember.user.discriminator}, {where: {userID: oldMember.id}})
                await memberLogChannel.send(embed)
            } catch {
                return
            }
        }
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord/issues/3622
*/