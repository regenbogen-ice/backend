import { config } from 'dotenv'

config()


/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {

  development: {
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: process.env.MYSQL_PORT || '3306',
      database: process.env.MYSQL_DATABASE || 'regenbogenice',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: process.env.MYSQL_PORT || '3306',
      database: process.env.MYSQL_DATABASE || 'regenbogenice',
      user: process.env.MYSQL_USER || 'regenbogenice',
      password: process.env.MYSQL_PASSWORD,
    },
  }

};
