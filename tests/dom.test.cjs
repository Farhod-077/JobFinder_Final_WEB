const fs = require('fs');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = require('path').resolve(__dirname, '..');
const remote = { jobs: [{ id: 99, title: 'Remote Test Engineer', company_name: 'Remote Test Team', candidate_required_location: 'Worldwide', category: 'IT & Software', job_type: 'full_time', salary: '$60,000 per year', description: '<p>Develop reliable applications and test products with a remote team.</p>', publication_date: '2026-11-17T10:00:00Z', url: 'https://remotive.com/remote-jobs/software-dev/test-99' }] };
const files = ['js/storage.js', 'js/Job.js', 'js/api.js', 'js/state.js', 'js/ui.js', 'js/forms.js', 'js/dashboard.js', 'js/repository.js', 'js/job-cards.js', 'js/home.js', 'js/jobs.js', 'js/companies.js', 'js/post-job.js', 'js/contact.js', 'js/remote.js', 'app.js'];
const code = files.map(file => fs.readFileSync(root + '/' + file, 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, '')).join('\n');
let errors=[];
async function load(name, state={}, mode='success', query='') {
 const vc=new VirtualConsole(); vc.on('jsdomError', e=>errors.push(e.message));
 const dom = new JSDOM(fs.readFileSync(root+'/'+name,'utf8'), { url:'http://localhost/'+name+query, runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc });
 const w=dom.window;
 w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});
 w.confirm=()=>true; w.prompt=()=> 'Renamed Search';
 for (const [key,value] of Object.entries(state)) w.localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));
 w.fetch=async()=> {
  if(mode==='error') throw new Error('Failed to fetch');
  if(mode==='malformed') return {ok:true,json:async()=>({bad:true})};
  return {ok:true,json:async()=>mode==='empty'?{jobs:[]}:remote};
 };
 w.eval(fs.readFileSync(root+'/data.js','utf8'));
 await new Promise(r=>w.addEventListener('DOMContentLoaded',r,{once:true}));
 w.eval(code);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 if(name==='contact.html') {
  w.eval(fs.readFileSync(root+'/vendor/jquery.min.js','utf8'));
  w.eval(fs.readFileSync(root+'/jquery-features.js','utf8'));
 }
 await new Promise(r=>setTimeout(r,50));
 return dom;
}
function event(w,id,type,value){const e=w.document.getElementById(id);if(value!==undefined)e.value=value;e.dispatchEvent(new w.Event(type,{bubbles:true,cancelable:true}));}
function text(w,id){return w.document.getElementById(id).textContent;}
(async()=>{
 let d=await load('jobs.html');let w=d.window;
 assert.match(text(w,'results-count'),/13 jobs/);assert.equal(w.document.querySelectorAll('#job-list .job-card').length,6);
 assert.equal(text(w,'api-status'),'');
 event(w,'job-search','input','remote test');assert.match(text(w,'results-count'),/1 jobs/);
 assert.match(w.document.querySelector('.salary').textContent,/year/);
 w.document.querySelector('[data-save-id]').click();assert.equal(JSON.parse(w.localStorage.getItem('jobfinder.favorites.v1'))[0],'api-99');
 event(w,'search-name','input','Remote search');event(w,'save-search-form','submit');assert.equal(w.document.querySelectorAll('.saved-search-row').length,1);
 w.document.querySelector('.saved-search-row button:nth-child(2)').click();assert.match(text(w,'saved-search-list'),/Renamed Search/);
 w.document.getElementById('reset-filters').click();assert.equal(w.location.search,'');assert.match(text(w,'results-count'),/13 jobs/);
 w.document.querySelector('.saved-search-row button').click();assert.equal(w.document.getElementById('job-search').value,'remote test');
 w.document.querySelector('.saved-search-row button:nth-child(3)').click();assert.equal(w.document.querySelectorAll('.saved-search-row').length,0);
 w.document.getElementById('reset-filters').click();w.document.getElementById('next-page').click();assert.match(text(w,'page-label'),/Page 2/);
 event(w,'min-salary','input','99999');assert.equal(w.document.getElementById('empty-state').hidden,false);
 w.document.getElementById('theme-toggle').click();assert.equal(w.document.documentElement.dataset.bsTheme,'dark');
 d.window.close();console.log('PASS API data, search, salary, favorites, saved searches, pagination, theme');
 d=await load('post-job.html');w=d.window;event(w,'post-form','submit');assert.ok(w.document.querySelectorAll('.is-invalid').length>0);
 const values={title:'Student Test Developer',company:'Student Company',email:'test@example.com',location:'Astana',category:'IT & Software',employmentType:'Full-time',workMode:'Remote',salary:'2500',description:'Build a responsive website and test every important feature with the rest of the development team.'};
 for(const [id,value]of Object.entries(values)) event(w,id,'input',value);
 event(w,'post-form','submit');assert.equal(w.document.getElementById('post-success').hidden,false);
 let jobs=JSON.parse(w.localStorage.getItem('jobfinder.customJobs.v1'));assert.equal(jobs.length,1);assert.equal(jobs[0].email,undefined);let id=jobs[0].id;d.window.close();
 d=await load('post-job.html',{'jobfinder.customJobs.v1':jobs},'success','?edit='+id);w=d.window;
 assert.equal(w.document.getElementById('title').value,values.title);event(w,'title','input','Updated Student Job');event(w,'post-form','submit');
 jobs=JSON.parse(w.localStorage.getItem('jobfinder.customJobs.v1'));assert.equal(jobs[0].title,'Updated Student Job');assert.equal(jobs.length,1);d.window.close();
 d=await load('jobs.html',{'jobfinder.customJobs.v1':jobs},'success','?search=Updated');w=d.window;
 w.document.querySelector('.btn-outline-danger').click();assert.equal(JSON.parse(w.localStorage.getItem('jobfinder.customJobs.v1')).length,0);assert.equal(w.document.querySelectorAll('#job-list .job-card').length,0);d.window.close();
 console.log('PASS custom job create, validation, restore, edit, delete');
 d=await load('post-job.html');w=d.window;for(const [id,value]of Object.entries(values))event(w,id,'input',value);
 w.Storage.prototype.setItem=()=>{throw new Error('full');};event(w,'post-form','submit');assert.equal(w.document.getElementById('title').value,values.title);assert.match(text(w,'notice'),/Could not save/);d.window.close();
 console.log('PASS storage failure preserves form input');
 for(const mode of ['empty','error','malformed']){
  d=await load('jobs.html',{},mode);w=d.window;
  if(mode==='empty')assert.match(text(w,'api-status'),/returned no jobs/);
  else assert.equal(w.document.getElementById('api-retry').hidden,false);
  assert.match(text(w,'results-count'),/12 jobs/);d.window.close();
 }
 d=await load('jobs.html',{'jobfinder.customJobs.v1':'{broken','jobfinder.favorites.v1':'null','jobfinder.apiCache.v1':'42','jobfinder.searches.v1':'{}'});assert.match(text(d.window,'results-count'),/13 jobs/);d.window.close();
 console.log('PASS API empty/error/invalid response and corrupt storage');
 for(const page of ['index.html','companies.html','dashboard.html']){
  d=await load(page);w=d.window;assert.equal(w.document.querySelectorAll('nav [aria-current="page"]').length,1);
  if(page==='dashboard.html') assert.equal(w.document.querySelector('.stat-number').textContent,'13');
  if(page==='index.html') assert.equal(w.document.querySelectorAll('#featured-jobs .job-card').length,3);
  if(page==='companies.html') assert.equal(w.document.querySelectorAll('.company-card').length,7);
  d.window.close();
 }
 d=await load('contact.html');w=d.window;
 event(w,'contact-form','submit');assert.ok(w.document.querySelectorAll('.is-invalid').length>0);
 for(const [id,value]of Object.entries({fullName:'Test Student',contactEmail:'student@example.com',subject:'Other',message:'This is a valid test message for the contact form.'}))event(w,id,'input',value);
 w.document.getElementById('consent').checked=true;event(w,'contact-form','submit');assert.equal(w.document.getElementById('contact-success').hidden,false);
 w.document.querySelector('.faq-question').click();assert.equal(w.document.querySelector('.faq-question').getAttribute('aria-expanded'),'true');
 event(w,'faq-search','input','notarealquestion');await new Promise(r=>setTimeout(r,250));assert.notEqual(w.document.getElementById('faq-empty').style.display,'none');
 d.window.close();console.log('PASS other pages, dashboard, contact form and jQuery FAQ');
 assert.deepEqual(errors,[]);console.log('ALL DOM INTEGRATION CHECKS PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
