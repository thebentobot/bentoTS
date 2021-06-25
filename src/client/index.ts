import { Client, Collection } from 'discord.js';
import database from '../database/database';
import path from 'path';
import { readdirSync } from 'fs';
import { Command, Event } from '../interfaces';
import * as dotenv from "dotenv";
dotenv.config();

const ascii = require('ascii-table');

class ExtendedClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public event: Collection<string, Event> = new Collection();
    public aliases: Collection<string, Command> = new Collection();
    public categories: Collection<string, Command> = new Collection();

    public async init() {
        this.login(process.env.token);
        try {
            await database.authenticate();
            console.log('Connection to the database has been established successfully.');
          } catch (error) {
            console.error('Unable to connect to the database:', error);
        }

        // commands
        const commandPath = path.join(__dirname, '..', 'commands');
        const table = new ascii().setHeading('Command', 'Status');
        readdirSync(commandPath).forEach((dir) => {
            const commands = readdirSync(`${commandPath}/${dir}`).filter((file) => file.endsWith('.ts'));

            for (const file of commands) {
                const { command } = require(`${commandPath}/${dir}/${file}`);
                const pull = this.commands.set(command.name, command);

                // categories
                this.categories.set(command.category, command.category)

                if (pull) {
                    table.addRow(file, '✅ Loaded!');
                } else {
                    table.addRow(file, '❌ -> Command failed to load, please check your work again!');
                    continue;
                }

                if(command?.aliases.length !== 0) {
                    command.aliases.forEach((alias: string) => {
                        this.aliases.set(alias, command);
                    });
                }
            }
            console.log(table.toString());
        });

        // events
        const eventPath = path.join(__dirname, '..', 'events');
        readdirSync(eventPath).forEach(async (file) => {
            const { event } = await import(`${eventPath}/${file}`);
            this.event.set(event.name, event);
            console.log('The ' + event.name + ' event is ready');
            this.on(event.name, event.run.bind(null, this));
        });
    }
}

export default ExtendedClient