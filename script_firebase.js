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


// -----------------------------
// UI Elements
// -----------------------------
const loginSection = document.getElementById("loginSection");
const simSection = document.getElementById("simSection");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const runRoundBtn = document.getElementById("runRoundBtn");

// -----------------------------
// Auth Event Listeners
// -----------------------------
loginBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
};

registerBtn.onclick = () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password).catch(err => alert(err.message));
};

logoutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = "none";
    simSection.style.display = "block";
    userEmail.textContent = user.email;
  } else {
    loginSection.style.display = "block";
    simSection.style.display = "none";
  }
});

// -----------------------------
// Simulation Logic
// -----------------------------
runRoundBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Please login first.");

  const round = parseInt(document.getElementById("roundSelect").value);
  const google = parseFloat(document.getElementById("googleInput").value) || 0;
  const social = parseFloat(document.getElementById("socialInput").value) || 0;
  const email = parseFloat(document.getElementById("emailInput").value) || 0;
  const influencer = parseFloat(document.getElementById("influencerInput").value) || 0;

  if (google + social + email + influencer <= 0) {
    alert("Enter valid budgets for all channels!");
    return;
  }

  // Basic simulation formula (can be made dynamic later)
  const revenue = (google * 0.25) + (social * 0.22) + (email * 0.15) + (influencer * 0.30);
  const profit = revenue - (google + social + email + influencer);

  await db.collection("users").doc(user.uid)
    .collection("rounds").doc("round_" + round)
    .set({ google, social, email, influencer, revenue, profit, timestamp: firebase.firestore.FieldValue.serverTimestamp() });

  drawChart([google, social, email, influencer], revenue);
  alert(`Round ${round} completed! Revenue: $${revenue.toFixed(2)}`);
});

// -----------------------------
// Chart Drawing
// -----------------------------
let chart;
function drawChart(budgets, revenue) {
  const ctx = document.getElementById("myChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Google", "Social", "Email", "Influencer"],
      datasets: [{
        label: "Budgets",
        data: budgets,
        backgroundColor: "lightblue"
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: `Round Revenue: $${revenue.toFixed(2)}` }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}