import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface announcementScheduleAttributes {
	id: number
	guildID: bigint
	channelID: bigint
	message: string
	date: Date
}

export type announcementSchedulePk = `id`
export type announcementScheduleId = announcementSchedule[announcementSchedulePk]
export type announcementScheduleOptionalAttributes = `id` | `date`
export type announcementScheduleCreationAttributes = Optional<
	announcementScheduleAttributes,
	announcementScheduleOptionalAttributes
>

export class announcementSchedule
	extends Model<announcementScheduleAttributes, announcementScheduleCreationAttributes>
	implements announcementScheduleAttributes
{
	id!: number
	guildID!: bigint
	channelID!: bigint
	message!: string
	date!: Date

	// announcementSchedule belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof announcementSchedule {
		announcementSchedule.init(
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
			},
			{
				sequelize,
				tableName: `announcementSchedule`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `announcementschedule_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `announcementschedule_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
				],
			},
		)
		return announcementSchedule
	}
}
