// Independent cycles keep fish at different depths while respecting their body size.
export function fishDepth({id,time,dt,surface,bed,size=1,current}) {
 let seed=0;for(const c of String(id))seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
 const clearance=Math.max(.12,size*.65);
 const lower=bed+clearance, upper=surface-clearance;
 if(lower>=upper)return (bed+surface)/2-size*.2;
 const cycle=.5+.5*Math.sin(time*(.075+(seed%17)*.002)+(seed%1000)*.017);
 const target=upper-(upper-lower)*(.08+cycle*.84);
 if(!Number.isFinite(current))return target;
 const step=Math.max(0,dt)*(.35+size*.25);
 return Math.max(lower,Math.min(upper,current+Math.max(-step,Math.min(step,target-current))));
}
