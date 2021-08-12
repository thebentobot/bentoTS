import { Event } from "../interfaces";
import database from '../database/database';
import { guildMember, initModels, user } from '../database/models/init-models';
import { User } from "discord.js";

export const event: Event = {
    name: 'userUpdate',
    run: async (client, oldUser: User, newUser: User): Promise<any> => {
        initModels(database);

        await user.update({discriminator: newUser.discriminator, username: newUser.username, avatarURL: newUser.avatarURL()}, {where: {userID: oldUser.id}})
    }
}