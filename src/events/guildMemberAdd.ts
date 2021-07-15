import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guildMember, guildMemberCreationAttributes, user, userCreationAttributes, welcome, autoRole, mute, muteRole } from '../database/models/init-models';
import { GuildMember, TextChannel } from "discord.js"

export const event: Event = {
    name: 'guildMemberAdd',
    run: async (client, member: GuildMember): Promise<any> => {
        initModels(database);

        const currentMute = await mute.findOne({raw: true, where: {userID: member.id, guildID: member.guild.id, MuteStatus: true}})

        if (currentMute) {
            const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: member.guild.id}})
            const role = member.guild.roles.cache.get(`${muteRoleData.roleID}`)
            await member.roles.add(role)
        }

        const userAttr: userCreationAttributes = {
            userID: BigInt(member.id),
            discriminator: member.user.discriminator,
            xp: 0,
            level: 1,
            username: member.user.username
        }

        await user.findOrCreate({where: { userID: member.id}, defaults: userAttr});

        const guildMemberAttr: guildMemberCreationAttributes = {
            userID: BigInt(member.id),
            guildID: BigInt(member.guild.id),
            xp: 0,
            level: 1
        }

        await guildMember.create(guildMemberAttr);

        try {
            const welcomeData = await welcome.findOne({where: { guildID: member.guild.id }});

            const channel = member.guild.channels.cache.get(`${welcomeData.channel}`) as TextChannel;
            const msg = welcomeData.message
            const msgClean = msg
            .replace('{user}', `${member.user}`)
            .replace('{username}', member.user.username)
            .replace('{discriminator}', member.user.discriminator)
            .replace('{usertag}', member.user.username + '#' + member.user.discriminator)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', `${member.guild.memberCount}`)
            .replace('{space}', '\n')
            .replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '').replace(`\\`, '')

            channel.send(msgClean)
        } catch {
            return
        }

        const autoRoleData = await autoRole.findAll({where: {guildID: member.guild.id}})
        if (autoRoleData) {
            const iterator = autoRoleData.values();

            for (const value of iterator) {
                member.roles.add(`${value.roleID}`) // there was an array around the string before, was that a mistake? Most likely
            }
        }
    }
}