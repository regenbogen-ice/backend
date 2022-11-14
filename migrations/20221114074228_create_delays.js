import { DateTime } from 'luxon'
import { toSQLTimestamp } from '../dist/src/dateTimeFormat.js'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 export const up = async (knex) => {
    const since = DateTime.now().minus({ months: 3 })
    const routes = await knex('train_trip_route')
        .where(builder => {
            builder.where('scheduled_departure', '>', toSQLTimestamp(since))
                .orWhere('scheduled_arrival', '>', toSQLTimestamp(since))
        })
        .andWhere(builder => {
            builder.whereNull('arrival_delay')
                .whereNull('departure_delay')
        })
        .select(['id', 'scheduled_arrival', 'arrival', 'scheduled_departure', 'departure'])
    for (const route of routes) {
        let u = {}
        if (route.scheduled_arrival && route.arrival) {
            u['arrival_delay'] = DateTime.fromJSDate(route.arrival).diff(DateTime.fromJSDate(route.scheduled_arrival)).as('minutes')
        }
        if (route.scheduled_departure && route.departure) {
            u['departure_delay'] = DateTime.fromJSDate(route.departure).diff(DateTime.fromJSDate(route.scheduled_departure)).as('minutes')
        }
        await knex('train_trip_route').where({ id: route.id }).update(u)
    }
    console.log(`Run create_delays migration for ${routes.length} routes.`)
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export const down = async (knex) => {
    
  }
  