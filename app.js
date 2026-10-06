const D = window.HW_DATA;
const qs = (s, root=document) => root.querySelector(s);
const qsa = (s, root=document) => [...root.querySelectorAll(s)];

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
  return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function showView(id){
  ["homeView","slideView","activityView","sourcesView"].forEach(v => qs("#"+v).classList.add("hidden"));
  qs("#"+id).classList.remove("hidden");
  state.view=id.replace("View","");
  qs("#main").focus({preventScroll:true});
  window.scrollTo({top:0,behavior:"smooth"});
}
function renderNav(filter=""){
  const nav = qs("#moduleNav");
  const f = filter.trim().toLowerCase();
  nav.innerHTML = D.modules.map(m => {
    const slides = D.slides.filter(s => s.module===m.id && (
      !f || s.title.toLowerCase().includes(f) || s.explanation.toLowerCase().includes(f) ||
      s.keyTerms.some(k => (k.term+" "+k.meaning).toLowerCase().includes(f))
    ));
    if(!slides.length && f) return "";
    return `<div class="module-block">
      <button class="module-btn ${state.currentModule===m.id ? "active":""}" data-module="${m.id}">
        <span>${m.icon}</span><span>${escapeHTML(m.title)}</span>
      </button>
      <div class="slide-list">
        ${slides.map(s => `<button class="slide-link ${state.currentSlide===s.number && state.view==="slide" ? "active":""}" data-slide="${s.number}">
          ${s.number}. ${escapeHTML(s.title)}
        </button>`).join("")}
      </div>
    </div>`;
  }).join("");
  qsa("[data-slide]",nav).forEach(b=>b.addEventListener("click",()=>openSlide(Number(b.dataset.slide))));
  qsa("[data-module]",nav).forEach(b=>b.addEventListener("click",()=>openModule(b.dataset.module)));
}
function renderHome(){
  const home = qs("#homeView");
  home.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">COMPLETE CLASSROOM COMPANION</div>
        <h2>Human wellbeing is more than happiness or money.</h2>
        <p>This site expands every slide in your 84-slide Year 9 Geography deck. Students can read the explanation, learn key terms, complete class activities and test themselves. Teacher mode adds lesson intentions, support strategies and model guidance.</p>
        <div class="unit-badges">
          <span class="badge">84 slides explained</span>
          <span class="badge">6 interactive activities</span>
          <span class="badge">Teacher mode</span>
          <span class="badge">2026 source updates</span>
        </div>
        <button class="solid-btn" id="startUnit">Start Slide 1</button>
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
      <p>Follow the PowerPoint order or jump straight to the concept you need.</p>
    </div>
    <section class="grid module-grid">
      ${D.modules.map(m=>`
        <article class="module-card">
          <div class="big-icon">${m.icon}</div>
          <h3>${escapeHTML(m.title)}</h3>
          <p>${escapeHTML(m.description)}</p>
          <div class="card-actions">
            <button class="solid-btn" data-open-module="${m.id}">Open slides</button>
            <button class="soft-btn" data-open-activity="${m.id}">Class activity</button>
          </div>
        </article>
      `).join("")}
    </section>

    <div class="section-title">
      <div><div class="eyebrow">TEACHING PATTERN</div><h2>Designed for explain → apply → check</h2></div>
    </div>
    <section class="info-strip">
      <article class="info-card"><div>🧠</div><strong>Explain</strong><span>Student-friendly expansion of what the slide means.</span></article>
      <article class="info-card"><div>🔎</div><strong>Apply</strong><span>Short activities that connect concepts to real places and decisions.</span></article>
      <article class="info-card"><div>✅</div><strong>Check</strong><span>Interactive module quizzes with instant feedback.</span></article>
      <article class="info-card"><div>🌐</div><strong>Update</strong><span>Official external sources are marked as extensions, not replacements for the class deck.</span></article>
    </section>

    <section class="content-card">
      <h3>Wellbeing in real life</h3>
      <p>Beyond Blue describes mental wellbeing as something that can look different for everyone and emphasises balance across the whole person, including physical, mental, social and emotional aspects. This site uses that accessible card-based teaching pattern, while the Geography unit keeps the broader syllabus focus on economic, environmental, cultural and political wellbeing as well.</p>
      <a href="https://www.beyondblue.org.au/mental-health/wellbeing" target="_blank" rel="noopener">Open Beyond Blue wellbeing resource ↗</a>
    </section>
  `;
  qs("#startUnit").onclick=()=>openSlide(1);
  qs("#openSources").onclick=renderSources;
  qsa("[data-open-module]").forEach(b=>b.onclick=()=>openModule(b.dataset.openModule));
  qsa("[data-open-activity]").forEach(b=>b.onclick=()=>renderActivity(b.dataset.openActivity));
  showView("homeView");
}
function openModule(id){
  const m=moduleById(id);
  state.currentModule=id;
  openSlide(m.range[0]);
}
function getTeacherModel(s){
  const note=D.teacherNotes[s.module];
  const termPrompt = s.keyTerms?.length ? `Ask one student to define <strong>${escapeHTML(s.keyTerms[0].term)}</strong> without reading the screen.` : "Ask a student to summarise the slide in one sentence.";
  return `<div class="teacher-panel">
    <h3>Teacher tools</h3>
    <div class="teacher-columns">
      <div>
        <strong>Learning intentions</strong>
        <ul>${note.learningIntentions.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>
        <strong>Success criteria</strong>
        <ul>${note.success.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>
      </div>
      <div>
        <strong>Module starter</strong><p>${escapeHTML(note.starter)}</p>
        <strong>Support / low literacy</strong><p>${escapeHTML(note.support)}</p>
        <strong>Mini-plenary</strong><p>${escapeHTML(note.plenary)}</p>
      </div>
    </div>
    <div class="model">${termPrompt}</div>
  </div>`;
}
function openSlide(num){
  const s=slideByNum(num);
  if(!s) return;
  state.currentSlide=num;
  state.currentModule=s.module;
  const m=moduleById(s.module);
  const pct=Math.round((num/84)*100);
  const keyTerms=(s.keyTerms||[]).length ? `
    <section class="content-card">
      <h3>Key terms</h3>
      <div class="key-terms">${s.keyTerms.map(k=>`<div class="term"><strong>${escapeHTML(k.term)}</strong><br>${escapeHTML(k.meaning)}</div>`).join("")}</div>
    </section>`:"";
  const task=s.task ? `<section class="content-card activity-card">
      <div class="activity-type">${escapeHTML(s.task.type)}</div>
      <h3>${escapeHTML(s.task.title)}</h3>
      <p>${escapeHTML(s.task.prompt)}</p>
    </section>`:"";
  const ext=s.external ? `<section class="content-card external-card">
      <span class="update-pill">EXTERNAL RESOURCE / UPDATE</span>
      <h3>${escapeHTML(s.external.label)}</h3>
      <p>${escapeHTML(s.external.note)}</p>
      <a href="${s.external.url}" target="_blank" rel="noopener">Open official source ↗</a>
    </section>`:"";
  const hasOriginalText=(s.originalText||[]).length;
  const hasOriginalLinks=(s.originalLinks||[]).length;
  const original=(hasOriginalText||hasOriginalLinks) ? `<section class="content-card original-source">
      <h3>Original slide source${hasOriginalLinks ? " / links" : ""}</h3>
      ${hasOriginalText ? `<ul class="source-lines">${s.originalText.map(t=>`<li>${escapeHTML(t)}</li>`).join("")}</ul>` : `<p>This slide contains an external link in the original PowerPoint.</p>`}
      ${hasOriginalLinks?`<div class="original-links">${s.originalLinks.map((u,i)=>`<a href="${u}" target="_blank" rel="noopener">Original slide link ${i+1} ↗</a>`).join("")}</div>`:""}
    </section>`:"";
  const view=qs("#slideView");
  view.innerHTML=`
    <div class="slide-head">
      <div>
        <div class="slide-number">SLIDE ${num} OF 84</div>
        <h2>${escapeHTML(s.title)}</h2>
        <div class="module-label">${m.icon} ${escapeHTML(m.title)}</div>
      </div>
      <div class="progress-row"><div class="progress"><span style="width:${pct}%"></span></div><small>${pct}%</small></div>
    </div>
    <section class="content-card">
      <h3>Detailed explanation</h3>
      <p class="explanation">${escapeHTML(s.explanation)}</p>
    </section>
    ${keyTerms}
    ${task}
    ${ext}
    ${original}
    ${getTeacherModel(s)}
    <div class="slide-controls">
      <button class="ghost-btn" id="prevSlide" ${num===1?"disabled":""}>← Previous</button>
      <button class="soft-btn" id="moduleActivity">Try module activity</button>
      <button class="solid-btn" id="nextSlide" ${num===84?"disabled":""}>Next →</button>
    </div>
  `;
  qs("#prevSlide").onclick=()=>num>1&&openSlide(num-1);
  qs("#nextSlide").onclick=()=>num<84&&openSlide(num+1);
  qs("#moduleActivity").onclick=()=>renderActivity(s.module);
  showView("slideView");
  renderNav(qs("#slideSearch").value);
}
function renderActivity(moduleId){
  const m=moduleById(moduleId);
  const a=D.activities[moduleId];
  state.currentModule=moduleId;
  state.activityAnswers[moduleId]={};
  const v=qs("#activityView");
  v.innerHTML=`
    <div class="activity-shell">
      <div class="eyebrow">${m.icon} ${escapeHTML(m.title)}</div>
      <h2>${escapeHTML(a.title)}</h2>
      <p>${escapeHTML(a.instructions)}</p>
      <div id="scoreBox"></div>
      <div id="questions">
        ${a.questions.map((q,qi)=>`
          <article class="question-card" data-q="${qi}">
            <h3>${qi+1}. ${escapeHTML(q.prompt)}</h3>
            <div class="quiz-options">
              ${q.options.map((o,oi)=>`<button class="quiz-option" data-q="${qi}" data-o="${oi}">${escapeHTML(o)}</button>`).join("")}
            </div>
            <div class="feedback hidden" id="fb-${qi}"></div>
          </article>
        `).join("")}
      </div>
      <div class="slide-controls">
        <button class="ghost-btn" id="backToModule">← Back to module</button>
        <button class="solid-btn" id="resetActivity">Reset activity</button>
      </div>
      <div class="teacher-panel">
        <h3>Teacher use</h3>
        <p>Ask students to commit to an answer before clicking. After feedback appears, require one student to explain <em>why</em> the correct option fits the concept.</p>
      </div>
    </div>`;
  qsa(".quiz-option",v).forEach(btn=>btn.onclick=()=>answerQuestion(moduleId,Number(btn.dataset.q),Number(btn.dataset.o)));
  qs("#backToModule").onclick=()=>openModule(moduleId);
  qs("#resetActivity").onclick=()=>renderActivity(moduleId);
  showView("activityView");
  renderNav(qs("#slideSearch").value);
}
function answerQuestion(moduleId,qi,oi){
  const a=D.activities[moduleId], q=a.questions[qi];
  if(state.activityAnswers[moduleId][qi]!==undefined) return;
  state.activityAnswers[moduleId][qi]=oi;
  const card=qs(`.question-card[data-q="${qi}"]`);
  qsa(".quiz-option",card).forEach((b,idx)=>{
    if(idx===q.answer)b.classList.add("correct");
    else if(idx===oi)b.classList.add("incorrect");
    b.disabled=true;
  });
  const fb=qs(`#fb-${qi}`);
  fb.textContent=(oi===q.answer?"Correct. ":"Not quite. ")+q.why;
  fb.classList.remove("hidden");
  const answered=Object.keys(state.activityAnswers[moduleId]).length;
  const correct=Object.entries(state.activityAnswers[moduleId]).filter(([k,v])=>a.questions[Number(k)].answer===v).length;
  qs("#scoreBox").innerHTML=`<div class="score-card">Score: ${correct}/${answered} answered correctly ${answered===a.questions.length?"• Activity complete!":""}</div>`;
}
function renderSources(){
  const v=qs("#sourcesView");
  v.innerHTML=`
    <div class="eyebrow">SOURCE TRANSPARENCY</div>
    <h2>External resources & 2026 updates</h2>
    <p>The original PowerPoint remains the primary class source. These official resources are used only to expand, verify or update selected concepts. Where the slide uses an older figure, the site labels the newer information instead of silently replacing the slide.</p>
    <div class="warning"><strong>Important example:</strong> the poverty slide uses the older US$1.90/day figure. The World Bank’s international extreme-poverty line was updated to US$3.00 per person per day in June 2025.</div>
    <div class="source-list">
      ${D.sources.map(s=>`<article class="source-card"><h3>${escapeHTML(s.name)}</h3><p>${escapeHTML(s.use)}</p><a href="${s.url}" target="_blank" rel="noopener">Open source ↗</a></article>`).join("")}
    </div>
    <section class="content-card">
      <h3>Design note</h3>
      <p>The interface uses an original blue/teal wellbeing-card pattern, clear icon tiles, spacious headings and self-check activities inspired by the accessibility and supportive structure of contemporary wellbeing resources. No Beyond Blue logo, illustration or proprietary brand asset is copied.</p>
    </section>
  `;
  showView("sourcesView");
}
function syncTeacher(){
  document.body.classList.toggle("teacher-on",state.teacherMode);
}
qs("#teacherMode").addEventListener("change",e=>{state.teacherMode=e.target.checked;syncTeacher()});
qs("#printBtn").onclick=()=>window.print();
qs("#homeBtn").onclick=()=>{renderHome();renderNav(qs("#slideSearch").value)};
qs("#sourcesBtn").onclick=renderSources;
qs("#slideSearch").addEventListener("input",e=>renderNav(e.target.value));
document.addEventListener("keydown",e=>{
  if(state.view==="slide" && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
    if(e.key==="ArrowRight" && state.currentSlide<84)openSlide(state.currentSlide+1);
    if(e.key==="ArrowLeft" && state.currentSlide>1)openSlide(state.currentSlide-1);
  }
});
renderNav();
renderHome();
syncTeacher();