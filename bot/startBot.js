import pino from "pino"
import {
  default as makeWASocket,
  fetchLatestBaileysVersion,
  initInMemoryKeyStore
} from "@whiskeysockets/baileys"

import config from "../config.js"
import { loadPlugins } from "./plugins/index.js"

/* ============================= */
/* START BOT                     */
/* ============================= */

export async function startBot(botId = "bot-001") {
  console.log(`🤖 Starting NovaX-MD | ${botId}`)

  if (!config.SESSION_ID)
    throw new Error("❌ SESSION_ID missing in config.js")

  /* ============================= */
  /* LOAD SESSION FROM CONFIG      */
  /* ============================= */

  let sessionData
  try {
    sessionData = JSON.parse(
      Buffer.from(config.SESSION_ID, "base64").toString()
    )
  } catch {
    throw new Error("❌ Invalid SESSION_ID format (must be base64 JSON)")
  }

  const store = initInMemoryKeyStore(sessionData)

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: {
      creds: store.creds,
      keys: store.keys
    },
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["NovaX-MD", "Chrome", "1.0"]
  })

  console.log("✅ WhatsApp connected")

  /* ============================= */
  /* LOAD PLUGINS                  */
  /* ============================= */

  const plugins = await loadPlugins()
  console.log(`🧩 Loaded ${plugins.length} plugins`)

  /* ============================= */
  /* MESSAGE HANDLER               */
  /* ============================= */

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0]
    if (!msg?.message) return
    if (msg.key.fromMe) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      ""

    if (!text.startsWith(config.prefix)) return

    /* ---- AUTO REACT ---- */
    try {
      await sock.sendMessage(msg.key.remoteJid, {
        react: { text: "⚡", key: msg.key }
      })
    } catch {}

    const command =
      text.slice(config.prefix.length)
        .trim()
        .split(/\s+/)[0]
        .toLowerCase()

    for (const plugin of plugins) {
      try {
        if (!plugin.command) continue
        if (!plugin.command.includes(command)) continue

        await plugin.run({
          sock,
          msg,
          config,
          plugins
        })
      } catch (err) {
        console.error(
          `❌ Plugin error [${plugin.command}]`,
          err
        )
      }
    }
  })

  return sock
}

