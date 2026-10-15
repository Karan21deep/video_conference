import React, {useEffect, useRef, useState} from 'react';
import {Mic, MicOff, Video, VideoOff, PhoneOff} from 'lucide-react';
import {WS_URL} from '../services/api';

export default function VideoCall({roomId, role}) {
  const localRef = useRef(null), remoteRef = useRef(null), wsRef = useRef(null), pcRef = useRef(null), streamRef = useRef(null), pendingCandidates = useRef([]);
  const [micOn,setMicOn] = useState(true), [cameraOn,setCameraOn] = useState(true), [status,setStatus] = useState('Connecting signaling…'), [joined,setJoined] = useState(false);
  const send = (obj) => { if (wsRef.current?.readyState===WebSocket.OPEN) wsRef.current.send(JSON.stringify({roomId,type:obj.type,...obj})); };
  useEffect(()=>{
    let alive=true;
    const start=async()=>{
      try {
        const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        if(!alive){stream.getTracks().forEach(t=>t.stop());return;}
        streamRef.current=stream; if(localRef.current)localRef.current.srcObject=stream;
        const pc=new RTCPeerConnection({iceServers:[]}); pcRef.current=pc;
        stream.getTracks().forEach(track=>pc.addTrack(track,stream));
        pc.ontrack=e=>{if(remoteRef.current)remoteRef.current.srcObject=e.streams[0];setStatus('Media connected');};
        pc.onicecandidate=e=>{if(e.candidate)send({type:'ice',candidate:e.candidate});};
        pc.onconnectionstatechange=()=>setStatus(pc.connectionState==='connected'?'Connected':`Call: ${pc.connectionState}`);
        const ws=new WebSocket(WS_URL); wsRef.current=ws;
        ws.onopen=()=>{send({type:'join',role});setJoined(true);setStatus('Waiting for other participant…');};
        ws.onmessage=async event=>{
          const msg=JSON.parse(event.data); if(msg.type==='chat')return;
          try {
            if(msg.type==='peer-joined' && role==='doctor' && !pc.remoteDescription){const offer=await pc.createOffer();await pc.setLocalDescription(offer);send({type:'offer',sdp:offer});}
            else if(msg.type==='offer'){await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));for(const c of pendingCandidates.current)await pc.addIceCandidate(c);pendingCandidates.current=[];const answer=await pc.createAnswer();await pc.setLocalDescription(answer);send({type:'answer',sdp:answer});}
            else if(msg.type==='answer'){await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));for(const c of pendingCandidates.current)await pc.addIceCandidate(c);pendingCandidates.current=[];}
            else if(msg.type==='ice' && msg.candidate){const c=new RTCIceCandidate(msg.candidate);if(pc.remoteDescription)await pc.addIceCandidate(c);else pendingCandidates.current.push(c);}
          } catch(err){console.error(err);setStatus('Call setup error: '+err.message);}
        };
        ws.onerror=()=>setStatus('Signaling connection failed');
      } catch(err) {setStatus(`Camera/microphone unavailable: ${err.message}. Use HTTPS or localhost and allow permissions.`);}
    };
    start();
    return ()=>{alive=false;wsRef.current?.close();pcRef.current?.close();streamRef.current?.getTracks().forEach(t=>t.stop());};
  },[roomId,role]);
  const toggle=(kind)=>{const stream=streamRef.current;const track=stream?.getTracks().find(t=>t.kind===kind);if(track)track.enabled=!track.enabled;if(kind==='audio')setMicOn(Boolean(track?.enabled));else setCameraOn(Boolean(track?.enabled));};
  const end=()=>{wsRef.current?.close();pcRef.current?.close();streamRef.current?.getTracks().forEach(t=>t.stop());setStatus('Call ended');setJoined(false);};
  return <div className="video-shell"><div className="remote-video"><video ref={remoteRef} autoPlay playsInline/><div className="video-placeholder">{status}</div><div className="local-video"><video ref={localRef} autoPlay muted playsInline/></div></div><div className="call-controls"><button onClick={()=>toggle('audio')} title="Toggle microphone" className={!micOn?'muted':''}>{micOn?<Mic/>:<MicOff/>}</button><button onClick={()=>toggle('video')} title="Toggle camera" className={!cameraOn?'muted':''}>{cameraOn?<Video/>:<VideoOff/>}</button><button onClick={end} className="hangup"><PhoneOff/> End consultation</button></div><div className="call-status">{joined?'Signaling connected · ':''}{status}</div></div>;
}
