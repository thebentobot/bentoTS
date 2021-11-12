import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'

export interface gfycatWordListAttributes {
	id: number
	word: string
}

export type gfycatWordListPk = `id`
export type gfycatWordListId = gfycatWordList[gfycatWordListPk]
export type gfycatWordListOptionalAttributes = `id`
export type gfycatWordListCreationAttributes = Optional<gfycatWordListAttributes, gfycatWordListOptionalAttributes>

export class gfycatWordList
	extends Model<gfycatWordListAttributes, gfycatWordListCreationAttributes>
	implements gfycatWordListAttributes
{
	id!: number
	word!: string

	static initModel(sequelize: Sequelize.Sequelize): typeof gfycatWordList {
		gfycatWordList.init(
			{
				id: {
					autoIncrement: true,
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
				},
				word: {
					type: DataTypes.STRING,
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `gfycatWordList`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `gfycatwordlist_id_uindex`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `gfycatwordlist_pk`,
						unique: true,
						fields: [{ name: `id` }],
					},
					{
						name: `gfycatwordlist_word_uindex`,
						unique: true,
						fields: [{ name: `word` }],
					},
				],
			},
		)
		return gfycatWordList
	}
}
