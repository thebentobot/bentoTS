import { Client, Collection } from 'discord.js';
const { Sequelize } = require('sequelize');
import path from 'path';
import { readdirSync } from 'fs';
import { Command, Event, Config } from '../interfaces';
import ConfigJson from '../../config.json'

class ExtendedClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public event: Collection<string, Event> = new Collection();
    public config: Config = ConfigJson;
    public aliases: Collection<string, Command> = new Collection();

    public async init() {
        this.login(this.config.token);
        const db = new Sequelize(this.config.postgreSQL)
        try {
            await db.authenticate();
            console.log('Connection to the database has been established successfully.');
          } catch (error) {
            console.error('Unable to connect to the database:', error);
        }

        // commands
        const commandPath = path.join(__dirname, '..', 'commands');
        readdirSync(commandPath).forEach((dir) => {
            const commands = readdirSync(`${commandPath}/${dir}`).filter((file) => file.endsWith('.ts'));

            for (const file of commands) {
                const { command } = require(`${commandPath}/${dir}/${file}`);
                this.commands.set(command.name, command);

                if(command?.aliases.length !== 0) {
                    command.aliases.forEach((alias) => {
                        this.aliases.set(alias, command);
                    });
                }
            }
        });

        // events
        const eventPath = path.join(__dirname, '..', 'events');
        readdirSync(eventPath).forEach(async (file) => {
            const { event } = await import(`${eventPath}/${file}`);
            this.event.set(event.name, event);
            console.log(event);
            this.on(event.name, event.run.bind(null, this));
        });
    }
}

export default ExtendedClient