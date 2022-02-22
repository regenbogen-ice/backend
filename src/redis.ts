import { createClient } from 'redis'

const client = createClient({
    url: process.env.REDIS_URL
})

// TODO logger
client.on('error', (err) => console.error(`Redis error: ${err}`))

await client.connect()


export default client