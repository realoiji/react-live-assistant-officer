import React from 'react'
import ReactDOM from 'react-dom'

// import ReactComponent from 'my-react-component' // React component name in configs/index.js
import VideoCall from '../lib' // React component name in configs/index.js
import config from '../configs' // React component name in configs/index.js
import forEach from 'lodash/foreach'
import '../css/style.css'

const loadLangDefault = () => {
  const obj = {}
  forEach(config.langs, (value, key) => {
    obj[key] = ''
  })
  return obj
}

const langDefault = loadLangDefault()

class App extends React.Component {
  state = {
    videoMessageErrors: langDefault,
    isVideoCalling: false,
    touchScreenId: null,
    onlineStatus: true,
    activeLang: ['en']
  }

  resetState = () => {
    this.setState({
      isVideoCalling: false,
      touchScreenId: null,
      videoMessageErrors: langDefault
    })
  }

  handleReload = () => {
    console.log('handleReload')
    setTimeout(() => {
      this.resetState()
    }, 4 * 1000)
    // ipcRenderer.send('statusForWindow', 'hide')
  }

  handleLang = () => {
    this.setState({ activeLang: ['en', 'th'] })
  }

  handleVideoCall = (status) => {
    this.setState({ isVideoCalling: status })
  }

  handleHangUp = (data) => {
    // console.log('App handleHangUp', data)
    this.handleVideoCall(false)
  }

  handleIncoming = (data) => {
    // console.log('handleIncoming', data)
    if (data.touchScreenId) this.setState(() => ({ touchScreenId: data.touchScreenId }))
  }

  handleOnlineStatus = (onlineStatus) => {
    this.setState({ onlineStatus })
  }

  handleError = (type) => {
    // console.log('handleError', type)
    const errMessage = langDefault
    switch (type) {
      case 'device':
        errMessage.en = 'Camera or microphone is not available.'
        errMessage.th = 'กล้องหรือไมโครโฟนไม่พร้อมใช้งาน'
        break
      case 'not-available':
        errMessage.en = 'Not Available, Please try again.'
        errMessage.th = 'สายไม่ว่าง โปรดติดต่อใหม่อีกครั้ง'
        break
      default:
        errMessage.en = 'Connection Error'
        errMessage.th = 'กล้องหรือไมโครโฟนไม่พร้อมใช้งาน'
        break
    }
    this.setState({ videoMessageErrors: errMessage })
    this.handleVideoCall(false)
    // setTimeout(() => {
    //   this.resetState()
    // }, 4 * 1000)
  }

  componentDidMount() {
    
  }

  render() {
    const { isVideoCalling, videoMessageErrors, touchScreenId, onlineStatus, activeLang } = this.state
    // console.log('videoMessageErrors', videoMessageErrors)
    const alertEl = (videoMessageErrors['en']) ? <div className='alert active'>{videoMessageErrors['en']}</div> : null
    let remoteEl = <div>test</div>
    if (touchScreenId && isVideoCalling) {
      const encodeRemote = window.btoa(`${touchScreenId}\0c\0noauth`)
      const remoteUrl = `${config.serverRemoteDesktop}client/${encodeRemote}`
      remoteEl = <iframe className='remote-desktop' src={remoteUrl} frameBorder='0' />
    }

    return (
      <div>
        {alertEl}
        {remoteEl}
        <input type='radio' name='online_status[]' value='true' onClick={() => this.handleOnlineStatus(true)} />
        <input type='radio' name='online_status[]' value='false' onClick={() => this.handleOnlineStatus(false)} />
        <br />
        <input type='checkbox' name='lang[]' value='false' onClick={() => this.handleLang()} />
        <VideoCall
          onHangUp={this.handleHangUp}
          onErrors={this.handleError}
          onCalling={this.handleVideoCall}
          onInComing={this.handleIncoming}
          onReload={this.handleReload}
          onlineStatus={onlineStatus}
          id='1'
          type='callcenter'
          zone={activeLang}
          videoWidth={400}
          videoHeight={536}
          delayAutoHangUp={30}
          delayAfterDisConnect={1.5}
          audio
          server={config.serverVideCall}
          videoUI={(myVideo, theirVideo, handleHangUp, handleAccept, inComingCall, talking) => {
            let btnControl = null
            if (inComingCall) btnControl = <button className='btn-accept' onClick={() => handleAccept()}><i className='icon-end-call' />Accept</button>
            if (talking) btnControl = <button className='btn-hangup' onClick={() => handleHangUp()}><i className='icon-end-call' />Hang Up</button>
            return (
              <div className='video-call-panel'>
                {myVideo()}
                {theirVideo()}
                <div className='control-container'>
                  {btnControl}
                </div>
              </div>
            )
          }}
        />
      </div>
    )
  }
}

const rootEl = document.getElementById('root')
ReactDOM.render(<App />, rootEl)
