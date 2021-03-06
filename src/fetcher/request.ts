import fetch, { Response } from 'node-fetch'
import { Cache } from '../cache.js'
import { error } from '../logger.js'

export const ApiModule = {
    MARUDOR: process.env.MARUDOR_API_PATH || "https://marudor.de/api"
}

type ApiModuleType = string

const checkRequest = async (path: string, response: Response, ignoreStatusCodes?: number[]): Promise<any> => {
    if (ignoreStatusCodes?.includes(response.status)) {
        return null
    }
    if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Error while fetching ${path}: ${response.statusText}: ${await response.text()}`)
    }
    
    return await response.json()
}

export const request = async (
    apiModule: ApiModuleType,
    path: string,
    args: { [key: string]: string | null },
    options?: { ignoreStatusCodes?: number[], cache?: Cache, cacheTTL?: number, useGetArguments?: string[] }) => {
    for (const [argName, argValue] of Object.entries(args)) {
        if (path.includes(`[${argName}]`) && argValue) {
            path = path.replace(`[${argName}]`, argValue)
        }
    }
    if (options?.useGetArguments && options.useGetArguments.length > 0) {
        const getArguments: { [key: string]: string } = {}
        for (const getArgument of options.useGetArguments) {
            if (args[getArgument]) {
                getArguments[getArgument] = args[getArgument]!
            }
        }
        if (Object.keys(getArguments).length > 0)
            path = `${path}?${new URLSearchParams(getArguments)}`
    }
    path = `${apiModule}${path}`
    if (options?.cache) {
        const cachedResponse = await options.cache.get(path)
        if (cachedResponse) {
            return cachedResponse
        }
    }
    const response = await checkRequest(path, await fetch(path), options?.ignoreStatusCodes)
    if (response && options?.cache) {
        options.cache.set(path, response, options.cacheTTL).catch(e => error(`Error while caching ${path}: ${e}`))
    }
    return response
}