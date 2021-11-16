import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface announcementTimeAttributes {
	id: number
	guildID: bigint
	channelID: bigint
	message: string
	date: Date
	amountOfTime: number
	timeframe: string
}

export type announcementTimePk = `id`
export type announcementTimeId = announcementTime[announcementTimePk]
export type announcementTimeOptionalAttributes = `id` | `date` | `timeframe`
export type announcementTimeCreationAttributes = Optional<
	announcementTimeAttributes,
	announcementTimeOptionalAttributes
>

export class announcementTime
	extends Model<announcementTimeAttributes, announcementTimeCreationAttributes>
	implements announcementTimeAttributes
{
	id!: number
	guildID!: bigint
	channelID!: bigint
	message!: string
	date!: Date
	amountOfTime!: number
	timeframe!: string

	// announcementTime belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof announcementTime {
		announcementTime.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				guildID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					references: {
						model: `guild`,
						key: `guildID`,
					},
				},
				channelID: {
					type: DataTypes.BIGINT,
					allowNull: false,
				},
				message: {
					type: DataTypes.STRING,
					allowNull: false,
				},
				date: {
					type: DataTypes.DATE,
					allowNull: false,
				},
				amountOfTime: {
					type: DataTypes.INTEGER,
					allowNull: false,
				},
				timeframe: {
					type: DataTypes.STRING,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `announcementTime`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `announcementtime_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `announcementtime_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
				],
			},
		)
		return announcementTime
	}
}
