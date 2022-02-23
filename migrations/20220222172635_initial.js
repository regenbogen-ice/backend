/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// https://dbdiagram.io/d/61c8e8743205b45b73cd18c5

export const up = async (knex) => {
   await knex.schema.createTable('train_vehicle', (table) => {
       table.increments('id')
       table.integer('train_vehicle_number').notNullable().unique()
       table.string('train_vehicle_name', 255)
       table.string('train_type', 3).notNullable()
       table.integer('building_series').notNullable()
       table.timestamp('timestamp').defaultTo(knex.fn.now())
   }) 

   await knex.schema.createTable('train_trip', (table) => {
       table.increments('id')
       table.string('train_type', 3).notNullable()
       table.integer('train_number').notNullable()
       table.integer('origin_station')
       table.integer('destination_station')
       table.timestamp('initial_departure').notNullable()
       table.timestamp('timestamp').defaultTo(knex.fn.now())
       table.timestamp('updated').defaultTo(knex.fn.now())
   })

   await knex.schema.createTable('train_trip_route', (table) => {
       table.increments('id')
       table.integer('train_trip_id').unsigned().notNullable()
       table.foreign('train_trip_id').references('id').inTable('train_trip')
       table.integer('index').notNullable()
       table.boolean('canceled').notNullable().defaultTo(false)
       table.integer('station').notNullable()
       table.timestamp('scheduled_departure').notNullable()
       table.timestamp('departure').notNullable()
       table.timestamp('scheduled_arrival').notNullable()
       table.timestamp('arrival').notNullable()
   })

   await knex.schema.createTable('train_trip_vehicle', (table) => {
       table.increments('id')
       table.integer('train_vehicle_id').unsigned().notNullable()
       table.foreign('train_vehicle_id').references('id').inTable('train_vehicle')
       table.integer('train_trip_id').unsigned().notNullable()
       table.foreign('train_trip_id').references('id').inTable('train_trip')
       table.integer('group_index').notNullable()
       table.timestamp('timestamp').defaultTo(knex.fn.now())
   })

   await knex.schema.createTable('train_trip_vehicle_change', (table) => {
       table.increments('id')
       table.integer('train_vehicle_id').unsigned().notNullable()
       table.foreign('train_vehicle_id').references('id').inTable('train_vehicle')
       table.integer('train_trip_id').unsigned().notNullable()
       table.foreign('train_trip_id').references('id').inTable('train_trip')
       table.integer('group_index').notNullable()
       table.timestamp('timestamp').defaultTo(knex.fn.now())
       table.timestamp('original_timestamp').notNullable()
   })

   await knex.schema.createTable('coach_sequence', (table) => {
       table.increments('id')
       table.integer('train_vehicle_id').unsigned().notNullable()
       table.foreign('train_vehicle_id').references('id').inTable('train_vehicle')
       table.timestamp('timestamp').defaultTo(knex.fn.now())
   })

   await knex.schema.createTable('coach', (table) => {
       table.increments('id')
       table.integer('index').notNullable()
       table.integer('coach_sequence_id').unsigned().notNullable()
       table.foreign('coach_sequence_id').references('id').inTable('coach_sequence')
       table.string('uic', 12).notNullable()
       table.string('category')
       table.integer('class')
       table.string('type')
   })

   await knex.schema.createTable('train_trip_coaches_identification', (table) => {
       table.increments('id')
       table.integer('train_trip_id').unsigned().notNullable()
       table.foreign('train_trip_id').references('id').inTable('train_trip')
       table.integer('coach_id').unsigned().notNullable()
       table.foreign('coach_id').references('id').inTable('coach')
       table.integer('identification_number')
   })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

export const down = async (knex) => {
    
}
