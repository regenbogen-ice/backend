import { DateTime } from 'luxon'
import { info } from './logger.js'
import { rabbit } from './rabbit/rabbit.js'
import staticConfig from './staticConfig.js'

let fetchedHour: number | null = null

export const autoFetch = () => {
    const hour = DateTime.now().hour
    if (hour % 2 == 0 && fetchedHour != hour) {
        fetchedHour = hour
        info(`Autofetch running.`)
        rabbit.publish('fetch_train_numbers', { evaNumbers: staticConfig.AUTO_FETCH_EVA_NUMBERS })
    }
    setTimeout(autoFetch, 1000 * 60)
}