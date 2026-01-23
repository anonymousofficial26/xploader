import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

import pino from "pino"
import fs from "fs"
import { io } from "../web/server.js"
import { loadPlugins } from "./plugins/index.js"

/* ============================= */
/* START BOT FUNCTION            */
/* ============================= */

export async function startBot(botId, config) {
  console.log(`🤖 Starting bot: ${botId}`)

  /* ---------- AUTH ---------- */
  const sessionPath = `./sessions/${botId}`
  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath)

  const { version } = await fetchLatestBaileysVersion()

  /* ---------- SOCKET ---------- */
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["NovaX-MD", "Chrome", "1.0"]
  })

  /* ---------- LOAD PLUGINS ---------- */
  const plugins = await loadPlugins()
  console.log(`🧩 Loaded ${plugins.length} plugins`)

  /* ============================= */
  /* CONNECTION / QR HANDLING     */
  /* ============================= */

  let lastQRTime = 0

  sock.ev.on("connection.update", async update => {
    const { connection, qr, lastDisconnect } = update

    /* ---- QR CODE ---- */
    if (qr) {
      const now = Date.now()

      // QR refresh delay protection (8 seconds)
      if (now - lastQRTime > 8000) {
        lastQRTime = now
        console.log("📱 New QR generated")
        io.emit("qr", qr)
      }
    }

    /* ---- CONNECTED ---- */
    if (connection === "open") {
      console.log(`✅ ${botId} connected`)
      io.emit("qr-scanned")
    }

    /* ---- DISCONNECTED ---- */
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      console.log(`❌ Disconnected: ${reason}`)

      if (reason !== DisconnectReason.loggedOut) {
        startBot(botId, config)
      } else {
        console.log("🧹 Logged out – delete session to re-pair")
      }
    }
  })

  /* ---------- SAVE CREDS ---------- */
  sock.ev.on("creds.update", saveCreds)

  /* ============================= */
  /* MESSAGE HANDLER (IMPORTANT)   */
  /* ============================= */

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return
    if (msg.key.fromMe) return

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      ""

    /* ---- ONLY COMMANDS ---- */
    if (!body.startsWith(".")) return

    /* ---- AUTO REACT ---- */
    try {
      await sock.sendMessage(msg.key.remoteJid, {
        react: {
          text: "⚡",
          key: msg.key
        }
      })
    } catch {}

    const command = body.slice(1).split(" ")[0].toLowerCase()

    /* ---- RUN PLUGINS ---- */
    for (const plugin of plugins) {
      try {
        if (!plugin.command) continue
        if (!plugin.command.includes(command)) continue

        await plugin.run({
          sock,
          msg,
          config
        })
      } catch (err) {
        console.error(`❌ Plugin error [${plugin.command}]`, err)
      }
    }
  })

  /* ============================= */
  /* PAIRING CODE SUPPORT          */
  /* ============================= */

  if (!fs.existsSync(`${sessionPath}/creds.json`) &&
      config.pairingNumber) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(
          config.pairingNumber
        )
        console.log("🔐 Pairing code:", code)
      } catch (e) {
        console.log("⚠️ Pairing failed", e)
      }
    }, 4000)
  }

  return sock
}
