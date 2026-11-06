// SPDX-License-Identifier: AGPL-3.0-only
export * from './schema'; export * from './geo';
import { commandSchema, configSchema, defaultConfig, type Config, type Point, type Sample, type Command } from './schema';
import { distance, discoveryZone, fresh, inArena, near, offset, survivalZone } from './geo';
export type Phase = 'lobby'|'return'|'active'|'paused'|'finished';
export type Ability = 'scanner'|'radar'|'ghost'|'decoy'|'shield'|'rescue'|'jammer'|'proximity';
export type Player = { id:string; name:string; team:'violet'|'lime'; ready:boolean; consent:boolean; returned:boolean; score:number; captured:boolean; connected:boolean; cargo:boolean; samples:Sample[]; abilities:Partial<Record<Ability,{until:number; cooldown:number; charges:number}>> };
type Treasure = {owner:string;position:Point;clue:string;kind:'virtual'|'physical'|'qr';code:string;hunter?:string;foundBy?:string;seed:number};
export type Match = {id:string;name:string;hostId:string;cohosts:string[];players:Record<string,Player>;config:Config;phase:Phase;previousPhase?:Phase;createdAt:number;startedAt?:number;pausedAt?:number;revision:number;treasures:Record<string,Treasure>;processed:string[];banned:string[];interactions:{id:string;actor:string;target:string;expires:number}[];chat:{id:string;player:string;text:string;at:number}[];events:{text:string;at:number}[];checkpoints:{owner?:'violet'|'lime';progress:number;claimant?:string;lastTick?:number}[];teamScores:{violet:number;lime:number};winner?:string;finishedAt?:number;lastTick?:number;results:{at:number;mode:string;winner:string;scores:{name:string;score:number}[]}[];simulation:boolean};
export function uid() { const bytes=new Uint8Array(16); globalThis.crypto.getRandomValues(bytes); return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join(''); }
export function createMatch(host:{id:string;name:string}, name='Weekend explorers', now=Date.now()):Match {
 const m:Match={id:uid(),name,hostId:host.id,cohosts:[],players:{},config:defaultConfig(),phase:'lobby',createdAt:now,revision:0,treasures:{},processed:[],banned:[],interactions:[],chat:[],events:[],checkpoints:[],teamScores:{violet:0,lime:0},results:[],simulation:false};
 return addPlayer(m,host,now);
}
function requireRule(ok:unknown,text:string):asserts ok { if(!ok) throw new Error(text); }
export function addPlayer(m:Match,p:{id:string;name:string},now=Date.now()):Match {
 requireRule(!m.banned.includes(p.id),'You cannot join this party.');
 requireRule(m.phase==='lobby'||!!m.players[p.id],'Match already started.');
 requireRule(Object.keys(m.players).length<20 || !!m.players[p.id],'Party is full.');
 const next=structuredClone(m);
 if(next.players[p.id]) next.players[p.id].connected=true;
 else next.players[p.id]={id:p.id,name:p.name.slice(0,32),team:Object.keys(m.players).length%2?'lime':'violet',ready:false,consent:false,returned:false,score:0,captured:false,connected:true,cargo:false,samples:[],abilities:{}};
 next.revision++; next.events.push({text:`${p.name} joined the party`,at:now}); return next;
}
function announce(m:Match,text:string,now:number) {m.events.push({text,at:now});m.events=m.events.slice(-30);}
function finish(m:Match,winner:string,now:number) {
 m.phase='finished';m.winner=winner;m.finishedAt=now;
 m.results.unshift({at:now,mode:m.config.mode,winner,scores:Object.values(m.players).map(p=>({name:p.name,score:p.score}))});m.results=m.results.slice(0,20);
 for(const p of Object.values(m.players)) {p.consent=false;p.samples=[];p.abilities={};}
 m.interactions=[]; m.treasures={}; announce(m,'Match complete. Location sharing stopped.',now);
}
export function disconnect(m:Match,id:string,now=Date.now()):Match {
 const n=structuredClone(m); if(n.players[id]) {n.players[id].connected=false;n.players[id].samples=[];n.players[id].ready=false;}
 if((id===n.hostId || n.phase==='active'||n.phase==='return') && n.phase!=='finished' && n.phase!=='paused' && n.phase!=='lobby') {n.previousPhase=n.phase;n.phase='paused';n.pausedAt=now;announce(n,'Connection lost. Match safely paused.',now);}n.revision++;return n;
}
function checkLocation(p:Player,point:Point,m:Match,now:number) { requireRule(p.consent,'Accept location sharing first.');requireRule(near(p.samples.at(-1),point,m.config.interactionRadius,now),'A fresh, accurate GPS fix inside the interaction area is required.'); }
export function apply(m:Match,actor:string,eventId:string,input:Command|unknown,now=Date.now()):Match {
 requireRule(!!m.players[actor] && m.players[actor].connected,'Not a connected party member.');
 if(m.processed.includes(eventId))return m;
 const c=commandSchema.parse(input);const n=structuredClone(m);const p=n.players[actor];const host=actor===n.hostId||n.cohosts.includes(actor);
 const admin=()=>requireRule(host,'Only a host can do that.'); const lobby=()=>requireRule(n.phase==='lobby','Return to the lobby first.'); const active=()=>requireRule(n.phase==='active','Match is not active.');
 switch(c.type) {
 case 'configure': admin();lobby();requireRule(c.config.checkpoints.every(x=>inArena(x,c.config.arena)),'Checkpoints must be in the arena.');n.config=configSchema.parse(c.config);n.treasures={};for(const v of Object.values(n.players))v.ready=false;break;
 case 'consent': p.consent=c.accepted;if(!c.accepted) {p.samples=[];p.ready=false;if(n.phase==='active'||n.phase==='return'){n.previousPhase=n.phase;n.phase='paused';n.pausedAt=now;announce(n,'Location sharing stopped. Safety pause.',now);}} break;
 case 'ready': lobby();requireRule(!c.ready||p.consent,'Review and accept the location rules first.');if(c.ready&&n.config.mode==='treasure')requireRule(n.treasures[actor],'Register your treasure first.');p.ready=c.ready;break;
 case 'team': admin();lobby();requireRule(!!n.players[c.playerId],'Unknown player.');n.players[c.playerId].team=c.team;for(const v of Object.values(n.players))v.ready=false;break;
 case 'cohost': admin();lobby();requireRule(!!n.players[c.playerId],'Unknown player.');n.cohosts=n.cohosts.includes(c.playerId)?n.cohosts.filter(x=>x!==c.playerId):[...n.cohosts,c.playerId];break;
 case 'treasure': lobby();requireRule(n.config.mode==='treasure','Choose Treasure Hunt.');requireRule(inArena(c.position,n.config.arena),'Treasure must be inside the arena, outside exclusions.');checkLocation(p,c.position,n,now);n.treasures[actor]={owner:actor,position:c.position,clue:c.clue,kind:c.kind,code:uid(),seed:parseInt(uid().slice(0,6),16)/0xffffff*Math.PI*2};p.ready=false;break;
 case 'location': {
 requireRule(p.consent && ['lobby','return','active'].includes(n.phase),'Location sharing is stopped.');
 const s=c.sample;requireRule(s.timestamp<=now+3000&&now-s.timestamp<=15000,'Stale or future GPS sample.');
 requireRule(s.provenance==='measured'||n.simulation,'Simulated locations are disabled in real games.');
 const last=p.samples.at(-1);requireRule(!last||s.timestamp>last.timestamp,'Out-of-order location sample.');
 if(last && s.timestamp-last.timestamp<60000 && last.accuracy<=30 && s.accuracy<=30)requireRule(distance(last,s)<=Math.max(0,(s.timestamp-last.timestamp)/1000)*12+last.accuracy+s.accuracy+10,'Implausible movement. Stop and retry with a fresh fix.');
 p.samples=[...p.samples.filter(x=>now-x.timestamp<=240000),s].slice(-100);break;
 }
 case 'start': {
 admin();lobby();const players=Object.values(n.players);requireRule(players.length>=2&&players.every(v=>v.ready&&v.consent&&v.connected),'At least two connected, ready players with consent are required.');
 if(n.config.mode!=='treasure')requireRule(players.some(v=>v.team==='violet')&&players.some(v=>v.team==='lime'),'Both teams need a player.');
 if(n.config.mode==='domination')requireRule(n.config.checkpoints.length>=1,'Place at least one checkpoint.');
 if(n.config.mode==='smugglers')requireRule(n.config.checkpoints.length>=2,'Place pickup and delivery points.');
 n.teamScores={violet:0,lime:0};n.checkpoints=n.config.checkpoints.map(()=>({progress:0}));
 if(n.config.mode==='treasure') {
 requireRule(players.every(v=>n.treasures[v.id]),'Every player needs a treasure.');
 // CSPRNG Fisher–Yates followed by a cycle: bijective derangement, no self assignment.
 const ids=players.map(v=>v.id);for(let i=ids.length-1;i>0;i--){const bytes=new Uint32Array(1);let r:number;const bound=Math.floor(0x100000000/(i+1))*(i+1);do{crypto.getRandomValues(bytes);r=bytes[0];}while(r>=bound);const j=r%(i+1);[ids[i],ids[j]]=[ids[j],ids[i]];}
 ids.forEach((id,i)=>{n.treasures[ids[(i+1)%ids.length]].hunter=id;});n.phase='return';announce(n,'Treasures assigned. Return to the starting area.',now);
 }else{n.phase='active';n.startedAt=now;n.lastTick=now;announce(n,'The match is live.',now);}break;
 }
 case 'returned': requireRule(n.phase==='return','Not in the return phase.');checkLocation(p,n.config.arena.center,n,now);p.returned=true;if(Object.values(n.players).every(v=>v.returned)){n.phase='active';n.startedAt=now;n.lastTick=now;announce(n,'Everyone is back. The hunt begins!',now);}break;
 case 'verify': {active();requireRule(n.config.mode==='treasure','Not a treasure game.');const t=Object.values(n.treasures).find(t=>t.hunter===actor);requireRule(t&&!t.foundBy,'No remaining assignment.');requireRule(t.code===c.code,'Invalid or already used treasure code.');checkLocation(p,t.position,n,now);t.foundBy=actor;p.score+=100+Math.max(0,Math.floor((n.config.duration-(now-n.startedAt!)/1000)/10));announce(n,`${p.name} found a treasure!`,now);if(n.config.victory==='first'||Object.values(n.treasures).every(t=>t.foundBy))finish(n,p.name,now);break;}
 case 'capture': {active();requireRule(n.config.mode==='manhunt'||n.config.mode==='smugglers','Captures are unavailable.');const t=n.players[c.target];requireRule(t&&t.team!==p.team&&!t.captured&&p.team==='violet','Choose an opposing runner.');requireRule(!t.abilities.shield||t.abilities.shield.until<=now,'That player is shielded.');checkLocation(p,t.samples.at(-1)??{latitude:0,longitude:0},n,now);requireRule(fresh(t.samples.at(-1),now),'Other player needs a fresh GPS fix.');requireRule(!n.interactions.some(i=>i.actor===actor&&i.target===t.id&&i.expires>now),'Confirmation already requested.');n.interactions.push({id:uid(),actor,target:t.id,expires:now+30000});announce(n,`${p.name} requested a non-contact confirmation.`,now);break;}
 case 'confirm': {active();const i=n.interactions.find(i=>i.id===c.interactionId&&i.target===actor&&i.expires>now);requireRule(i,'Confirmation expired or belongs to another player.');const a=n.players[i.actor];requireRule(a&&a.consent&&p.consent,'Location consent required.');checkLocation(p,a.samples.at(-1)??{latitude:0,longitude:0},n,now);requireRule(fresh(a.samples.at(-1),now),'Hunter needs a fresh GPS fix.');requireRule(!p.abilities.shield||p.abilities.shield.until<=now,'Shield is active.');a.score+=50;n.teamScores.violet+=50;if(n.config.mode==='manhunt')p.captured=true;else{requireRule(p.cargo,'No cargo to intercept.');p.cargo=false;}n.interactions=n.interactions.filter(x=>x.target!==actor);announce(n,`${p.name} confirmed the encounter.`,now);if(n.config.mode==='manhunt'&&Object.values(n.players).filter(v=>v.team==='lime').every(v=>v.captured))finish(n,'Hunters',now);break;}
 case 'claim': {active();requireRule(n.config.mode==='domination','Not a territory game.');const point=n.config.checkpoints[c.checkpoint];requireRule(point,'Unknown checkpoint.');if(n.config.movingHill)requireRule(c.checkpoint===Math.floor((now-n.startedAt!)/60000)%n.checkpoints.length,'This hill is inactive.');checkLocation(p,point,n,now);const samples=p.samples.filter(s=>now-s.timestamp<=20000&&near(s,point,n.config.interactionRadius,now));requireRule(samples.length>=3&&samples.at(-1)!.timestamp-samples[0].timestamp>=5000,'Stay here for three accurate GPS samples spanning five seconds.');const cp=n.checkpoints[c.checkpoint];if(cp.owner!==p.team){if(cp.claimant!==p.team){cp.progress=0;cp.claimant=p.team;}requireRule(!cp.lastTick||now-cp.lastTick>=5000,'Hold position before claiming again.');cp.progress=Math.min(100,cp.progress+25);cp.lastTick=now;if(cp.progress===100){cp.owner=p.team;p.score+=25;announce(n,`${p.name} captured checkpoint ${c.checkpoint+1}.`,now);}}break;}
 case 'pickup': active();requireRule(n.config.mode==='smugglers'&&p.team==='lime'&&!p.cargo,'Only an empty-handed courier can collect cargo.');checkLocation(p,n.config.checkpoints[0],n,now);p.cargo=true;announce(n,`${p.name} collected sealed cargo.`,now);break;
 case 'deliver': active();requireRule(n.config.mode==='smugglers'&&p.team==='lime'&&p.cargo,'No cargo to deliver.');checkLocation(p,n.config.checkpoints[1],n,now);p.cargo=false;p.score+=100;n.teamScores.lime+=100;announce(n,`${p.name} completed a delivery.`,now);break;
 case 'ability': {
 active();requireRule(!p.captured,'Captured players cannot use abilities.');const old=p.abilities[c.ability];requireRule(!old||(old.cooldown<=now&&old.charges>0),'Ability is recharging or out of charges.');
 const permitted:Record<Ability,boolean>={scanner:n.config.mode==='treasure',radar:p.team==='violet'&&n.config.mode!=='treasure',ghost:p.team==='lime',decoy:p.team==='lime',shield:true,rescue:p.team==='lime'&&n.config.mode==='manhunt',jammer:p.team==='lime',proximity:true};requireRule(permitted[c.ability],'Ability unavailable for this role.');
 if(c.ability==='rescue'){const target=Object.values(n.players).find(v=>v.team===p.team&&v.captured&&fresh(v.samples.at(-1),now)&&near(p.samples.at(-1),v.samples.at(-1)!,n.config.interactionRadius,now));requireRule(target,'Stand near a captured teammate to rescue.');target.captured=false;p.score+=25;}
 p.abilities[c.ability]={until:now+15000,cooldown:now+60000,charges:(old?.charges??3)-1};announce(n,`${p.name} activated an ability.`,now);break;
 }
 case 'pause': requireRule(n.phase==='active'||n.phase==='return','Nothing to pause.');n.previousPhase=n.phase;n.phase='paused';n.pausedAt=now;for(const v of Object.values(n.players))v.samples=[];announce(n,'Safety pause. Location transmission stopped.',now);break;
 case 'resume': admin();requireRule(n.phase==='paused','Match is not paused.');requireRule(Object.values(n.players).every(v=>v.consent&&v.connected),'Everyone must reconnect and consent before resuming.');if(n.startedAt)n.startedAt+=now-n.pausedAt!;n.lastTick=now;n.phase=n.previousPhase??'active';announce(n,'Match resumed.',now);break;
 case 'end': admin();requireRule(n.phase!=='finished'&&n.phase!=='lobby','No running match.');finish(n,'Match ended by host',now);break;
 case 'replay': admin();requireRule(n.phase==='finished','Finish this match first.');n.phase='lobby';n.treasures={};n.checkpoints=[];n.interactions=[];n.teamScores={violet:0,lime:0};n.winner=undefined;n.startedAt=undefined;n.finishedAt=undefined;for(const v of Object.values(n.players)){v.ready=false;v.returned=false;v.captured=false;v.cargo=false;v.score=0;v.consent=false;v.samples=[];v.abilities={};}announce(n,'New round. Register new treasures and review sharing rules.',now);break;
 case 'chat': n.chat.push({id:eventId,player:p.name,text:c.text,at:now});n.chat=n.chat.slice(-80);break;
 case 'report': announce(n,`Integrity report from ${p.name}: ${c.text}`,now);break;
 case 'kick': admin();requireRule(c.playerId!==n.hostId&&!!n.players[c.playerId],'Cannot remove this player.');if(c.ban)n.banned.push(c.playerId);delete n.players[c.playerId];delete n.treasures[c.playerId];if(n.phase!=='lobby'&&n.phase!=='finished')finish(n,'Match ended after roster change',now);break;
 case 'leave': p.consent=false;p.samples=[];p.connected=false;p.ready=false;if(n.phase!=='lobby'&&n.phase!=='finished')finish(n,'Match ended after a player withdrew',now);else if(actor!==n.hostId){delete n.players[actor];delete n.treasures[actor];}break;
 }
 n.processed=[...n.processed,eventId].slice(-2000);n.revision++;return n;
}
export function tick(m:Match,now=Date.now()):Match {
 if(m.phase!=='active')return m;const n=structuredClone(m);const elapsed=(now-n.startedAt!)/1000;
 for(const p of Object.values(n.players))p.samples=p.samples.filter(s=>now-s.timestamp<=240000);
 n.interactions=n.interactions.filter(i=>i.expires>now);
 const dt=Math.min(2,Math.max(0,(now-(n.lastTick??now))/1000));n.lastTick=now;
 if(n.config.mode==='domination')n.checkpoints.forEach((cp,i)=>{if(cp.owner&&(!n.config.movingHill||i===Math.floor(elapsed/60)%n.checkpoints.length))n.teamScores[cp.owner]+=dt;});
 if(elapsed>=n.config.duration){let winner:string;if(n.config.mode==='manhunt')winner=Object.values(n.players).some(v=>v.team==='lime'&&!v.captured)?'Runners':'Hunters';else if(n.config.mode==='treasure'){const ranking=Object.values(n.players).sort((a,b)=>b.score-a.score);winner=ranking[0].score?ranking.filter(p=>p.score===ranking[0].score).map(p=>p.name).join(' & '):'No treasure found';}else winner=n.teamScores.violet===n.teamScores.lime?'Draw':n.teamScores.violet>n.teamScores.lime?'Violet team':'Lime team';finish(n,winner,now);}
 n.revision++;return n;
}
export function project(m:Match,viewerId:string,now=Date.now()) {
 requireRule(m.players[viewerId]?.connected&&!m.banned.includes(viewerId),'Not an authorized viewer.');const self=m.players[viewerId];const elapsed=m.startedAt?Math.max(0,((m.phase==='paused'?m.pausedAt!:now)-m.startedAt)/1000):0;
 const own=m.treasures[viewerId];const assignment=Object.values(m.treasures).find(t=>t.hunter===viewerId);
 const players=Object.values(m.players).map(p=>{
  let location:{position:Point;accuracy:number;timestamp:number;kind:'measured'|'delayed'|'approximate';radius?:number}|undefined;
  const s=p.samples.at(-1);const sharing=m.phase==='active'&&p.consent&&self.consent;
  if(sharing&&s&&now-s.timestamp<=30000&&(p.id===viewerId||p.team===self.team&&m.config.mode!=='treasure'))location={position:{latitude:s.latitude,longitude:s.longitude},accuracy:s.accuracy,timestamp:s.timestamp,kind:'measured'};
  else if(sharing&&m.config.mode!=='treasure'&&(!p.abilities.ghost||p.abilities.ghost.until<=now)&&(!p.abilities.jammer||p.abilities.jammer.until<=now)){
   const snapshot=Math.floor(now/(m.config.pingInterval*1000))*m.config.pingInterval*1000-m.config.pingDelay*1000;
   const delayed=[...p.samples].reverse().find(s=>s.timestamp<=snapshot&&snapshot-s.timestamp<30000);
   if(delayed){const coarse={latitude:Math.round(delayed.latitude*1000)/1000,longitude:Math.round(delayed.longitude*1000)/1000};const decoy=p.abilities.decoy&&p.abilities.decoy.until>now;location={position:decoy?offset(coarse,80,1):coarse,accuracy:Math.max(delayed.accuracy,100),timestamp:delayed.timestamp,kind:'approximate',radius:150};}
  }
  return {id:p.id,name:p.name,team:p.team,ready:p.ready,consent:p.consent,returned:p.returned,score:p.score,captured:p.captured,connected:p.connected,hasTreasure:!!m.treasures[p.id],location,...(p.id===viewerId?{cargo:p.cargo,abilities:p.abilities}:{})};
 });
 let zone=assignment&&m.phase==='active'?discoveryZone(assignment.position,m.config.discovery,elapsed,assignment.seed):undefined;
 if(zone&&self.abilities.scanner&&self.abilities.scanner.until>now)zone=discoveryZone(assignment!.position,[{after:0,radius:Math.max(10,zone.radius*.65)}],0,assignment!.seed);
 return {id:m.id,name:m.name,hostId:m.hostId,cohosts:m.cohosts,config:m.config,phase:m.phase,revision:m.revision,players,serverTime:now,remaining:Math.max(0,m.config.duration-elapsed),teamScores:m.teamScores,winner:m.winner,
  ownTreasure:own?{clue:own.clue,code:own.code,kind:own.kind,position:own.position}:undefined,
  assignment:assignment&&m.phase==='active'?{clue:assignment.clue,kind:assignment.kind,found:!!assignment.foundBy,zone}:undefined,
  survival:m.config.mode==='manhunt'&&m.phase==='active'?survivalZone(m.config.arena,elapsed,m.config.duration):undefined,
  checkpoints:m.checkpoints,interactions:m.interactions.filter(i=>i.target===viewerId||i.actor===viewerId),chat:m.chat,events:m.events.slice(-12),results:m.results,
  proximity:self.abilities.proximity&&self.abilities.proximity.until>now?Object.values(m.players).filter(p=>p.id!==viewerId&&p.team!==self.team&&fresh(p.samples.at(-1),now)&&fresh(self.samples.at(-1),now)&&distance(p.samples.at(-1)!,self.samples.at(-1)!)<100).length:undefined,
  radar:self.abilities.radar&&self.abilities.radar.until>now?players.filter(p=>p.team!==self.team&&p.location).map(p=>({id:p.id,zone:{center:p.location!.position,radius:150}})):undefined,
  simulation:m.simulation};
}
export type View=ReturnType<typeof project>;
