# React Live Assistant Officer
React Live Assistant For Officer


### Getting Started
```
$ npm install react-live-assistant-officer
$ const VideoCall = require('react-live-assistant-officer')
```

### How to use
Insert this code in render
```
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
```

### Option

| Props | type|  Description |
| --- | --- | --- |
| onHangUp | function | callback for hangup
| onErrors | function | callback for erros return not-available, device, peer, user |
| onCalling | function | callback for compared and calling |
| onInComing | function | callback for have incoming call |
| onInComing | function | callback after reload component |
| onlineStatus | boolen | This is online status get true or false |
| id | string | This is machine id |
| type | string | This is machine type ( callcenter ) |
| zone | array | This is machine zone. \ ['en', 'th'] or ['department1', 'department2'] |
| videoWidth | number | video width |
| videoHeight | number | video height |
| audio | boolean | true for enable audio |
| delayAutoHangUp | number | set time when not missed call, auto hangup  |
| delayAfterDisConnect | number | set delay time after hangup |
| server | object | config for call
- ip: 1
- port: 9000
- path: /peerjs
- debug: 3
- protocol: http
|
| videoUI | function | custom UI |


Thank you for your suggestions!