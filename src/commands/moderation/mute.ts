import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'mute',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'mute',
    run: async (client, message, args): Promise<Message> => {
        return message.channel.send('https://github.com/thebentobot')
    }
}