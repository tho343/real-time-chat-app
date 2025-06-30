const username = localStorage.getItem("username");
const greeting = document.getElementById("greeting-message");
const chatForm = document.getElementById("chat-form");
const messageList = document.getElementById("message-bubbles");
const logoutBtn = document.getElementById("log-out-btn");
const typingStatus = document.getElementById("typing-status");
greeting.innerHTML = `Hello ${username}`;
let isTyping = false;
let typingTimeOut;
const socket = io();
//let server know that user login
socket.emit("userLogin", username);
//send message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = document.getElementById("chat-message").value;
  socket.emit("chatMessage", msg);
  socket.emit("stopTyping");
  document.getElementById("chat-message").value = "";
});

document.getElementById("chat-message").addEventListener("input", () => {
  const message = document.getElementById("chat-message").value.trim();
  if (message && !isTyping) {
    socket.emit("isTyping");
    isTyping = true;
  }
  if (!message && isTyping) {
    socket.emit("stopTyping");
    isTyping = false;
    clearTimeout(typingTimeOut);
    return;
  }
  clearTimeout(typingTimeOut);
  typingTimeOut = setTimeout(() => {
    if (isTyping) {
      socket.emit("stopTyping");
      isTyping = false;
    }
  }, 3000);
});
//listen to message
socket.on("message", ({ messageType, messageContent }) => {
  if (messageType === "chat") {
    const div = document.createElement("div");
    div.className = "chat-bubble";
    div.textContent = messageContent;
    messageList.appendChild(div);
  }
  if (messageType === "notification") {
    const div = document.createElement("div");
    div.className = "chat-noti text-black/40";
    div.textContent = messageContent;
    messageList.appendChild(div);
  }
});
//handle typing
socket.on("showTyping", (msg) => {
  typingStatus.textContent = msg;
});
socket.on("hideTyping", () => {
  typingStatus.textContent = "";
});
//Logout
logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  socket.disconnect();
  window.location.href = "/index.html";
});
