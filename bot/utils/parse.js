export function parseMessage(msg, prefix = ".") {
  let body = ""

  if (msg.message?.conversation)
    body = msg.message.conversation

  else if (msg.message?.extendedTextMessage?.text)
    body = msg.message.extendedTextMessage.text

  else if (msg.message?.imageMessage?.caption)
    body = msg.message.imageMessage.caption

  else if (msg.message?.videoMessage?.caption)
    body = msg.message.videoMessage.caption

  body = body.trim()

  const isCmd = body.startsWith(prefix)
  const args = body.slice(prefix.length).trim().split(/\s+/)
  const command = isCmd ? args.shift().toLowerCase() : ""

  return {
    body,
    isCmd,
    command,
    args
  }
}
