import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys"

import fs from "fs"
import { io } from "../web/server.js"
import { messageHandler } from "./core/handler.js"

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

  /* ---------- SAVE SESSION ---------- */
  sock.ev.on("creds.update", saveCreds)

  /* ---------- CONNECTION + QR LOGIC ---------- */
  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update

    // 📸 QR GENERATED
    if (qr) {
      console.log("📸 QR GENERATED")
      io.emit("qr", qr)
      return
    }

    // ✅ CONNECTED
    if (connection === "open") {
      console.log("✅ WhatsApp connected")
      hasConnectedOnce = true
      io.emit("qr-scanned")
      return
    }

    // ❌ DISCONNECTED
    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode

      console.log("❌ Connection closed. Reason:", reason)

      // ⛔ Do NOT reconnect while waiting for QR scan
      if (!hasConnectedOnce) {
        console.log("⏳ Waiting for QR scan — not reconnecting")
        return
      }

      // 🔁 Reconnect only if previously connected
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔁 Reconnecting WhatsApp...")
        startBot(id, config)
      } else {
        console.log("🚪 Logged out — new QR required")
      }
    }
  })

  /* ---------- MESSAGE HANDLER ---------- */
  sock.ev.on("messages.upsert", async (msg) => {
    await messageHandler(sock, msg)
  })

  return sock
}



