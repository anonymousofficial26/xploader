import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"
import loadPlugins from "./loader.js"

export async function startBot(id, config) {
  const { state, saveCreds } =
    await useMultiFileAuthState(`./sessions/${id}`)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", saveCreds)

  const plugins = await loadPlugins()

  sock.ev.on("connection.update", u => {
    if (u.qr) console.log(`[${id}] QR RECEIVED`)
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg?.message) return
    for (const plugin of plugins)
      await plugin(sock, msg, config)
  })

  return sock
}
