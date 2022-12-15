import { DateTime } from 'luxon'
import express from 'express'
import { info } from './logger.js'

const app = express()

type Metric = { [key: string]: number }
var metrics: { [key: number]: Metric } = {}

const METRICS_KEY_PREFIX = process.env.METRICS_KEY_PREFIX || 'regenbogen_ice_'

export const incrementMetric = (key: string) => {
    const hour = new Date().getHours()
    if (!metrics[hour]) {
        metrics[hour] = {}
    }
    if (!metrics[hour][METRICS_KEY_PREFIX + key]) {
        metrics[hour][METRICS_KEY_PREFIX + key] = 0
    }
    metrics[hour][METRICS_KEY_PREFIX + key] += 1
}

export const getMetrics = (): Metric => {
    const hour = new Date().getHours()
    const currentMetric = metrics[hour]
    metrics = {}
    metrics[hour] = currentMetric
    return currentMetric
}

app.get('/metrics', (req, res) => {
    let body = ""
    let metrics = getMetrics()
    for (let k in metrics) {
        body += k + " "
        body += metrics[k].toString() + "\n"
    }
    res.setHeader('content-type', 'text/plain')
    res.send(body)
})

export const startWebserver = () => {
    const HTTP_HOST = process.env.METRIC_HTTP_HOST || '::1'
    const HTTP_PORT = parseInt(process.env.METRIC_HTTP_PORT || '3030')
    app.listen(HTTP_PORT, HTTP_HOST, () => {
        info(`Metric HTTP server is running on http://${HTTP_HOST}:${HTTP_PORT}`)
    })
}