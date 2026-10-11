import { valveHalfAngleRad } from './kinematics';

/** Schematic tangent route reconstructed from RM956U EM-13.
 * Positive radius: toothed face, negative: belt back. NOT factory coordinates.
 * Наклон оси распредвала берётся из подтверждённого угла клапанов.
 */
const tilt=Math.PI/4-valveHalfAngleRad;
const camX=2.38*Math.SQRT1_2+.55*Math.sin(tilt), camY=2.92*Math.SQRT1_2+.55*Math.cos(tilt);
export const timingWheels = [
 {id:'crank-sprocket',x:0,y:0,r:.25},
 {id:'timing-idler',x:.68,y:.62,r:-.18},
 {id:'cam-pulley-1',x:camX,y:camY,r:.5},
 {id:'water-pump-pulley',x:0,y:1.2,r:-.38},
 {id:'cam-pulley-2',x:-camX,y:camY,r:.5},
 {id:'timing-tensioner',x:-.68,y:.62,r:-.18},
];
const tau=2*Math.PI;
type Segment={length:number;at:(s:number)=>[number,number]};
const tangents=timingWheels.map((a,i)=>{
 const b=timingWheels[(i+1)%timingWheels.length];const dx=b.x-a.x,dy=b.y-a.y;
 const angle=Math.atan2(dy,dx)-Math.acos((a.r-b.r)/Math.hypot(dx,dy));
 return {nx:Math.cos(angle),ny:Math.sin(angle)};
});
export const beltSegments:Segment[]=timingWheels.flatMap((wheel,i)=>{
 const before=tangents[(i+timingWheels.length-1)%timingWheels.length], after=tangents[i];
 const start=Math.atan2(wheel.r*before.ny,wheel.r*before.nx),end=Math.atan2(wheel.r*after.ny,wheel.r*after.nx);
 const sign=Math.sign(wheel.r);const sweep=sign*((sign*(end-start)%tau+tau)%tau);
 const next=timingWheels[(i+1)%timingWheels.length];
 const a=[wheel.x+wheel.r*after.nx,wheel.y+wheel.r*after.ny], b=[next.x+next.r*after.nx,next.y+next.r*after.ny];
 return [{length:Math.abs(sweep*wheel.r),at:(s:number):[number,number]=>[wheel.x+Math.abs(wheel.r)*Math.cos(start+s*sweep),wheel.y+Math.abs(wheel.r)*Math.sin(start+s*sweep)]},{length:Math.hypot(b[0]-a[0],b[1]-a[1]),at:(s:number):[number,number]=>[a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s]}];
});
export const beltLength=beltSegments.reduce((n,s)=>n+s.length,0);
export function beltPoint(distance:number):[number,number]{
 let d=(distance%beltLength+beltLength)%beltLength;
 for(const segment of beltSegments){if(d<=segment.length)return segment.at(d/segment.length);d-=segment.length;}
 return beltSegments[0].at(0);
}
export const beltTravel=(theta:number)=>-.25*theta*Math.PI/180;
