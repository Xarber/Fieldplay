// SPDX-License-Identifier: AGPL-3.0-only
import { addPlayer, apply, createMatch, disconnect, envelopeSchema, project, tick, uid, type Command, type Match, type View } from '@fieldplay/engine';
export type Credentials={id:string;token:string;code:string;authority:'peer'|'dedicated';hostId:string;expires:number};
export type Status={connection:'offline'|'connecting'|'connected'|'reconnecting';transport:'WebRTC'|'WebSocket'|'none';peers:number;message:string};
type Callbacks={onView:(view:View)=>void;onStatus:(status:Status)=>void;onError:(message:string)=>void;onCredentials?:(c:Credentials)=>void};
export class GameClient {
 private ws?:WebSocket;private channels=new Map<string,RTCDataChannel>();private pcs=new Map<string,RTCPeerConnection>();private pending=new Map<string,RTCIceCandidateInit[]>();private state?:Match;private timer?:ReturnType<typeof setInterval>;private roster:{id:string;name:string;connected:boolean}[]=[];private serial=Promise.resolve();private stopped=false;
 credentials?:Credentials; view?:View;
 status:Status={connection:'offline',transport:'none',peers:0,message:'Not connected'};
 constructor(private callbacks:Callbacks,private factories:{socket?:(url:string)=>WebSocket;peer?:(config:RTCConfiguration)=>RTCPeerConnection}={}){}
 private statusChange(p:Partial<Status>){this.status={...this.status,...p};this.callbacks.onStatus(this.status);}
 async connect(url:string,options:{operation:'create'|'join'|'resume';name:string;code?:string;token?:string;authority?:'peer'|'dedicated';partyName?:string}) {
  this.stopped=false;this.statusChange({connection:'connecting',message:'Connecting to private party…'});
  return new Promise<void>((resolve,reject)=>{
   const ws=this.factories.socket?.(url)??new WebSocket(url);this.ws=ws;
   const deadline=setTimeout(()=>{reject(new Error('Connection timed out. Check the server address.'));ws.close();},15000);
   ws.onopen=()=>ws.send(JSON.stringify({type:'hello',...options}));
   ws.onmessage=e=>{this.serial=this.serial.then(async()=>{
    const msg=JSON.parse(String(e.data));
    if(msg.type==='welcome'){
     clearTimeout(deadline);this.credentials={id:msg.id,token:msg.token??options.token,code:msg.code,authority:msg.authority,hostId:msg.hostId,expires:msg.expires};this.callbacks.onCredentials?.(this.credentials!);
     this.iceServers=msg.iceServers;this.statusChange({connection:'connected',transport:msg.authority==='dedicated'?'WebSocket':'WebRTC',message:msg.authority==='dedicated'?'Dedicated authority connected':'Private peer session · establishing encrypted link'});
     if(msg.authority==='peer'&&msg.id===msg.hostId){if(options.operation==='resume'&&!this.state){this.callbacks.onError('Host state was lost. Create a new party; secrets cannot be safely recovered.');this.close();reject(new Error('Host state unavailable'));return;}this.state??=createMatch({id:msg.id,name:options.name},options.partyName);this.timer=setInterval(()=>{if(this.state?.phase==='active'){this.state=tick(this.state);this.broadcast();}},1000);}
     resolve();
    }else if(msg.type==='roster'){
     this.roster=msg.members;
     if(this.isHost&&this.state){for(const member of this.roster){if(member.connected){if(!this.state.players[member.id]||!this.state.players[member.id].connected)this.state=addPlayer(this.state,member);}else if(this.state.players[member.id]?.connected)this.state=disconnect(this.state,member.id);}this.broadcast();for(const member of this.roster)if(member.connected&&member.id!==this.credentials!.id&&!this.pcs.has(member.id))await this.makePeer(member.id,true);}
     else if(this.credentials?.authority==='peer'&&!this.roster.find(m=>m.id===this.credentials!.hostId)?.connected)this.statusChange({message:'Host disconnected. Match paused. Reconnect or create a new party.'});
    }else if(msg.type==='signal')await this.signal(msg.from,msg.data);
    else if(msg.type==='state')this.receiveView(msg.view);
    else if(msg.type==='error'){this.callbacks.onError(msg.message);if(!this.credentials){clearTimeout(deadline);reject(new Error(msg.message));ws.close();}}
   }).catch(e=>{this.callbacks.onError(e instanceof Error?e.message:'Connection message rejected.');});};
   ws.onerror=()=>{if(!this.credentials){clearTimeout(deadline);reject(new Error('Cannot connect to the server.'));}this.statusChange({message:'Connection error. Check your network and server.'});};
   ws.onclose=()=>{clearTimeout(deadline);if(!this.stopped)this.statusChange({connection:'reconnecting',message:'Connection interrupted. Reconnect to resume safely.'});};
  });
 }
 private iceServers:RTCIceServer[]=[];
 get isHost(){return this.credentials?.authority==='peer'&&this.credentials.id===this.credentials.hostId;}
 private receiveView(v:View){if(this.view&&this.view.id===v.id&&this.view.revision>v.revision)return;this.view=v;this.callbacks.onView(v);}
 private sendSignal(to:string,data:unknown){this.ws?.send(JSON.stringify({type:'signal',to,data}));}
 private async makePeer(id:string,offer:boolean) {
  const config={iceServers:this.iceServers};const pc=this.factories.peer?.(config)??new RTCPeerConnection(config);this.pcs.set(id,pc);
  pc.onicecandidate=e=>{if(e.candidate)this.sendSignal(id,{candidate:e.candidate.toJSON()});};
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'||pc.connectionState==='disconnected'||pc.connectionState==='closed'){if(this.isHost&&this.state?.players[id]?.connected){this.state=disconnect(this.state,id);this.broadcast();}this.statusChange({peers:[...this.channels.values()].filter(c=>c.readyState==='open').length,message:'Peer link interrupted. Match paused; reconnect safely.'});}};
  pc.ondatachannel=e=>this.attachChannel(id,e.channel);
  if(offer){const channel=pc.createDataChannel('fieldplay-v1',{ordered:true});this.attachChannel(id,channel);await pc.setLocalDescription(await pc.createOffer());this.sendSignal(id,{description:pc.localDescription});}return pc;
 }
 private attachChannel(id:string,channel:RTCDataChannel) {
  this.channels.set(id,channel);
  channel.onopen=()=>{this.statusChange({peers:[...this.channels.values()].filter(c=>c.readyState==='open').length,message:'Encrypted WebRTC DataChannel connected'});if(this.isHost)this.broadcast();};
  channel.onmessage=e=>{
   try{if(String(e.data).length>32768)throw new Error('Peer message too large.');const packet=JSON.parse(String(e.data));if(this.isHost){if(packet.type!=='command')throw new Error('Invalid peer packet.');const parsed=envelopeSchema.parse(packet.envelope);this.execute(id,parsed.id,parsed.command);}else if(id===this.credentials?.hostId){if(packet.type==='state')this.receiveView(packet.view);else if(packet.type==='error')this.callbacks.onError(packet.message);}}catch(e){const message=e instanceof Error?e.message:'Invalid command.';if(this.isHost&&channel.readyState==='open')channel.send(JSON.stringify({type:'error',message}));else this.callbacks.onError(message);}
  };
  channel.onclose=()=>{this.statusChange({peers:[...this.channels.values()].filter(c=>c.readyState==='open').length,message:'Peer disconnected. Match is paused.'});if(this.isHost&&this.state?.players[id]?.connected){this.state=disconnect(this.state,id);this.broadcast();}};
 }
 private async signal(from:string,data:{description?:RTCSessionDescriptionInit;candidate?:RTCIceCandidateInit}) {
  if(!this.credentials||from!==this.credentials.hostId&&!this.isHost)throw new Error('Unauthorized signaling peer.');
  const pc=this.pcs.get(from)??await this.makePeer(from,false);
  if(data.description){await pc.setRemoteDescription(data.description);for(const c of this.pending.get(from)??[])await pc.addIceCandidate(c);this.pending.delete(from);if(data.description.type==='offer'){await pc.setLocalDescription(await pc.createAnswer());this.sendSignal(from,{description:pc.localDescription});}}
  else if(data.candidate){if(pc.remoteDescription)await pc.addIceCandidate(data.candidate);else this.pending.set(from,[...(this.pending.get(from)??[]),data.candidate]);}
 }
 private execute(actor:string,id:string,command:Command){if(!this.state)throw new Error('Authority is unavailable.');this.state=apply(this.state,actor,id,command);if(command.type==='kick'){this.ws?.send(JSON.stringify({type:'remove',playerId:command.playerId}));this.channels.get(command.playerId)?.close();this.pcs.get(command.playerId)?.close();}this.broadcast();}
 private broadcast(){if(!this.state||!this.credentials)return;this.receiveView(project(this.state,this.credentials.id));for(const [id,ch]of this.channels)if(ch.readyState==='open'&&this.state.players[id]?.connected)ch.send(JSON.stringify({type:'state',view:project(this.state,id)}));}
 send(command:Command){const id=uid();if(!this.credentials)throw new Error('Join a party first.');if(this.isHost)this.execute(this.credentials.id,id,command);else if(this.credentials.authority==='dedicated'&&this.ws?.readyState===1)this.ws.send(JSON.stringify({type:'command',envelope:{id,command}}));else{const channel=this.channels.get(this.credentials.hostId);if(channel?.readyState!=='open')throw new Error('Peer connection is not ready. Check STUN/TURN or use dedicated authority.');channel.send(JSON.stringify({type:'command',envelope:{id,command}}));}}
 close(){this.stopped=true;clearInterval(this.timer);for(const channel of this.channels.values()){channel.onclose=null;channel.close();}for(const pc of this.pcs.values()){pc.onconnectionstatechange=null;pc.close();}this.channels.clear();this.pcs.clear();this.ws?.close();this.statusChange({connection:'offline',transport:'none',peers:0,message:'Disconnected. Location sharing stopped.'});}
}
