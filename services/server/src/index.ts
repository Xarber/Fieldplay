// SPDX-License-Identifier: AGPL-3.0-only
import { makeServer } from './server';
const iceServers=JSON.parse(process.env.ICE_SERVERS??'[]');
const service=makeServer({port:Number(process.env.PORT??8787),host:process.env.HOST??'127.0.0.1',origins:process.env.ALLOWED_ORIGINS?.split(','),iceServers});
console.log(`Fieldplay private authority/signaling listening on ${await service.listen()}. No location histories are written to disk.`);
for(const s of ['SIGTERM','SIGINT'] as const)process.on(s,()=>{void service.close().then(()=>process.exit(0));});
