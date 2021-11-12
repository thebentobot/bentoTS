import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface muteRoleAttributes {
	guildID: bigint
	roleID: bigint
}

export type muteRolePk = `guildID`
export type muteRoleId = muteRole[muteRolePk]
export type muteRoleCreationAttributes = Optional<muteRoleAttributes, muteRolePk>

export class muteRole extends Model<muteRoleAttributes, muteRoleCreationAttributes> implements muteRoleAttributes {
	guildID!: bigint
	roleID!: bigint

	// muteRole belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof muteRole {
		muteRole.init(
			{
				guildID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
					references: {
						model: `guild`,
						key: `guildID`,
					},
				},
				roleID: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `muteRole`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `muterole_guildid_uindex`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
					{
						name: `muterole_pk`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
					{
						name: `muterole_role_uindex`,
						unique: true,
						fields: [{ name: `roleID` }],
					},
				],
			},
		)
		return muteRole
	}
}
