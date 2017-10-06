import React, { Component } from 'react';
import FASearch from 'react-icons/lib/fa/search'

export default class SideBar extends Component{
	constructor(props) {
		super(props);

		this.state = {
			receiver:"",
		};
	}

	handleSubmit = (e) => {
		e.preventDefault();
		const { receiver } = this.state;
		const { onSendPrivateMessage } = this.props;
		console.log(receiver);
		onSendPrivateMessage(receiver);
	}

	render(){
		const { receiver } = this.state;
		const { chats, activeChat, user, setActiveChat } = this.props
		return (
			<div id="side-bar">
				<div className="heading">
					<div className="app-name">ChatBasic</div>
					<span>{user.name}</span>
				</div>
				<form onSubmit={this.handleSubmit} className="search">
					<i className="search-icon"><FASearch /></i>
					<input value={receiver} onChange={(e) => { this.setState({receiver:e.target.value}) }}  placeholder="Search Open Chats or PM Online Users" type="text"/>
				</form>
				<div className="users" ref='users' onClick={(e) => {(e.target === this.refs.user) && setActiveChat(null)}}>
					{
						chats.map((chat) => {
							if(chat.name){
								const lastMessage = chat.messages[chat.messages.length - 1];
								const chatSideName = chat.users.find((name)=>{
									return name !== user.name
								}) || "Community"
								const classNames = (activeChat && activeChat.id === chat.id) ? 'active' : ''

								return(
  								<div key={chat.id} className={`user ${classNames} pointer`} onClick={() => {setActiveChat(chat)}}>
  									<div className="user-photo">{chatSideName[0].toUpperCase()}</div>
  									<div className="user-info">
  										<div className="name">{chatSideName}</div>
  										{lastMessage && <div className="last-message">{lastMessage.message}</div>}
  									</div>

  								</div>
							  )
							}
							return null
						})
					}
				</div>
			</div>
		);

	}
}
