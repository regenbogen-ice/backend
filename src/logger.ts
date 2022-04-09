import {Shoutrrr } from 'shoutrrrd-js'
import dotenv from 'dotenv'
import { DateTime } from 'luxon'

dotenv.config()

export const LogLevels: { [level: string]: number } = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4,
}
const minimalShoutrrrLogLevel = LogLevels[(process.env.SHOUTRRR_MIN_LOGLEVEL || 'WARN').toUpperCase()]
const minimalConsoleLogLevel = LogLevels[(process.env.MINIMAL_CONSOLE_LOG_LEVEL || 'INFO').toUpperCase()]


const shoutrrr = process.env.SHOUTRRR_API_URL && process.env.SHOUTRRR_SERVICE_NAME ? new Shoutrrr(process.env.SHOUTRRR_API_URL) : null

let maxLogLevelLength = 0
Object.keys(LogLevels).forEach(e => e.length > maxLogLevelLength ? maxLogLevelLength = e.length : null)

const logShoutrrr = async (content: string) => {
    if (shoutrrr) {
        await shoutrrr.send(process.env.SHOUTRRR_SERVICE_NAME!, content)
    }
}

export const log = (level: string, message: string) => {
    level = level.toUpperCase()
    if (!Object.keys(LogLevels).includes(level)) {
        throw new Error(`LogLevel ${level} doesn't exists, so log message could not be sent.`)
    }
    const levelNumber = LogLevels[level]
    const sendingContent = `${level.toUpperCase().padEnd(maxLogLevelLength)} [${DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')}] ${message}`
    if (levelNumber >= minimalConsoleLogLevel) console.log(sendingContent)
    if (levelNumber >= minimalShoutrrrLogLevel) logShoutrrr(sendingContent).catch(error => console.error(`Error ${error} happend while sending message to shoutrrr.`))
}

export const debug = (message: string) => log('DEBUG', message)
export const info = (message: string) => log('INFO', message)
export const warn = (message: string) => log('WARN', message)
export const error = (message: string) => log('ERROR', message)
export const critical = (message: string) => log('CRITICAL', message)