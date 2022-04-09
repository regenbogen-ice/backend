import { createClient } from 'redis'
import { debug, error } from './logger.js'

const client = createClient({
    url: process.env.REDIS_URL
})

client.on('error', (err) => error(`Redis error: ${err}`))

await client.connect()
debug(`Redis ${process.env.REDIS_URL} connected.`)


export default client