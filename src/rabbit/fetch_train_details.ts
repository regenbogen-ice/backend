import { DateTime } from 'luxon'
import database from '../database.js'
import { marudorToSQL, toSQLTimestamp } from '../dateTimeFormat.js'
import { getTrainDetails } from '../fetcher/marudor.js'
import { debug } from '../logger.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'

type FetchTrainDetails = { trainId: number, trainNumber: number, trainType: number, initialDeparture: string, evaNumber: number }

export const fetch_train_details = rabbitAsyncHandler(async (msg: FetchTrainDetails) => {
    const trainDetails = await getTrainDetails(msg.trainType + String(msg.trainNumber), msg.evaNumber, msg.initialDeparture)
    if (!trainDetails) return
    const stops = trainDetails.stops.map((stop, index) => {
        return {
            train_trip_id: msg.trainId,
            index,
            cancelled: stop.cancelled,
            station: +stop.station.id,
            scheduled_departure: stop.departure ? marudorToSQL(stop.departure.scheduledTime) : null,
            departure: stop.departure ?  marudorToSQL(stop.departure.time) : null,
            scheduled_arrival: stop.arrival ? marudorToSQL(stop.arrival.scheduledTime) : null,
            arrival: stop.arrival ? marudorToSQL(stop.arrival.time) : null
        }
    })

    await database('train_trip').where({ id: msg.trainId }).update({ origin_station: stops[0].station, destination_station: stops[stops.length - 1].station})

    let trainTripRoutes = await database('train_trip_route').where({ train_trip_id: msg.trainId }).orderBy('index', 'asc').select('*')
    if (trainTripRoutes.length !== 0 && trainTripRoutes.length != stops.length) {
        debug(`Saved trip route of ${msg.trainId} length is invalid.`)
        await database('train_trip_route').where({ train_trip_id: msg.trainId }).delete()
        trainTripRoutes = []
    }

    if (trainTripRoutes.length === 0) {
        debug(`Trip route for ${msg.trainId} saved.`)
        await database('train_trip_route').insert(stops)
    } else {
        for (const stop of trainTripRoutes) {
            const newStop = stops[stop.index]
            if (
                stop.station != newStop.station ||
                stop.scheduled_departure != newStop.scheduled_departure ||
                stop.scheduled_arrival != newStop.scheduled_departure
            ) {
                debug(`Trip route for ${msg.trainId} saved because old list in invalid.`)
                await database('train_trip_route').where({ train_trip_id: msg.trainId }).delete()
                await database('train_trip_route').insert(stops)
                break
            }
            if (
                stop.cancelled != newStop.cancelled ||
                stop.departure != newStop.departure ||
                stop.arrival != newStop.arrival
            ) {
                debug(`Trip route for ${msg.trainId} updated (index ${stop.index}).`)
                await database('train_trip_route').where({ id: stop.id }).update({
                    cancelled: newStop.cancelled,
                    departure: newStop.departure,
                    arrival: newStop.arrival,
                    updated: toSQLTimestamp(DateTime.now())
                })
            }
        }
    }
    await database('train_trip').where({ id: msg.trainId }).update({ routes_update_expire: toSQLTimestamp(DateTime.now().plus({ minutes: 20 })) })

})