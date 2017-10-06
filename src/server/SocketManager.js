const io = require('./index.js').io;
const { VERIFY_USER, USER_CONNECTED, LOGOUT, USER_DISCONNECTED, COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECEIVED, TYPING, PRIVATE_MESSAGE } = require('../Events');
const { createUser, createMessage, createChat } = require('../Factories');
let communityChat = createChat();
let connectedUsers = {};

module.exports = function(socket) {
  console.log("Socket Id:" + socket.id);

  let sendMessageToChatFromUser;

  let sendTypingFromUser;

  // Make sure the username has not already been chosen.
  socket.on(VERIFY_USER, (nickname, callback) => {
    if(isUser(connectedUsers, nickname)){
      callback({ isUser:true, user:null });
    } else {
      callback({ isUser:false, user:createUser({name:nickname, socketId:socket.id})});
    }
  });

  // New user connected, so add them to the object of connected users.
  socket.on(USER_CONNECTED, (user) => {
    user.socketId = socket.id;
    connectedUsers = addUser(connectedUsers, user);
    socket.user = user;

    sendMessageToChatFromUser = sendMessageToChat(user.name);
    sendTypingFromUser = sendTypingToChat(user.name);

    io.emit(USER_CONNECTED, connectedUsers);
    console.log(connectedUsers);
  });

  // Handle the disconnect, removing that user.
  socket.on('disconnect', () => {
    if("user" in socket){
      connectedUsers = removeUser(connectedUsers, socket.user.name);
      io.emit(USER_DISCONNECTED, connectedUsers);
      console.log("Disconnect", connectedUsers);
    }
  });

  socket.on(LOGOUT, () => {
    connectedUsers = removeUser(connectedUsers, socket.user.name);
    io.emit(USER_DISCONNECTED, connectedUsers);
    console.log("Disconnect", connectedUsers);
  });

  // Opening the socket to the community chat channel, the default for all users.
  socket.on(COMMUNITY_CHAT, (callback) => {
    callback(communityChat);
  });

  // Whenever someone sends a message, it then relays that message to the person receiving it.
  socket.on(MESSAGE_SENT, ({chatId, message}) => {
    sendMessageToChatFromUser(chatId, message);
  });

  // When someone starts typing, it lets the other person know they're typing.
  socket.on(TYPING, ({chatId, isTyping}) => {
    sendTypingFromUser(chatId, isTyping);
  });

  // Handles the logic for when a user attempts to message a different user.  Checks to see if that user exists.
  socket.on(PRIVATE_MESSAGE, ({receiver, sender}) => {
    if(receiver in connectedUsers) {
      const newChat = createChat({ name:`${receiver}&${sender}`, users:[receiver, sender] });
      const receiverSocket = connectedUsers[receiver].socketId;

      socket.to(receiverSocket).emit(PRIVATE_MESSAGE, newChat);
      socket.emit(PRIVATE_MESSAGE, newChat);
    }
  });

}

// Adds new user
function addUser(userList, user){
  let newList = Object.assign({}, userList);
  newList[user.name] = user;
  return newList;
}

// Handles disconnects by removing the user.
function removeUser(userList, username){
  let newList = Object.assign({}, userList);
  delete newList[username];
  return newList;
}

// Checks to see if the user exists in the current connected users.
function isUser(userList, username){
  return username in userList;
}

// Creates the sent message object and assigns metadata to it.
function sendMessageToChat(sender){
  return (chatId, message) => {
    io.emit(`${MESSAGE_RECEIVED}-${chatId}`, createMessage({message, sender}));
  }
}

// Sends back which user was typing.
function sendTypingToChat(user) {
  return (chatId, isTyping) => {
    io.emit(`${TYPING}-${chatId}`, {user, isTyping});
  }
}
