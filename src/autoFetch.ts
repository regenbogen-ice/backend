import { DateTime } from 'luxon'
import { info, debug } from './logger.js'
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
        if (process.env.DISABLE_AUTOFETCH == 'true') {
            debug(`Autofetch disabled.`)
        } else {
            info(`Autofetch running.`)
            rabbit.publish('fetch_train_numbers', { evaNumbers: staticConfig.AUTO_FETCH_EVA_NUMBERS })
        }
    }
    setTimeout(autoFetch, 1000 * 60)
}