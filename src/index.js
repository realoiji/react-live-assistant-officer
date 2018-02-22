import React, { PureComponent } from 'react'
import io from 'socket.io-client'
import Peer from 'peerjs'
import PropTypes from 'prop-types'

import profileImg from '../images/profile.png'
import busyAudio from '../audios/busy.mp3'
import incomingAudio from '../audios/incoming.mp3'
export default class VideoCall extends PureComponent {
  checkTalkingTimeOut = false
  checkBusyAudioTimeOut = false

  static propTypes = {
    // id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    // type: PropTypes.string,
    // zone: PropTypes.array.isRequired,
    userData: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string,
      language: PropTypes.array.isRequired,
      name: PropTypes.string,
      lastname: PropTypes.string
    }),
    server: PropTypes.shape({
      ip: PropTypes.string.isRequired,
      port: PropTypes.number.isRequired,
      path: PropTypes.string.isRequired,
      debug: PropTypes.number,
      protocol: PropTypes.string.isRequired
    }).isRequired,
    videoWidth: PropTypes.number.isRequired,
    videoHeight: PropTypes.number.isRequired,
    audio: PropTypes.bool,
    onlineStatus: PropTypes.bool.isRequired,
    onInComing: PropTypes.func,
    onReload: PropTypes.func,
    onErrors: PropTypes.func,
    onCalling: PropTypes.func,
    onHangUp: PropTypes.func,
    videoUI: PropTypes.func,
    delayAutoHangUp: PropTypes.number.isRequired,
    delayAfterDisConnect: PropTypes.number.isRequired
  }

  static defaultProps = {
    audio: true
  }

  state = {
    myVideoStream: '',
    theirVideoStream: '',
    socket: null,
    peer: null,
    error: false,
    audio: '',
    touchScreenId: null, // id 2
    inComingCall: false, // true
    talking: false,
    myId: null
  }

  configMedia = () => {
    const { videoWidth, videoHeight, audio } = this.props
    const mediaOptions = { video: { width: videoWidth, height: videoHeight }, audio }
    return mediaOptions
  }

  resetConnection = () => {
    this.setState(() => ({
      myVideoStream: '',
      theirVideoStream: '',
      peer: null,
      // socket: null,
      error: false,
      audio: '',
      touchScreenId: null,
      talking: false,
      inComingCall: false
    }))
    this.props.onReload(true)
  }

  destroy = () => {
    const { myVideoStream, peer, socket } = this.state
    try {
      if (myVideoStream) myVideoStream.getTracks().forEach(mediaTrack => mediaTrack.stop())
      if (socket) socket.emit('changestatus', 'ready')
      if (peer) peer.destroy()
      this.audioReload(busyAudio)
      if (this.checkBusyAudioTimeOut) clearTimeout(this.checkBusyAudioTimeOut)
      this.checkBusyAudioTimeOut = setTimeout(() => {
        this.audioReload('')
      }, this.props.delayAfterDisConnect * 1000)
      if (this.checkTalkingTimeOut) clearTimeout(this.checkTalkingTimeOut)
    } catch (error) {
      // console.log('error', error)
      this.resetConnection()
    }
  }

  audioReload = (audio) => {
    this.setState({ audio })
    if (this.audioRef) {
      this.audioRef.load()
      this.audioRef.play().then(() => null).catch(() => null)
    }
  }

  handleError = (data) => {
    setTimeout(() => {
      if (this.videoContainer) {
        this.props.onErrors(data)
        this.setState(() => ({ error: true }))
      }
    }, this.props.delayAfterDisConnect * 1000)
    this.destroy()
  }

  handleHangUp = () => {
    const { talking, peer, socket, touchScreenId } = this.state
    if (talking) {
      peer.destroy()
    } else {
      try {
        socket.emit('hangup', touchScreenId)
        this.handlePeerClose()
      } catch (error) {
        console.log('socket hangup emit', error)
      }
    }
  }

  calling = (call) => {
    call.on('stream', (stream) => {
      const { userData } = this.props
      const { socket, touchScreenId } = this.state
      try {
        const comparedData = {
          touchScreenId: touchScreenId,
          callCenterId: `${userData.id}${userData.type}`
        }
        socket.emit('changestatus', 'already')
        socket.emit('comparedData', comparedData)
        this.audioReload('')
        this.props.onCalling(true)
        this.setState(() => ({ theirVideoStream: stream }))
      } catch (error) {
        console.log('calling error', error)
      }
    })

    call.on('close', this.handlePeerClose)
  };

  handleAccept = () => {
    const { talking, peer, touchScreenId, myVideoStream } = this.state
    if (!talking) {
      const call = peer.call(touchScreenId, myVideoStream)
      this.calling(call)
    }
    this.setState(() => ({
      talking: true
    }))
  }

  handlePeerClose = () => {
    this.destroy()
    this.props.onHangUp(true)
  }

  checkTalking = () => {
    this.checkTalkingTimeOut = setTimeout(() => {
    // console.log('checkTalking')
      const { talking, error } = this.state
      if (talking) return
      if (error) return
      this.handleError('not-available')
    }, this.props.delayAutoHangUp * 1000)
  }

  requestWebcam = () => {
    const mediaOptions = this.configMedia()
    navigator.getUserMedia(mediaOptions, (stream) => {
      this.setState(() => ({ myVideoStream: stream }))
    }, () => this.handleError('device'))
  };

  shutdownSocketPeerAndCheckRestart = () => {
    // console.log('start shutdownSocketPeerAndCheckRestart')
    try {
      const { socket, peer } = this.state
      const { onlineStatus } = this.props
      // console.log('socket', socket)
      // console.log('peer', peer)
      // console.log('onlineStatus', onlineStatus)
      if (socket) socket.close()
      if (peer) peer.destroy()
      if (onlineStatus) this.connectSocket()
    } catch (error) {
      console.log('socket disconnect error', error)
    }
    // console.log('end shutdownSocketPeerAndCheckRestart')
  }

  connectPeer = () => {
    // console.log('connectPeer')
    // debugger;
    try {
      const { id, type, server } = this.props
      const peerId = `${id}${type}`
      const peer = new Peer(peerId, {
        host: server.ip,
        port: server.port,
        path: server.path,
        debug: server.debug
      })

      this.setState(() => ({ peer }))
      // console.log('peer', peer)
      // console.log('this.state.peer', this.state.peer)
      peer.on('open', (peerId) => {
        // console.log('peerId', peerId)
      })

      peer.on('close', () => {
        // console.log('peer close')
        this.resetConnection()
      })

      peer.on('disconnected', function() { console.log('peer disconnected') })

      peer.on('error', (error) => {
        // console.log('peer error', error)
        this.handleError('peer')
      })
    } catch (error) {
      this.handleError('peer')
    }
  }

  connectSocket = () => {
    // console.log('connectSocket')
    const { userData, server } = this.props
    // console.log('this.userData', this.userData)
    // const { myId } = this.state
    // console.log('connectSocket userData', userData)
    const socket = io.connect(`${server.protocol}://${server.ip}:${server.port}`)
    this.setState(() => ({ socket }))
    socket.on('connect', () => {
      // console.log('connect')
      socket.emit('login', userData)
      socket.on('alert', (err) => this.handleError(err.code || 'user'))
      socket.on('calling', (data) => {
        // console.log('socket calling', data)
        // ipcRenderer.send('statusForWindow', 'show')
        this.props.onInComing(data)
        this.connectPeer()
        this.audioReload(incomingAudio)
        this.requestWebcam()
        this.setState(() => ({
          touchScreenId: data.touchScreenId,
          inComingCall: true
        }))
        this.checkTalking()
      })
      socket.on('hangup', (id) => {
        this.handlePeerClose()
      })
    })
    socket.on('disconnect', () => {
      // console.log('disconnectttttttttttttttttttt')
      this.shutdownSocketPeerAndCheckRestart()
      // this.destroy()
      // window.location.reload()
    })
    socket.on('connect_error', (error) => {
      console.log('connect_error', error)
      this.shutdownSocketPeerAndCheckRestart()
    })
    socket.on('connect_timeout', (timeout) => {
      console.log('connect_timeout', timeout)
    })
    socket.on('error', (error) => {
      console.log('error', error)
    })
  }

  componentDidMount() {
    const { onlineStatus, userData } = this.props
    console.log('componentDidMount', userData)
    if (onlineStatus) this.connectSocket()
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('prevProps :', prevProps)
    // console.log('this.props :', this.props)
    // console.log('prevState :', prevState)
    // console.log('this.state :', this.state)
    const { onlineStatus } = this.props
    const { socket } = this.state
    try {
      if (prevProps.onlineStatus !== onlineStatus) {
        // console.log('onlineStatus not eual')
        if (onlineStatus) {
          this.connectSocket()
        } else {
          // console.log('socket disconnect')
          socket.disconnect()
          // this.handlePeerClose()
        }
      }
    } catch (error) {
      console.log('componentDidUpdate error', error)
    }
  }

  componentWillUnmount() { this.destroy() }

  render() {
    const { myVideoStream, theirVideoStream, audio, inComingCall, talking } = this.state
    const myVideoUrl = (myVideoStream) ? URL.createObjectURL(myVideoStream) : ''
    const theirVideoUrl = (theirVideoStream) ? URL.createObjectURL(theirVideoStream) : ''
    const myVideo = () => <video ref={c => { this.myVideoRef = c }} className='upper-video' src={myVideoUrl} muted autoPlay />
    const theirVideo = () => <video ref={c => { this.theirVideoRef = c }} className='lower-video' src={theirVideoUrl} autoPlay poster={profileImg} />

    return (<div ref={c => { this.videoContainer = c }} id='video-call-container' className='video-call-container'>
      {this.props.videoUI(myVideo, theirVideo, this.handleHangUp, this.handleAccept, inComingCall, talking)}
      <audio ref={c => { this.audioRef = c }} className='audio' loop autoPlay><source src={audio} type='audio/mpeg' /></audio>
    </div>)
  }
}
