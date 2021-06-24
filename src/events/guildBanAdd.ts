import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guildMember, user as DbUser, bento, horoscope, lastfm, weather } from '../database/models/init-models';
import { Guild, User } from "discord.js"

export const event: Event = {
    name: 'guildBanAdd',
    run: async (client, guild: Guild, user: User) => {
        initModels(database);

        // the ban command inserts the record into the ban table
        await guildMember.destroy({where: {guildID: guild.id, userID: user.id}})

        try {
            await guildMember.findAll({where: {userID: user.id}})
        } catch {
            await DbUser.destroy({where: {userID: user.id}});
            await bento.destroy({where: {userID: user.id}});
            await horoscope.destroy({where: {userID: user.id}});
            await lastfm.destroy({where: {userID: user.id}});
            await weather.destroy({where: {userID: user.id}});
        }
    }
}