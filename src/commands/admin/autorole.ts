// remember to insert it's functionality in guildMemberAdd
import { Command } from '../../interfaces';
import database from '../../database/database';
import { initModels, autoRole, autoRoleCreationAttributes, guild } from '../../database/models/init-models';

export const command: Command = {
    name: 'autorole',
    aliases: [],
    category: 'admin',
    description: 'Set an auto role that users get assigned automatically when they join',
    usage: ' is the prefix\nautoRole <status>\nautoRole set <roleID>\nautoRole delete <roleID>\nautoRole list',
    run: async (client, message, args): Promise<any> => {
        if (!message.member.hasPermission('MANAGE_GUILD')) {
            return message.channel.send('You do not have permission to use this command!').then(m => m.delete({timeout: 10000}));
        };

        initModels(database);

        const guildData = await guild.findOne({raw:true, where: {guildID: message.guild.id}});

        if (args.length < 1) {
            return message.channel.send(`You must specify what you want to do with the auto role settings.\nUse \`${guildData.prefix}help autorole\` to see how to use this command.`);
        };

        if (args[0] == 'status') {
            try {
                const autoRoleData = await autoRole.findOne({raw: true, where: {guildID: message.guild.id}});
                return message.channel.send(`
            Auto role is currently \`${autoRoleData ? 'Enabled' : 'Disabled'}\` on this server.`);
            } catch {
                return message.channel.send(`This server doesn't have a auto role.\nUse \`${guildData.prefix}help autorole\` to see how to setup a auto role for this server.`)
            }
        }

        if (args[0] == 'set') {
            if (!args[1]) return message.channel.send('Please assign a role id as the second argument');
            let regExp = /[a-zA-Z]/g;
            let role = args[1]
            if (regExp.test(role) == true) return message.channel.send(`Your role id ${args[1]} was invalid.\nPlease use a valid role id.`);
            console.log(role)
            const attr: autoRoleCreationAttributes = {
                guildID: BigInt(message.guild.id),
                roleID: BigInt(role)
            }
            console.log(attr)
            await autoRole.create(attr);
            return message.channel.send(`Your role <@&${role}> was set as an auto role.\nTo see a list of your auto roles use ${guildData.prefix}autorole list`); 
        }

        if (args[0] == 'delete') {
            message.channel.send(`Your auto role <@&${args[1]}> is now deleted in Bento's database and Bento will from now on not assign new users with that role.\nPlease use ${guildData.prefix}autorole set <roleID> to set an auto role again.`);
            await autoRole.destroy({where: { roleID: args[1], guildID: message.guild.id}});
        }

        if (args[0] == 'list') {
            const roles = await autoRole.findAll({where: { guildID: message.guild.id}});
            const iterator = roles.values();

            for (const value of iterator) {
                message.channel.send(`<@&${value.roleID}>`)
            }
        }
    }
}