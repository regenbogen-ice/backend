import { DateTime } from 'luxon'
import database from '../database.js'
import { marudorToSQL } from '../dateTimeFormat.js'
import { getIRISDepartures } from '../fetcher/marudor.js'
import { debug, error } from '../logger.js'
import rabbitAsyncHandler from '../rabbitAsyncHandler.js'
import staticConfig from '../staticConfig.js'
import { rabbit } from './rabbit.js'

type FetchTrainNumbersData = { evaNumbers: number[] }
export const fetch_train_numbers = rabbitAsyncHandler(async (msg: FetchTrainNumbersData) => {
    const alreadyFetched: string[] = []
    for (const evaNumber of msg.evaNumbers) {
        const departuresResponse = await getIRISDepartures(evaNumber, staticConfig.IRIS_LOOKAHEAD)
        if (!departuresResponse) {
            error(`getIRISDepartures for evaNumber ${evaNumber} failed. The function returned null.`)
            continue
        }
        const allDepartures = departuresResponse.departures
        allDepartures.concat(Object.values(departuresResponse.wings))
        const departures = allDepartures.filter(e =>
            staticConfig.FETCHABLE_TRAIN_TYPES.includes(e.train.type) && e.reihung && !e.substitute && e.departure && !alreadyFetched.includes(e.train.name))
        debug(`Fetched ${departures.length} train_trips on evaNumber ${evaNumber}.`)
        for(const train of departures) {
            alreadyFetched.push(train.train.name)
            if (train.cancelled) {
                debug(`${train.train.name} was cancelled.`)
                await database('train_trip').where({
                    train_type: train.train.type,
                    train_number: +train.train.number,
                    initial_departure: marudorToSQL(train.initialDeparture)    
                }).delete()
                continue
            }
            const existingTrain = await database('train_trip').where({
                train_type: train.train.type,
                train_number: +train.train.number,
                initial_departure: marudorToSQL(train.initialDeparture)
            }).select(['id', 'routes_update_expire', 'coach_sequence_update_expire'])
            let trainId = null
            let fetch_coaches = true
            let fetch_details = true
            if (existingTrain.length > 0) {
                trainId = existingTrain[0].id
                debug(`Train_trip ${trainId} already exists.`)
                if (existingTrain[0].coach_sequence_update_expire && DateTime.fromJSDate(existingTrain[0].coach_sequence_update_expire) > DateTime.now()) {
                    fetch_coaches = false
                }
                if (existingTrain[0].routes_update_expire && DateTime.fromJSDate(existingTrain[0].routes_update_expire) > DateTime.now()) {
                    fetch_details = false
                }
            } else {
                const databaseTrain = await database('train_trip').insert({
                    train_type: train.train.type,
                    train_number: +train.train.number,
                    initial_departure: marudorToSQL(train.initialDeparture)
                })
                trainId = databaseTrain[0]
                debug(`Created train_trip ${trainId}.`)
            }
            if (fetch_coaches)
                await rabbit.publish('fetch_coach_sequence', {
                    trainId,
                    trainNumber: +train.train.number,
                    trainType: train.train.type,
                    evaDeparture: train.departure.scheduledTime,
                    evaNumber
                })
            if (fetch_details)
                await rabbit.publish('fetch_train_details', {
                    trainId,
                    trainNumber: +train.train.number,
                    trainType: train.train.type,
                    initialDeparture: train.initialDeparture,
                    evaNumber
                })
        }
    }
})