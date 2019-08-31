import React, { Component } from 'react';
import './App.css';
import Peer from 'simple-peer'
const rx = localStorage.rxjs
const p = new Peer({
  initiator: window.location.hash === '#1',
  config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }] },
  sdpTransform: function (sdp) { return sdp },
  trickle: false,
})
p.on('error', err => console.log(err))

class App extends Component {

  state = {
    outgoing: '',
    incoming: '',
    showChat: false,
    beingWritten: '',
    chats: [],
    keys: false,
    isRx: false,
  }

  chatBody = React.createRef()

  componentDidMount() {
    p.on('signal', data => {
      this.setState({
        outgoing: JSON.stringify(data)
      })
    })
    p.on('connect', () => {
      p.send(JSON.stringify({
        msg: 'You are now connected! 🎉',
        owner: null
      }))
      this.setState({
        showChat: true
      })
    })
    p.on('data', data => {
      const msg = JSON.parse(new TextDecoder("utf-8").decode(data))
      // console.log('on data: ', msg)
      if(msg.type) {
        if(msg.type === 'keyboard') {
          if(this.state.isRx === true) {
            this.setState({
              keys: msg.msg
            })
          }
        }
      } else {
        this.appendMsg({
          msg: msg.msg,
          owner: msg.owner
        })
      }
    })
    rx && rx === 'rxjs_dev-TypeScript2.40.33-dev-build' && this.setState({ keys: 'Type should start now...', isRx: true})
  }

  handleChange(event) {
    const name = event.target.name
    this.setState({
      [name]: event.target.value
    }, () => {
      if(name === 'beingWritten') {
        this.handleKeyboardType(this.state.beingWritten)
      }
    })
  }

  handleSubmitConnection(event) {
    event.preventDefault()
    p.signal(JSON.parse(this.state.incoming))
  }

  renderP2P() {
    return (
      <div className="render-p2p">
        <strong>Super Chat</strong>
        <br/><br/>
        <form onSubmit={this.handleSubmitConnection.bind(this)}>
          <strong>Incoming:</strong><br/>
          <textarea 
            id="incoming" 
            rows="8" 
            cols="50"
            name="incoming"
            value={this.state.incoming}
            onChange={this.handleChange.bind(this)}></textarea>
          <br/>
          <button>Connect</button>
        </form>
        <br/>
        <strong>Outgoing:</strong><br/>
        <textarea 
          id="incoming" 
          rows="8" 
          cols="50" 
          name="outgoing"
          value={this.state.outgoing}
          onChange={this.handleChange.bind(this)}></textarea>
      </div>
    );
  }

  appendMsg(msg) {
    // console.log(msg)
    this.setState({
      chats: [
        ...this.state.chats,
        msg
      ]
    }, () => {
      setTimeout(() => {
        this.chatBody.current.scrollTop = this.chatBody.current.scrollHeight
      }, 2000);
    })
  }

  handleMsg(event) {
    event.preventDefault()
    this.appendMsg({
      msg: this.state.beingWritten,
      owner: true
    })
    p.send(JSON.stringify({
      msg: this.state.beingWritten,
      owner: false
    }))
    this.setState({
      beingWritten: ''
    })
  }

  renderMsgs() {
    return this.state.chats.map((m, i) => <div 
      key={i}
      className={m.owner ? "msg-bubble bubble-owner" : "msg-bubble bubble-recipient"}>
      {m.msg}
    </div>)
  }

  renderChat() {
    return <div className="chat-wrapper">
      <div 
        className="chat-body"
        ref={this.chatBody}>
        {this.renderMsgs()}
      </div>
      <div className="keys">{this.state.keys}</div>
      <div className="chat-input">
        <form onSubmit={this.handleMsg.bind(this)}>
          <input 
            className="chat-box"
            name="beingWritten"
            value={this.state.beingWritten}
            onChange={this.handleChange.bind(this)}
            placeholder="Hit enter to send your reply..."/>
        </form>
      </div>
    </div>
  }

  handleKeyboardType(data) {
    if(this.state.isRx === false) {
      p.send(JSON.stringify({
        msg: data,
        type: 'keyboard'
      }))
    }
  }

  render() {
    if(this.state.showChat) return this.renderChat()
    else return this.renderP2P()
  }
}

export default App;
