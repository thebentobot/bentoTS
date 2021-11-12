import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface channelDisableAttributes {
	id: number
	guildID: bigint
	channelID: bigint
}

export type channelDisablePk = `id`
export type channelDisableId = channelDisable[channelDisablePk]
export type channelDisableOptionalAttributes = `id`
export type channelDisableCreationAttributes = Optional<channelDisableAttributes, channelDisableOptionalAttributes>

export class channelDisable
	extends Model<channelDisableAttributes, channelDisableCreationAttributes>
	implements channelDisableAttributes
{
	id!: number
	guildID!: bigint
	channelID!: bigint

	// channelDisable belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof channelDisable {
		channelDisable.init(
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
			},
			{
				sequelize,
				tableName: `channelDisable`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `channeldisable_channelid_uindex`,
						unique: true,
						fields: [{ name: `channelID` }],
					},
					{
						name: `channeldisable_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `channeldisable_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
				],
			},
		)
		return channelDisable
	}
}
