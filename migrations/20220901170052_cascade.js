/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex.schema.table('train_trip_vehicle', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip').onDelete('CASCADE')
        table.dropForeign('train_vehicle_id')
        table.foreign('train_vehicle_id').references('id').inTable('train_vehicle').onDelete('CASCADE')
    })

    await knex.schema.table('train_trip_route', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip').onDelete('CASCADE')
    })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
      await knex.schema.table('train_trip_vehicle', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip')
        table.dropForeign('train_vehicle_id')
        table.foreign('train_vehicle_id').references('id').inTable('train_vehicle')
      })

      await knex.schema.table('train_trip_route', table => {
        table.dropForeign('train_trip_id')
        table.foreign('train_trip_id').references('id').inTable('train_trip').onDelete('CASCADE')
    })
  }
  