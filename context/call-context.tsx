"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useSocket } from "./socket-context"
import { useApp } from "./app-context"
import { WebRTCPeer } from "@/lib/webrtc"

interface CallContextType {
    isInCall: boolean
    callType: "audio" | "video" | null
    isOutgoing: boolean
    otherUser: { id: string; name: string; avatar?: string } | null
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    initiateCall: (userId: string, userName: string, userAvatar: string | undefined, type: "audio" | "video") => void
    answerCall: () => void
    rejectCall: () => void
    endCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children }: { children: ReactNode }) {
    const { socket } = useSocket()
    const { currentUser } = useApp()
    const [isInCall, setIsInCall] = useState(false)
    const [callType, setCallType] = useState<"audio" | "video" | null>(null)
    const [isOutgoing, setIsOutgoing] = useState(false)
    const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [currentCallId, setCurrentCallId] = useState<string | null>(null)
    const [webrtcPeer, setWebrtcPeer] = useState<WebRTCPeer | null>(null)
    const [incomingCall, setIncomingCall] = useState<{
        callId: string
        callerId: string
        callerName: string
        callType: "audio" | "video"
    } | null>(null)
    const callTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])
    const webrtcPeerRef = useRef<WebRTCPeer | null>(null)

    // Sync ref with state for event handlers
    useEffect(() => {
        webrtcPeerRef.current = webrtcPeer
    }, [webrtcPeer])

    useEffect(() => {
        if (!socket) return

        const handleIncomingCall = (data: {
            callId: string
            callerId: string
            callerName: string
            callType: "audio" | "video"
        }) => {
            setIncomingCall(data)

            // Clear queue on new call
            iceCandidatesQueue.current = []

            callTimeoutRef.current = setTimeout(() => {
                if (socket) {
                    socket.emit('call:reject', {
                        callId: data.callId,
                        callerId: data.callerId
                    })

                    saveCallMessage(data.callerId, data.callType, 'missed', 0, false)
                    setIncomingCall(null)

                    const { toast } = require('sonner')
                    toast.error(`Missed call from ${data.callerName}`, {
                        description: data.callType === 'video' ? 'Video call' : 'Voice call',
                        duration: 5000
                    })
                }
            }, 30000)
        }

        const handleCallAnswered = () => {
            console.log('Call answered by receiver')
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current)
            }
        }

        const handleCallRejected = () => {
            console.log('Call rejected by receiver')
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current)
            }
            endCall()
            const { toast } = require('sonner')
            toast.info('Call declined')
        }

        const handleCallEnded = () => {
            console.log('Call ended by other user')
            endCall()
        }

        const handleOffer = async (data: { callId: string; offer: RTCSessionDescriptionInit }) => {
            // If offer comes before we started answering (shouldn't happen in this flow but good safety)
            // We might need to store it if we were doing auto-answer, but here we wait for user action.
            // Actually, handleOffer is for the callee. But we only init peer when answering.
            // Wait, typical flow: 
            // 1. A inits call -> sends 'call:initiate' -> B gets 'call:incoming'
            // 2. B answers -> sends 'call:answer' -> A gets 'call:answered'
            // 3. A creates offer -> sends 'call:offer' -> B gets 'call:offer'
            // So B *should* have peer ready when 'call:offer' arrives if they clicked answer.

            // However, if we change flow to: A sends offer WITH initiate, then B needs to answer and process offer.
            // Current flow seems to be: A waits for 'call:answer' before sending offer?
            // checking initiateCall: 
            // socket.emit('call:initiate', ...) 
            // const offer = await peer.createOffer() 
            // socket.emit('call:offer', ...)
            // It sends BOTH.

            // So B gets 'call:incoming' AND 'call:offer' almost same time.
            // But B hasn't answered yet. 'call:incoming' shows modal. 
            // 'call:offer' logic:
            if (webrtcPeerRef.current) {
                await webrtcPeerRef.current.setRemoteDescription(data.offer)
                const answer = await webrtcPeerRef.current.createAnswer()
                socket.emit('call:answer-sdp', {
                    callId: data.callId,
                    callerId: otherUser?.id, // NOTE: otherUser might be null if not set yet? 
                    // otherUser is set in answerCall. 
                    // We need to ensure we have the ID. 
                    // But wait, handleOffer uses 'otherUser' from closure.
                    answer
                })
            } else {
                // Store offer to process after answer? 
                // Actually, if we haven't answered, we don't have a peer.
                // We should probably store the offer in a specific ref if it comes early?
                // But in `answerCall` we create peer.
                // The `handleOffer` might run before or after `answerCall`.
                // If B clicks answer, `answerCall` runs. 
                // Use a ref for pending offer?
                // Let's rely on the fact that if we haven't answered, we just ignore the offer 
                // and rely on the fact that `initiateCall` sends offer immediately 
                // BUT wait, `handleOffer` just sets remote desc and sends answer.
                // We need to do this ONLY after we decided to answer.
                pendingOfferRef.current = data.offer
            }
        }

        // Actually, the issue is simpler: 
        // A sends offer. B receives offer. B hasn't answered. 
        // B answers. B creates peer. B needs that offer.
        // CURRENT CODE: handleOffer does nothing if webrtcPeer is null.
        // So B never sets remote description!
        // FIX: We need to store the offer if peer is not ready.

        const handleAnswerSDP = async (data: { callId: string; answer: RTCSessionDescriptionInit }) => {
            if (webrtcPeerRef.current) {
                await webrtcPeerRef.current.setRemoteDescription(data.answer)
            }
        }

        const handleIceCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
            if (webrtcPeerRef.current) {
                await webrtcPeerRef.current.addIceCandidate(data.candidate)
            } else {
                iceCandidatesQueue.current.push(data.candidate)
            }
        }

        socket.on('call:incoming', handleIncomingCall)
        socket.on('call:answered', handleCallAnswered)
        socket.on('call:rejected', handleCallRejected)
        socket.on('call:ended', handleCallEnded)
        socket.on('call:offer', handleOffer) // This needs fixing too
        socket.on('call:answer-sdp', handleAnswerSDP)
        socket.on('call:ice-candidate', handleIceCandidate)

        return () => {
            socket.off('call:incoming', handleIncomingCall)
            socket.off('call:answered', handleCallAnswered)
            socket.off('call:rejected', handleCallRejected)
            socket.off('call:ended', handleCallEnded)
            socket.off('call:offer', handleOffer)
            socket.off('call:answer-sdp', handleAnswerSDP)
            socket.off('call:ice-candidate', handleIceCandidate)
        }
    }, [socket, webrtcPeer, otherUser]) // Keeping dep array simple but using refs inside

    const initiateCall = useCallback(async (
        userId: string,
        userName: string,
        userAvatar: string | undefined,
        type: "audio" | "video"
    ) => {
        if (!socket || !currentUser) return

        const callId = `${currentUser.id}-${userId}-${Date.now()}`
        setCurrentCallId(callId)
        setCallType(type)
        setIsOutgoing(true)
        setOtherUser({ id: userId, name: userName, avatar: userAvatar })
        setIsInCall(true)


        const peer = new WebRTCPeer()
        setWebrtcPeer(peer)

        try {
            const stream = await peer.initialize(
                type,
                (remoteStream) => setRemoteStream(remoteStream),
                (candidate) => {
                    socket.emit('call:ice-candidate', {
                        callId,
                        userId: currentUser.id,
                        otherUserId: userId,
                        candidate
                    })
                }
            )
            setLocalStream(stream)


            socket.emit('call:initiate', {
                callId,
                callerId: currentUser.id,
                receiverId: userId,
                callerName: currentUser.name,
                callType: type
            })


            const offer = await peer.createOffer()
            socket.emit('call:offer', {
                callId,
                receiverId: userId,
                offer
            })
        } catch (error) {
            console.error('Error initiating call:', error)
            endCall()
        }
    }, [socket, currentUser])

    const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)

    // Update handleOffer in the useEffect above too, but I can't effectively multi-edit the same block easily due to size.
    // Instead, I will rewrite the useEffect logic AND the answerCall method here.
    // Wait, I already overwrote useEffect in previous step but I left handleOffer logic explicitly saying "This needs fixing too".
    // I need to update that useEffect again to fix handleOffer, AND update answerCall.
    // Let's do answerCall first, then I'll fix the useEffect with another replace.
    // Actually, I can do it all if I target the right lines.

    // Changing strategy: I will replace the previously inserted useEffect block to include the pendingOfferRef logic properly,
    // and then I will replace answerCall.

    // Step 1: Fix handleOffer in useEffect (I'll re-target the useEffect I just wrote or slightly different range if lines shifted).
    // The previous tool call output shows the file content lines shifted.
    // It's safer to just replace `answerCall` first, then go back and fix `handleOffer` logic in the effect? 
    // No, `handleOffer` is inside the effect. 
    // I will modify `answerCall` to process `pendingOfferRef.current`.

    const answerCall = useCallback(async () => {
        if (!socket || !currentUser || !incomingCall) return

        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current)
        }

        setCurrentCallId(incomingCall.callId)
        setCallType(incomingCall.callType)
        setIsOutgoing(false)
        setOtherUser({ id: incomingCall.callerId, name: incomingCall.callerName })
        setIsInCall(true)
        setIncomingCall(null)

        const peer = new WebRTCPeer()
        setWebrtcPeer(peer)
        webrtcPeerRef.current = peer // Update ref immediately for safety

        try {
            const stream = await peer.initialize(
                incomingCall.callType,
                (remoteStream) => setRemoteStream(remoteStream),
                (candidate) => {
                    socket.emit('call:ice-candidate', {
                        callId: incomingCall.callId,
                        userId: currentUser.id,
                        otherUserId: incomingCall.callerId,
                        candidate
                    })
                }
            )
            setLocalStream(stream)

            socket.emit('call:answer', {
                callId: incomingCall.callId,
                callerId: incomingCall.callerId
            })

            // Process pending offer if any
            if (pendingOfferRef.current) {
                await peer.setRemoteDescription(pendingOfferRef.current)
                const answer = await peer.createAnswer()
                socket.emit('call:answer-sdp', {
                    callId: incomingCall.callId,
                    callerId: incomingCall.callerId,
                    answer
                })
                pendingOfferRef.current = null
            }

            // Flush ICE candidate queue
            if (iceCandidatesQueue.current.length > 0) {
                for (const candidate of iceCandidatesQueue.current) {
                    await peer.addIceCandidate(candidate)
                }
                iceCandidatesQueue.current = []
            }

        } catch (error) {
            console.error('Error answering call:', error)
            endCall()
        }
    }, [socket, currentUser, incomingCall])

    const saveCallMessage = async (
        otherUserId: string,
        type: "audio" | "video",
        status: "missed" | "rejected" | "completed" | "cancelled",
        duration: number = 0,
        isOutgoing: boolean
    ) => {
        try {
            if (!currentUser) return



            const chatRes = await fetch(`/api/chats/find?userId=${otherUserId}&currentUserId=${currentUser.id}`)
            const chatData = await chatRes.json()

            if (chatData.chatId) {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: chatData.chatId,
                        senderId: currentUser.id,
                        text: "",
                        type: 'call',
                        callMetadata: {
                            callType: type,
                            duration,
                            status,
                            isOutgoing
                        }
                    })
                })
            }
        } catch (error) {
            console.error('Error saving call message:', error)
        }
    }

    const endCall = useCallback((duration: number = 0) => {
        if (socket && currentCallId && otherUser && currentUser) {
            socket.emit('call:end', {
                callId: currentCallId,
                userId: currentUser.id,
                otherUserId: otherUser.id
            })


            if (duration > 0) {
                saveCallMessage(otherUser.id, callType || 'audio', 'completed', duration, isOutgoing)
            } else {

                saveCallMessage(otherUser.id, callType || 'audio', 'cancelled', 0, isOutgoing)
            }
        }


        webrtcPeer?.close()


        setIsInCall(false)
        setCallType(null)
        setIsOutgoing(false)
        setOtherUser(null)
        setLocalStream(null)
        setRemoteStream(null)
        setCurrentCallId(null)
        setWebrtcPeer(null)
        setIncomingCall(null)
    }, [socket, currentCallId, otherUser, currentUser, webrtcPeer, callType, isOutgoing])

    const rejectCall = useCallback(() => {
        if (!socket || !incomingCall) return


        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current)
        }

        socket.emit('call:reject', {
            callId: incomingCall.callId,
            callerId: incomingCall.callerId
        })


        saveCallMessage(incomingCall.callerId, incomingCall.callType, 'rejected', 0, false)

        setIncomingCall(null)
    }, [socket, incomingCall])

    const value: CallContextType = {
        isInCall,
        callType,
        isOutgoing,
        otherUser,
        localStream,
        remoteStream,
        initiateCall,
        answerCall,
        rejectCall,
        endCall
    }

    return (
        <CallContext.Provider value={value}>
            {children}
            { }
            {incomingCall && !isInCall && (
                <div className="fixed inset-0 z-[999]">
                    { }
                    {typeof window !== 'undefined' && (
                        <>
                            { }
                            <IncomingCallModalWrapper
                                callerName={incomingCall.callerName}
                                callType={incomingCall.callType}
                                onAccept={answerCall}
                                onReject={rejectCall}
                            />
                        </>
                    )}
                </div>
            )}
        </CallContext.Provider>
    )
}


function IncomingCallModalWrapper(props: any) {
    const IncomingCallModal = require('@/components/call/incoming-call-modal').default
    return <IncomingCallModal {...props} />
}

export function useCall() {
    const context = useContext(CallContext)
    if (!context) {
        throw new Error("useCall must be used within CallProvider")
    }
    return context
}
