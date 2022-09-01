import { DateTime } from 'luxon'

export const fromBahnExpertTimestamp = (bahnExpertTimestamp: string) => DateTime.fromISO(bahnExpertTimestamp)
export const toBahnExpertTimestamp = (timestamp: DateTime) => timestamp.toISO()
export const fromSQLTimestamp = (sqlTimestamp: string) => DateTime.fromFormat(sqlTimestamp, 'yyyy-LL-dd HH:mm:ss', { zone: 'UTC' })
export const toSQLTimestamp = (timestamp: DateTime) => timestamp.setZone('UTC').toFormat('yyyy-LL-dd HH:mm:ss')
export const bahnExpertToSQL = (bahnExpertTimestamp: string) => toSQLTimestamp(fromBahnExpertTimestamp(bahnExpertTimestamp))