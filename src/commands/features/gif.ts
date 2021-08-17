import { Command } from '../../interfaces';
import axios from 'axios'
import utf8 from 'utf8'
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import * as dotenv from "dotenv";
import { Message, TextChannel } from 'discord.js';
dotenv.config();

const tenorAPI = axios.create({
    baseURL: "https://api.tenor.com/v1",
});

export const command: Command = {
    name: 'gif',
    aliases: [],
    category: 'features',
    description: 'Searches for random GIFs based on the search input. The GIFs comes from Tenor, and has a G-rated content filter for non-NSFW channels. The filter is off in NSFW channels.',
    usage: 'gif <search input>',
    website: 'https://www.bentobot.xyz/commands#gif',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) {
            return message.channel.send('You need to provide a search input!').then(m => m.delete({timeout: 5000}));
        }

        if (message.channel.type !== 'text') return

        const channelObject = message.channel as TextChannel

        initModels(database);

        const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}});

        if (guildDB.media === false) return
        
        let query: string;
        let filter: string;
        if (channelObject.nsfw === false) {
            query = args.join(" ").replace('contentfilter', '');
            filter = 'high';
        } else {
            query = args.join(" ");
            filter = 'off';
        }
        const response = await tenorAPI.get('/search', {params: {q: utf8.encode(query), key: process.env.TENORKEY, contentfilter: filter}})
        const index = Math.floor(Math.random() * response.data.results.length);
        if (!response.data.results.length) {
            return message.channel.send(`No GIFs found based on your search input \`${query}\`.`);
        } else {
            return message.channel.send(response.data.results[index].url);
        }
    }
}