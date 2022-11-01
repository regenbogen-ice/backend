/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.table('train_vehicle', table => {
        table.string('building_series_name', 255)
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.table('train_vehicle', table => {
        table.dropColumn('building_series_name')
      })
  }
  