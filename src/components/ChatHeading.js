import React from 'react';

export default function({name, logout}) {

  return(
    <div className="chat-header">
      <div className="user-info">
        <div className="user-name">{name}</div>
        <div className="status">
          <div className="indicator"></div>
        </div>
      </div>
      <div className="options">
        <div onClick={()=>{logout()}} title="Logout" className="logout pointer">
          Log Out
        </div>
      </div>
    </div>
  );
}
