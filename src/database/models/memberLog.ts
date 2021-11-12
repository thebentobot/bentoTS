import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface memberLogAttributes {
	guildID: bigint
	channel: bigint
}

export type memberLogPk = `guildID`
export type memberLogId = memberLog[memberLogPk]
export type memberLogCreationAttributes = Optional<memberLogAttributes, memberLogPk>

export class memberLog extends Model<memberLogAttributes, memberLogCreationAttributes> implements memberLogAttributes {
	guildID!: bigint
	channel!: bigint

	// memberLog belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof memberLog {
		memberLog.init(
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
				channel: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `memberLog`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `memberlog_channel_uindex`,
						unique: true,
						fields: [{ name: `channel` }],
					},
					{
						name: `memberlog_guildid_uindex`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
					{
						name: `memberlog_pk`,
						unique: true,
						fields: [{ name: `guildID` }],
					},
				],
			},
		)
		return memberLog
	}
}
