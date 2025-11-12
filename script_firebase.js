// ====================  FIREBASE + SIMULATION  ====================
// 1. Paste your Firebase config below
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5vl32N36EEuL4T6AaxGTvCruiXEhqmUE",
  authDomain: "mgt-sims.firebaseapp.com",
  projectId: "mgt-sims",
  storageBucket: "mgt-sims.firebasestorage.app",
  messagingSenderId: "68578603565",
  appId: "1:68578603565:web:641cdeb2bbf3444814bea4",
  measurementId: "G-6LXSJSDJTK"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// ========== AUTHENTICATION ==========
const loginBox=document.getElementById('loginBox');
const simContainer=document.getElementById('simContainer');
const simArea=document.getElementById('simArea');
const msg=document.getElementById('loginMsg');
document.getElementById('loginBtn').onclick=()=>auth.signInWithEmailAndPassword(email.value,password.value).catch(e=>msg.innerText=e.message);
document.getElementById('registerBtn').onclick=()=>auth.createUserWithEmailAndPassword(email.value,password.value).catch(e=>msg.innerText=e.message);
document.getElementById('logoutBtn').onclick=()=>auth.signOut();

auth.onAuthStateChanged(user=>{
  if(user){loginBox.style.display='none';simContainer.style.display='block';document.getElementById('userName').innerText=user.email;buildSimUI(user);}
  else{loginBox.style.display='block';simContainer.style.display='none';simArea.innerHTML='';}
});

// ========== SIMULATION ==========
function buildSimUI(user){
 simArea.innerHTML=`
 <div>
   <label>Round:</label>
   <select id="roundSelect"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
   <button id="runBtn">Run Round</button>
 </div>
 <canvas id="revChart" width="700" height="300"></canvas>
 <div id="report"></div>
 `;
 const ctx=document.getElementById('revChart').getContext('2d');
 const chart=new Chart(ctx,{type:'bar',data:{labels:['Google','Social','Email','Influencer'],datasets:[{label:'Revenue',data:[0,0,0,0]}]},options:{scales:{y:{beginAtZero:true}}}});
 document.getElementById('runBtn').onclick=()=>runRound(user,chart);
}

function rand(){return 1+(Math.random()-.5)*.1;}
async function runRound(user,chart){
 const r=parseInt(document.getElementById('roundSelect').value);
 const avgOrder=[35,38,40,42,48][r-1];
 const ch={g:{b:1000,c:0.04,v:0.25},s:{b:8000,c:0.11,v:0.32},e:{b:50000,c:0.12,v:0.03},i:{b:2000,c:0.25,v:0.25}};
 function sim(base,ctr,conv){const imp=base*rand();const clk=imp*ctr;const con=clk*conv;return {revenue:con*avgOrder,conv:con};}
 const g=sim(ch.g.b,ch.g.c,ch.g.v),s=sim(ch.s.b,ch.s.c,ch.s.v),e=sim(ch.e.b,ch.e.c,ch.e.v),i=sim(ch.i.b,ch.i.c,ch.i.v);
 const total=g.revenue+s.revenue+e.revenue+i.revenue;
 const profit=total-5000; const roi=(profit/5000)*100;
 chart.data.datasets[0].data=[g.revenue,s.revenue,e.revenue,i.revenue];chart.update();
 document.getElementById('report').innerHTML=`<p>Round ${r} | Profit: $${profit.toFixed(2)} | ROI: ${roi.toFixed(1)}%</p>`;
 await db.collection('users').doc(user.uid).collection('rounds').doc(String(r)).set({
   round:r,profit,roi,avgOrder,totalRevenue:total,
   google:g,social:s,email:e,influencer:i,
   timestamp:firebase.firestore.FieldValue.serverTimestamp()
 });
}
