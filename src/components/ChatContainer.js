import React, { Component } from 'react';
import SideBar from './SideBar';
import { MESSAGE_SENT, TYPING, COMMUNITY_CHAT, MESSAGE_RECEIVED, PRIVATE_MESSAGE } from '../Events';
import ChatHeading from './ChatHeading';
import Messages from './Messages';
import MessageInput from './MessageInput';

export default class ChatContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chats:[],
      activeChat:null
    };
  }

  componentDidMount() {
    const { socket } = this.props;

    socket.emit('COMMUNITY_CHAT', this.resetChat);
    this.initSocket(socket);
  }

  initSocket(socket) {
    socket.emit(COMMUNITY_CHAT, this.resetChat);
    socket.on(PRIVATE_MESSAGE, this.addChat);
    socket.on('connect', () => {
      socket.emit(COMMUNITY_CHAT, this.resetChat);
    });
  }

  sendOpenPrivateMessage = (receiver) => {
    const { socket, user } = this.props;
    socket.emit(PRIVATE_MESSAGE, {receiver, sender:user.name});
  }

  resetChat = (chat) => {
    return this.addChat(chat, true);
  }

  addChat = (chat, reset = false) => {
    const { socket } = this.props;
    const { chats } = this.state;

    const newChats = reset ? [chat] : [...chats, chat];
    this.setState({chats:newChats, activeChat:reset ? chat : this.state.activeChat});

    const messageEvent = `${MESSAGE_RECEIVED}-${chat.id}`;
    const typingEvent = `${TYPING}-${chat.id}`;

    socket.on(typingEvent, this.updateTypingInChat(chat.id));
    socket.on(messageEvent, this.addMessageToChat(chat.id));
  }

  addMessageToChat = (chatId) => {
    return message => {
      const { chats } = this.state;
      let newChats = chats.map((chat) => {
        if(chat.id === chatId)
          chat.messages.push(message);
        return chat;
      });

      this.setState({chats:newChats});
    }
  }

  updateTypingInChat = (chatId) => {
    return ({isTyping, user}) => {
      if(user !== this.props.user.name) {
        const { chats } = this.state;

        let newChats = chats.map((chat) => {
          if(chat.id === chatId) {
            if(isTyping && !chat.typingUsers.includes(user)) {
              chat.typingUsers.push(user);
            } else if(!isTyping && chat.typingUsers.includes(user)){
              chat.typingUsers = chat.typingUsers.filter(u => u !== user);
            }
          }
          return chat;
        });
        this.setState({chat:newChats});
      }
    }
  }

  sendMessage = (chatId, message) => {
    const { socket } = this.props;
    socket.emit(MESSAGE_SENT, {chatId, message});
  }

  sendTyping = (chatId, isTyping) => {
    const {socket } = this.props;
    socket.emit(TYPING, {chatId, isTyping});
  }

  setActiveChat = (activeChat) => {
    this.setState({activeChat});
  }

  render() {
    const { user, logout } = this.props;
    const { chats, activeChat } = this.state;

    return(
      <div className="container">
        <SideBar chats={chats} user={user} activeChat={activeChat} setActiveChat={this.setActiveChat} onSendPrivateMessage={this.sendOpenPrivateMessage} />
        <div className="chat-room-container">
          {
            activeChat !== null ? (
              <div className="chat-room">
                <ChatHeading name={activeChat.name} logout={logout} />
                <Messages messages={activeChat.messages} user={user} typingUsers={activeChat.typingUsers} />
                <MessageInput
                  sendMessage={(message) => {this.sendMessage(activeChat.id, message)}}
                  sendTyping={(isTyping) => {this.sendTyping(activeChat.id, isTyping)}}
                />
              </div>
            ):
            <div className="chat-room choose">
              <h3>Choose a chat!</h3>
            </div>
          }
        </div>
      </div>
    );
  }
}
