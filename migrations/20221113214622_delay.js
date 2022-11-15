/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.alterTable('train_trip_route', table => {
        table.integer('arrival_delay')
        table.integer('departure_delay')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
    await knex.schema.alterTable('train_trip_route', table => {
        table.dropColumn('arrival_delay')
        table.dropColumn('departure_delay')
    })
  }
  