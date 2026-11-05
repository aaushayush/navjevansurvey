// 1) Paste your deployed Google Apps Script web app URL here (ends with /exec).
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4GI1gTeSA02UtBGlt5EAfn56sdHTLYiiCaruCeOv5Oz2KEcIf1Gf0xU1LHEHWFF_s-g/exec";

const pages = [
  { title:"Your day when you’re away", sub:"What it feels like right now.", qs:[
    { id:"q1", icon:"pulse", topic:"Medical emergencies", tone:"coral", type:"radio", label:"When your loved one is home alone, what worries you most?", opts:[
      "A medical emergency (asthma, BP spike)",
      "Missed or wrong medicines",
      "Safety, mobility, or daily tasks",
      "I feel stressed the whole time I’m at work"]},
    { id:"q2", icon:"pregnant", topic:"Pregnancy and chronic care", tone:"rose", type:"radio", label:"How easily can the main caregiver step out for 2 hours?", opts:[
      "Very stressful. I keep rushing back or calling",
      "I usually cancel my plans or errands",
      "I depend on neighbors or relatives",
      "Manageable, but I’d feel better with someone qualified at home"]},
    { id:"q3", icon:"gauge", topic:"Your peace of mind", tone:"indigo", type:"scale", label:"How much does the lack of backup care affect your life, work, or peace of mind?",
      hint:"1 = Not at all · 3 = Always on my mind · 5 = Massive daily stress", lo:"Not at all", hi:"Massive stress" }
  ]},
  { title:"A caregiver for just a few hours", sub:"Care that arrives when you step out.", qs:[
    { id:"q4", icon:"phone", topic:"Care on demand", tone:"teal", type:"radio", label:"A verified caregiver for 2 to 4 hours, booked on an app. Your first reaction?", opts:[
      "Lifesaver","Long overdue","Convenient","Not needed for me"]},
    { id:"q5", icon:"elder", topic:"When you’d need it", tone:"amber", type:"check", label:"When would you say “Take my money”?", hint:"Select all that apply.", opts:[
      "Relatives are at work and an elder or disabled person is home alone",
      "A husband steps out and his pregnant wife needs someone with her",
      "A patient with asthma or a heart condition needs close monitoring",
      "A sudden schedule change and I need emergency cover"]},
    { id:"q6", icon:"shield", topic:"Trust and safety", tone:"green", type:"radio", label:"What matters most when booking a caregiver for a few hours?", opts:[
      "Speed: at my door within an hour",
      "Trust: vetted, background-checked, trained (CPR, emergencies)",
      "Price: pay by the hour, no big package",
      "Ease: simple booking on my phone"]}
  ]},
  { title:"Be the first to try it", sub:"Last few questions.", qs:[
    { id:"q7", icon:"baby", topic:"Your household", tone:"coral", type:"radio", label:"If it launched in your area tomorrow, would you try it?", opts:[
      "Yes, I’d download it right away",
      "I’d keep it for emergencies or special days",
      "I’d wait for reviews first",
      "My household doesn’t need it"]},
    { id:"q8", icon:"steth", topic:"Your story", tone:"indigo", type:"text", optional:true, label:"Any specific care need in your family? (Optional)" },
    { id:"name", icon:"user", topic:"About you", tone:"teal", type:"short", label:"What’s your name?" },
    { id:"q9", icon:"gift", topic:"Early access", tone:"amber", type:"vip", label:"Join the VIP list for 20% off your first booking?" }
  ]}
];

const flow = document.getElementById("flow");
const stepEl = document.getElementById("step");
const bar = document.getElementById("bar");
const answers = {};

// Flatten pages into one top-to-bottom list of questions
const list = [];
pages.forEach(p => p.qs.forEach((q, i) => list.push({ q, sec: i === 0 ? p : null })));
let revealed = -1;

const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));


