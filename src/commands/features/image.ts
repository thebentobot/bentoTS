import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, guild } from '../../database/models/init-models';
import { Message } from 'discord.js';
const gis: any = require('g-i-s');
//import * as gis from 'g-i-s'

export const command: Command = {
    name: 'image',
    aliases: ['img', 'pic'],
    category: 'features',
    description: 'Searches for random images based on the search input',
    usage: 'image <search query>',
    run: async (client, message, args): Promise<Message> => {

        initModels(database);

        const guildDB = await guild.findOne({raw: true, where: {guildID: message.guild.id}});

        if (guildDB.media === false) return
        
        let query: string;
        if (guildDB.nsfw === false) {
            query = args.join(" ") + '&safe=on'
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
                    return message.channel.send(`No images found based on your search input \`${query}\`.`);
                }
            }
        }
    }
}