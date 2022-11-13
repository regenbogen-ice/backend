/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.alterTable('coach', table => {
        table.dropForeign('coach_sequence_id')
        table.integer('coach_sequence_id').unsigned().alter()
        table.integer('index').alter()
        table.foreign('coach_sequence_id').references('id').inTable('coach_sequence')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.alterTable('coach', table => {
        table.dropForeign('coach_sequence_id')
        table.integer('coach_sequence_id').unsigned().notNullable().alter()
        table.integer('index').notNullable().alter()
        table.foreign('coach_sequence_id').references('id').inTable('coach_sequence')
      })
  }
  