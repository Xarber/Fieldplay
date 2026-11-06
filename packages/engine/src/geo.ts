// SPDX-License-Identifier: AGPL-3.0-only
import type { Arena, Config, Point, Sample } from './schema';
const R = 6371000; const rad = (n: number) => n * Math.PI / 180;
export function distance(a: Point, b: Point): number {
 const dlat=rad(b.latitude-a.latitude), dlon=rad(b.longitude-a.longitude);
 const h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;
 return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function offset(p: Point, meters: number, angle: number): Point {
 return {latitude:p.latitude+meters*Math.cos(angle)/R*180/Math.PI,longitude:p.longitude+meters*Math.sin(angle)/(R*Math.cos(rad(p.latitude)))*180/Math.PI};
}
export function inPolygon(p: Point, vertices: Point[]): boolean {
 let inside=false;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++) { const a=vertices[i],b=vertices[j]; if(((a.latitude>p.latitude)!==(b.latitude>p.latitude)) && p.longitude<(b.longitude-a.longitude)*(p.latitude-a.latitude)/(b.latitude-a.latitude)+a.longitude) inside=!inside; }
 return inside;
}
export function inArena(p: Point, a: Arena): boolean {
 return distance(p,a.center)<=a.radius && (!a.polygon || inPolygon(p,a.polygon)) && !a.exclusions.some(e=>distance(p,e.center)<=e.radius);
}
export function discoveryZone(p: Point, stages: Config['discovery'], elapsed: number, seed: number) {
 const radius=[...stages].reverse().find(s=>s.after<=elapsed)?.radius ?? stages[0].radius;
 // Center is offset from the objective; target is ALWAYS inside, never exactly marked.
 return {center:offset(p,radius*0.35,seed),radius};
}
export function survivalZone(a: Arena, elapsed: number, duration: number) { return {center:a.center,radius:Math.max(30,a.radius*(1-0.8*Math.min(1,elapsed/duration)))}; }
export function fresh(s: Sample | undefined, now: number): s is Sample { return !!s && s.accuracy<=30 && now-s.timestamp<=15000 && s.timestamp<=now+3000; }
export function near(s: Sample | undefined,p: Point, radius: number,now: number) { return fresh(s,now) && distance(s,p)+s.accuracy<=radius; }
