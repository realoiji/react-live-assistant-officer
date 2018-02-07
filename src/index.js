import React, { PureComponent } from 'react'
import io from 'socket.io-client'
import Peer from 'peerjs'
import PropTypes from 'prop-types'

import profileImg from '../images/profile.png'
import busyAudio from '../audios/busy.mp3'
import incomingAudio from '../audios/incoming.mp3'
export default class VideoCall extends PureComponent {
  static propTypes = {
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    zone: PropTypes.array.isRequired,
    server: PropTypes.shape({
      ip: PropTypes.string.isRequired,
      port: PropTypes.number.isRequired,
      path: PropTypes.string.isRequired,
      debug: PropTypes.number,
      protocol: PropTypes.string.isRequired
    }).isRequired,
    videoWidth: PropTypes.number.isRequired,
    videoHeight: PropTypes.number.isRequired,
    audio: PropTypes.bool.isRequired,
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

  constructor(props) {
    super(props)
    this.handlePeerClose = this.handlePeerClose.bind(this)
    this.connectPeer = this.connectPeer.bind(this)
  }

  state = {
    myVideoStream: '',
    theirVideoStream: '',
    socket: null,
    peer: null,
    error: false,
    audio: '',
    touchScreenId: null,
    talking: false,
    inComingCall: false
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
      socket: null,
      error: false,
      audio: '',
      touchScreenId: null,
      talking: false,
      inComingCall: false
    }))
    if (this.props.onlineStatus) this.connectSocket()
    setTimeout(() => {
      this.props.onReload(true)
    }, this.props.delayAfterDisConnect * 1000)
  }

  destroy = () => {
    const { myVideoStream, peer, socket } = this.state
    try {
      if (myVideoStream) myVideoStream.getTracks().forEach(mediaTrack => mediaTrack.stop())
      if (socket) {
        socket.emit('changestatus', 'ready')
        socket.disconnect()
      }
      if (peer) peer.destroy()
      // ipcRenderer.send('statusForWindow', 'hide')
      this.audioReload(busyAudio)
      this.resetConnection()
    } catch (error) {
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
    // const { delayAfterDisConnect } = this.props
    // this.audioReload(busyAudio)
    const { talking, peer } = this.state
    if (talking) {
      peer.destroy()
    } else {
      this.handlePeerClose()
    }
  }

  calling = (call) => {
    call.on('stream', (stream) => {
      const { id, type } = this.props
      const { socket, touchScreenId } = this.state
      const comparedData = {
        touchScreenId: touchScreenId,
        callCenterId: `${id}${type}`
      }
      socket.emit('changestatus', 'already')
      socket.emit('comparedData', comparedData)
      this.audioReload('')
      this.props.onCalling(true)
      this.setState(() => ({ theirVideoStream: stream }))
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

  async handlePeerClose() {
    this.destroy()
    setTimeout(() => {
      this.props.onHangUp(true)
    }, this.props.delayAfterDisConnect * 1000)
  }

  checkTalking = () => setTimeout(() => {
    // console.log('checkTalking')
    const { talking, error } = this.state
    if (talking) return
    if (error) return
    this.handleError('not-available')
  }, this.props.delayAutoHangUp * 1000)

  requestWebcam = () => {
    const mediaOptions = this.configMedia()
    navigator.getUserMedia(mediaOptions, (stream) => {
      this.setState(() => ({ myVideoStream: stream }))
    }, () => this.handleError('device'))
  };

  async connectPeer() {
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

      peer.on('open', (peerId) => {

      })

      peer.on('error', () => this.handleError('peer'))
    } catch (error) {
      this.handleError('peer')
    }
  }

  connectSocket = () => {
    const { id, type, zone, server } = this.props
    const socket = io.connect(`${server.protocol}://${server.ip}:${server.port}`)
    this.setState(() => ({ socket }))
    socket.on('connect', () => {
      const userData = { id, type, zone }
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
    })
  }

  componentDidMount() {
    const { onlineStatus } = this.props
    if (onlineStatus) this.connectSocket()
  }

  componentWillReceiveProps(nextProps) {
    const { id, type, zone, onlineStatus } = this.props
    const { socket } = this.state
    // console.log('componentWillReceiveProps ', onlineStatus)
    // console.log('nextProps', nextProps)
    if (onlineStatus !== nextProps.onlineStatus) {
      if (nextProps.onlineStatus) {
        this.connectSocket()
      } else {
        this.destroy()
      }
    }
    if (zone !== nextProps.zone) {
      const userData = { id, type, zone: nextProps.zone }
      if (socket) socket.emit('login', userData)
    }
  }

  componentWillUnmount() { this.destroy() }

  render() {
    const { myVideoStream, theirVideoStream, audio, inComingCall, talking } = this.state
    const myVideoUrl = (myVideoStream) ? URL.createObjectURL(myVideoStream) : ''
    const theirVideoUrl = (theirVideoStream) ? URL.createObjectURL(theirVideoStream) : ''
    const myVideo = () => <video ref={c => { this.myVideoRef = c }} className='upper-video' src={myVideoUrl} muted autoPlay />
    const theirVideo = () => <video ref={c => { this.theirVideoRef = c }} className='lower-video' src={theirVideoUrl} autoPlay poster={profileImg} />

    return (<div ref={c => { this.videoContainer = c }} className='video-call-container'>
      {this.props.videoUI(myVideo, theirVideo, this.handleHangUp, this.handleAccept, inComingCall, talking)}
      <audio ref={c => { this.audioRef = c }} className='audio' loop autoPlay><source src={audio} type='audio/mpeg' /></audio>
    </div>)
  }
}
