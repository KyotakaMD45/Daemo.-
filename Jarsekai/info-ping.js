import { performance } from 'perf_hooks'

let jarsepay = async (m, { conn }) => {
    let old = performance.now()
    let neww = performance.now()
    let speed = Math.floor(neww - old)

    m.reply(`> Pong!${speed}ms*`)
}

jarsepay.help = ['ping']
jarsepay.tags = ['info']
jarsepay.command = ['ping', 'speed']

export default jarsepay
