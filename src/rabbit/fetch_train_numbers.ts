import { DateTime } from 'luxon'
import database from '../database.js'
import { marudorToSQL } from '../dateTimeFormat.js'
import { getIRISDepartures } from '../fetcher/marudor.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'
import staticConfig from '../staticConfig.js'
import { rabbit } from './rabbit.js'

type FetchTrainNumbersData = { evaNumbers: number[] }
export const fetch_train_numbers = rabbitAsyncHandler(async (msg: FetchTrainNumbersData) => {
    const alreadyFetched: string[] = []
    for (const evaNumber of msg.evaNumbers) {
        const departuresResponse = await getIRISDepartures(evaNumber, staticConfig.IRIS_LOOKAHEAD)
        if (!departuresResponse) {
            // TODO: error
            continue
        }
        const departures = departuresResponse.departures.filter(e =>
            staticConfig.FETCHABLE_TRAIN_TYPES.includes(e.train.type) && !e.cancelled && e.reihung && !e.substitute && e.departure && !alreadyFetched.includes(e.train.name))
        for(const train of departures) {
            alreadyFetched.push(train.train.name)
            const existingTrain = await database('train_trip').where({
                train_type: train.train.type,
                train_number: +train.train.number,
                initial_departure: marudorToSQL(train.initialDeparture)
            }).select('id')
            let trainId = null
            if (existingTrain.length > 0) {
                trainId = existingTrain[0].id
                const trainTripVehicles = await database('train_trip_vehicle').where({ train_trip_id: trainId }).select('id')
                if (trainTripVehicles.length > 0) {
                    continue
                }
            } else {
                const databaseTrain = await database('train_trip').insert({
                    train_type: train.train.type,
                    train_number: +train.train.number,
                    initial_departure: marudorToSQL(train.initialDeparture)
                })
                trainId = databaseTrain[0]
            }

            await rabbit.publish('fetch_coach_sequence', {
                trainId,
                trainNumber: +train.train.number,
                trainType: train.train.type,
                initialDeparture: train.initialDeparture,
                evaDeparture: train.departure.scheduledTime,
                evaNumber
            })
            await rabbit.publish('fetch_train_details', {
                trainId,
                trainNumber: +train.train.number,
                trainType: train.train.type,
                initialDeparture: train.initialDeparture
            })
        }
    }
})