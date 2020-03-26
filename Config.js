config = {
    HttpsOptions: {
        key: 'key.pem',
        cert: 'cert.pem'
    },
    ServerPort: 8181,
    "ServerIP": "http://192.168.1.36:8181", 
    "iceServers": [{"url": "stun:stun.l.google.com:19302"},
        {"url":"stun:stun1.l.google.com:19302"},
        {"url":"stun:stun2.l.google.com:19302"},
        {"url":"stun:stun3.l.google.com:19302"},
        {"url":"stun:stun4.l.google.com:19302"},
        {
            "url": "turn:numb.viagenie.ca",
            "credential": "muazkh",
            "username": "webrtc@live.com"
        }
    ]
}
module.exports = config;
