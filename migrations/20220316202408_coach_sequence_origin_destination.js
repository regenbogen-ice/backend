/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.alterTable('train_trip_vehicle', table => {
      table.integer('origin')
      table.integer('destination')
    })
    await knex.schema.alterTable('train_trip_vehicle_change', table => {
        table.integer('origin')
        table.integer('destination')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.alterTable('train_trip_vehicle', table => {
        table.dropColumn('origin')
        table.dropColumn('destination')
      })
      await knex.schema.alterTable('train_trip_vehicle_change', table => {
        table.dropColumn('origin')
        table.dropColumn('destination')
      })
  }
  