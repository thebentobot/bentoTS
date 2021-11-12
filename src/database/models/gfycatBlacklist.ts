import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'

export interface gfycatBlacklistAttributes {
	id: number
	username: string
}

export type gfycatBlacklistPk = `id`
export type gfycatBlacklistId = gfycatBlacklist[gfycatBlacklistPk]
export type gfycatBlacklistOptionalAttributes = `id`
export type gfycatBlacklistCreationAttributes = Optional<gfycatBlacklistAttributes, gfycatBlacklistOptionalAttributes>

export class gfycatBlacklist
	extends Model<gfycatBlacklistAttributes, gfycatBlacklistCreationAttributes>
	implements gfycatBlacklistAttributes
{
	id!: number
	username!: string

	static initModel(sequelize: Sequelize.Sequelize): typeof gfycatBlacklist {
		gfycatBlacklist.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				username: {
					type: DataTypes.STRING,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `gfycatBlacklist`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `gfycatblacklist_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `gfycatblacklist_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `gfycatblacklist_username_uindex`,
						unique: true,
						fields: [{ name: `username` }],
					},
				],
			},
		)
		return gfycatBlacklist
	}
}
