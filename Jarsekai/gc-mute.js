let jarsepay = async (m, { conn, usedPrefix }) => {
	let chat = global.db.data.chats[m.chat]
	if (chat.isBanned === true) {
		m.reply('Ce chat est désormais désactivé.')
		return
	}
	chat.isBanned = true
	await m.reply('Le bot a été désactivé avec succès dans ce chat.')
}
jarsepay.help = ['mute']
jarsepay.tags = ['group']
jarsepay.command = ['mute']

jarsepay.admin = true
jarsepay.group = true

export default jarsepay
