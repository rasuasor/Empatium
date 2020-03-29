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
        },
        {
            "url": 'turn:192.158.29.39:3478?transport=udp',
            "credential": 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            "username": '28224511:1379330808'
        },
        {
            "url": 'turn:192.158.29.39:3478?transport=tcp',
            "credential": 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            "username": '28224511:1379330808'
        },
        {
            "url": 'turn:turn.bistri.com:80',
            "credential": 'homeo',
            "username": 'homeo'
        },
        {
            "url": 'turn:turn.anyfirewall.com:443?transport=tcp',
            "credential": 'webrtc',
            "username": 'webrtc'
        }
    ]
}
module.exports = config;
