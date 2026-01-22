module.exports = {
  name: 'likestatus',
  execute: async (sock, msg, args, config) => {
    const sender = msg.key.participant || msg.key.remoteJid
    const chatId = msg.key.remoteJid

    if (!config.admins.includes(sender)) {
      return sock.sendMessage(chatId, {
        text: '❌ Admin only command'
      })
    }

    await sock.sendMessage('status@broadcast', {
      react: {
        text: '❤️',
        key: msg.key
      }
    })

    await sock.sendMessage(chatId, { text: '✅ Status liked' })
  }
}
