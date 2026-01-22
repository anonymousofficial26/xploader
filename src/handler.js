const config = require('./config')

module.exports = async (sock, msg) => {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text

  if (!text) return
  if (!text.startsWith(config.prefix)) return

  const args = text.slice(1).trim().split(/ +/)
  const command = args.shift().toLowerCase()

  const commandFiles = [
    require('./commands/menu'),
    require('./commands/downloader'),
    require('./commands/status'),
    require('./commands/profile')
  ]

  for (const cmd of commandFiles) {
    if (cmd.name === command) {
      return cmd.execute(sock, msg, args, config)
    }
  }
}

