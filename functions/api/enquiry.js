const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clean=(v,n=250)=>typeof v==="string"?v.trim().slice(0,n):"";
const reply=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
export async function onRequestPost({request,env}){
 if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return reply({ok:false,error:"JSON required."},415);
 if(Number(request.headers.get("content-length")||0)>7500)return reply({ok:false,error:"Too much information."},413);
 const host=new URL(request.url).hostname;if(!(host==="stmartin.tranquilitasspa.com"||host.endsWith(".pages.dev")||host==="localhost"))return reply({ok:false,error:"Unknown destination."},403);
 let d;try{d=await request.json()}catch{return reply({ok:false,error:"Invalid request."},400)}
 if(!d||typeof d!=="object"||Array.isArray(d))return reply({ok:false,error:"Invalid fields."},400);
 if(d.website)return reply({ok:false,error:"Invalid request."},400);
 const fields={};for(const [key,n] of Object.entries({service:35,duration:12,guests:4,area:80,property:190,date:12,time:7,name:130,email:254,phone:35,notes:1250,source:200}))fields[key]=clean(d[key],n);
 const required=["service","duration","guests","area","property","date","time","name","email","phone"];if(required.some(k=>!fields[k]))return reply({ok:false,error:"Complete all required fields."},400);
 const allowed=["swedish","deep","couples","villa","hotel","group","yacht"];if(!allowed.includes(fields.service)||!["60","90","other"].includes(fields.duration))return reply({ok:false,error:"Invalid treatment."},400);
 const guests=Number(fields.guests);if(!Number.isInteger(guests)||guests<1||guests>10||(fields.service==="couples"&&guests!==2))return reply({ok:false,error:"Invalid guest count."},400);
 if(!/^[^@ ]+@[^@ ]+\.[^@ ]+$/.test(fields.email)||!/\+?[0-9\s()+.-]{7,25}/.test(fields.phone))return reply({ok:false,error:"Invalid contact details."},400);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.time)||fields.time<"10:00"||fields.time>"19:00")return reply({ok:false,error:"Invalid date/time."},400);
 function p(x){let z={};new Intl.DateTimeFormat("en-GB",{timeZone:"America/Marigot",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(x).forEach(q=>{if(q.type!=="literal")z[q.type]=q.value});return z.year+"-"+z.month+"-"+z.day+"T"+z.hour+":"+z.minute}
 const chosen=fields.date+"T"+fields.time;
 if(chosen<p(new Date(Date.now()+6*3600000))||chosen>p(new Date(Date.now()+366*86400000)))return reply({ok:false,error:"Please allow six hours and choose within one year."},400);
 if(!env.RESEND_API_KEY||!env.BOOKING_FROM_EMAIL)return reply({ok:false,error:"Email channel not configured. Please use WhatsApp."},503);
 const id="TQ-"+crypto.randomUUID().slice(0,8).toUpperCase();
 const table=Object.entries(fields).map(([key,value])=>"<tr><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd'>"+esc(key)+"</th><td style='padding:8px;border-bottom:1px solid #ddd'>"+esc(value)+"</td></tr>").join("");
 const msg={from:env.BOOKING_FROM_EMAIL,to:["info@massagebahamas.com","amar@massagebahamas.com"],reply_to:fields.email,subject:"[St. Martin / Sint Maarten] New massage enquiry "+id,html:"<h2>Tranquilitas — St. Martin / Sint Maarten</h2><p>Pending enquiry, not a confirmed booking or a payment. Reference: "+esc(id)+"</p><table>"+table+"</table>",text:"Reference: "+id+"\nMarket: St. Martin / Sint Maarten\n"+Object.entries(fields).map(([k,v])=>k+": "+v).join("\n")};
 let response;try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(msg)})}catch{return reply({ok:false,error:"Mail service unreachable; use WhatsApp."},502)}
 if(!response.ok)return reply({ok:false,error:"Email delivery failed; please use WhatsApp."},502);
 return reply({ok:true,reference:id});
}
export async function onRequestGet(){return new Response("Method not allowed",{status:405,headers:{Allow:"POST"}})}
