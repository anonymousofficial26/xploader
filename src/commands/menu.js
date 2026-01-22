module.exports = {
  name: 'menu',
  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const menu = `
🤖 *WHATSAPP BOT MENU*

📥 *Downloads*
• !music <youtube link>
• !video <youtube link>
• !file <direct link>
• !pp <number>

👁️ *Status*
• Auto view status
• !likestatus (admin)

⚙️ *Admin*
• !online on
• !online off

ℹ️ *Help*
• !menu
`

    await sock.sendMessage(chatId, { text: menu })
  }
}
