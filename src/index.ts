import { autoFetch } from './autoFetch.js'
import './rabbit/rabbit.js'
import Sentry from '@sentry/node'
import { startWebserver } from './metrics.js'

if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN })
    Sentry.setTag('environment', process.env.ENVIRONMENT || 'local')
}

autoFetch()
startWebserver()