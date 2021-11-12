import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { guild, guildId } from './guild'

export interface availableRolesGuildAttributes {
	role: string
	id?: number
	guildID: bigint
	type: `main` | `sub` | `other`
}

export type availableRolesGuildPk = `id`
export type availableRolesGuildId = availableRolesGuild[availableRolesGuildPk]
export type availableRolesGuildCreationAttributes = Optional<availableRolesGuildAttributes, availableRolesGuildPk>

export class availableRolesGuild
	extends Model<availableRolesGuildAttributes, availableRolesGuildCreationAttributes>
	implements availableRolesGuildAttributes
{
	role!: string
	id?: number
	guildID!: bigint
	type!: `main` | `sub` | `other`

	// availableRolesGuild belongsTo guild via guildID
	guild!: guild
	getGuild!: Sequelize.BelongsToGetAssociationMixin<guild>
	setGuild!: Sequelize.BelongsToSetAssociationMixin<guild, guildId>
	createGuild!: Sequelize.BelongsToCreateAssociationMixin<guild>

	static initModel(sequelize: Sequelize.Sequelize): typeof availableRolesGuild {
		availableRolesGuild.init(
			{
				role: {
					type: DataTypes.STRING,
					allowNull: false,
				},
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
				type: {
					type: DataTypes.ENUM(`main`, `sub`, `other`),
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `availableRolesGuild`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `availablerolesguild_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `availablerolesguild_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
				],
			},
		)
		return availableRolesGuild
	}
}
