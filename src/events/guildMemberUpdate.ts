import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, modLog, user } from '../database/models/init-models';
import { TextChannel, GuildMember } from "discord.js";

export const event: Event = {
    name: 'guildMemberUpdate',
    run: async (client, oldMember: GuildMember, newMember: GuildMember): Promise<any> => {
        initModels(database);

        try {
            const log = await modLog.findOne({where: { guildID: oldMember.guild.id}})
            const modLogChannel: TextChannel = client.channels.cache.get(`${log.channel}`) as TextChannel;
            await modLogChannel.send(`**User update for <@${oldMember.id}>**\nOld user info:\n${oldMember}\nNew user info:\n${newMember}`)
        } catch {
            return
        }

        await user.update({discriminator: newMember.user.discriminator, username: newMember.user.username}, {where: {userID: oldMember.id}})
    }
}

/*
Explanation for the specification and import of TextChannel can be found here: https://github.com/discordjs/discord.js/issues/3622
*/