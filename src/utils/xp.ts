import database from '../database/database';
import { initModels, guildMember, user } from '../database/models/init-models';

const cooldown = new Set();

export async function addXpServer(guildID: string, userID: string, xpToAdd: number): Promise<any> {
    initModels(database);

    if (cooldown.has(userID)) {
        return
    }

    const result = await guildMember.increment('xp', {by: xpToAdd, where: {guildID: guildID, userID: userID}});
    let { xp, level } = result
    const getNeededXP = (level: number) => level * level * 100;
    const needed = getNeededXP(level)
    if (xp >= needed) {
        xp -= needed
        await guildMember.increment('level', {where: {guildID: guildID, userID: userID}});
        // increment is used instead of decrement because sequelize hasn't updated the TypeScript definition for the decrement method
        // https://github.com/sequelize/sequelize/issues/12792
        await guildMember.increment('xp', {by: -xp, where: {guildID: guildID, userID: userID}});
    }

    cooldown.add(userID);
    setTimeout(() => {
        cooldown.delete(userID)
    }, 60000) // 1 minute
}

export async function addXpGlobal(userID: string, xpToAdd: number): Promise<any> {
    initModels(database);

    if (cooldown.has(userID)) {
        return
    }

    const result = await user.increment('xp', {by: xpToAdd, where: {userID: userID}});
    let { xp, level } = result
    const getNeededXP = (level: number) => level * level * 100;
    const needed = getNeededXP(level)
    if (xp >= needed) {
        xp -= needed
        await user.increment('level', {where: {userID: userID}});
        // increment is used instead of decrement because sequelize hasn't updated the TypeScript definition for the decrement method
        // https://github.com/sequelize/sequelize/issues/12792
        await user.increment('xp', {by: -xp, where: {userID: userID}});
    }

    
    cooldown.add(userID);
    setTimeout(() => {
        cooldown.delete(userID)
    }, 60000) // 1 minute
}