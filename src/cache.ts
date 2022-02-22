import redis from './redis'

export class Cache {
    local_cache: { [key: string]: any }
    constructor (private namespace: string, private ttl: number) {
        this.local_cache = {}
    }

    async get (key: string): Promise<null|any> {
        if (redis) {
            const redisResponse = await redis.get(`${this.namespace}_${key}`)
            if (redisResponse) {
                return JSON.parse(redisResponse)
            }
        } else {
            const { die, value } = this.local_cache[key]
            if (die) {
                if (die < Date.now()) {
                    return value
                } else {
                    delete this.local_cache[key]
                }
            }
        }
    }

    async set (key: string, value: any, ttl?: number=undefined) {
        if (!ttl) {
            ttl = this.ttl
        }
        if (redis) {
            await redis.set(`${this.namespace}_${key}`, JSON.stringify(value), { EX: ttl })
        } else {
            this.local_cache[key] = { die: Date.now() + ttl * 1000, value }
        }
    }

    async remove (key: string) {
        if (redis) {
            await redis.del(`${this.namespace}_${key}`)
        } else {
            delete this.local_cache[key]
        }
    }
}