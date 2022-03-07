/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.schema.alterTable('train_trip', table => {
    table.timestamp('routes_update_expire')
    table.timestamp('coach_sequence_update_expire')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
    await knex.schema.alterTable('train_trip', table => {
      table.dropColumn('routes_update_expire')
      table.dropColumn('coach_sequence_update_expire')
    })
}
