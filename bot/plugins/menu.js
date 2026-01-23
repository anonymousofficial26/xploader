export default async (sock, msg, cfg) => {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text

  if (!text || text.trim() !== ".menu") return

  const menuImageUrl = "https://files.catbox.moe/2klf23.png"

  const caption = `
╔═════〔 🤖 ${cfg.botName} 〕═════╗

📥 *DOWNLOAD*
• .ytmp3 <link>
• .ytmp4 <link>
• .tiktok <link>
• .song <name>
• .video <name>
• .image <name>
• .apk <app name>
• .mediafire <link>

🎬 *CONVERT*
• .tomp3 (reply audio)
• .tovn (reply video)
• .sticker (reply image/video)
• .toimg (reply sticker)
• .removebg (reply image)

🤖 *AI*
• .ai <question>
• .ask <question>
• .gpt <prompt>
• .translate <lang> <text>
• .summarize (reply text)

🎉 *FUN*
• .joke
• .quote
• .fact
• .meme
• .coinflip
• .roll
• .truth
• .dare

🛠 *UTILITY*
• .ping
• .alive
• .runtime
• .speed
• .calc <math>
• .qr <text>
• .short <url>
• .weather <city>

👥 *GROUP*
• .tagall
• .hidetag
• .kick @user
• .add +number
• .promote @user
• .demote @user
• .group open / close
• .setname <text>
• .setdesc <text>

👑 *ADMIN*
• .ban @user
• .unban @user
• .mute
• .unmute
• .setprefix <symbol>
• .restart
• .update

⚙ *SYSTEM*
• .menu
• .help
• .plugins
• .plugin install <name>
• .plugin remove <name>
• .backup
• .shutdown

🔐 *PAIRING*
• .pair
• .paircode

╚══════════════════════╝
${cfg.botName} *• ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀɴᴏɴʏᴍᴏᴜꜱ •*
`

  await sock.sendMessage(
    msg.key.remoteJid,
    {
      image: { url: menuImageUrl },
      caption
    },
    { quoted: msg }
  )
}
