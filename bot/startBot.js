async function reactCommand(sock, msg) {
  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: {
        text: "⚡",
        key: msg.key
      }
    })
  } catch {}
}

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"

import fs from "fs"
import { io } from "../web/server.js"
import { loadPlugins, getPlugins } from "./plugins/index.js"

loadPlugins()

export async function startBot(id, config) {
  const sessionPath = `./sessions/${id}`
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true })
  }

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Chrome", "Android", "13"]
  })

  let hasConnectedOnce = false

  sock.ev.on("creds.update", saveCreds)

  /* QR + PAIRING */
  if (!state.creds.registered && config.pairingNumber) {
    setTimeout(async () => {
      const code = await sock.requestPairingCode(
        config.pairingNumber
      )
      io.emit("pairing-code", code)
    }, 3000)
  }

  sock.ev.on("connection.update", update => {
    const { qr, connection, lastDisconnect } = update

    if (qr) {
      io.emit("qr", qr)
      return
    }

    if (connection === "open") {
      hasConnectedOnce = true
      io.emit("qr-scanned")
      return
    }

    if (connection === "close") {
      if (!hasConnectedOnce) return
      if (
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        startBot(id, config)
      }
    }
  })

  /* PLUGIN HANDLER */
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message || msg.key.fromMe) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if (!text || !text.startsWith(".")) return

    const cmd = text.slice(1).split(" ")[0].toLowerCase()

    for (const plugin of getPlugins()) {
      if (plugin.command.includes(cmd)) {
        await plugin.run({ sock, msg, text })
        break
      }
    }
  })

  return sock
}


