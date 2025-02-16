import { watchFile, unwatchFile } from 'fs'
import fs from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

// Paramètres  
global.setting = {
    autoclear: false,
    addReply: true
}

// Propriétaire  
global.owner = [
    ['2250575130788', 'Propriétaire', true]
]

// Informations  
global.info = {
    namabot: 'Hiden-md',
    wm: 'pharouk',
    packname: ' 🟢',
    stickpack: 'Créé par'
}

// Vignettes  
global.url = {
    profil: '',
    thumb: '',
    logo: '',
    akses: '',
    welcomes: '',
    lefts: '',
    sig: '',
    sgh: '',
    sgc: '',
    sdc: '',
    sid: ''
}

// Messages  
global.msg = {
    wait: 'Veuillez patienter...',
    error: 'Une erreur est survenue, veuillez contacter le propriétaire via */report*.'
}

// Clés API  
global.api = {
    lol: 'GataDios'
}

global.APIKeys = {
    "https://api.lolhumaan.xyz": "GataDios"
}

// API  
global.APIs = {
    lol: "https://api.lolhumaan.xyz"
}

// RPG & Niveau  
global.multiplier = 50
global.rpg = {
    emoticon(string) {
        string = string.toLowerCase()
        let emot = {
            health: '❤️',
            role: '🎭',
            level: '🧬',
            exp: '✨',
            money: '💵',
            limit: '🌟'
        }
        let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string))
        if (!results.length) return ''
        else return emot[results[0][0]]
    }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Mise à jour de 'config.js'"))
    import(`${file}?update=${Date.now()}`)
})
