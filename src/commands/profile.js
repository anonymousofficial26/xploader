module.exports = {
  name: 'pp',
  execute: async (sock, msg, args) => {
    const chatId = msg.key.remoteJid
    const number = args[0]
    if (!number) return

    try {
      const pp = await sock.profilePictureUrl(
        number + '@s.whatsapp.net',
        'image'
      )
      await sock.sendMessage(chatId, {
        image: { url: pp }
      })
    } catch {
      await sock.sendMessage(chatId, {
        text: 'No profile picture found.'
      })
    }
  }
}
