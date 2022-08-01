/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.alterTable('train_vehicle', table => {
        table.setNullable('building_series')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.alterTable('train_trip_vehicle', table => {
        table.dropNullable('building_series')
      })
  }
  