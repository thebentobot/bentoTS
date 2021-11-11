import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface caseGlobalAttributes {
	guildID: bigint;
	serverName: boolean;
	reason: boolean;
}

export type caseGlobalPk = `guildID`;
export type caseGlobalId = caseGlobal[caseGlobalPk];
export type caseGlobalOptionalAttributes = `guildID`;
export type caseGlobalCreationAttributes = Optional<caseGlobalAttributes, caseGlobalOptionalAttributes>;

export class caseGlobal
	extends Model<caseGlobalAttributes, caseGlobalCreationAttributes>
	implements caseGlobalAttributes
{
	guildID!: bigint
	serverName!: boolean
	reason!: boolean

	// caseGlobal belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof caseGlobal {
		caseGlobal.init(
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
				serverName: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
				reason: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `caseGlobal`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `caseglobal_guildid_uindex`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
					{
						name: `caseglobal_pk`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
				],
			},
		)
		return caseGlobal
	}
}
