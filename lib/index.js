'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VideoCall = (_temp = _class = function (_PureComponent) {
  _inherits(VideoCall, _PureComponent);

  function VideoCall(props) {
    _classCallCheck(this, VideoCall);

    var _this = _possibleConstructorReturn(this, (VideoCall.__proto__ || Object.getPrototypeOf(VideoCall)).call(this, props));

    _this.checkTalkingTimeOut = false;
    _this.state = {
      myVideoStream: '',
      theirVideoStream: '',
      socket: null,
      peer: null,
      error: false,
      audio: '',
      touchScreenId: null, // id 2
      inComingCall: false, // true
      talking: false
    };

    _this.configMedia = function () {
      var _this$props = _this.props,
          videoWidth = _this$props.videoWidth,
          videoHeight = _this$props.videoHeight,
          audio = _this$props.audio;

      var mediaOptions = { video: { width: videoWidth, height: videoHeight }, audio: audio };
      return mediaOptions;
    };

    _this.resetConnection = function () {
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
      // setTimeout(() => {
      // console.log('reload')
      _this.props.onReload(true);
      // }, this.props.delayAfterDisConnect * 1000)
    };

    _this.destroy = function () {
      var _this$state = _this.state,
          myVideoStream = _this$state.myVideoStream,
          peer = _this$state.peer,
          socket = _this$state.socket;

      try {
        if (myVideoStream) myVideoStream.getTracks().forEach(function (mediaTrack) {
          return mediaTrack.stop();
        });
        if (socket) socket.emit('changestatus', 'ready');
        if (peer) {
          peer.destroy();
        }
        _this.audioReload(_busy2.default);
        if (_this.checkTalkingTimeOut) {
          clearTimeout(_this.checkTalkingTimeOut);
        }
        // ipcRenderer.send('statusForWindow', 'hide')
      } catch (error) {
        // console.log('error', error)
        _this.resetConnection();
      }
    };

    _this.audioReload = function (audio) {
      _this.setState({ audio: audio });
      if (_this.audioRef) {
        _this.audioRef.load();
        _this.audioRef.play().then(function () {
          return null;
        }).catch(function () {
          return null;
        });
      }
    };

    _this.handleError = function (data) {
      setTimeout(function () {
        if (_this.videoContainer) {
          _this.props.onErrors(data);
          _this.setState(function () {
            return { error: true };
          });
        }
      }, _this.props.delayAfterDisConnect * 1000);
      _this.destroy();
    };

    _this.handleHangUp = function () {
      // const { delayAfterDisConnect } = this.props
      // this.audioReload(busyAudio)
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
    };

    _this.calling = function (call) {
      call.on('stream', function (stream) {
        var _this$props2 = _this.props,
            id = _this$props2.id,
            type = _this$props2.type;
        var _this$state3 = _this.state,
            socket = _this$state3.socket,
            touchScreenId = _this$state3.touchScreenId;

        var comparedData = {
          touchScreenId: touchScreenId,
          callCenterId: '' + id + type
        };
        socket.emit('changestatus', 'already');
        socket.emit('comparedData', comparedData);
        _this.audioReload('');
        _this.props.onCalling(true);
        _this.setState(function () {
          return { theirVideoStream: stream };
        });
      });

      // call.on('close', () => {
      //   console.log('peer close')
      // })
      call.on('close', _this.handlePeerClose);
    };

    _this.handleAccept = function () {
      var _this$state4 = _this.state,
          talking = _this$state4.talking,
          peer = _this$state4.peer,
          touchScreenId = _this$state4.touchScreenId,
          myVideoStream = _this$state4.myVideoStream;

      if (!talking) {
        var call = peer.call(touchScreenId, myVideoStream);
        _this.calling(call);
      }
      _this.setState(function () {
        return {
          talking: true
        };
      });
    };

    _this.checkTalking = function () {
      _this.checkTalkingTimeOut = setTimeout(function () {
        // console.log('checkTalking')
        var _this$state5 = _this.state,
            talking = _this$state5.talking,
            error = _this$state5.error;

        if (talking) return;
        if (error) return;
        _this.handleError('not-available');
      }, _this.props.delayAutoHangUp * 1000);
    };

    _this.requestWebcam = function () {
      var mediaOptions = _this.configMedia();
      navigator.getUserMedia(mediaOptions, function (stream) {
        _this.setState(function () {
          return { myVideoStream: stream };
        });
      }, function () {
        return _this.handleError('device');
      });
    };

    _this.connectSocket = function () {
      var _this$props3 = _this.props,
          id = _this$props3.id,
          type = _this$props3.type,
          zone = _this$props3.zone,
          server = _this$props3.server;

      var socket = _socket2.default.connect(server.protocol + '://' + server.ip + ':' + server.port);
      _this.setState(function () {
        return { socket: socket };
      });
      socket.on('connect', function () {
        var userData = { id: id, type: type, zone: zone };
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
    };

    _this.handlePeerClose = _this.handlePeerClose.bind(_this);
    _this.connectPeer = _this.connectPeer.bind(_this);
    return _this;
  }

  _createClass(VideoCall, [{
    key: 'handlePeerClose',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // console.log('handlePeerClose')
                this.destroy();
                // setTimeout(() => {
                this.props.onHangUp(true);
                // }, this.props.delayAfterDisConnect * 1000)

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function handlePeerClose() {
        return _ref.apply(this, arguments);
      }

      return handlePeerClose;
    }()
  }, {
    key: 'connectPeer',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var _this2 = this;

        var _props, id, type, server, peerId, peer;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // debugger;
                try {
                  _props = this.props, id = _props.id, type = _props.type, server = _props.server;
                  peerId = '' + id + type;
                  peer = new _peerjs2.default(peerId, {
                    host: server.ip,
                    port: server.port,
                    path: server.path,
                    debug: server.debug
                  });

                  this.setState(function () {
                    return { peer: peer };
                  });

                  peer.on('open', function (peerId) {});

                  peer.on('close', function () {
                    _this2.resetConnection();
                  });

                  peer.on('error', function () {
                    return _this2.handleError('peer');
                  });
                } catch (error) {
                  this.handleError('peer');
                }

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function connectPeer() {
        return _ref2.apply(this, arguments);
      }

      return connectPeer;
    }()
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var onlineStatus = this.props.onlineStatus;

      if (onlineStatus) this.connectSocket();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _props2 = this.props,
          id = _props2.id,
          type = _props2.type,
          zone = _props2.zone,
          onlineStatus = _props2.onlineStatus;
      var socket = this.state.socket;
      // console.log('componentWillReceiveProps ', onlineStatus)
      // console.log('nextProps', nextProps)

      if (onlineStatus !== nextProps.onlineStatus) {
        if (nextProps.onlineStatus) {
          this.connectSocket();
        } else {
          // console.log('socket disconnect')
          this.state.socket.disconnect();
          this.handlePeerClose();
        }
      }
      if (zone !== nextProps.zone) {
        var userData = { id: id, type: type, zone: nextProps.zone };
        if (socket) socket.emit('login', userData);
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
      var _this3 = this;

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
            _this3.myVideoRef = c;
          }, className: 'upper-video', src: myVideoUrl, muted: true, autoPlay: true });
      };
      var theirVideo = function theirVideo() {
        return _react2.default.createElement('video', { ref: function ref(c) {
            _this3.theirVideoRef = c;
          }, className: 'lower-video', src: theirVideoUrl, autoPlay: true, poster: _profile2.default });
      };

      return _react2.default.createElement(
        'div',
        { ref: function ref(c) {
            _this3.videoContainer = c;
          }, id: 'video-call-container', className: 'video-call-container' },
        this.props.videoUI(myVideo, theirVideo, this.handleHangUp, this.handleAccept, inComingCall, talking),
        _react2.default.createElement(
          'audio',
          { ref: function ref(c) {
              _this3.audioRef = c;
            }, className: 'audio', loop: true, autoPlay: true },
          _react2.default.createElement('source', { src: audio, type: 'audio/mpeg' })
        )
      );
    }
  }]);

  return VideoCall;
}(_react.PureComponent), _class.propTypes = _defineProperty({
  id: _propTypes2.default.string.isRequired,
  type: _propTypes2.default.string.isRequired,
  zone: _propTypes2.default.array.isRequired,
  server: _propTypes2.default.shape({
    ip: _propTypes2.default.string.isRequired,
    port: _propTypes2.default.number.isRequired,
    path: _propTypes2.default.string.isRequired,
    debug: _propTypes2.default.number,
    protocol: _propTypes2.default.string.isRequired
  }).isRequired,
  videoWidth: _propTypes2.default.number.isRequired,
  videoHeight: _propTypes2.default.number.isRequired,
  audio: _propTypes2.default.bool.isRequired,
  onlineStatus: _propTypes2.default.bool.isRequired,
  onInComing: _propTypes2.default.func,
  onReload: _propTypes2.default.func,
  onErrors: _propTypes2.default.func,
  onCalling: _propTypes2.default.func,
  onHangUp: _propTypes2.default.func,
  videoUI: _propTypes2.default.func,
  delayAutoHangUp: _propTypes2.default.number.isRequired,
  delayAfterDisConnect: _propTypes2.default.number.isRequired
}, 'onlineStatus', _propTypes2.default.bool.isRequired), _temp);
exports.default = VideoCall;