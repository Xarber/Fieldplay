// SPDX-License-Identifier: AGPL-3.0-only
import {build as bundle} from 'esbuild';
import {mkdir,copyFile,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
const root='artifacts/runtime';await mkdir(root,{recursive:true});
const dirty=execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim();if(dirty)throw new Error('Commit intended changes first: runtime source must match one known clean commit.');
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await bundle({entryPoints:['services/server/src/index.ts'],bundle:true,platform:'node',format:'esm',target:'node24',banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},external:['bufferutil','utf-8-validate'],outfile:`${root}/server.mjs`,legalComments:'inline'});
await cp('apps/mobile/dist',`${root}/web`,{recursive:true});await copyFile('LICENSE',`${root}/LICENSE`);await copyFile('deploy/runtime.Dockerfile',`${root}/Dockerfile`);
const source=execFileSync('git',['archive','--format=tar','HEAD'],{maxBuffer:50_000_000});await writeFile(`${root}/source.tar.gz`,gzipSync(source));
await writeFile(`${root}/metadata.json`,JSON.stringify({commit,version:JSON.parse(await readFile('apps/mobile/package.json','utf8')).version,createdAt:new Date().toISOString()},null,2));
let notices='Fieldplay original software: AGPL-3.0-only. See LICENSE.\n\n';
async function packages(dir:string){let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch{return;}for(const e of entries){if(!e.isDirectory()||e.name.startsWith('.'))continue;if(e.name.startsWith('@')){await packages(`${dir}/${e.name}`);continue;}const path=`${dir}/${e.name}`;for(const f of await readdir(path)){if(/^(licen[cs]e|notice)(\.|$)/i.test(f)){try{const contents=await readFile(`${path}/${f}`,'utf8');notices+=`\n\n----- ${e.name}/${f} -----\n${contents}`;}catch{/* Some packages use a license directory instead. */}}}await packages(`${path}/node_modules`);}}
await packages('node_modules');await writeFile(`${root}/web/licenses.txt`,notices);await writeFile(`${root}/THIRD_PARTY_LICENSES.txt`,notices);
console.log(JSON.stringify({commit,directory:root,sourceArchive:'source.tar.gz',locationDataIncluded:false}));
