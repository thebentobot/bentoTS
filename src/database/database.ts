import { Sequelize } from 'sequelize';
import ConfigJson from '../../config.json';

const database = new Sequelize(ConfigJson.postgreSQL, {
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false
});

export default database;