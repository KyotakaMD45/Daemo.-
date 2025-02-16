let jarsepay = async (m, { conn, usedPrefix }) => {
	let chat = global.db.data.chats[m.chat]
	if (chat.isBanned === false) {
		m.reply('Ce chat n est pas mis en sourdine.')
		return
	}
	chat.isBanned = false
	await m.reply('Le robot a été réactivé avec succès.')
}
jarsepay.help = ['unmute']
jarsepay.tags = ['group']
jarsepay.command = ['unmute']

jarsepay.admin = true
jarsepay.group = true

export default jarsepay
