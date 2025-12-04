// WebRTC utility functions for managing peer connections

export interface CallConfig {
    iceServers: RTCIceServer[]
}

export const defaultConfig: CallConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
}

export class WebRTCPeer {
    private peerConnection: RTCPeerConnection | null = null
    private localStream: MediaStream | null = null
    private remoteStream: MediaStream | null = null
    private onRemoteStream?: (stream: MediaStream) => void
    private onIceCandidate?: (candidate: RTCIceCandidate) => void

    constructor(
        private config: CallConfig = defaultConfig
    ) { }

    async initialize(
        callType: 'audio' | 'video',
        onRemoteStream: (stream: MediaStream) => void,
        onIceCandidate: (candidate: RTCIceCandidate) => void
    ) {
        this.onRemoteStream = onRemoteStream
        this.onIceCandidate = onIceCandidate

        // Get user media
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            })
        } catch (error) {
            console.error('Error accessing media devices:', error)
            throw new Error('Could not access camera/microphone')
        }

        // Create peer connection
        this.peerConnection = new RTCPeerConnection(this.config)

        // Add local stream tracks to peer connection
        this.localStream.getTracks().forEach(track => {
            if (this.localStream && this.peerConnection) {
                this.peerConnection.addTrack(track, this.localStream)
            }
        })

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream()
                if (this.onRemoteStream) {
                    this.onRemoteStream(this.remoteStream)
                }
            }
            this.remoteStream.addTrack(event.track)
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidate) {
                this.onIceCandidate(event.candidate)
            }
        }

        return this.localStream
    }

    async createOffer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized')
        }

        const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        })

        await this.peerConnection.setLocalDescription(offer)
        return offer
    }

    async createAnswer(): Promise<RTCSessionDescriptionInit> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized')
        }

        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        return answer
    }

    async setRemoteDescription(sdp: RTCSessionDescriptionInit) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized')
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized')
        }

        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }

    getLocalStream(): MediaStream | null {
        return this.localStream
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream
    }

    close() {
        // Stop all tracks
        this.localStream?.getTracks().forEach(track => track.stop())
        this.remoteStream?.getTracks().forEach(track => track.stop())

        // Close peer connection
        this.peerConnection?.close()

        this.localStream = null
        this.remoteStream = null
        this.peerConnection = null
    }
}
