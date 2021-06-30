import { Command } from '../../interfaces';
import axios from 'axios'
import { MessageEmbed } from 'discord.js';
import { trim } from '../../utils';

const urbanAPI = axios.create({
    baseURL: "https://api.urbandictionary.com/v0",
});

export const command: Command = {
    name: 'urban',
    aliases: [],
    category: 'features',
    description: 'Search for definitions on Urban dictionary',
    usage: 'urban <search input>',
    run: async (client, message, args): Promise<any> => {
        if (!args.length) {
			return message.channel.send('You need to search for a definition!');
		}
        
        let query: string = args.join(" ");

        const response = await urbanAPI.get('/define?', {params: {term: query}});

        if (response.data.length) {
            return message.channel.send(`No definition found for \`${query}\`.`);
        }

        const answer = response.data.list[0]

        const exampleEmbed = new MessageEmbed()
            .setColor('#1c9fea')
            .setAuthor('Urban Dictionary', 'https://is4-ssl.mzstatic.com/image/thumb/Purple111/v4/81/c8/5a/81c85a6c-9f9d-c895-7361-0b19b3e5422e/mzl.gpzumtgx.png/246x0w.png', 'https://www.urbandictionary.com/')
            .setTitle(answer.word)
            .setURL(answer.permalink)
            .setTimestamp()
            .addFields(
                { name: 'Definition', value: trim(answer.definition, 1024) },
                { name: 'Example', value: trim(answer.example, 1024) },
                { name: 'Rating', value: `${answer.thumbs_up} :thumbsup: ${answer.thumbs_down} :thumbsdown:` },
        );

		return message.channel.send(exampleEmbed);
    }
}