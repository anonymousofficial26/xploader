const socket = io()
const status = document.getElementById("status")

function openQR() {
  window.open(
    "/qr.html",
    "qr",
    "width=360,height=480"
  )
}

socket.on("connect", () => {
  status.innerText = "Dashboard connected"
})

socket.on("qr", data => {
  status.innerText = "QR generated – scan now"
})

socket.on("qr-scanned", () => {
  status.innerText = "Bot connected"
})
