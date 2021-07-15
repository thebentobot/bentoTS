import { QueryTypes } from "sequelize";
//import { lt } from "sequelize/types/lib/operators";
import Client from '../client/index';
import database from "../database/database";
import { mute } from "../database/models/mute";
import { muteRole } from "../database/models/muteRole";

export async function checkMutes() {
    
    interface muteDataTypes {
        guildID: bigint,
        userID: bigint
    }

    const unmutes: Array<muteDataTypes> = await database.query(`
    SELECT *
    FROM mute
    WHERE mute."muteEnd" < now() AND mute."MuteStatus" = true AND "muteEnd" != null;`, {
        type: QueryTypes.SELECT
    })
    
    //const now = new Date()

    //const unmutes = await mute.findAll({raw: true, where: { muteEnd: {[lt]: now}, MuteStatus: true }})

    if (unmutes && unmutes) {
        for (const unmute of unmutes) {

            const guild = new Client().guilds.cache.get(`${unmute.guildID}`)
            const member = (await guild.members.fetch()).get(`${unmute.userID}`)

            const muteRoleData = await muteRole.findOne({raw: true, where: {guildID: unmute.guildID}})
            const role = guild.roles.cache.get(`${muteRoleData.roleID}`)
            await member.roles.remove(role)
            await mute.update({MuteStatus: false}, {where: {userID: unmute.userID, guildID: unmute.guildID, MuteStatus: true}})
        }
    }
    //console.log('checkMute TRIGGERED')
}