const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { readdir } = require("fs");
//create exress instance to allow route ("/login","/chat app")
const app = express();
// use http to create a server
// because socket io only connect and do operation
// if it hooks to a raw HTTp
// create a server and hook with socket io instance on top
const server = http.createServer(app);
const io = socketio(server);

//demo users
const demoUsers = [
  {
    email: "admin@example.com",
    username: "Admin",
    //securely stores a hashed pw
    passwordHash: bcrypt.hashSync("password123", 10),
  },
  {
    email: "test@example.com",
    username: "Test",
    //securely stores a hashed pw
    passwordHash: bcrypt.hashSync("password123", 10),
  },
];

//session middleware
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);
//allow app to use body.usernam or body.pw
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

//login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const emailMatched = demoUsers.reduce((bool, user) => {
    return bool || user.email === email;
  }, false); //not found return false

  const passwordMatched = demoUsers.reduce((bool, user) => {
    return bool || bcrypt.compareSync(password, user.passwordHash);
  }, false); //not found return false

  if (!email || !password) {
    return res.status(400).send({ message: "Missing email or password" });
  }

  if (emailMatched && passwordMatched) {
    req.session.user = email;
    user = demoUsers.find((u) => u.email === email);
    return res.send({
      message: "successfully loged in",
      redirect: "/chat.html",
      username: user.username,
    });
  }

  return res.send({ message: "Invalid credentials" });
});
//protect the chat page
app.get("/chat.html", (req, res, next) => {
  if (req.session.user) {
    return res._construct({ redirect: "/login.html" });
  }
  next();
});

//socketio for chat
io.on("connection", (socket) => {
  console.log("user connected");
  socket.username = "Anonymous";
  socket.on("userLogin", (username) => {
    socket.username = username;
    console.log(`${username} has logged in`);
    socket.broadcast.emit("message", `${socket.username} has joined !`);
  });
  socket.on("chatMessage", (msg) => {
    io.emit("message", `${socket.username}: ` + msg);
  });
  socket.on("isTyping", () => {
    socket.broadcast.emit("showTyping", `${socket.username} is typing...`);
  });
  socket.on("stopTyping", () => {
    socket.broadcast.emit("hideTyping");
  });
  socket.on("disconnect", () => {
    console.log(`${socket.username} disconnected`);
    socket.broadcast.emit("message", `${socket.username} has left`);
  });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on " + PORT));