// Icon set: one illustration per question (line icons, colored by each card's tone)
const sv = d => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  pulse: sv('<path d="M32 54S10 40 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 16-22 30-22 30z"/><path d="M15 33h10l4-8 6 14 4-6h10"/>'),
  pregnant: sv('<circle cx="29" cy="11" r="6"/><path d="M27 20c-5 6-4 15 0 21l-2 16"/><path d="M30 22c11 2 17 11 11 21-2 3-6 4-11 4"/><path d="M40 52v5"/><path d="M36 35a2.5 2.5 0 0 1 5 0c0 2.5-2.5 4-2.5 4S36 37.5 36 35z" fill="currentColor" stroke="none"/>'),
  gauge: sv('<path d="M9 45a23 23 0 0 1 46 0"/><path d="M32 45l11-15"/><circle cx="32" cy="45" r="3" fill="currentColor"/><path d="M15 31l3 2M32 20v4M49 31l-3 2"/>'),
  phone: sv('<rect x="19" y="6" width="26" height="52" rx="6"/><path d="M29 51h6"/><path d="M32 41s-9-5.5-9-11a5 5 0 0 1 9-2.5A5 5 0 0 1 41 30c0 5.5-9 11-9 11z"/>'),
  elder: sv('<circle cx="25" cy="11" r="6"/><path d="M24 20c-6 3-8 10-5 18l3 19"/><path d="M26 20c5 0 8 4 8 9l-2 10"/><path d="M40 32c0-5 7-5 7 0v25"/><path d="M33 39l-3 18"/>'),
  shield: sv('<path d="M32 7l20 7v16c0 13-9 22-20 27-11-5-20-14-20-27V14z"/><path d="M22 32l7 7 13-14"/>'),
  baby: sv('<circle cx="32" cy="26" r="15"/><path d="M32 11c-4 0-4-5 1-5"/><circle cx="26.5" cy="26" r="1.8" fill="currentColor"/><circle cx="37.5" cy="26" r="1.8" fill="currentColor"/><path d="M27.5 33q4.5 4 9 0"/><path d="M17 58c0-9 6-14 15-14s15 5 15 14"/>'),
  steth: sv('<path d="M14 8v16a10 10 0 0 0 20 0V8"/><path d="M24 34v7a13 13 0 0 0 26 0v-7"/><circle cx="50" cy="30" r="5"/><path d="M12 8h5M31 8h5"/>'),
  user: sv('<circle cx="32" cy="21" r="10"/><path d="M12 56c0-12 9-19 20-19s20 7 20 19"/>'),
  gift: sv('<rect x="9" y="22" width="46" height="9" rx="2"/><path d="M13 31v23h38V31"/><path d="M32 22v32"/><path d="M32 22c-9-12-18-2-8 0M32 22c9-12 18-2 8 0"/>')
};
const banner = q => `<div class="banner"><span class="badge">${ICONS[q.icon]}</span><span class="topic">${esc(q.topic)}</span></div>`;
document.getElementById("heroArt").innerHTML =
  [["elder","amber"],["pregnant","rose"],["baby","teal"]].map(([i,t]) => `<span class="t-${t}">${ICONS[i]}</span>`).join("");

