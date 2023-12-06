import { DateTime } from 'luxon'
import fetch from 'node-fetch'
import database from './database.js'

const runHeartbeat = async () => {
    let heartbeatUrl = process.env.HEARTBEAT_URL
    const newestTrainTrip = await database('train_trip').whereNotNull('destination_station').orderBy('id', 'desc').first()

    if (newestTrainTrip) {
        const newestTrainTripHour = DateTime.now().diff(DateTime.fromJSDate(newestTrainTrip.timestamp)).as('hours')
        if (newestTrainTripHour > 6) {
            console.error(`The newest train trip in the database is about 6 hours (${newestTrainTripHour} hours) old. It seem's like the backend is broken. Try to restart.`)
            console.error('Heartbeat disabled because the backend seems to broken')
            heartbeatUrl = undefined // disable heartbeat
        }
    } else {
        console.warn('No full train trip does yet exist in the database')
    }

    if (heartbeatUrl) {
        fetch(heartbeatUrl)
    }
}

export default runHeartbeat