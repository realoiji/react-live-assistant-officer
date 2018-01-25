module.exports = {
  name: 'my-react-component',
  classNamePrefix: 'my-react-component',
  serverVideCall: {
    ip: '192.168.1.17',
    port: 9000,
    path: '/peerjs',
    debug: 3,
    protocol: 'http'
  },
  serverRemoteDesktop: 'http://192.168.1.22:8080/guacamole/#/',
  langs: {
    en: {
      key: 'en',
      name: 'English',
      flag: ''
    },
    th: {
      key: 'th',
      name: 'ภาษาไทย',
      flag: ''
    },
    'zh-hans': {
      key: 'zh-hans',
      name: 'Chinese',
      flag: ''
    }
  }
}
