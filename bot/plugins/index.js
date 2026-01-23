import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function loadPlugins() {
  const plugins = []

  const files = fs
    .readdirSync(__dirname)
    .filter(f => f.endsWith(".js") && f !== "index.js")

  for (const file of files) {
    try {
      const pluginPath = path.join(__dirname, file)
      const plugin = await import(`file://${pluginPath}`)

      plugins.push(plugin.default)
      console.log(`✅ Plugin loaded: ${file}`)
    } catch (err) {
      console.error(`❌ Failed to load plugin ${file}`, err)
    }
  }

  return plugins
}
