import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { user, userId } from './user'

export interface lastfmAttributes {
	userID: bigint
	lastfm: string
}

export type lastfmPk = `userID`
export type lastfmId = lastfm[lastfmPk]
export type lastfmCreationAttributes = Optional<lastfmAttributes, lastfmPk>

export class lastfm extends Model<lastfmAttributes, lastfmCreationAttributes> implements lastfmAttributes {
	userID!: bigint
	lastfm!: string

	// lastfm belongsTo user via userID
	user!: user
	getUser!: Sequelize.BelongsToGetAssociationMixin<user>
	setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>
	createUser!: Sequelize.BelongsToCreateAssociationMixin<user>

	static initModel(sequelize: Sequelize.Sequelize): typeof lastfm {
		lastfm.init(
			{
				userID: {
					type: DataTypes.BIGINT,
					allowNull: false,
					primaryKey: true,
					references: {
						model: `user`,
						key: `userID`,
					},
				},
				lastfm: {
					type: DataTypes.STRING(255),
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `lastfm`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `lastfm_pk`,
						unique: true,
						fields: [{ name: `userID` }],
					},
					{
						name: `lastfm_userid_uindex`,
						unique: true,
						fields: [{ name: `userID` }],
					},
				],
			},
		)
		return lastfm
	}
}
