import { DateTime } from 'luxon'
import database from '../database.js'
import { bahnExpertToSQL, toSQLTimestamp } from '../dateTimeFormat.js'
import { getTrainDetails } from '../fetcher/bahn_expert.js'
import { debug } from '../logger.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'

type FetchTrainDetails = { trainId: number, trainNumber: number, trainType: number, initialDeparture: string, evaNumber: number }

export const fetch_train_details = rabbitAsyncHandler(async (msg: FetchTrainDetails) => {
    if (DateTime.fromISO(msg.initialDeparture) < DateTime.now().startOf('day') ) {
        // this is a temporaly fix until HAFAS is working again
        throw new Error(`Currently there is a HAFAS problem so hafas doesn't respond on trips whose initial departures are yesterday or earlier.`)
    }
    const trainDetails = await getTrainDetails(msg.trainType + String(msg.trainNumber), msg.evaNumber, msg.initialDeparture)
    if (!trainDetails) return
    if (trainDetails.cancelled) {
        debug(`${msg.trainId} was cancelled.`)
        await database('train_trip').where({ id: msg.trainId }).delete()
        return
    }
    const stops = trainDetails.stops.map((stop, index) => {
        return {
            train_trip_id: msg.trainId,
            index,
            cancelled: stop.cancelled,
            station: +stop.station.id,
            scheduled_departure: stop.departure ? bahnExpertToSQL(stop.departure.scheduledTime) : null,
            departure: stop.departure ?  bahnExpertToSQL(stop.departure.time) : null,
            departure_delay: stop.departure ? stop.departure.delay : null,
            scheduled_arrival: stop.arrival ? bahnExpertToSQL(stop.arrival.scheduledTime) : null,
            arrival: stop.arrival ? bahnExpertToSQL(stop.arrival.time) : null,
            arrival_delay: stop.arrival ? stop.arrival.delay : null,
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
                    departure_delay: newStop.departure_delay,
                    arrival: newStop.arrival,
                    arrival_delay: newStop.arrival_delay,
                    updated: toSQLTimestamp(DateTime.now())
                })
            }
        }
    }
    await database('train_trip').where({ id: msg.trainId }).update({ routes_update_expire: toSQLTimestamp(DateTime.now().plus({ minutes: 20 })) })

})