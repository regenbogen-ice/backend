import redis from './redis.js'

export class Cache {
    constructor (private namespace: string, private ttl: number) { }

    async get (key: string): Promise<null|any> {
        const redisResponse = await redis.get(`${this.namespace}_${key}`)
        if (redisResponse) {
            return JSON.parse(redisResponse)
        }

    }

    async set (key: string, value: any, ttl?: number) {
        if (!ttl) {
            ttl = this.ttl
        }
        await redis.set(`${this.namespace}_${key}`, JSON.stringify(value), { EX: ttl })
    }

    async remove (key: string) {
        await redis.del(`${this.namespace}_${key}`)
    }
}