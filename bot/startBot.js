import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import Pino from "pino"
import fs from "fs"
import path from "path"
import { io } from "../web/server.js"

export async function startBot(id, config = {}) {
  const authDir = path.resolve(`./sessions/${id}`)
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: Pino({ level: "silent" }),
    browser: ["NovaX-MD", "Chrome", "1.0"]
  })

  // 🔐 Save session
  sock.ev.on("creds.update", saveCreds)

  // 📸 QR CODE EVENT
  sock.ev.on("connection.update", update => {
    const { qr, connection, lastDisconnect } = update

    if (qr) {
      console.log(`[${id}] QR RECEIVED`)
      io.emit("qr", qr)
    }

    if (connection === "open") {
      console.log(`[${id}] Connected to WhatsApp`)
      io.emit("status", "connected")
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode

      console.log(`[${id}] Disconnected (${reason})`)

      if (reason !== DisconnectReason.loggedOut) {
        console.log(`[${id}] Reconnecting...`)
        startBot(id, config)
      } else {
        console.log(`[${id}] Logged out`)
      }
    }
  })

  // 📩 MESSAGE HANDLER (basic)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if (!text) return

    if (text === ".menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🔥 NovaX-MD Menu\n\n.menu\n.ping\n.alive"
      })
    }

    if (text === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 Pong!"
      })
    }
  })

  return sock
}
