import { Event } from "../interfaces";
import database from '../database/database';
import { initModels, guild as DbGuild, guildCreationAttributes } from '../database/models/init-models';
import ConfigJson from '../../config.json';

export const event: Event = {
    name: 'guildCreate',
    run: async (client, guild) => {
        initModels(database);

        const attr: guildCreationAttributes = {
            guildID: guild.id,
            guildName: guild.name,
            prefix: ConfigJson.prefix,
            tiktok: true,
            nsfw: false,
            leaderboard: true,
            media: true
        };

        const newGuild = await DbGuild.create(attr);
        console.log('New guild were added to the database. It is called: ' + newGuild.guildName + ', ID: ' + newGuild.guildID);
    }
}