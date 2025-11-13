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

//-----------------------------------------------------
// UI ELEMENTS
//-----------------------------------------------------
const loginSection = document.getElementById("loginSection");
const simSection = document.getElementById("simSection");
const userEmail = document.getElementById("userEmail");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const runRoundBtn = document.getElementById("runRoundBtn");
const pdfBtn = document.getElementById("downloadPdfBtn");

//-----------------------------------------------------
// AUTH LOGIC
//-----------------------------------------------------
loginBtn.onclick = () => {
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).catch(err => alert(err.message));
};

registerBtn.onclick = () => {
  auth.createUserWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).catch(err => alert(err.message));
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

//-----------------------------------------------------
// SIMULATION STORAGE
//-----------------------------------------------------
let roiData = [null, null, null, null, null]; // store ROI of rounds 1–5
let barChart = null;
let roiChart = null;

//-----------------------------------------------------
// RUN ROUND
//-----------------------------------------------------
runRoundBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Please login first.");

  const round = parseInt(document.getElementById("roundSelect").value);

  const google = parseFloat(document.getElementById("googleInput").value) || 0;
  const social = parseFloat(document.getElementById("socialInput").value) || 0;
  const email = parseFloat(document.getElementById("emailInput").value) || 0;
  const influencer = parseFloat(document.getElementById("influencerInput").value) || 0;

  const totalSpend = google + social + email + influencer;
  if (totalSpend <= 0) return alert("Enter valid budgets!");

  // Revenue formula (you can customize)
  const revenue =
    (google * 0.25) +
    (social * 0.22) +
    (email * 0.15) +
    (influencer * 0.30);

  const profit = revenue - totalSpend;
  const roi = (profit / totalSpend) * 100;

  roiData[round - 1] = roi;

  //-----------------------------------------------------
  // SAVE TO FIRESTORE
  //-----------------------------------------------------
  await db.collection("users").doc(user.uid)
    .collection("rounds").doc(`round_${round}`)
    .set({
      google, social, email, influencer,
      totalSpend, revenue, profit, roi,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

  //-----------------------------------------------------
  // DRAW CHARTS
  //-----------------------------------------------------
  drawBudgetChart([google, social, email, influencer], revenue);
  drawRoiChart();

  alert(`Round ${round} Completed!\nRevenue: $${revenue.toFixed(2)}\nROI: ${roi.toFixed(2)}%`);
});

//-----------------------------------------------------
// BAR CHART (BUDGET SPENT)
//-----------------------------------------------------
function drawBudgetChart(budgets, revenue) {
  const ctx = document.getElementById("myChart").getContext("2d");
  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Google", "Social", "Email", "Influencer"],
      datasets: [{
        label: "Budget Spent ($)",
        data: budgets,
        backgroundColor: "rgba(54,162,235,0.6)"
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Revenue Generated: $${revenue.toFixed(2)}`
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

//-----------------------------------------------------
// ROI LINE CHART
//-----------------------------------------------------
function drawRoiChart() {
  const ctx = document.getElementById("roiChart").getContext("2d");
  if (roiChart) roiChart.destroy();

  roiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ["R1", "R2", "R3", "R4", "R5"],
      datasets: [{
        label: "ROI (%)",
        data: roiData,
        borderColor: "green",
        backgroundColor: "rgba(0,128,0,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

//-----------------------------------------------------
// PDF DOWNLOAD BUTTON
//-----------------------------------------------------
pdfBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("MGT SIMS - Digital Campaign Simulation Report", 10, 15);

  doc.setFontSize(12);
  doc.text(`User: ${auth.currentUser.email}`, 10, 25);

  let y = 40;
  roiData.forEach((roi, i) => {
    if (roi !== null) {
      doc.text(`Round ${i+1} ROI: ${roi.toFixed(2)}%`, 10, y);
      y += 10;
    }
  });

  doc.save("MGT_SIM_Report.pdf");
});
