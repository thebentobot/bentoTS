import axios from 'axios';
import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'cat',
    aliases: [],
    category: 'features',
    description: 'Make Bento send a random cat 🐱🥺',
    usage: 'cat',
    website: 'https://www.bentobot.xyz/commands#cat',
    run: async (client, message, args): Promise<Message> => {
        const catData = await axios.get('http://aws.random.cat/meow')
        return message.channel.send(catData.data.file)
    }
}