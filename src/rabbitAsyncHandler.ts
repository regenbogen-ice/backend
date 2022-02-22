type RabbitCallback = (msg: any, ack: (error?: any, reply?: any) => void) => void
type InternalRabbitCallback = (msg: any) => Promise<{ error?: any, reply?: any }|void>

const rabbitAsyncHandler = (callback: InternalRabbitCallback): RabbitCallback => {
    return (msg, ack) => {
        callback(JSON.parse(msg.content.toString())).then(e => {
            if (e) ack(e.error, e.reply)
            else ack()
        }).catch(e => {
            ack({ error: e.toString() })
            // TODO
        })
    }
}

export default rabbitAsyncHandler