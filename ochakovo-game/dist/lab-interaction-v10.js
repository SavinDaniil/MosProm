/* Interaction quantities are game controls, not a physical or analytical method. */
(() => {
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const flowRate=opening=>opening<=0?0:.5+7.5*clamp(opening,0,100)/100; // tenths of ml / game second
 function integrate(volume,carry,opening,seconds){
  const quantity=carry+flowRate(opening)*clamp(seconds,0,.1),drops=Math.floor(quantity+1e-8);
  return {volume:Math.min(50,volume+drops),carry:quantity-drops,drops};
 }
 function gesture(){
  let distance=0,turns=0,last=null;
  return {move(dx,dy){const length=Math.hypot(dx,dy);if(length<3)return this.progress();distance+=length;if(last&&(dx*last.x+dy*last.y)/(length*last.length)<.25)turns++;last={x:dx,y:dy,length};return this.progress();},progress(){return {distance,turns,ready:distance>=150&&turns>=2,amount:Math.min(1,distance/150,turns/2)};}};
 }
 const refState=(s,repeat)=>({context:repeat?'repeat':'first',lid:repeat?(s.repeatStage===0||s.repeatCover?0:1):(s.cover||s.control&&!s.clean?0:1),well:repeat?(s.repeatStage===0?'residue':s.repeatStage>=2?'sample':''):(s.loaded?'sample':s.control&&!s.clean?'control':''),clean:repeat?s.repeatStage>=1:s.clean,pipette:'',measuring:false});
 window.OchakovoLabInteraction={clamp,flowRate,integrate,gesture,refState};
})();
