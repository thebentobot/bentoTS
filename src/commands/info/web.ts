import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'web',
    aliases: [],
    category: 'info',
    description: 'Link to the Bento 🍱 website',
    usage: 'web',
    website: 'https://www.bentobot.xyz/commands#web',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://www.bentobot.xyz/')
    }
}