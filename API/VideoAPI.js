var Session = {

    localVideo: document.querySelector('#localVideo'),
    remoteVideo: document.querySelector('#remoteVideo'),   
    
    isChannelReady: false,
    isInitiator: false,
    isStarted: false,

    localStream: undefined,
    remoteStream: undefined,

    pc: undefined,
    remote_pc: undefined,

    pc_config: {},

    sdpConstraints: {},

    socket: undefined,

    constraints: {video: true, audio: true},

    room: undefined,


    ChangeAudioState(){
        this.localStream.getAudioTracks()[0].enabled = !this.localStream.getAudioTracks()[0].enabled;
    },
    
    ChangeVideoState(){
        this.localStream.getVideoTracks()[0].enabled = !this.localStream.getVideoTracks()[0].enabled;
    },

    Hangup() {
        console.log('Hanging up.');
        this._stop();
        this._sendMessage('bye');
        this.socket.disconnect(true);
    },

    Call(room){
        this.socket = io.connect(config.ServerIP);
        this.room=room;
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        this.pc_config.iceServers = config.iceServers;

        console.log('Create or join room', room);
        this.socket.emit('create or join', room);

        this.socket.on('created', function (room){
            console.log('Created room ' + room);
            Session.isInitiator = true;
            Session._getMedia();
            console.log('Getting user media with constraints', Session.constraints);
            Session._checkAndStart();
        });
          
          
          
          
          
           // Handle 'full' message coming back from server:
           // this peer arrived too late :-(
        this.socket.on('full', function (room){
            console.log('Room ' + room + ' is full');
        });
        
        
        
        // Handle 'join' message coming back from server:
        // another peer is joining the channel
        this.socket.on('join', function (room){
            console.log('Another peer made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');
            Session.isChannelReady = true;
            Session.isInitiator = true;
        });
        
        
        
        
        // Handle 'joined' message coming back from server:
        // this is the second peer joining the channel
        this.socket.on('joined', function (room){
            console.log('This peer has joined room ' + room);
            Session.isChannelReady = true;
            // Call getUserMedia()
            //navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
            //localStream = navigator.mediaDevices.getUserMedia(constraints);
            //this.localVideo.srcObject = localStream;
            Session._getMedia();
            console.log('Getting user media with constraints', Session.constraints);
        });
        
        
        
        // Server-sent log message...
        this.socket.on('log', function (array){
            console.log.apply(console, array);
        });

        this.socket.on('message', function (message){
            console.log('Received message:', message);
            if (message == 'got user media') {
                Session._checkAndStart();
            } else if (message.type == 'offer') {
            if (!Session.isInitiator && !Session.isStarted) {
                Session._checkAndStart();
            }
                //remote_pc = new RTCPeerConnection(pc_config, pc_constraints);
                //remote_pc.setRemoteDescription(new RTCSessionDescription(message));
                Session.pc.setRemoteDescription(new RTCSessionDescription(message));
                Session._doAnswer();
            } else if (message.type == 'answer' && Session.isStarted) {
                Session.pc.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type == 'candidate' && Session.isStarted) {
                console.log('Add ice candidate');
                var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
                candidate:message.candidate});
                Session.pc.addIceCandidate(candidate);
            } else if (message == 'bye' && Session.isStarted) {
                Session._handleRemoteHangup();
            }
        });
    },

    async _getMedia()
    {
        this.localStream = await navigator.mediaDevices.getUserMedia(this.constraints);
        this.localVideo.srcObject = this.localStream;
        console.log('Adding local stream.');
        this._sendMessage('got user media');
    },

    _sendMessage(message){
        console.log('Sending message: ', message);
        console.log('Sending room: ', this.room);
        this.socket.emit('message', message, this.room);
    },

    _checkAndStart() {
        console.log("Inside _checkAndStart");
        console.log(!this.isStarted)
        console.log(typeof this.localStream != 'undefined')
        console.log(this.isChannelReady)
        if (!this.isStarted && typeof this.localStream != 'undefined' && this.isChannelReady) {
            console.log("Creating Peer Connction");
            this._createPeerConnection();
            this.isStarted = true;
            if (this.isInitiator) {
                console.log("_doCall");
                this._doCall();
            }
        }
    },


    _createPeerConnection() {
        try {
            //pc = new RTCPeerConnection(pc_config, pc_constraints);
            this.pc = new RTCPeerConnection(this.pc_config);
            
        
            const videoTracks = this.localStream.getVideoTracks();
            const audioTracks = this.localStream.getAudioTracks();
            console.log('Checking devices');
            if (videoTracks.length > 0) {
                console.log(`Using video device: ${videoTracks[0].label}`);
            }
            if (audioTracks.length > 0) {
                console.log(`Using audio device: ${audioTracks[0].label}`);
            }
            
            this.pc.onicecandidate = this._handleIceCandidate;
            console.log('Created RTCPeerConnnection with:\n' +
            ' config: \'' + JSON.stringify(this.pc_config) + '\';\n' + '\'.');
        } 
        catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
        this.pc.ontrack = this._handleRemoteStreamAdded;
        this.pc.onremovestream = this._handleRemoteStreamRemoved;
        this.pc.onconnectionstatechange = this._handleStateChanged.apply(this);

        this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream))
    },

    _handleIceCandidate(event) {
        console.log('_handleIceCandidate event: ', event);
        if (event.candidate) {
            Session._sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            //label: 1,
            id: event.candidate.sdpMid,
            //id: "video",
            candidate: event.candidate.candidate});
        } 
        else {
            console.log('End of candidates.');
        }
    },

    _doCall() {
        console.log('Creating Offer...');
        this.pc.createOffer(this._setLocalAndSendMessage, this._onSignalingError, this.sdpConstraints);
    },

    _onSignalingError(error) {
        console.log('Failed to create signaling message : ' + error.name);
    },
       
    _doAnswer() {
        console.log('Sending answer to peer.');
        this.pc.createAnswer(this._setLocalAndSendMessage, this._onSignalingError, this.sdpConstraints);
    },


    _setLocalAndSendMessage(sessionDescription) {
        console.log("pc = " + JSON.stringify(this.pc))
        Session.pc.setLocalDescription(sessionDescription);
        Session._sendMessage(sessionDescription);
    },

    _handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        this.remoteVideo.srcObject=null;
        //attachMediaStream(remoteVideo, event.stream);
        if (this.remoteVideo.srcObject !== event.streams[0])
        {
            this.remoteVideo.srcObject=event.streams[0];
            console.log('Remote stream attached!!.');
        }
    },
    
    _handleStateChanged(event){
        console.log('State changed: ', this.pc.connectionState)
    },
    
       
    _handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
    },
    
    _handleRemoteHangup() {
        console.log('Session terminated.');
        this._stop();
        this.isInitiator = false;
    },
    
    _stop(){
        this.isStarted = false;
        if (this.pc) this.pc.close();
        this.pc = null;
    }
}