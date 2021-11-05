import * as Sequelize from 'sequelize'
import { DataTypes, Model, Optional } from 'sequelize'
import type { user, userId } from './user'

export interface horoscopeAttributes {
	userID: bigint;
	horoscope:
		| `Aries`
		| `Taurus`
		| `Gemini`
		| `Cancer`
		| `Leo`
		| `Virgo`
		| `Libra`
		| `Scorpio`
		| `Sagittarius`
		| `Capricorn`
		| `Aquarius`
		| `Pisces`;
}

export type horoscopePk = `userID`;
export type horoscopeId = horoscope[horoscopePk];
export type horoscopeCreationAttributes = Optional<horoscopeAttributes, horoscopePk>;

export class horoscope extends Model<horoscopeAttributes, horoscopeCreationAttributes> implements horoscopeAttributes {
	userID!: bigint
	horoscope!:
		| `Aries`
		| `Taurus`
		| `Gemini`
		| `Cancer`
		| `Leo`
		| `Virgo`
		| `Libra`
		| `Scorpio`
		| `Sagittarius`
		| `Capricorn`
		| `Aquarius`
		| `Pisces`

	// horoscope belongsTo user via userID
	user!: user
	getUser!: Sequelize.BelongsToGetAssociationMixin<user>
	setUser!: Sequelize.BelongsToSetAssociationMixin<user, userId>
	createUser!: Sequelize.BelongsToCreateAssociationMixin<user>

	static initModel(sequelize: Sequelize.Sequelize): typeof horoscope {
		horoscope.init(
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
				horoscope: {
					type: DataTypes.ENUM(
						`Aries`,
						`Taurus`,
						`Gemini`,
						`Cancer`,
						`Leo`,
						`Virgo`,
						`Libra`,
						`Scorpio`,
						`Sagittarius`,
						`Capricorn`,
						`Aquarius`,
						`Pisces`,
					),
					allowNull: false,
				},
			},
			{
				sequelize,
				tableName: `horoscope`,
				schema: `public`,
				timestamps: false,
				indexes: [
					{
						name: `horoscope_pk`,
						unique: true,
						fields: [{ name: `userID` }],
					},
					{
						name: `horoscope_userid_uindex`,
						unique: true,
						fields: [{ name: `userID` }],
					},
				],
			},
		)
		return horoscope
	}
}
