const socket = io()
const status = document.getElementById("status")

function openQR() {
  window.open("/qr.html", "qr", "width=360,height=480")
}

function requestPair() {
  status.innerText = "Generating pairing code..."
  socket.emit("request-pair")
}

socket.on("connect", () => {
  status.innerText = "Dashboard connected"
})

socket.on("pair-code", code => {
  alert("PAIRING CODE:\n\n" + code)
  status.innerText = "Enter the code on WhatsApp"
})

socket.on("connected", () => {
  status.innerText = "✅ WhatsApp Connected"
})