function field(q){
  const hint = q.hint && q.type !== "scale" ? `<p class="hint">${esc(q.hint)}</p>` : "";
  let body = "";
  if(q.type === "radio" || q.type === "check"){
    const t = q.type === "radio" ? "radio" : "checkbox";
    body = q.opts.map(o =>
      `<label class="opt ${q.type==="check"?"check":""}"><input type="${t}" name="${q.id}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("");
  } else if(q.type === "scale"){
    body = `<p class="hint">${esc(q.hint)}</p><div class="scale">` +
      [1,2,3,4,5].map(n => `<label class="opt"><input type="radio" name="${q.id}" value="${n}" aria-label="${n}"><span>${n}</span></label>`).join("") +
      `</div><div class="ends"><span>${esc(q.lo)}</span><span>${esc(q.hi)}</span></div>`;
  } else if(q.type === "short"){
    body = `<input type="text" name="${q.id}" placeholder="Your full name" autocomplete="name">`;
  } else if(q.type === "text"){
    body = `<textarea name="${q.id}" placeholder="Share anything that would help us plan."></textarea>`;
  } else if(q.type === "vip"){
    const yes = "Yes, send me early access", no = "No, thank you";
    body = `<div class="vip"><strong>20% off your first booking</strong>We’ll only use your details to tell you when we launch.</div>
      <div style="height:12px"></div>
      <label class="opt"><input type="radio" name="q9" value="${yes}"><span>${yes}</span></label>
      <label class="opt"><input type="radio" name="q9" value="${no}"><span>${no}</span></label>
      <div id="contactBox" hidden><input type="text" name="q9_contact" placeholder="Email or phone number" autocomplete="email"></div>`;
  }
  return `<h3 class="ql">${esc(q.label)}</h3>${hint}${body}<div class="err" role="alert"></div>`;
}

function reveal(i){
  if(i >= list.length || i <= revealed) return;
  revealed = i;
  const { q, sec } = list[i];
  const isLast = i === list.length - 1;
  let target;
  if(sec){
    const s = document.createElement("div");
    s.className = "sec";
    s.innerHTML = `<h2>${esc(sec.title)}</h2><p>${esc(sec.sub)}</p>`;
    flow.appendChild(s);
    target = s;
  }
  const el = document.createElement("div"); el.setAttribute("role","group"); el.setAttribute("aria-label", q.topic);
  el.className = "q t-" + q.tone; el.dataset.q = q.id; el.dataset.i = i;
  const needsBtn = q.type === "check" || q.type === "text" || q.type === "short";
  el.innerHTML = banner(q) + '<div class="body">' + field(q) +
    (needsBtn ? `<button class="next" type="button" data-act="cont">${q.type==="text"?"Continue":"Continue"}</button>` : "") +
    (isLast ? `<button class="next send" type="button" data-act="send">Send my answers</button>` : "") + "</div>";
  flow.appendChild(el);
  el.addEventListener("change", e => onChange(el, q, i, e));
  el.addEventListener("click", e => {
    const act = e.target.dataset.act;
    if(act === "cont") cont(el, q, i);
    if(act === "send") send(el, q);
  });
  el.addEventListener("keydown", e => { if(e.key === "Enter" && q.type === "short"){ e.preventDefault(); cont(el, q, i); } });
  updateProgress();
  if(i > 0) (target || el).scrollIntoView({ behavior:"smooth", block:"start" });
}

function read(el, q){
  if(q.type === "check") return [...el.querySelectorAll("input:checked")].map(x => x.value);
  if(q.type === "short") return el.querySelector("input").value.trim();
  if(q.type === "text") return el.querySelector("textarea").value.trim();
  const c = el.querySelector("input:checked");
  return c ? c.value : "";
}

function onChange(el, q, i, e){
  answers[q.id] = read(el, q);
  el.classList.add("answered");
  el.querySelector(".err").textContent = "";
  if(q.type === "vip"){
    el.querySelector("#contactBox").hidden = !String(answers.q9).startsWith("Yes");
    return;
  }
  if((q.type === "radio" || q.type === "scale") && i === revealed){
    setTimeout(() => reveal(i + 1), 380);
  }
}

function cont(el, q, i){
  answers[q.id] = read(el, q);
  if(q.type === "short" && !answers[q.id]){
    el.querySelector(".err").textContent = "Please enter your name to continue.";
    return;
  }
  if(q.type === "check" && !answers[q.id].length){
    el.querySelector(".err").textContent = "Pick at least one to continue.";
    return;
  }
  el.classList.add("answered");
  el.querySelector('[data-act="cont"]').hidden = true;
  reveal(i + 1);
}

function updateProgress(){
  stepEl.textContent = `Question ${revealed + 1} of ${list.length}`;
  bar.style.strokeDashoffset = 100 - ((revealed + 1) / list.length) * 100;
}

async function send(el, q){
  answers[q.id] = read(el, q);
  answers.q9_contact = el.querySelector('[name="q9_contact"]').value.trim();
  const err = el.querySelector(".err");
  if(!answers.q9){ err.textContent = "Choose an answer to send."; return; }
  if(answers.q9.startsWith("Yes") && !answers.q9_contact){
    err.textContent = "Add an email or phone number so we can reach you."; return;
  }
  const btn = el.querySelector(".send");
  btn.disabled = true; btn.textContent = "Sending…";
  const payload = { ...answers, q5: (answers.q5 || []).join(" | "), submittedAt: new Date().toISOString() };
  try{
    if(SCRIPT_URL){
      await fetch(SCRIPT_URL, { method:"POST", mode:"no-cors", body:new URLSearchParams(payload) });
    } else {
      console.log("SCRIPT_URL is empty. Demo payload:", payload);
    }
    done();
  }catch(e){
    btn.disabled = false; btn.textContent = "Send my answers";
    err.textContent = "We couldn’t send your answers. Check your connection and try again.";
  }
}

function done(){
  stepEl.textContent = "Complete";
  bar.style.strokeDashoffset = 0;
  const vip = String(answers.q9 || "").startsWith("Yes");
  const fn = String(answers.name || "").split(" ")[0];
  flow.innerHTML = `<div class="q done t-teal">
    <svg viewBox="0 0 120 70" aria-hidden="true"><path d="M4 40H38l8-26 14 50 12-30h10l6-8 6 14h20" fill="none" stroke="#e4572e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h2>Thank you${fn ? ", " + esc(fn) : ""}</h2>
    <p class="sub">${vip ? "You’re on the VIP list. We’ll contact you with your 20% discount when we launch." : "Your feedback will help shape care that shows up when families need it."}</p></div>`;
  window.scrollTo({ top: 0, behavior:"smooth" });
}

reveal(0);
