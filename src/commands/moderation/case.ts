import { Message } from 'discord.js';
import { Command } from '../../interfaces';

export const command: Command = {
    name: 'case',
    aliases: [],
    category: 'moderation',
    description: 'Link to the Bento GitHub organisation',
    usage: 'case',
    run: async (client, message, args): Promise<Message> => {
        if (args[0] === 'user') {
            // check a user, args 1 is the user, args 2 is global option
            return userCheck (message, args[1], args[2])
            // returns a list of a user's cases 
        }

        if (args[0] === 'check') {
            // check a case, args 1 is the case number
            return caseCheck (message, args[1])
            // only returns local cases, so you can't just check random cases for fun lol
            // returns one case
        }

        if (args[0] === 'edit') {
            // edit a case, args 1 is the case number
            return caseEdit (message, args[1])
            // only works with local cases, so you can't just edit random cases for fun lol
            // edits one case
        }

        if (args[0] === 'delete') {
            // delete a case, args 1 is the case number
            return caseDelete (message, args[1])
            // only works with local cases, so you can't just delete random cases for fun lol
            // deletes one case
        }

        if (args[0] === 'search') {
            // search after a case, args 1 is what type to search after (ban, warning etc.)
            // args 2 is the column to search in
            // args 3 is the query
            return caseSearch (message, args[1], args[2], args[3])
            // only works with local cases, so you can't just delete random cases for fun lol
            // deletes one case
        }

        if (args[0] === 'list') {
            // list of cases
            // no argument = all cases, sorted after the most recent first
            // args 1 = one of the types of cases (mute, kick), or overall
            // args 2 = dates (first date to be between)
            // args 3 = dates (first date to be between)
            return caseList (message, args[1], args[2], args[3])
            // only works with local cases, so you can't just delete random cases for fun lol
            // deletes one case
        }

        if (!args.length) {
            return message.channel.send(`No argument listed. Use the help command with case to see possible arguments.`)
        }

        async function userCheck (message: Message, user: string, global?: string): Promise<Message> {

        }

        async function caseCheck (message: Message, caseNumber: string): Promise<Message> {
            
        }

        async function caseEdit (message: Message, caseNumber: string): Promise<Message> {
            
        }

        async function caseDelete (message: Message, caseNumber: string): Promise<Message> {
            
        }

        async function caseSearch (message: Message, caseType: string, column: string, query: string): Promise<Message> {
            
        }

        async function caseList (message: Message, caseType: string, firstDate: string, secondDate: string): Promise<Message> {
            
        }
    }
}