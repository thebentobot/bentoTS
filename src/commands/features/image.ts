import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import { Message, TextChannel } from 'discord.js';
const gis: any = require('g-i-s');
//import * as gis from 'g-i-s'

export const command: Command = {
    name: 'image',
    aliases: ['img', 'pic'],
    category: 'features',
    description: 'Searches for random images based on the search input',
    usage: 'image <search query>',
    run: async (client, message, args): Promise<Message> => {
        if (!args.length) {
            return message.channel.send('You need to provide a search input!').then(m => m.delete({timeout: 5000}));
        }

        if (message.channel.type !== 'text') return

        initModels(database);

        const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}});

        if (guildDB.media === false) return

        const channelObject = message.channel as TextChannel
        
        let query: string;
        if (channelObject.nsfw === false) {
            query = args.join(" ").replace('#', '').replace('&safe=off', '').replace('&safe=on', '') + '&safe=on'
        } else {
            query = args.join(" ")
        }

        if(!query) return message.channel.send('You need to write something to search for a picture!').then(m => m.delete({timeout: 5000}));

        gis(query, logResults);

        function logResults (error: Error, results: any) {
            const index = Math.floor(Math.random() * results.length);
            if (error) {
                console.log(error);
                return message.channel.send('Error');
            } else {
                try {
                    return message.channel.send(results[index].url);
                } catch {
                    return message.channel.send(`No images found based on your search input \`${query.replace('&safe=on', '')}\`.`);
                }
            }
        }
    }
}