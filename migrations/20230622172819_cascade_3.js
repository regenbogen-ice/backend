/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
    await knex.schema.table('train_trip_coaches_identification', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip').onDelete('CASCADE')
        table.dropForeign('coach_id')
        table.foreign('coach_id').references('id').inTable('coach').onDelete('CASCADE')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.table('train_trip_coaches_identification', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip')
        table.dropForeign('coach_id')
        table.foreign('coach_id').references('id').inTable('coach')
      })
  }
  