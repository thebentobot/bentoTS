import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'ban',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'ban',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}