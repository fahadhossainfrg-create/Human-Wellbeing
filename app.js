const D = window.HW_DATA;
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];
const TOTAL = () => D.slides.length;

const state = {
  currentSlide: 1,
  currentModule: D.modules[0].id,
  teacherMode: false,
  view: "home",
  activityAnswers: {}
};

const moduleById = id => D.modules.find(m => m.id === id);
const slideByNum = n => D.slides.find(s => s.number === n);

function escapeHTML(v=""){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function renderParagraphs(text=""){
  return String(text).split(/\n\s*\n/).filter(Boolean).map(p=>`<p class="explanation">${escapeHTML(p)}</p>`).join("");
}
function showView(id){
  ["homeView","slideView","activityView","sourcesView"].forEach(v=>qs("#"+v).classList.add("hidden"));
  qs("#"+id).classList.remove("hidden");
  state.view=id.replace("View","");
  qs("#main").focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderNav(filter=""){
  const nav=qs("#moduleNav");
  const f=filter.trim().toLowerCase();
  nav.innerHTML=D.modules.map(m=>{
    const topics=D.slides.filter(s=>s.module===m.id&&(!f||s.title.toLowerCase().includes(f)||s.explanation.toLowerCase().includes(f)||s.keyTerms.some(k=>(k.term+" "+k.meaning).toLowerCase().includes(f))));
    if(!topics.length&&f)return "";
    return `<div class="module-block">
      <button class="module-btn ${state.currentModule===m.id?"active":""}" data-module="${m.id}">
        <span>${m.icon}</span><span>${escapeHTML(m.title)}</span>
      </button>
      <div class="slide-list">
        ${topics.map(s=>`<button class="slide-link ${state.currentSlide===s.number&&state.view==="slide"?"active":""}" data-slide="${s.number}">${escapeHTML(s.title)}</button>`).join("")}
      </div>
    </div>`;
  }).join("");
  qsa("[data-slide]",nav).forEach(b=>b.onclick=()=>openSlide(Number(b.dataset.slide)));
  qsa("[data-module]",nav).forEach(b=>b.onclick=()=>openModule(b.dataset.module));
}
function renderHome(){
  const home=qs("#homeView");
  home.innerHTML=`
    <section class="hero">
      <div>
        <div class="eyebrow">INDEPENDENT CLASSROOM RESOURCE</div>
        <h2>Teach human wellbeing with explanations you can read aloud.</h2>
        <p>Every topic is written in clear classroom language with definitions, examples, activities and checks for learning. Use the resource in order as a complete unit or jump directly to the concept you need.</p>
        <div class="unit-badges">
          <span class="badge">${TOTAL()} detailed teaching topics</span>
          <span class="badge">6 learning modules</span>
          <span class="badge">Interactive checks</span>
          <span class="badge">Teacher mode</span>
        </div>
        <button class="solid-btn" id="startUnit">Start teaching</button>
        <button class="soft-btn" id="openSources">Sources & updates</button>
      </div>
      <div class="hero-art" aria-label="Human wellbeing dimensions">
        <div class="icon-tile"><span>💧</span>Physical</div>
        <div class="icon-tile"><span>💼</span>Economic</div>
        <div class="icon-tile"><span>🤝</span>Social</div>
        <div class="icon-tile"><span>🌿</span>Environmental</div>
      </div>
    </section>
    <div class="section-title">
      <div><div class="eyebrow">UNIT MAP</div><h2>Six teaching modules</h2></div>
      <p>Explain the concept, apply it, then check understanding.</p>
    </div>
    <section class="grid module-grid">
      ${D.modules.map(m=>`<article class="module-card">
        <div class="big-icon">${m.icon}</div>
        <h3>${escapeHTML(m.title)}</h3>
        <p>${escapeHTML(m.description)}</p>
        <div class="card-actions">
          <button class="solid-btn" data-open-module="${m.id}">Open module</button>
          <button class="soft-btn" data-open-activity="${m.id}">Check learning</button>
        </div>
      </article>`).join("")}
    </section>
    <div class="section-title"><div><div class="eyebrow">TEACHING PATTERN</div><h2>Explain → apply → check</h2></div></div>
    <section class="info-strip">
      <article class="info-card"><div>🗣️</div><strong>Read aloud</strong><span>Detailed explanation written in natural classroom language.</span></article>
      <article class="info-card"><div>🧠</div><strong>Define</strong><span>Key vocabulary is unpacked in simple language.</span></article>
      <article class="info-card"><div>🔎</div><strong>Apply</strong><span>Short activities connect ideas to realistic situations.</span></article>
      <article class="info-card"><div>✅</div><strong>Check</strong><span>Interactive module questions provide immediate feedback.</span></article>
    </section>
    <section class="content-card">
      <h3>Wellbeing in real life</h3>
      <p>Beyond Blue explains that mental wellbeing looks different for different people and involves the whole person, including physical, mental, social and emotional aspects. In Geography, we broaden the discussion further by also examining economic, environmental, cultural and political conditions.</p>
      <a href="https://www.beyondblue.org.au/mental-health/wellbeing" target="_blank" rel="noopener">Open Beyond Blue wellbeing resource ↗</a>
    </section>`;
  qs("#startUnit").onclick=()=>openSlide(1);
  qs("#openSources").onclick=renderSources;
  qsa("[data-open-module]").forEach(b=>b.onclick=()=>openModule(b.dataset.openModule));
  qsa("[data-open-activity]").forEach(b=>b.onclick=()=>renderActivity(b.dataset.openActivity));
  showView("homeView");
}
function openModule(id){
  const m=moduleById(id); state.currentModule=id; openSlide(m.range[0]);
}
function getTeacherModel(s){
  const note=D.teacherNotes[s.module];
  const termPrompt=s.keyTerms?.length?`Ask one student to define <strong>${escapeHTML(s.keyTerms[0].term)}</strong> without reading the definition.`:"Ask a student to summarise the topic in one sentence.";
  return `<div class="teacher-panel">
    <h3>Teacher tools</h3>
    <div class="teacher-columns">
      <div><strong>Learning intentions</strong><ul>${note.learningIntentions.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>
      <strong>Success criteria</strong><ul>${note.success.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul></div>
      <div><strong>Module starter</strong><p>${escapeHTML(note.starter)}</p>
      <strong>Support / low literacy</strong><p>${escapeHTML(note.support)}</p>
      <strong>Mini-plenary</strong><p>${escapeHTML(note.plenary)}</p></div>
    </div>
    <div class="model">${termPrompt}</div>
  </div>`;
}
function openSlide(num){
  const s=slideByNum(num); if(!s)return;
  state.currentSlide=num; state.currentModule=s.module;
  const m=moduleById(s.module); const pct=Math.round((num/TOTAL())*100);
  const keyTerms=(s.keyTerms||[]).length?`<section class="content-card"><h3>Key terms</h3><div class="key-terms">${s.keyTerms.map(k=>`<div class="term"><strong>${escapeHTML(k.term)}</strong><br>${escapeHTML(k.meaning)}</div>`).join("")}</div></section>`:"";
  const task=s.task?`<section class="content-card activity-card"><div class="activity-type">${escapeHTML(s.task.type)}</div><h3>${escapeHTML(s.task.title)}</h3><p>${escapeHTML(s.task.prompt)}</p></section>`:"";
  const ext=s.external?`<section class="content-card external-card"><span class="update-pill">AUTHORITATIVE EXTENSION</span><h3>${escapeHTML(s.external.label)}</h3><p>${escapeHTML(s.external.note)}</p><a href="${s.external.url}" target="_blank" rel="noopener">Open resource ↗</a></section>`:"";
  const links=(s.originalLinks||[]).length?`<section class="content-card original-source"><h3>Useful media / data link</h3><div class="original-links">${s.originalLinks.map((u,i)=>`<a href="${u}" target="_blank" rel="noopener">Open resource ${i+1} ↗</a>`).join("")}</div></section>`:"";
  qs("#slideView").innerHTML=`
    <div class="slide-head">
      <div><div class="slide-number">TEACHING TOPIC ${num} OF ${TOTAL()}</div><h2>${escapeHTML(s.title)}</h2><div class="module-label">${m.icon} ${escapeHTML(m.title)}</div></div>
      <div class="progress-row"><div class="progress"><span style="width:${pct}%"></span></div><small>${pct}%</small></div>
    </div>
    <section class="content-card read-aloud"><h3>Read-aloud explanation</h3>${renderParagraphs(s.explanation)}</section>
    ${keyTerms}${task}${ext}${links}${getTeacherModel(s)}
    <div class="slide-controls">
      <button class="ghost-btn" id="prevSlide" ${num===1?"disabled":""}>← Previous topic</button>
      <button class="soft-btn" id="moduleActivity">Check module learning</button>
      <button class="solid-btn" id="nextSlide" ${num===TOTAL()?"disabled":""}>Next topic →</button>
    </div>`;
  qs("#prevSlide").onclick=()=>num>1&&openSlide(num-1);
  qs("#nextSlide").onclick=()=>num<TOTAL()&&openSlide(num+1);
  qs("#moduleActivity").onclick=()=>renderActivity(s.module);
  showView("slideView"); renderNav(qs("#slideSearch").value);
}
function renderActivity(moduleId){
  const m=moduleById(moduleId),a=D.activities[moduleId];
  state.currentModule=moduleId; state.activityAnswers[moduleId]={};
  qs("#activityView").innerHTML=`<div class="activity-shell">
    <div class="eyebrow">${m.icon} ${escapeHTML(m.title)}</div><h2>${escapeHTML(a.title)}</h2><p>${escapeHTML(a.instructions)}</p>
    <div id="scoreBox"></div><div id="questions">${a.questions.map((q,qi)=>`<article class="question-card" data-q="${qi}"><h3>${qi+1}. ${escapeHTML(q.prompt)}</h3><div class="quiz-options">${q.options.map((o,oi)=>`<button class="quiz-option" data-q="${qi}" data-o="${oi}">${escapeHTML(o)}</button>`).join("")}</div><div class="feedback hidden" id="fb-${qi}"></div></article>`).join("")}</div>
    <div class="slide-controls"><button class="ghost-btn" id="backToModule">← Back to module</button><button class="solid-btn" id="resetActivity">Reset activity</button></div>
    <div class="teacher-panel"><h3>Teacher use</h3><p>Ask students to commit to an answer before clicking. After feedback appears, ask a student to explain why the correct option fits the concept.</p></div>
  </div>`;
  qsa(".quiz-option",qs("#activityView")).forEach(btn=>btn.onclick=()=>answerQuestion(moduleId,Number(btn.dataset.q),Number(btn.dataset.o)));
  qs("#backToModule").onclick=()=>openModule(moduleId); qs("#resetActivity").onclick=()=>renderActivity(moduleId);
  showView("activityView"); renderNav(qs("#slideSearch").value);
}
function answerQuestion(moduleId,qi,oi){
  const a=D.activities[moduleId],q=a.questions[qi]; if(state.activityAnswers[moduleId][qi]!==undefined)return;
  state.activityAnswers[moduleId][qi]=oi;
  const card=qs(`.question-card[data-q="${qi}"]`);
  qsa(".quiz-option",card).forEach((b,idx)=>{if(idx===q.answer)b.classList.add("correct");else if(idx===oi)b.classList.add("incorrect");b.disabled=true;});
  const fb=qs(`#fb-${qi}`); fb.textContent=(oi===q.answer?"Correct. ":"Not quite. ")+q.why; fb.classList.remove("hidden");
  const answered=Object.keys(state.activityAnswers[moduleId]).length;
  const correct=Object.entries(state.activityAnswers[moduleId]).filter(([k,v])=>a.questions[Number(k)].answer===v).length;
  qs("#scoreBox").innerHTML=`<div class="score-card">Score: ${correct}/${answered} answered correctly ${answered===a.questions.length?"• Activity complete!":""}</div>`;
}
function renderSources(){
  qs("#sourcesView").innerHTML=`<div class="eyebrow">SOURCE TRANSPARENCY</div><h2>Authoritative resources & current updates</h2>
    <p>This teaching resource stands on its own. The links below are included when a concept benefits from official data, current definitions or a deeper classroom extension.</p>
    <div class="warning"><strong>Current poverty measure:</strong> the World Bank’s international extreme-poverty line is US$3.00 per person per day, updated in June 2025.</div>
    <div class="source-list">${D.sources.map(s=>`<article class="source-card"><h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(s.use)}</p><a href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></article>`).join("")}</div>
    <section class="content-card"><h3>Design note</h3><p>The interface uses an original blue/teal wellbeing-card layout and simple icon-led navigation. It is inspired by the clear, supportive structure used by modern wellbeing education sites, without copying Beyond Blue branding or proprietary artwork.</p></section>`;
  showView("sourcesView");
}
function syncTeacher(){document.body.classList.toggle("teacher-on",state.teacherMode);}
qs("#teacherMode").addEventListener("change",e=>{state.teacherMode=e.target.checked;syncTeacher();});
qs("#printBtn").onclick=()=>window.print();
qs("#homeBtn").onclick=()=>{renderHome();renderNav(qs("#slideSearch").value);};
qs("#sourcesBtn").onclick=renderSources;
qs("#slideSearch").addEventListener("input",e=>renderNav(e.target.value));
document.addEventListener("keydown",e=>{if(state.view==="slide"&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){if(e.key==="ArrowRight"&&state.currentSlide<TOTAL())openSlide(state.currentSlide+1);if(e.key==="ArrowLeft"&&state.currentSlide>1)openSlide(state.currentSlide-1);}});
renderNav(); renderHome(); syncTeacher();