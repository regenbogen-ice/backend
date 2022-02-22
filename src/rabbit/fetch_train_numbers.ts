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
        console.log(departuresResponse.departures.length)
        const departures = departuresResponse.departures.filter(e =>
            staticConfig.FETCHABLE_TRAIN_TYPES.includes(e.train.type) && !e.cancelled && e.reihung && !e.substitute && e.departure && !alreadyFetched.includes(e.train.name))
        departures.forEach(t => {
            rabbit.publish('fetch_coach_sequence', { trainNumber: +t.train.number, train_type: t.train.type, departure: t.departure.time })
            alreadyFetched.push(t.train.name)
        })
    }
})