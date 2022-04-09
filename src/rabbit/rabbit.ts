import { Rabbit } from 'rabbit-queue'
import { error, info, log } from '../logger.js'
import { fetch_coach_sequence } from './fetch_coach_sequence.js'
import { fetch_train_details } from './fetch_train_details.js'
import { fetch_train_numbers } from './fetch_train_numbers.js'

export const rabbit = new Rabbit(process.env.RABBIT_URL || 'amqp://localhost')


rabbit.on('connected', () => {
    info(`Rabbit connected.`)
})

rabbit.on('disconnect', (err = new Error(`Rabbitmq disconnected.`)) => {
    error(`Disconnected from rabbit: ${err}. Trying to reconnect.`)
    setTimeout(() => rabbit.reconnect(), 100)
})

rabbit.on('log', (component, level, ...args) => {
    if (level != 'trace') log(level, `Rabbit: ${component} ${args.join(' ')}`)
})

await rabbit.createQueue('fetch_train_numbers', {}, fetch_train_numbers)
await rabbit.createQueue('fetch_coach_sequence', {}, fetch_coach_sequence)
await rabbit.createQueue('fetch_train_details', {}, fetch_train_details)
info(`Created rabbit queues.`)