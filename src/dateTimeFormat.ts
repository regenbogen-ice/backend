import { DateTime } from 'luxon'

export const fromMarudorTimestamp = (marudorTimestamp: string) => DateTime.fromISO(marudorTimestamp)
export const toMarudorTimestamp = (timestamp: DateTime) => timestamp.toISO()
export const fromSQLTimestamp = (sqlTimestamp: string) => DateTime.fromFormat(sqlTimestamp, 'yyyy-LL-dd HH:mm:ss', { zone: 'UTC' })
export const toSQLTimestamp = (timestamp: DateTime) => timestamp.setZone('UTC').toFormat('yyyy-LL-dd HH:mm:ss')
export const marudorToSQL = (marudorTimeStamp: string) => toSQLTimestamp(fromMarudorTimestamp(marudorTimeStamp))