/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    await knex('train_vehicle').where({ train_type: 'IC' }).update({ train_type: 'ICK' })
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
    await knex('train_vehicle').where({ train_type: 'ICK' }).orWhere({ train_type: 'ICD' }).update({ train_type: 'IC' })
  }
  