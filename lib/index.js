'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp2;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _profile = require('../images/profile.png');

var _profile2 = _interopRequireDefault(_profile);

var _busy = require('../audios/busy.mp3');

var _busy2 = _interopRequireDefault(_busy);

var _incoming = require('../audios/incoming.mp3');

var _incoming2 = _interopRequireDefault(_incoming);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VideoCall = (_temp2 = _class = function (_PureComponent) {
  _inherits(VideoCall, _PureComponent);

  function VideoCall() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, VideoCall);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = VideoCall.__proto__ || Object.getPrototypeOf(VideoCall)).call.apply(_ref, [this].concat(args))), _this), _this.checkTalkingTimeOut = false, _this.checkBusyAudioTimeOut = false, _this.state = {
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
    }, _this.configMedia = function () {
      var _this$props = _this.props,
          videoWidth = _this$props.videoWidth,
          videoHeight = _this$props.videoHeight,
          audio = _this$props.audio;

      var mediaOptions = { video: { width: videoWidth, height: videoHeight }, audio: audio };
      return mediaOptions;
    }, _this.resetConnection = function () {
      _this.setState(function () {
        return {
          myVideoStream: '',
          theirVideoStream: '',
          peer: null,
          // socket: null,
          error: false,
          audio: '',
          touchScreenId: null,
          talking: false,
          inComingCall: false
        };
      });
      _this.props.onReload(true);
    }, _this.destroy = function () {
      var _this$state = _this.state,
          myVideoStream = _this$state.myVideoStream,
          peer = _this$state.peer,
          socket = _this$state.socket;

      try {
        if (myVideoStream) myVideoStream.getTracks().forEach(function (mediaTrack) {
          return mediaTrack.stop();
        });
        if (socket) socket.emit('changestatus', 'ready');
        if (peer) peer.destroy();
        _this.audioReload(_busy2.default);
        if (_this.checkBusyAudioTimeOut) clearTimeout(_this.checkBusyAudioTimeOut);
        _this.checkBusyAudioTimeOut = setTimeout(function () {
          _this.audioReload('');
        }, _this.props.delayAfterDisConnect * 1000);
        if (_this.checkTalkingTimeOut) clearTimeout(_this.checkTalkingTimeOut);
      } catch (error) {
        // console.log('error', error)
        _this.resetConnection();
      }
    }, _this.audioReload = function (audio) {
      _this.setState({ audio: audio });
      if (_this.audioRef) {
        _this.audioRef.load();
        _this.audioRef.play().then(function () {
          return null;
        }).catch(function () {
          return null;
        });
      }
    }, _this.handleError = function (data) {
      setTimeout(function () {
        if (_this.videoContainer) {
          _this.props.onErrors(data);
          _this.setState(function () {
            return { error: true };
          });
        }
      }, _this.props.delayAfterDisConnect * 1000);
      _this.destroy();
    }, _this.handleHangUp = function () {
      var _this$state2 = _this.state,
          talking = _this$state2.talking,
          peer = _this$state2.peer,
          socket = _this$state2.socket,
          touchScreenId = _this$state2.touchScreenId;

      if (talking) {
        peer.destroy();
      } else {
        try {
          socket.emit('hangup', touchScreenId);
          _this.handlePeerClose();
        } catch (error) {
          console.log('socket hangup emit', error);
        }
      }
    }, _this.calling = function (call) {
      // console.log('calling calling calling', call);
      call.on('stream', function (stream) {
        // console.log('stream stream stream')
        var userData = _this.props.userData;
        var _this$state3 = _this.state,
            socket = _this$state3.socket,
            touchScreenId = _this$state3.touchScreenId;

        try {
          var comparedData = {
            touchScreenId: touchScreenId,
            callCenterId: '' + userData.id + userData.type
          };
          socket.emit('changestatus', 'already');
          socket.emit('comparedData', comparedData);
          _this.audioReload('');
          _this.props.onCalling(true);
          _this.setState(function () {
            return { theirVideoStream: stream };
          });
        } catch (error) {
          console.log('calling error', error);
        }
      });

      call.on('close', _this.handlePeerClose);
    }, _this.handleAccept = function () {
      var _this$state4 = _this.state,
          talking = _this$state4.talking,
          peer = _this$state4.peer,
          touchScreenId = _this$state4.touchScreenId,
          myVideoStream = _this$state4.myVideoStream;
      // console.log('handleAccept touchScreenId :', touchScreenId);

      if (!talking) {
        // console.log('myVideoStream', myVideoStream);
        var call = peer.call(touchScreenId, myVideoStream);
        _this.calling(call);
      }
      _this.setState(function () {
        return {
          talking: true
        };
      });
    }, _this.handlePeerClose = function () {
      _this.destroy();
      _this.props.onHangUp(true);
    }, _this.checkTalking = function () {
      _this.checkTalkingTimeOut = setTimeout(function () {
        // console.log('checkTalking')
        var _this$state5 = _this.state,
            talking = _this$state5.talking,
            error = _this$state5.error,
            socket = _this$state5.socket,
            touchScreenId = _this$state5.touchScreenId;

        if (talking) return;
        if (error) return;
        try {
          socket.emit('hangup', touchScreenId);
        } catch (error) {
          console.log('socket hangup emit', error);
        }
        _this.handleError('not-available');
      }, _this.props.delayAutoHangUp * 1000);
    }, _this.requestWebcam = function () {
      var mediaOptions = _this.configMedia();
      navigator.getUserMedia(mediaOptions, function (stream) {
        _this.setState(function () {
          return { myVideoStream: stream };
        });
      }, function () {
        return _this.handleError('device');
      });
    }, _this.shutdownSocketPeerAndCheckRestart = function () {
      // console.log('start shutdownSocketPeerAndCheckRestart')
      try {
        var _this$state6 = _this.state,
            socket = _this$state6.socket,
            peer = _this$state6.peer;
        var onlineStatus = _this.props.onlineStatus;
        // console.log('socket', socket)
        // console.log('peer', peer)
        // console.log('onlineStatus', onlineStatus)

        if (socket) socket.close();
        if (peer) peer.destroy();
        if (onlineStatus) _this.connectSocket();
      } catch (error) {
        console.log('socket disconnect error', error);
      }
      // console.log('end shutdownSocketPeerAndCheckRestart')
    }, _this.connectPeer = function () {
      // console.log('connectPeer')
      // debugger;
      try {
        var _this$props2 = _this.props,
            userData = _this$props2.userData,
            server = _this$props2.server;

        var peerId = '' + userData.id + userData.type;
        // console.log('connect peer', peerId);

        var peer = new _peerjs2.default(peerId, {
          host: server.ip,
          port: server.port,
          path: server.path,
          debug: server.debug
        });

        _this.setState(function () {
          return { peer: peer };
        });
        // console.log('peer', peer)
        // console.log('this.state.peer', this.state.peer)
        peer.on('open', function (peerId) {
          // console.log('peerId', peerId)
        });

        peer.on('close', function () {
          // console.log('peer close')
          _this.resetConnection();
        });

        peer.on('disconnected', function () {
          console.log('peer disconnected');
        });

        peer.on('error', function (error) {
          // console.log('peer error', error)
          _this.handleError('peer');
        });
      } catch (error) {
        _this.handleError('peer');
      }
    }, _this.connectSocket = function () {
      // console.log('connectSocket')
      var _this$props3 = _this.props,
          userData = _this$props3.userData,
          server = _this$props3.server;
      // console.log('this.userData', this.userData)
      // const { myId } = this.state
      // console.log('connectSocket userData', userData)

      var socket = _socket2.default.connect(server.protocol + '://' + server.ip + ':' + server.port);
      _this.setState(function () {
        return { socket: socket };
      });
      socket.on('connect', function () {
        // console.log('connect')
        socket.emit('login', userData);
        socket.on('alert', function (err) {
          return _this.handleError(err.code || 'user');
        });
        socket.on('calling', function (data) {
          // console.log('socket calling', data)
          // ipcRenderer.send('statusForWindow', 'show')
          _this.props.onInComing(data);
          _this.connectPeer();
          _this.audioReload(_incoming2.default);
          _this.requestWebcam();
          _this.setState(function () {
            return {
              touchScreenId: data.touchScreenId,
              inComingCall: true
            };
          });
          _this.checkTalking();
        });
        socket.on('hangup', function (id) {
          _this.handlePeerClose();
        });
      });
      socket.on('disconnect', function () {
        // console.log('disconnectttttttttttttttttttt')
        _this.shutdownSocketPeerAndCheckRestart();
        // this.destroy()
        // window.location.reload()
      });
      socket.on('connect_error', function (error) {
        console.log('connect_error', error);
        _this.shutdownSocketPeerAndCheckRestart();
      });
      socket.on('connect_timeout', function (timeout) {
        console.log('connect_timeout', timeout);
      });
      socket.on('error', function (error) {
        console.log('error', error);
      });
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(VideoCall, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _props = this.props,
          onlineStatus = _props.onlineStatus,
          userData = _props.userData;
      // console.log('componentDidMount', userData)

      if (onlineStatus) this.connectSocket();
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      // console.log('prevProps :', prevProps)
      // console.log('this.props :', this.props)
      // console.log('prevState :', prevState)
      // console.log('this.state :', this.state)
      var onlineStatus = this.props.onlineStatus;
      var socket = this.state.socket;

      try {
        if (prevProps.onlineStatus !== onlineStatus) {
          // console.log('onlineStatus not eual')
          if (onlineStatus) {
            this.connectSocket();
          } else {
            // console.log('socket disconnect')
            socket.disconnect();
            // this.handlePeerClose()
          }
        }
      } catch (error) {
        console.log('componentDidUpdate error', error);
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.destroy();
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var _state = this.state,
          myVideoStream = _state.myVideoStream,
          theirVideoStream = _state.theirVideoStream,
          audio = _state.audio,
          inComingCall = _state.inComingCall,
          talking = _state.talking;

      var myVideoUrl = myVideoStream ? URL.createObjectURL(myVideoStream) : '';
      var theirVideoUrl = theirVideoStream ? URL.createObjectURL(theirVideoStream) : '';
      var myVideo = function myVideo() {
        return _react2.default.createElement('video', { ref: function ref(c) {
            _this2.myVideoRef = c;
          }, className: 'upper-video', src: myVideoUrl, muted: true, autoPlay: true });
      };
      var theirVideo = function theirVideo() {
        return _react2.default.createElement('video', { ref: function ref(c) {
            _this2.theirVideoRef = c;
          }, className: 'lower-video', src: theirVideoUrl, autoPlay: true, poster: _profile2.default });
      };

      return _react2.default.createElement(
        'div',
        { ref: function ref(c) {
            _this2.videoContainer = c;
          }, id: 'video-call-container', className: 'video-call-container' },
        this.props.videoUI(myVideo, theirVideo, this.handleHangUp, this.handleAccept, inComingCall, talking),
        _react2.default.createElement(
          'audio',
          { ref: function ref(c) {
              _this2.audioRef = c;
            }, className: 'audio', loop: true, autoPlay: true },
          _react2.default.createElement('source', { src: audio, type: 'audio/mpeg' })
        )
      );
    }
  }]);

  return VideoCall;
}(_react.PureComponent), _class.propTypes = {
  // id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  // type: PropTypes.string,
  // zone: PropTypes.array.isRequired,
  userData: _propTypes2.default.shape({
    id: _propTypes2.default.oneOfType([_propTypes2.default.string, _propTypes2.default.number]).isRequired,
    type: _propTypes2.default.string,
    language: _propTypes2.default.array.isRequired,
    name: _propTypes2.default.string,
    lastname: _propTypes2.default.string
  }),
  server: _propTypes2.default.shape({
    ip: _propTypes2.default.string.isRequired,
    port: _propTypes2.default.number.isRequired,
    path: _propTypes2.default.string.isRequired,
    debug: _propTypes2.default.number,
    protocol: _propTypes2.default.string.isRequired
  }).isRequired,
  videoWidth: _propTypes2.default.number.isRequired,
  videoHeight: _propTypes2.default.number.isRequired,
  audio: _propTypes2.default.bool,
  onlineStatus: _propTypes2.default.bool.isRequired,
  onInComing: _propTypes2.default.func,
  onReload: _propTypes2.default.func,
  onErrors: _propTypes2.default.func,
  onCalling: _propTypes2.default.func,
  onHangUp: _propTypes2.default.func,
  videoUI: _propTypes2.default.func,
  delayAutoHangUp: _propTypes2.default.number.isRequired,
  delayAfterDisConnect: _propTypes2.default.number.isRequired
}, _class.defaultProps = {
  audio: true
}, _temp2);
exports.default = VideoCall;