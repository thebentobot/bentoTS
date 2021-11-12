import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface banAttributes {
	banCase?: number
	userID: bigint
	guildID: bigint
	date?: Date
	note?: string
	actor: bigint
	reason?: string
}

export type banPk = `banCase`
export type banId = ban[banPk]
export type banCreationAttributes = Optional<banAttributes, banPk>

export class ban extends Model<banAttributes, banCreationAttributes> implements banAttributes {
	banCase?: number
	userID!: bigint
	guildID!: bigint
	date?: Date
	note?: string
	actor!: bigint
	reason?: string

	// ban belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof ban {
		ban.init(
			{
				banCase: {
					autoIncrement: true,
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
				},
				userID: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
				guildID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					references: {
						model: `guild`,
						key: `guildID`,
					},
				},
				date: {
					type: DataTypes.DATE,
					allowNull: false,
					defaultValue: Sequelize.Sequelize.fn(`now`),
				},
				note: {
					type: DataTypes.STRING,
					allowNull: true,
				},
				actor: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
				reason: {
					type: DataTypes.STRING,
					allowNull: true,
				},
			},
			{
				sequelize,
				tableName: `ban`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `ban_mutecase_uindex`,
						unique: true,
						fields: [{ name: `banCase` }],
					},
					{
						name: `ban_pk`,
						unique: true,
						fields: [{ name: `banCase` }],
					},
				],
			},
		)
		return ban
	}
}
