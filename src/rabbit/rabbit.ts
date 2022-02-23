import { Rabbit } from 'rabbit-queue'
import { fetch_coach_sequence } from './fetch_coach_sequence.js'
import { fetch_train_numbers } from './fetch_train_numbers.js'

export const rabbit = new Rabbit(process.env.RABBIT_URL || 'amqp://localhost')

// TODO logger

rabbit.on('connected', () => {
    console.log('Rabbit connected')
})

rabbit.on('disconnect', (err = new Error(`Rabbitmq disconnected.`)) => {
    console.error(err)
    setTimeout(() => rabbit.reconnect(), 100)
})

rabbit.on('log', (component, level, ...args) => {
    // TODO logger
    if (level != 'debug') console.log(`[${level}] ${component}`, ...args)
})

await rabbit.createQueue('fetch_train_numbers', {}, fetch_train_numbers)
await rabbit.createQueue('fetch_coach_sequence', {}, fetch_coach_sequence)
