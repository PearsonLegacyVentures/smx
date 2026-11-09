(()=>{"use strict";
const nav=document.getElementById("siteNav"),toggle=document.getElementById("navToggle");
if(toggle&&nav){toggle.addEventListener("click",()=>{const active=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(active));toggle.textContent=active?"×":"☰"});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}));}
})();
