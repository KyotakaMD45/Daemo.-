import './system/config.js'
import path, { join } from 'path'
import { platform } from 'process'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

// Définition des fonctions globales pour obtenir les chemins des fichiers
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
}
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

import * as ws from 'ws'
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import os from 'os'
import Pino from 'pino'
import { format } from 'util'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low } from 'lowdb'
import fs from 'fs'
import { JSONFile } from "lowdb/node"
import storeSys from './lib/store2.js'

// Création d'un magasin en mémoire pour stocker les sessions
const store = storeSys.makeInMemoryStore()

// Importation des fonctionnalités de Baileys
const {
    DisconnectReason,
    useMultiFileAuthState,
    MessageRetryMap,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    proto,
    jidNormalizedUser,
    PHONENUMBER_MCC,
    Browsers
} = await (await import('@whiskeysockets/baileys')).default

import readline from "readline"
import { parsePhoneNumber } from "libphonenumber-js"

const { CONNECTING } = ws
const { chain } = lodash

// Définition du port du serveur
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

// Création d'une interface pour lire les entrées de l'utilisateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

import NodeCache from "node-cache"
const msgRetryCounterCache = new NodeCache()
const msgRetryCounterMap = (MessageRetryMap) => {}

// Récupération de la dernière version de Baileys
const { version } = await fetchLatestBaileysVersion()

// Initialisation des fonctions de sérialisation et de proto
protoType()
serialize()

// Définition de l'API globale
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({
    ...query,
    ...(apikeyqueryname ? {
        [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]
    } : {})
})) : '')

// Stockage du timestamp de démarrage
global.timestamp = {
    start: new Date
}

// Définition du répertoire courant
const __dirname = global.__dirname(import.meta.url)

// Lecture des arguments en ligne de commande
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

// Définition des préfixes du bot
global.prefix = new RegExp('^[' + (opts['prefix'] || '‎!./#\\').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

// Initialisation de la base de données
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}jarsepay/database.json`))

// Chargement des données de la base de données
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((resolve) => setInterval(async function() {
        if (!global.db.READ) {
            clearInterval(this)
            resolve(global.db.data == null ? await global.loadDatabase() : global.db.data)
        }
    }, 1 * 1000))
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        menfess: {},
        simulator: {},
        ...(global.db.data || {})
    }
    global.db.chain = chain(global.db.data)
}
loadDatabase()

// Définition du dossier d'authentification
global.authFolder = storeSys.fixFileName(`${opts._[0] || ''}jarsepay/sessions`)

// Initialisation de l'état de connexion
let {
    state,
    saveCreds
} = await useMultiFileAuthState(path.resolve('./jarsepay/sessions'))

const connectionOptions = {
    pairingCode: true,
    patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage)
        if (requiresPatch) {
            message = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadataVersion: 2,
                            deviceListMetadata: {}
                        },
                        ...message
                    }
                }
            }
        }
        return message
    },
    msgRetryCounterMap,
    logger: Pino({
        level: 'fatal'
    }),
    auth: state,
    browser: ['Linux', 'Chrome', ''],
    version,
    getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid)
        let msg = await store.loadMessage(jid, key.id)
        return msg?.message || ""
    },
    msgRetryCounterCache,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true
}

// Création de la connexion WhatsApp
global.conn = makeWASocket(connectionOptions)
conn.isInit = false
global.pairingCode = true

// Gestion du code de couplage (pairing code)
async function handlePairingCode(conn) {
    try {
        if (global.pairingCode && !conn.authState.creds.registered) {
            console.log(chalk.whiteBright('› Pour utiliser le code d’appairage, veuillez entrer votre numéro WhatsApp.'))
            console.log(chalk.whiteBright('› Exemple : 225......'))
            
            const phoneNumber = await question(chalk.bgGreen(chalk.black(`\nVotre numéro WhatsApp : `)))
            const cleanPhoneNumber = phoneNumber.replace(/\D/g, '')
            
            if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 13) {
                console.log(chalk.bgRed(chalk.black('\n› Numéro invalide. Veuillez entrer un numéro valide.')))
            } else {
                console.log(chalk.cyan('› Génération du code....'))
                
                try {
                    const code = await conn.requestPairingCode(cleanPhoneNumber)
                    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code
                    
                    console.log(chalk.whiteBright('› Votre code d’appairage :'), chalk.bgGreenBright(chalk.black(` ${formattedCode} `)))
                    console.log(chalk.whiteBright('› Veuillez entrer ce code dans votre application WhatsApp.'))
                    
                } catch (error) {
                    console.log(chalk.bgRed(chalk.black('Échec de la génération du code d’appairage :', error.message)))
                }
            }
        }
    } catch (error) {
        console.error('Erreur dans handlePairingCode :', error)
    } finally {
        rl.close()
    }
}

// Exécution du code de couplage
try {
    await handlePairingCode(conn)
} catch (error) {
    console.error('Erreur :', error)
    rl.close()
}
