import { DateTime } from 'luxon'
import { info } from './logger.js'
import { rabbit } from './rabbit/rabbit.js'
import staticConfig from './staticConfig.js'
import fetch from 'node-fetch'

let fetchedHour: number | null = null

export const autoFetch = () => {
    if (process.env.HEARTBEAT_URL)
        fetch(process.env.HEARTBEAT_URL)
    const hour = DateTime.now().hour
    if (fetchedHour != hour) {
        fetchedHour = hour
        info(`Autofetch running.`)
        rabbit.publish('fetch_train_numbers', { evaNumbers: staticConfig.AUTO_FETCH_EVA_NUMBERS })
    }
    setTimeout(autoFetch, 1000 * 60)
}