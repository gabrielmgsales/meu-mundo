import fs from 'node:fs';
const program=fs.readFileSync('upgrade.py','utf8');
let s=fs.readFileSync('game.js','utf8').replace(/^\uFEFF/,''), a=0,b=0;
function stringAt(index){
 while(/\s/.test(program[index]))index++;
 const quote=program[index]; if(quote!=="'"&&quote!=='"')throw new Error('Expected string at '+program.slice(index,index+50));
 const delimiter=program.slice(index,index+3)===quote.repeat(3)?quote.repeat(3):quote;
 let value='';index+=delimiter.length;
 while(index<program.length){
  if(program.slice(index,index+delimiter.length)===delimiter)return {value,end:index+delimiter.length};
  if(program[index]==='\\'){index++;const c=program[index++];value+=({n:'\n',r:'\r',t:'\t'}[c]??c);}else value+=program[index++];
 }
 throw new Error('Unterminated');
}
const regex=/^(replace\(|a=s\.index\(|s=s\[:a\]\+)/gm;let match;
while((match=regex.exec(program))){
 if(match[1]==='replace('){const old=stringAt(regex.lastIndex);const next=stringAt(program.indexOf(',',old.end)+1);if(!s.includes(old.value))throw new Error('Missing: '+old.value);s=s.replace(old.value,next.value);regex.lastIndex=next.end;}
 else if(match[1]==='a=s.index('){const first=stringAt(regex.lastIndex);const next=stringAt(program.indexOf('b=s.index(',first.end)+10);a=s.indexOf(first.value);b=s.indexOf(next.value,a);if(a<0||b<0)throw new Error('Bad slice '+first.value);regex.lastIndex=next.end;}
 else {const value=stringAt(regex.lastIndex);s=s.slice(0,a)+value.value+s.slice(b);regex.lastIndex=value.end;}
}
fs.writeFileSync('game.js',s);
console.log('Integrated visual and gameplay modules.');
