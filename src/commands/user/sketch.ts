import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'sketch',
    aliases: [],
    category: 'user',
    description: 'should we just direct people to the website? LOL',
    usage: 'sketch',
    website: 'https://www.bentobot.xyz/commands#sketch',
    run: async (client, message, args): Promise<any> => {
        // for all settings we need an option to just reset to default (which is make the table value null/empty, so it uses default here)

        // we need a command to delete/reset the whole profile, where it just deletes the row in the db.

        // perhaps we should try to use case instead of if else to make things more smooth for all the potential settings
        // remember to check if they got a record in the table for every command

        // we also need an overall reset, where you need to confirm before it proceeds
        // perhaps get inspiration from the case delete feature where you need to confirm a case delete

        switch (args[0]) {
            case 'pic':
            case 'picture':
            case 'image':
            case 'bgpic': await setBackgroundURL(message, args.slice(1).join(" "))
            break;
            case 'bgcolour':
            case 'bgcolor': switch (args[1]) {
                case 'colour':
                case 'color': await setBackgroundColour(message, args[2])
                break;
                case 'opacity': await setBackgroundColourOpacity(message, args[2])
            }
        }

        // check the list in ./rank.ts when adding arguments

        async function setBackgroundURL (message: Message, background: string) {
            return message.channel.send('https://github.com/thebentobot')
        }

        async function setBackgroundColour (message: Message, colour: string) {
            // remember to validate hex
            return message.channel.send('https://github.com/thebentobot')
        }

        async function setBackgroundColourOpacity (message: Message, opacity: string) {
            // remember to validate that opacity value is bigger than 0 and lower than 1.
            return message.channel.send('https://github.com/thebentobot')
        }
    }
}