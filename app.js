import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let auth = null;
let db = null;

document.addEventListener('DOMContentLoaded', () => {
  // Fetch dynamic Firebase configuration from the Express backend with cache busting
  fetch('/api/firebase-config?cb=' + Date.now())
    .then(res => res.json())
    .then(config => {
      const app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);

      // Listen for authentication changes
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          isUserLoggedIn = true;
          // Sync onboarding quiz choices to Firestore
          await syncUserData(user);

          // Get user document to verify role
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              userRole = userDoc.data().role || 'client';
            }
          } catch(err) {
            console.error("Error reading user role:", err);
          }

          updateHeaderNavActions(true, user);

          // If the user just completed the quiz, remain on the results page to show them their scores and advisor match!
          if (justCompletedQuiz && userRole === 'client') {
            sections.forEach(sec => {
              sec.classList.toggle('active', sec.id === 'results');
            });
            renderResultsPage();
          } else {
            // Otherwise transition them directly to the dashboard
            sections.forEach(sec => {
              const target = userRole === 'advisor' ? 'advisor-portal' : 'dashboard';
              sec.classList.toggle('active', sec.id === target);
            });

            if (userRole === 'advisor') {
              renderAdvisorDashboard();
            } else {
              renderClientDashboard();
            }
          }
        } else {
          isUserLoggedIn = false;
          updateHeaderNavActions(false);
        }
      });
    })
    .catch(err => console.error("Error initializing Firebase Client SDK:", err));


  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      
      // If Browse Directory is clicked and user is not logged in, redirect to login/signup quiz flow
      if (targetId === 'directory' && !isUserLoggedIn) {
        // Find the quiz section and scroll to it
        const quizBox = document.querySelector('.quiz-box') || document.querySelector('.hero-quiz-card');
        if (quizBox) {
          quizBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        goToStep('signup');
        return;
      }
      
      // Update links
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update sections
      sections.forEach(sec =>
        sec.classList.toggle('active', sec.id === targetId)
      );

      if (targetId === 'dashboard') {
        renderClientDashboard().then(() => {
          const scrollId = link.getAttribute('data-scroll');
          if (scrollId === 'document-locker-card') {
            switchDashboardTab('documents');
          } else if (scrollId === 'message-center-card') {
            switchDashboardTab('messages');
          } else {
            switchDashboardTab('roadmap');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      } else {
        if (targetId === 'advisor-portal') {
          renderAdvisorDashboard();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Bind dashboard tab click events
  document.querySelectorAll('.db-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchDashboardTab(tabId);
    });
  });

  function switchDashboardTab(tabId) {
    document.querySelectorAll('.db-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.db-panel').forEach(panel => {
      panel.style.display = panel.id === `panel-${tabId}` ? 'block' : 'none';
      panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
  }

  // Bind bookings sub-tabs click events
  const subtabUpcoming = document.getElementById('subtab-upcoming');
  const subtabPast = document.getElementById('subtab-past');
  const upcomingContent = document.getElementById('bookings-upcoming-content');
  const pastContent = document.getElementById('bookings-past-content');

  if (subtabUpcoming && subtabPast) {
    subtabUpcoming.addEventListener('click', () => {
      subtabUpcoming.classList.add('active');
      subtabPast.classList.remove('active');
      if (upcomingContent) upcomingContent.style.display = 'block';
      if (pastContent) pastContent.style.display = 'none';
    });

    subtabPast.addEventListener('click', () => {
      subtabPast.classList.add('active');
      subtabUpcoming.classList.remove('active');
      if (upcomingContent) upcomingContent.style.display = 'none';
      if (pastContent) pastContent.style.display = 'block';
    });
  }

  // Bind sub-nav category click events
  document.querySelectorAll('.sub-nav-cat').forEach(cat => {
    cat.addEventListener('click', (e) => {
      e.preventDefault();
      portalActiveFocusArea = cat.getAttribute('data-focus');
      document.querySelectorAll('.sub-nav-cat').forEach(c => c.classList.remove('active'));
      cat.classList.add('active');
      renderClientDashboard();
    });
  });

  // Hero Step-by-Step Quiz Logic
  // State variables declared in outer scope so they're accessible to functions outside the quizCard block
  let currentStep = 1;
  let selectedFocus = '';  // status, career, finance
  let selectedStep2 = '';  // visa, family, greencard, hired, business, credit, investing
  let selectedStep3 = '';  // lawyer, peer, tech, health, engineering, finance_biz, playbook, launch, basics, advanced
  let selectedStep7 = '';
  let selectedStep8 = '';
  let selectedStep9 = [];
  let selectedStep10 = '';
  let isUserLoggedIn = false; // Simulated authentication state
  let userRole = 'client'; // Current active dashboard role ('client' or 'advisor')
  let ratings = { status: 0, career: 0, finance: 0 };
  let portalActiveFocusArea = null; // Active dashboard category filter
  let justCompletedQuiz = false; // Flag to check if user completed quiz in this session
  // Dynamic goal selection steps state
  let goalStepsToAsk = [];
  let currentGoalStepIndex = 0;

  let quizContentConfig = {};
  let statusDescriptions = {};

  // Config objects declared in outer scope for access by renderResultsPage and other outside-quizCard functions
  function getChecklistItems(focusArea, bottleneck) {
    const focusKey = getFocusKey(focusArea);
    
    // Fallback seed checklists specific to focus areas if not found in dynamic config
    const fallbackChecklists = {
      status: {
        status: [
          { label: "Get or renew my work/student visa", val: "visa" },
          { label: "Determine eligibility for special talent/national interest visa", val: "talent" },
          { label: "Find a local immigration lawyer referral", val: "lawyer" },
          { label: "Explore digital nomad or remote work visas", val: "nomad" }
        ],
        career: [
          { label: "Organize certified translations of official records", val: "translations" },
          { label: "Prepare cover letter, application forms, and history logs", val: "forms" },
          { label: "Bring my family or dependents here", val: "family" },
          { label: "Submit and track applications without errors", val: "tracking" }
        ],
        finance: [
          { label: "Get my Green Card or long-term residency", val: "greencard" },
          { label: "Understand local stay and physical presence rules", val: "presence" },
          { label: "Navigate paperwork audits and legal rules", val: "audits" },
          { label: "Transition from temporary status to permanent status", val: "transition" }
        ]
      },
      career: {
        status: [
          { label: "Optimize local CV format and build target job list", val: "cv_format" },
          { label: "Identify top 10 expat-friendly employers in target city", val: "employer_list" }
        ],
        career: [
          { label: "Setup LinkedIn search alerts and local recruiter outreach", val: "recruiter_outreach" },
          { label: "Draft cultural-specific cover letter and intro templates", val: "cover_letters" }
        ],
        finance: [
          { label: "Practice local mock interviews and negotiate package templates", val: "mock_interviews" },
          { label: "Review labor law, work permit compliance, and contract standards", val: "labor_law" }
        ]
      },
      finance: {
        status: [
          { label: "Compare local bank account options and account opening requirements", val: "bank_requirements" },
          { label: "Translate and notarize proof of address/residency documents", val: "notarize_docs" }
        ],
        career: [
          { label: "Apply for local tax identification number (SSN/TIN equivalent)", val: "tax_number" },
          { label: "Establish local credit history and apply for secured starter card", val: "secured_card" }
        ],
        finance: [
          { label: "Set up multi-currency transfer service to avoid high bank fees", val: "currency_transfer" },
          { label: "Consult local tax guide or advisor regarding double-taxation rules", val: "tax_rules" }
        ]
      }
    };
    
    // First try to look inside quizContentConfig[focusKey][9]
    if (quizContentConfig && quizContentConfig[focusKey] && quizContentConfig[focusKey][9] && quizContentConfig[focusKey][9].checklists) {
      const lists = quizContentConfig[focusKey][9].checklists;
      if (lists[bottleneck]) {
        return lists[bottleneck];
      }
    }
    
    return fallbackChecklists[focusKey][bottleneck] || fallbackChecklists['status']['status'];
  }

  const mockBookingsData = {
    'Status & Visas': {
      upcoming: [
        {
          guideName: "David K.",
          guideRole: "Immigration Expert",
          guideAvatar: "david_k_portrait.png",
          type: "Visa Application Review",
          date: "June 28, 2026",
          time: "10:00 AM - 11:00 AM (EST)",
          joinLink: "https://zoom.us/j/123456789",
          rescheduleId: "resched1",
          tip: "Please upload your passport copy and academic transcripts to the Document Locker before our session so I can review them in advance."
        }
      ],
      past: [
        {
          guideName: "David K.",
          guideRole: "Immigration Expert",
          guideAvatar: "david_k_portrait.png",
          type: "Eligibility Intake Consultation",
          date: "June 12, 2026",
          time: "2:00 PM - 2:30 PM (EST)",
          status: "Completed",
          notes: "Reviewed regional visa options. Recommended proceeding with the talent visa pathway due to your high qualification scores. Next step is gathering letter of recommendation templates."
        }
      ]
    },
    'Career & Jobs': {
      upcoming: [
        {
          guideName: "Hassan M.",
          guideRole: "Expat Career Coach",
          guideAvatar: "hassan_portrait.png",
          type: "CV & Portfolio Deep Dive",
          date: "July 3, 2026",
          time: "2:00 PM - 3:00 PM (EST)",
          joinLink: "https://meet.google.com/abc-defg-hij",
          rescheduleId: "resched2",
          tip: "Please update your LinkedIn profile URL and share it in our chat channel before the call starts."
        }
      ],
      past: [
        {
          guideName: "Hassan M.",
          guideRole: "Expat Career Coach",
          guideAvatar: "hassan_portrait.png",
          type: "Introduction & Strategy Session",
          date: "June 18, 2026",
          time: "1:00 PM - 1:45 PM (EST)",
          status: "Completed",
          notes: "Conducted CV deep dive. Standardized professional layout for target European market. Recommended highlighting technical project ownership metrics."
        }
      ]
    },
    'Finance & Credit': {
      upcoming: [],
      past: [
        {
          guideName: "Sarah L.",
          guideRole: "Financial Consultant",
          guideAvatar: "sarah_portrait.png",
          type: "Expat Taxation & Banking Briefing",
          date: "June 15, 2026",
          time: "4:00 PM - 4:45 PM (EST)",
          status: "Completed",
          notes: "Explained steps for opening a local resident bank account without credit history. Shared utility bill registration checklists."
        }
      ]
    }
  };

  const mockDocumentsData = {
    'Status & Visas': [
      { name: "visa_application_draft_v2.pdf", size: "2.4 MB", dateStr: "Yesterday" },
      { name: "certified_academic_transcript.pdf", size: "1.8 MB", dateStr: "3 days ago" },
      { name: "employer_offer_letter.png", size: "920 KB", dateStr: "5 days ago" }
    ],
    'Career & Jobs': [
      { name: "optimized_expat_cv_europe.pdf", size: "1.2 MB", dateStr: "Yesterday" },
      { name: "cover_letter_template.docx", size: "340 KB", dateStr: "2 days ago" }
    ],
    'Finance & Credit': [
      { name: "proof_of_residency_utility.pdf", size: "3.1 MB", dateStr: "June 14, 2026" },
      { name: "local_bank_application.pdf", size: "1.5 MB", dateStr: "June 15, 2026" }
    ]
  };

  const mockAdvisorsData = {
    'Status & Visas': { name: "David K.", role: "Immigration Expert", avatar: "david_k_portrait.png" },
    'Career & Jobs': { name: "Hassan M.", role: "Expat Career Coach", avatar: "hassan_portrait.png" },
    'Finance & Credit': { name: "Sarah L.", role: "Financial Consultant", avatar: "sarah_portrait.png" }
  };

  function renderBookings(focusArea) {
    const upcomingList = document.getElementById('bookings-upcoming-list');
    const upcomingEmpty = document.getElementById('bookings-upcoming-empty');
    const pastList = document.getElementById('bookings-past-list');
    const pastEmpty = document.getElementById('bookings-past-empty');

    if (!upcomingList || !pastList) return;

    upcomingList.innerHTML = '';
    pastList.innerHTML = '';

    const bookings = mockBookingsData[focusArea] || { upcoming: [], past: [] };

    // Render Upcoming Bookings
    if (bookings.upcoming.length === 0) {
      if (upcomingEmpty) upcomingEmpty.style.display = 'block';
    } else {
      if (upcomingEmpty) upcomingEmpty.style.display = 'none';
      bookings.upcoming.forEach(b => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.style.cssText = 'display: flex; flex-direction: column; gap: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; transition: all 0.2s; margin-bottom: 12px;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <img src="${b.guideAvatar}" alt="${b.guideName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent);" />
              <div>
                <h4 style="font-weight: 700; color: var(--text-primary); font-size: 1rem; margin: 0; display: flex; align-items: center; gap: 8px;">
                  ${b.type}
                  <span style="font-size: 0.72rem; font-weight: 600; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span> Confirmed
                  </span>
                </h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 2px 0 6px 0;">with ${b.guideName} • ${b.guideRole}</p>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: var(--accent);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${b.date} at ${b.time}</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <a href="${b.joinLink}" target="_blank" class="btn btn-primary" style="padding: 10px 18px; border-radius: 8px; font-size: 0.82rem; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                📹 Join Call
              </a>
              <button class="btn btn-outline btn-reschedule-booking" data-id="${b.rescheduleId}" style="padding: 10px 18px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer;">
                Reschedule
              </button>
            </div>
          </div>
          ${b.tip ? `
            <div style="background: rgba(17,47,32,0.02); border-left: 3px solid var(--accent); padding: 12px 16px; border-radius: 4px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">
              <strong style="color: var(--accent); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                💡 Preparation Tip:
              </strong> 
              ${b.tip}
            </div>
          ` : ''}
        `;
        upcomingList.appendChild(card);
      });
    }

    // Render Past Bookings
    if (bookings.past.length === 0) {
      if (pastEmpty) pastEmpty.style.display = 'block';
    } else {
      if (pastEmpty) pastEmpty.style.display = 'none';
      bookings.past.forEach(b => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.style.cssText = 'display: flex; flex-direction: column; gap: 14px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; transition: all 0.2s; margin-bottom: 12px;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <img src="${b.guideAvatar}" alt="${b.guideName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; opacity: 0.8; border: 1px solid var(--border-color);" />
              <div>
                <h4 style="font-weight: 600; color: var(--text-secondary); font-size: 0.95rem; margin: 0;">${b.type}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 2px 0 6px 0;">with ${b.guideName} • ${b.guideRole}</p>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${b.date}</span>
                </div>
              </div>
            </div>
            <div>
              <span style="font-size: 0.82rem; font-weight: 600; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
                ✓ Completed
              </span>
            </div>
          </div>
          ${b.notes ? `
            <div style="background: rgba(0,0,0,0.02); border-left: 3px solid #10b981; padding: 12px 16px; border-radius: 4px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45;">
              <strong style="color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                📝 Advisor Summary Notes:
              </strong>
              ${b.notes}
            </div>
          ` : ''}
        `;
        pastList.appendChild(card);
      });
    }

    // Attach reschedule alert
    upcomingList.querySelectorAll('.btn-reschedule-booking').forEach(btn => {
      btn.addEventListener('click', () => {
        alert("To reschedule this coaching session, please send a direct message to your advisor in the Message Center.");
      });
    });
  }

  function getBiggestBottleneck() {
    let bottleneck = 'status';
    if (ratings.career < ratings.status) bottleneck = 'career';
    if (ratings.finance < ratings[bottleneck]) bottleneck = 'finance';
    return bottleneck;
  }

  async function syncUserData(user) {
    if (!db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const payload = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: "client",
        updatedAt: new Date(),
        quizResults: {
          focusArea: selectedFocus || "",
          scores: ratings || { status: 0, career: 0, finance: 0 },
          biggestBottleneck: getBiggestBottleneck() || "status",
          selectedGoals: selectedStep9 || []
        }
      };

      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        payload.createdAt = new Date();
        await setDoc(userDocRef, payload);
      } else {
        await updateDoc(userDocRef, {
          updatedAt: new Date(),
          quizResults: payload.quizResults
        });
      }
      console.log("Synced user onboarding data to Firestore successfully.");
    } catch (err) {
      console.error("Error syncing user data to Firestore:", err);
    }
  }

  const quizCard = document.querySelector('.hero-quiz-card');
  if (quizCard) {
    // 1. Core State Variables (now in outer scope above)
    const totalSteps = 10; // Q1-Q3 survey, Q4-Q6 ratings, Q7-Q10 dynamic questions

    // 2. DOM Elements
    const progressFill = document.getElementById('hero-quiz-progress');
    const stepLabel = quizCard.querySelector('.quiz-step-label');
    
    // Horizon Visualizer elements
    const ratingBtns = quizCard.querySelectorAll('.rating-btn');
    const sun = document.getElementById('horizon-sun');
    const sunGlow = document.getElementById('horizon-sun-glow');
    const skyGlowStop = document.getElementById('sky-glow-stop');
    const statusText = document.getElementById('rating-status-text');
    const finalSubmitBtn = quizCard.querySelector('.quiz-final-submit-btn');

    // 3. Sky gradient color palette (Step 4 sunrise progression)
    const skyColors = [
      '#eae2d5', // 1 (foggy beige)
      '#ebd9ca', // 2
      '#eccfc0', // 3
      '#edc6b5', // 4
      '#eebdab', // 5
      '#f0b3a0', // 6
      '#f1aa96', // 7
      '#f2a08b', // 8
      '#f39781', // 9
      '#f48d76'  // 10 (warm coral-rose sunrise)
    ];

    // Dynamic quiz contents config for Q4-Q10
    quizContentConfig = {
      status: {
        categories: ["Visa Prep", "Documents", "Compliance"],
        4: {
          badge: "Visa Prep",
          title: "Visa & Route Readiness",
          desc: "How clear is your visa route and eligibility right now?",
          type: "rating",
          category: "status"
        },
        5: {
          badge: "Documents",
          title: "Immigration Paperwork Readiness",
          desc: "How prepared is your immigration paperwork and files?",
          type: "rating",
          category: "career"
        },
        6: {
          badge: "Compliance",
          title: "Legal & Compliance Confidence",
          desc: "How confident are you about meeting legal sponsor or residency compliance rules?",
          type: "rating",
          category: "finance"
        },
        7: {
          badge: "Relocation Timeline",
          title: "When do you need your visa or status sorted?",
          desc: "Select your target timeline for moving or securing residency:",
          type: "choice",
          choices: [
            { label: "Immediately (Within 1 month)", val: "immediate" },
            { label: "Soon (1 to 3 months)", val: "soon" },
            { label: "Planning ahead (3 to 6 months)", val: "planning" },
            { label: "Just exploring options", val: "exploring" }
          ]
        },
        8: {
          badge: "Key Obstacle",
          title: "What is the biggest immigration hurdle you are facing?",
          desc: "Identify the main friction point in your process:",
          type: "choice",
          choices: [
            { label: "Finding a sponsoring employer or business route", val: "sponsor" },
            { label: "Understanding complex government regulations", val: "rules" },
            { label: "Organizing legal paperwork & official translations", val: "paperwork" },
            { label: "Navigating family/dependent visa limitations", val: "dependents" }
          ]
        },
        9: {
          badge: "Immigration Goals",
          title: "What would it take to move your status closer to 10?",
          desc: "Select the specific immigration actions you need help with:",
          type: "checklist",
          checklists: {
            status: [
              { label: "Get or renew my work/student visa", val: "visa" },
              { label: "Determine eligibility for special talent/national interest visa", val: "talent" },
              { label: "Find a local immigration lawyer referral", val: "lawyer" },
              { label: "Explore digital nomad or remote work visas", val: "nomad" }
            ],
            career: [
              { label: "Organize certified translations of official records", val: "translations" },
              { label: "Prepare cover letter, application forms, and history logs", val: "forms" },
              { label: "Bring my family or dependents here", val: "family" },
              { label: "Submit and track applications without errors", val: "tracking" }
            ],
            finance: [
              { label: "Get my Green Card or long-term residency", val: "greencard" },
              { label: "Understand local stay and physical presence rules", val: "presence" },
              { label: "Navigate paperwork audits and legal rules", val: "audits" },
              { label: "Transition from temporary status to permanent status", val: "transition" }
            ]
          }
        },
        10: {
          badge: "Support Plan",
          title: "How do you want to collaborate with your advisor?",
          desc: "Choose the support structure that fits your needs best:",
          type: "choice",
          choices: [
            { label: "A quick 1-on-1 session to audit my documents", val: "audit" },
            { label: "Step-by-step coaching through my relocation", val: "coaching" },
            { label: "Ask ongoing questions via chat and messages", val: "chat" },
            { label: "Get direct introductions to vetted service providers", val: "intros" }
          ]
        }
      },
      career: {
        categories: ["Profile", "Outreach", "Interviews"],
        4: {
          badge: "Profile",
          title: "Resume & LinkedIn Localization",
          desc: "How well is your profile tailored for the local market?",
          type: "rating",
          category: "status"
        },
        5: {
          badge: "Outreach",
          title: "Job Search & Networking Strategy",
          desc: "How active and structured is your local networking and job applications?",
          type: "rating",
          category: "career"
        },
        6: {
          badge: "Interviews",
          title: "Interview & Offer Readiness",
          desc: "How confident are you with local interviews and salary negotiations?",
          type: "rating",
          category: "finance"
        },
        7: {
          badge: "Target Role",
          title: "What type of career move are you aiming for?",
          desc: "Select your primary employment goal:",
          type: "choice",
          choices: [
            { label: "Full-time corporate position", val: "corporate" },
            { label: "Freelance, consulting, or contract work", val: "freelance" },
            { label: "Starting a business / startup founder", val: "startup" },
            { label: "Transitioning to a completely new industry", val: "transition" }
          ]
        },
        8: {
          badge: "Key Blocker",
          title: "What is your biggest job search blocker right now?",
          desc: "Identify the main challenge holding you back:",
          type: "choice",
          choices: [
            { label: "Lacking local work experience or credentials", val: "experience" },
            { label: "Not understanding local job market rules & culture", val: "culture" },
            { label: "Struggling to pass interview and screening rounds", val: "interviews" },
            { label: "My resume is not getting callback responses", val: "callbacks" }
          ]
        },
        9: {
          badge: "Career Goals",
          title: "What would it take to move your career closer to 10?",
          desc: "Select the career goals you want to prioritize:",
          type: "checklist",
          checklists: {
            status: [
              { label: "Tailor my resume for local hiring managers", val: "resume" },
              { label: "Localize my LinkedIn profile summary and skills", val: "linkedin" },
              { label: "Build a portfolio that translates to local roles", val: "portfolio" },
              { label: "Identify key hiring requirements in this market", val: "requirements" }
            ],
            career: [
              { label: "Build a target list of 20 local companies", val: "target_list" },
              { label: "Find and contact local recruiters in my niche", val: "recruiters" },
              { label: "Master warm outreach to alumni and professionals", val: "outreach" },
              { label: "Attend local industry meetups and networking events", val: "meetups" }
            ],
            finance: [
              { label: "Conduct mock interviews with local feedback", val: "mock" },
              { label: "Learn how to answer cultural and behavioral questions", val: "behavioral" },
              { label: "Negotiate salary package and sign-on bonuses", val: "negotiation" },
              { label: "Get salary benchmarks for my role and experience", val: "benchmarks" }
            ]
          }
        },
        10: {
          badge: "Advisor Support",
          title: "What are you looking for most from your career advisor?",
          desc: "Choose the primary outcome you want to achieve:",
          type: "choice",
          choices: [
            { label: "Thorough resume and LinkedIn profile reviews", val: "profile_review" },
            { label: "Mock interviews & active interview coaching", val: "interview_coaching" },
            { label: "Direct job referrals and recruiter connections", val: "referrals" },
            { label: "Local salary benchmarking & negotiation advice", val: "salary_bench" }
          ]
        }
      },
      finance: {
        categories: ["Credit", "Banking", "Taxes"],
        4: {
          badge: "Credit",
          title: "Credit Score Foundation",
          desc: "How established is your local credit history right now?",
          type: "rating",
          category: "status"
        },
        5: {
          badge: "Banking",
          title: "Banking & Account Setup",
          desc: "How complete is your local banking, cards, and international transfer setup?",
          type: "rating",
          category: "career"
        },
        6: {
          badge: "Taxes",
          title: "Tax & Asset Preparedness",
          desc: "How prepared are you for local/cross-border taxes and securing assets (housing)?",
          type: "rating",
          category: "finance"
        },
        7: {
          badge: "Financial Target",
          title: "What is your primary financial goal in the new country?",
          desc: "Select your main focus area:",
          type: "choice",
          choices: [
            { label: "Building a local credit score from scratch", val: "build_credit" },
            { label: "Setting up everyday banking & high-limit credit cards", val: "everyday_banking" },
            { label: "Sorting cross-border income and corporate tax compliance", val: "tax_compliance" },
            { label: "Buying a home / securing an expat mortgage", val: "home_mortgage" }
          ]
        },
        8: {
          badge: "Key Blocker",
          title: "What is your biggest financial bottleneck right now?",
          desc: "Identify your main challenge:",
          type: "choice",
          choices: [
            { label: "No local credit score to rent or get loans", val: "no_credit" },
            { label: "Confused about double taxation and filing rules", val: "double_tax" },
            { label: "Paying high fees on currency exchange & wire transfers", val: "wire_fees" },
            { label: "Cannot find housing without local income history", val: "no_housing" }
          ]
        },
        9: {
          badge: "Finance Goals",
          title: "What would it take to move your finance closer to 10?",
          desc: "Select the financial goals you want to prioritize:",
          type: "checklist",
          checklists: {
            status: [
              { label: "Apply for a credit-builder card (no credit history needed)", val: "builder_card" },
              { label: "Link foreign credit history to local bureaus", val: "foreign_link" },
              { label: "Monitor local credit score reports daily", val: "monitor" },
              { label: "Understand how credit mix and utilization work locally", val: "utilization" }
            ],
            career: [
              { label: "Open low-fee local checking & savings accounts", val: "open_checking" },
              { label: "Set up cheap international transfer channels", val: "cheap_transfers" },
              { label: "Obtain a tax identification number (SSN/ITIN/etc.)", val: "tax_id" },
              { label: "Establish local utilities and utilities reporting", val: "utility_link" }
            ],
            finance: [
              { label: "File local income and state tax returns", val: "file_taxes" },
              { label: "Comply with foreign asset reporting (FBAR/FATCA/etc.)", val: "asset_report" },
              { label: "Secure an expat mortgage or home loan pre-approval", val: "mortgage" },
              { label: "Optimize retirement account transfers and investments", val: "investments" }
            ]
          }
        },
        10: {
          badge: "Finance Support",
          title: "What type of financial guidance do you need most?",
          desc: "Choose the advisor specialization you want to match with:",
          type: "choice",
          choices: [
            { label: "Everyday banking setup and credit building", val: "banking_guidance" },
            { label: "Cross-border tax planning and compliance filing", val: "tax_planning" },
            { label: "Expat mortgage advisory and housing applications", val: "mortgage_advisory" },
            { label: "Comprehensive wealth management & transfer tips", val: "wealth_tips" }
          ]
        }
      }
    };

    // 4. Personalized status description texts based on focus & score
    statusDescriptions = {
      status: {
        1: "Lost in visa regulations and facing high rejection risks.",
        2: "Lost in visa regulations and facing high rejection risks.",
        3: "Gathering documents slowly but unsure of the correct pathway.",
        4: "Gathering documents slowly but unsure of the correct pathway.",
        5: "Preparing your application, but looking for a vetted lawyer/peer audit.",
        6: "Preparing your application, but looking for a vetted lawyer/peer audit.",
        7: "Visa application in progress, looking to secure your residency path.",
        8: "Visa application in progress, looking to secure your residency path.",
        9: "Visa approved or citizen, fully confident in your legal status.",
        10: "Visa approved or citizen, fully confident in your legal status."
      },
      career: {
        1: "Sending blind applications and getting filtered by algorithms.",
        2: "Sending blind applications and getting filtered by algorithms.",
        3: "Getting occasional interviews but struggling to close offers.",
        4: "Getting occasional interviews but struggling to close offers.",
        5: "Getting offers, but want to optimize your resume and practice interviews.",
        6: "Getting offers, but want to optimize your resume and practice interviews.",
        7: "Targeting top companies, ready to negotiate maximum compensation.",
        8: "Targeting top companies, ready to negotiate maximum compensation.",
        9: "Working your dream job, earning fair market value.",
        10: "Working your dream job, earning fair market value."
      },
      finance: {
        1: "Zero local credit history, struggling to open bank accounts.",
        2: "Zero local credit history, struggling to open bank accounts.",
        3: "Building basic credit, but facing high interest rates and deposit hurdles.",
        4: "Building basic credit, but facing high interest rates and deposit hurdles.",
        5: "Credit score is growing, but need advice on tax compliance and basic planning.",
        6: "Credit score is growing, but need advice on tax compliance and basic planning.",
        7: "Ready to invest, buy a home, or manage cross-border taxes.",
        8: "Ready to invest, buy a home, or manage cross-border taxes.",
        9: "Financial basics secured, wealth growing with expert compliance.",
        10: "Financial basics secured, wealth growing with expert compliance."
      }
    };

    // 5. Visualizer Animations & Calculations
    function getPathCoordinate(category, t) {
      let base_y = 120;
      if (category === 'status') base_y = 120;
      else if (category === 'career') base_y = 100;
      else if (category === 'finance') base_y = 80;

      const p0 = { x: 25, y: base_y };
      const p1 = { x: 115, y: base_y - 5 };
      const p2 = { x: 215, y: base_y - 40 };
      
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      return { x, y };
    }

    // Helper to restore standard opacities for path lines
    function restorePathOpacities() {
      const paths = ['horizon-active-status', 'horizon-active-career', 'horizon-active-finance'];
      const travelers = ['horizon-traveler-status', 'horizon-traveler-career', 'horizon-traveler-finance'];
      
      paths.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
      });
      travelers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const category = id.replace('horizon-traveler-', '');
          if (ratings[category] > 0) {
            el.style.opacity = '1';
          } else {
            el.style.opacity = '0';
          }
        }
      });
    }

    function updateHorizonVisuals(hoverCategory = null, hoverValue = 0) {
      const displayRatings = {
        status: (hoverCategory === 'status') ? hoverValue : ratings.status,
        career: (hoverCategory === 'career') ? hoverValue : ratings.career,
        finance: (hoverCategory === 'finance') ? hoverValue : ratings.finance
      };

      // 1. Status curve
      const valStatus = displayRatings.status;
      const pathStatus = document.getElementById('horizon-active-status');
      const travelerStatus = document.getElementById('horizon-traveler-status');
      if (pathStatus) {
        const offset = valStatus === 0 ? 210 : 210 * (1 - valStatus / 10);
        pathStatus.style.strokeDashoffset = offset;
      }
      if (travelerStatus) {
        if (valStatus === 0) {
          travelerStatus.style.opacity = '0';
        } else {
          travelerStatus.style.opacity = '1';
          const t = (valStatus - 1) / 9;
          const coords = getPathCoordinate('status', t);
          travelerStatus.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
        }
      }

      // 2. Career curve
      const valCareer = displayRatings.career;
      const pathCareer = document.getElementById('horizon-active-career');
      const travelerCareer = document.getElementById('horizon-traveler-career');
      if (pathCareer) {
        const offset = valCareer === 0 ? 210 : 210 * (1 - valCareer / 10);
        pathCareer.style.strokeDashoffset = offset;
      }
      if (travelerCareer) {
        if (valCareer === 0) {
          travelerCareer.style.opacity = '0';
        } else {
          travelerCareer.style.opacity = '1';
          const t = (valCareer - 1) / 9;
          const coords = getPathCoordinate('career', t);
          travelerCareer.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
        }
      }

      // 3. Finance curve
      const valFinance = displayRatings.finance;
      const pathFinance = document.getElementById('horizon-active-finance');
      const travelerFinance = document.getElementById('horizon-traveler-finance');
      if (pathFinance) {
        const offset = valFinance === 0 ? 210 : 210 * (1 - valFinance / 10);
        pathFinance.style.strokeDashoffset = offset;
      }
      if (travelerFinance) {
        if (valFinance === 0) {
          travelerFinance.style.opacity = '0';
        } else {
          travelerFinance.style.opacity = '1';
          const t = (valFinance - 1) / 9;
          const coords = getPathCoordinate('finance', t);
          travelerFinance.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
        }
      }

      // 4. Sun & Sky Gradient (Average of rated categories)
      let sum = 0;
      let count = 0;
      if (displayRatings.status > 0) { sum += displayRatings.status; count++; }
      if (displayRatings.career > 0) { sum += displayRatings.career; count++; }
      if (displayRatings.finance > 0) { sum += displayRatings.finance; count++; }

      const avg = count === 0 ? 0 : sum / count;

      if (sun) {
        const lift = avg === 0 ? 0 : (avg / 10) * 70;
        sun.style.transform = `translateY(${-lift}px)`;
      }
      if (sunGlow) {
        const lift = avg === 0 ? 0 : (avg / 10) * 70;
        sunGlow.style.transform = `translateY(${-lift}px)`;
        sunGlow.style.opacity = avg === 0 ? 0 : (avg / 10) * 0.9;
      }
      if (skyGlowStop) {
        const idx = Math.max(0, Math.min(9, Math.round(avg) - 1));
        const color = avg === 0 ? '#eae2d5' : skyColors[idx];
        skyGlowStop.setAttribute('stop-color', color);
      }

      // 5. Update Scoreboard Values, Labels & Highlights
      document.querySelectorAll('.score-pill').forEach(p => p.classList.remove('bottleneck'));
      
      const statusValEl = document.querySelector('#score-pill-status .score-val');
      if (statusValEl) statusValEl.innerText = displayRatings.status > 0 ? `${displayRatings.status}/10` : '-';
      
      const careerValEl = document.querySelector('#score-pill-career .score-val');
      if (careerValEl) careerValEl.innerText = displayRatings.career > 0 ? `${displayRatings.career}/10` : '-';
      
      const financeValEl = document.querySelector('#score-pill-finance .score-val');
      if (financeValEl) financeValEl.innerText = displayRatings.finance > 0 ? `${displayRatings.finance}/10` : '-';

      // Update scoreboard labels dynamically based on focus
      if (selectedFocus && quizContentConfig[selectedFocus]) {
        const catNames = quizContentConfig[selectedFocus].categories;
        const statusLabelEl = document.querySelector('#score-pill-status .score-label');
        if (statusLabelEl) statusLabelEl.innerText = catNames[0].toUpperCase();
        
        const careerLabelEl = document.querySelector('#score-pill-career .score-label');
        if (careerLabelEl) careerLabelEl.innerText = catNames[1].toUpperCase();
        
        const financeLabelEl = document.querySelector('#score-pill-finance .score-label');
        if (financeLabelEl) financeLabelEl.innerText = catNames[2].toUpperCase();
      } else {
        const statusLabelEl = document.querySelector('#score-pill-status .score-label');
        if (statusLabelEl) statusLabelEl.innerText = 'STATUS';
        
        const careerLabelEl = document.querySelector('#score-pill-career .score-label');
        if (careerLabelEl) careerLabelEl.innerText = 'CAREER';
        
        const financeLabelEl = document.querySelector('#score-pill-finance .score-label');
        if (financeLabelEl) financeLabelEl.innerText = 'FINANCE';
      }

      // Find bottleneck (lowest non-zero score)
      let lowestCategory = null;
      let lowestScore = 11;
      if (displayRatings.status > 0 && displayRatings.status < lowestScore) {
        lowestScore = displayRatings.status;
        lowestCategory = 'status';
      }
      if (displayRatings.career > 0 && displayRatings.career < lowestScore) {
        lowestScore = displayRatings.career;
        lowestCategory = 'career';
      }
      if (displayRatings.finance > 0 && displayRatings.finance < lowestScore) {
        lowestScore = displayRatings.finance;
        lowestCategory = 'finance';
      }

      if (lowestCategory) {
        const lowestPill = document.getElementById(`score-pill-${lowestCategory}`);
        if (lowestPill) lowestPill.classList.add('bottleneck');
      }

      // 6. Update status description text depending on current step
      if (statusText) {
        if (lowestCategory && count === 3 && currentStep === 6) {
          let categoryName = '';
          if (selectedFocus && quizContentConfig[selectedFocus]) {
            let idx = 0;
            if (lowestCategory === 'status') idx = 0;
            else if (lowestCategory === 'career') idx = 1;
            else if (lowestCategory === 'finance') idx = 2;
            categoryName = quizContentConfig[selectedFocus].categories[idx];
          } else {
            if (lowestCategory === 'status') categoryName = 'Visa & Documentation';
            else if (lowestCategory === 'career') categoryName = 'Career & Jobs';
            else if (lowestCategory === 'finance') categoryName = 'Finance & Credit';
          }
          statusText.innerHTML = `🏁 <strong>Assessment complete!</strong> Your biggest bottleneck is <strong>${categoryName}</strong> (${lowestScore}/10). Click Continue to complete your action plan.`;
        } else {
          let activeCat = '';
          let activeVal = 0;
          if (currentStep === 4) {
            activeCat = 'status';
            activeVal = displayRatings.status;
          } else if (currentStep === 5) {
            activeCat = 'career';
            activeVal = displayRatings.career;
          } else if (currentStep === 6) {
            activeCat = 'finance';
            activeVal = displayRatings.finance;
          }

          if (activeVal === 0) {
            statusText.innerText = "Select a number to rate your current progress.";
          } else {
            const lookupCat = selectedFocus || 'status';
            const categoryDesc = statusDescriptions[lookupCat];
            statusText.innerText = categoryDesc ? categoryDesc[activeVal] : "Select a number to rate your current progress.";
          }
        }
      }
    }

    // Helper to run matching logic and reset
    function triggerMatching() {
      if (!isUserLoggedIn) {
        goToStep('signup');
        return;
      }

      let matchId = '';
      if (selectedFocus === 'status') {
        if (selectedStep3 === 'peer') {
          matchId = 'aisha';
        } else {
          if (selectedStep2 === 'family') {
            matchId = 'david_chee';
          } else if (selectedStep2 === 'greencard') {
            matchId = 'hassan';
          } else {
            matchId = 'sarah';
          }
        }
      } else if (selectedFocus === 'career') {
        if (selectedStep2 === 'hired') {
          matchId = 'david';
        } else {
          matchId = 'michael';
        }
      } else if (selectedFocus === 'finance') {
        matchId = 'amanda';
      }
      
      if (!matchId) {
        matchId = 'sarah';
      }
      
      if (matchId) {
        const dirLink = document.querySelector('.nav-link[data-target="directory"]');
        if (dirLink) {
          dirLink.click();
        }

        const categoryBtn = document.querySelector(`.filter-pill-btn[data-category="${selectedFocus}"]`);
        if (categoryBtn) {
          categoryBtn.click();
        }

        const card = document.querySelector(`.advisor-intro-card[data-advisor-id="${matchId}"]`);
        if (card) {
          document.querySelectorAll('.advisor-intro-card').forEach(c => {
            c.classList.remove('highlight-match');
            const oldBadge = c.querySelector('.top-match-badge');
            if (oldBadge) oldBadge.remove();
          });

          const badge = document.createElement('div');
          badge.className = 'top-match-badge';
          badge.innerText = '⭐ TOP MATCH';
          badge.style.position = 'absolute';
          badge.style.top = '16px';
          badge.style.left = '16px';
          badge.style.background = 'var(--accent)';
          badge.style.color = '#000';
          badge.style.fontWeight = '800';
          badge.style.fontSize = '0.72rem';
          badge.style.letterSpacing = '0.05em';
          badge.style.padding = '6px 12px';
          badge.style.borderRadius = '30px';
          badge.style.zIndex = '10';
          badge.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          badge.style.pointerEvents = 'none';

          card.style.position = 'relative';
          card.appendChild(badge);
          card.classList.add('highlight-match');

          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }

        // Reset the quiz state
        ratings = { status: 0, career: 0, finance: 0 };
        selectedFocus = '';
        selectedStep2 = '';
        selectedStep3 = '';
        selectedStep7 = '';
        selectedStep8 = '';
        selectedStep9 = [];
        selectedStep10 = '';
        
        quizCard.querySelectorAll('.goal-checkbox-row').forEach(r => r.classList.remove('checked'));
        quizCard.querySelectorAll('.goal-checkbox-input').forEach(i => i.checked = false);
        if (ratingBtns) ratingBtns.forEach(b => b.classList.remove('active'));
        
        restorePathOpacities();
        updateHorizonVisuals();
        goToStep(1);
      }
    }

    // 6. Event Listeners Setup
    
    // Step 1: Focus Area click handler
    const focusRows = quizCard.querySelectorAll('.quiz-step-slide[data-step="1"] .quiz-choice-row');
    focusRows.forEach(row => {
      row.addEventListener('click', () => {
        selectedFocus = row.getAttribute('data-focus');
        selectedStep2 = '';
        selectedStep3 = '';
        
        quizCard.querySelectorAll('.quiz-step-slide[data-step^="2-"] .quiz-choice-row').forEach(r => r.classList.remove('active'));
        quizCard.querySelectorAll('.quiz-step-slide[data-step^="3-"] .quiz-choice-row').forEach(r => r.classList.remove('active'));
        
        focusRows.forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        goToStep(2);
      });
    });
    
    // Step 2: Branching goals click handler
    const step2Rows = quizCard.querySelectorAll('.quiz-step-slide[data-step^="2-"] .quiz-choice-row');
    step2Rows.forEach(row => {
      row.addEventListener('click', () => {
        selectedStep2 = row.getAttribute('data-step2');
        selectedStep3 = '';
        quizCard.querySelectorAll('.quiz-step-slide[data-step^="3-"] .quiz-choice-row').forEach(r => r.classList.remove('active'));
        
        const currentSlide = row.closest('.quiz-step-slide');
        currentSlide.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        goToStep(3);
      });
    });
    
    // Step 3: Connect options click handler — auto-advances after selection
    const step3Rows = quizCard.querySelectorAll('.quiz-step-slide[data-step^="3-"] .quiz-choice-row');
    step3Rows.forEach(row => {
      row.addEventListener('click', () => {
        const currentSlide = row.closest('.quiz-step-slide');
        currentSlide.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        selectedStep3 = row.getAttribute('data-step3');
        // Auto-advance to Step 4 after a brief delay
        setTimeout(() => {
          goToStep(4);
        }, 600);
      });
    });

    const resetBtns = quizCard.querySelectorAll('.quiz-back-btn');
    resetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Clear all selected choices
        quizCard.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        quizCard.querySelectorAll('.goal-checkbox-row').forEach(r => r.classList.remove('checked'));
        quizCard.querySelectorAll('.goal-checkbox-input').forEach(i => i.checked = false);
        
        selectedFocus = '';
        selectedStep2 = '';
        selectedStep3 = '';
        ratings = { status: 0, career: 0, finance: 0 };
        goalStepsToAsk = [];
        currentGoalStepIndex = 0;
        
        if (ratingBtns) ratingBtns.forEach(b => b.classList.remove('active'));
        
        restorePathOpacities();
        updateHorizonVisuals();
        goToStep(1);
      });
    });

    // Back Arrow Button (Top Left of Card)
    const prevBtn = quizCard.querySelector('.quiz-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentStep === 'signup') {
          goToStep(10);
        } else if (currentStep > 1) {
          goToStep(currentStep - 1);
        }
      });
    }
    
    // Next Buttons (transitions from Step 3 to Step 4)
    const nextBtns = quizCard.querySelectorAll('.quiz-next-btn');
    nextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        let activeStep3Slide = null;
        if (selectedFocus === 'status') {
          activeStep3Slide = quizCard.querySelector('.quiz-step-slide[data-step="3-status"]');
        } else if (selectedFocus === 'finance') {
          activeStep3Slide = quizCard.querySelector('.quiz-step-slide[data-step="3-finance"]');
        } else if (selectedFocus === 'career') {
          if (selectedStep2 === 'hired') {
            activeStep3Slide = quizCard.querySelector('.quiz-step-slide[data-step="3-career-hired"]');
          } else {
            activeStep3Slide = quizCard.querySelector('.quiz-step-slide[data-step="3-career-business"]');
          }
        }
        
        if (!activeStep3Slide) return;
        
        const activeRow = activeStep3Slide.querySelector('.quiz-choice-row.active');
        if (!activeRow) {
          alert("Please select a preference before moving to the next step!");
          return;
        }
        
        selectedStep3 = activeRow.getAttribute('data-step3');
        goToStep(4);
      });
    });
    
    // Rating Buttons click & hover listeners for Steps 4, 5, 6 (Automatic transitions)
    if (ratingBtns) {
      ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const grid = btn.closest('.rating-buttons-grid');
          if (!grid) return;
          const category = grid.getAttribute('data-category');
          if (!category) return;
          
          grid.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          const val = parseInt(btn.getAttribute('data-value'), 10);
          ratings[category] = val;
          updateHorizonVisuals();
          
          // Automatic slide timeout (600ms to allow animation to register)
          setTimeout(() => {
            if (category === 'status' && currentStep === 4) {
              goToStep(5);
            } else if (category === 'career' && currentStep === 5) {
              goToStep(6);
            } else if (category === 'finance' && currentStep === 6) {
              goToStep(7);
            }
          }, 600);
        });
        
        btn.addEventListener('mouseenter', () => {
          const grid = btn.closest('.rating-buttons-grid');
          if (!grid) return;
          const category = grid.getAttribute('data-category');
          if (!category) return;
          
          const val = parseInt(btn.getAttribute('data-value'), 10);
          updateHorizonVisuals(category, val);
        });
        
        btn.addEventListener('mouseleave', () => {
          updateHorizonVisuals();
        });
      });
    }

    // Step 9 & 10 Continue button handler — use event delegation on quizCard
    // to reliably catch clicks regardless of slide visibility state
    quizCard.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-goal-continue');
      if (!btn) return;

      const slide = btn.closest('.quiz-step-slide');
      if (!slide) return;
      const stepAttr = slide.getAttribute('data-step');

      if (stepAttr === '9') {
        goToStep(10);
      } else if (stepAttr === '10') {
        // Show results section in locked state
        justCompletedQuiz = true;
        sections.forEach(sec => sec.classList.toggle('active', sec.id === 'results'));
        navLinks.forEach(l => l.classList.remove('active'));
        renderResultsPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Signup / Login Form Handling
    const tabSignup = document.getElementById('btn-tab-signup');
    const tabLogin = document.getElementById('btn-tab-login');
    const groupFullname = document.getElementById('group-fullname');
    const inputFullname = document.getElementById('auth-fullname');
    const inputEmail = document.getElementById('auth-email');
    const inputPassword = document.getElementById('auth-password');
    const authForm = document.getElementById('quiz-signup-form');
    const authSubmitBtn = document.getElementById('btn-auth-submit');
    const authErrorMsg = document.getElementById('auth-error-msg');

    let isSignupMode = true;

    if (tabSignup && tabLogin) {
      tabSignup.addEventListener('click', () => {
        isSignupMode = true;
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        if (groupFullname) groupFullname.style.display = 'block';
        if (inputFullname) inputFullname.setAttribute('required', 'required');
        if (authSubmitBtn) authSubmitBtn.innerText = 'Create Account & View Match';
        if (authErrorMsg) authErrorMsg.style.display = 'none';
      });

      tabLogin.addEventListener('click', () => {
        isSignupMode = false;
        tabSignup.classList.remove('active');
        tabLogin.classList.add('active');
        if (groupFullname) groupFullname.style.display = 'none';
        if (inputFullname) inputFullname.removeAttribute('required');
        if (authSubmitBtn) authSubmitBtn.innerText = 'Log In & View Match';
        if (authErrorMsg) authErrorMsg.style.display = 'none';
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (authErrorMsg) authErrorMsg.style.display = 'none';
        
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();
        const fullname = isSignupMode ? inputFullname.value.trim() : '';

        if (isSignupMode && !fullname) {
          if (authErrorMsg) {
            authErrorMsg.innerText = "Please enter your full name.";
            authErrorMsg.style.display = 'block';
          }
          return;
        }

        if (authSubmitBtn) {
          authSubmitBtn.disabled = true;
          authSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
        }

        const handleAuthError = (err) => {
          console.error("Auth failed:", err);
          if (authSubmitBtn) {
            authSubmitBtn.disabled = false;
            authSubmitBtn.innerText = isSignupMode ? 'Create Account & View Match' : 'Log In & View Match';
          }
          if (authErrorMsg) {
            authErrorMsg.innerText = err.message || "Authentication failed. Please check credentials.";
            authErrorMsg.style.display = 'block';
          }
        };

        if (isSignupMode) {
          createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              const user = userCredential.user;
              updateProfile(user, { displayName: fullname })
                .then(() => syncUserData(user))
                .then(() => {
                  inputEmail.value = '';
                  inputPassword.value = '';
                  if (inputFullname) inputFullname.value = '';
                  triggerMatching();
                })
                .catch(handleAuthError);
            })
            .catch(handleAuthError);
        } else {
          signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              const user = userCredential.user;
              syncUserData(user)
                .then(() => {
                  inputEmail.value = '';
                  inputPassword.value = '';
                  triggerMatching();
                })
                .catch(handleAuthError);
            })
            .catch(handleAuthError);
        }
      });
    }

    const btnGoogleQuiz = document.getElementById('btn-google-quiz');
    if (btnGoogleQuiz) {
      btnGoogleQuiz.addEventListener('click', () => {
        if (!auth) return;
        if (authErrorMsg) authErrorMsg.style.display = 'none';
        
        if (authSubmitBtn) {
          authSubmitBtn.disabled = true;
          authSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
        }

        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
          .then((result) => {
            const user = result.user;
            return syncUserData(user).then(() => {
              if (authSubmitBtn) {
                authSubmitBtn.disabled = false;
                authSubmitBtn.innerText = isSignupMode ? 'Create Account & View Match' : 'Log In & View Match';
              }
              triggerMatching();
            });
          })
          .catch(err => {
            console.error("Google Auth failed:", err);
            if (authSubmitBtn) {
              authSubmitBtn.disabled = false;
              authSubmitBtn.innerText = isSignupMode ? 'Create Account & View Match' : 'Log In & View Match';
            }
            if (authErrorMsg) {
              authErrorMsg.innerText = err.message || "Google authentication failed.";
              authErrorMsg.style.display = 'block';
            }
          });
      });
    }

    function renderDynamicChoices(slide, config, step) {
      const container = slide.querySelector('.dynamic-choices-container');
      if (!container) return;
      container.innerHTML = '';
      
      config.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'quiz-choice-row';
        btn.setAttribute('data-val', ch.val);
        
        let currentSelection = '';
        if (step === 7) currentSelection = selectedStep7;
        else if (step === 8) currentSelection = selectedStep8;
        else if (step === 10) currentSelection = selectedStep10;
        
        if (currentSelection === ch.val) {
          btn.classList.add('active');
        }
        
        btn.innerHTML = `
          <div class="quiz-radio-indicator"></div>
          <div class="choice-row-text">
            <span class="choice-row-title">${ch.label}</span>
          </div>
        `;
        
        btn.addEventListener('click', () => {
          container.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
          btn.classList.add('active');
          
          if (step === 7) {
            selectedStep7 = ch.val;
            setTimeout(() => goToStep(8), 600);
          } else if (step === 8) {
            selectedStep8 = ch.val;
            setTimeout(() => goToStep(9), 600);
          } else if (step === 10) {
            selectedStep10 = ch.val;
            setTimeout(() => goToStep('signup'), 600);
          }
        });
        
        container.appendChild(btn);
      });
    }

    function renderDynamicChecklist(slide, config, bottleneck) {
      const container = slide.querySelector('.dynamic-checklists-container');
      if (!container) return;
      container.innerHTML = '';
      container.setAttribute('data-theme', bottleneck);
      
      const checklistItems = config.checklists[bottleneck] || [];
      checklistItems.forEach(item => {
        const label = document.createElement('label');
        label.className = 'goal-checkbox-row';
        
        const isChecked = selectedStep9.includes(item.val);
        if (isChecked) {
          label.classList.add('checked');
        }
        
        label.innerHTML = `
          <input type="checkbox" name="goal-checklist" value="${item.val}" class="goal-checkbox-input" ${isChecked ? 'checked' : ''}>
          <span class="goal-checkbox-box"></span>
          <span class="goal-checkbox-text">${item.label}</span>
        `;
        
        const input = label.querySelector('.goal-checkbox-input');
        label.addEventListener('click', (e) => {
          // Prevent double firing if clicking directly on input/text elements
          if (e.target === input) return;
          e.preventDefault();
          
          input.checked = !input.checked;
          label.classList.toggle('checked', input.checked);
          
          if (input.checked) {
            if (!selectedStep9.includes(item.val)) {
              selectedStep9.push(item.val);
            }
          } else {
            selectedStep9 = selectedStep9.filter(v => v !== item.val);
          }
          
          // Auto-advance to Step 10 after selection to keep uniform transition behavior
          setTimeout(() => {
            goToStep(10);
          }, 600);
        });
        
        container.appendChild(label);
      });
    }

    // 7. Navigation Controller ( goToStep )
    function goToStep(step) {
      currentStep = step;
      
      const allSlides = quizCard.querySelectorAll('.quiz-step-slide');
      allSlides.forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      
      // Progress Indicator Hiding / Displaying
      const progressWrapper = quizCard.querySelector('.quiz-progress-wrapper');
      if (progressWrapper) {
        if (step > 3 || step === 'signup') {
          progressWrapper.classList.add('hide-progress');
        } else {
          progressWrapper.classList.remove('hide-progress');
          const pct = (step / 3) * 100; // Progress only for first 3 steps
          if (progressFill) progressFill.style.width = `${pct}%`;
          if (stepLabel) stepLabel.innerText = `Step ${step} of 3`;
        }
      }
      
      // Manage back button visibility
      const prevBtn = quizCard.querySelector('.quiz-prev-btn');
      if (prevBtn) {
        if (step === 1) {
          prevBtn.style.display = 'none';
        } else {
          prevBtn.style.display = 'flex';
        }
      }

      const sharedVisualizer = quizCard.querySelector('.shared-horizon-visualizer');
      
      // If step is a number and >= 4, we dynamically setup the page content
      if (typeof step === 'number' && step >= 4) {
        const slide = quizCard.querySelector(`.quiz-step-slide[data-step="${step}"]`);
        if (slide) {
          const config = quizContentConfig[selectedFocus][step];
          if (config) {
            const badge = slide.querySelector('.dynamic-badge');
            if (badge) {
              badge.innerText = config.badge;
              // Always use uniform premium forest green branding colors
              badge.style.backgroundColor = 'var(--accent-light)';
              badge.style.color = 'var(--accent)';
            }
            
            const title = slide.querySelector('.dynamic-title');
            const desc = slide.querySelector('.dynamic-desc');
            
            // Determine bottleneck category for Q9 Title text formatting
            let bottleneck = 'status';
            let lowestScore = ratings.status > 0 ? ratings.status : 10;
            if (ratings.career > 0 && ratings.career < lowestScore) {
              lowestScore = ratings.career;
              bottleneck = 'career';
            }
            if (ratings.finance > 0 && ratings.finance < lowestScore) {
              lowestScore = ratings.finance;
              bottleneck = 'finance';
            }

            if (step === 9) {
              let bottleneckIndex = 0;
              if (bottleneck === 'career') bottleneckIndex = 1;
              else if (bottleneck === 'finance') bottleneckIndex = 2;
              const bottleneckName = quizContentConfig[selectedFocus].categories[bottleneckIndex];
              const bottleneckScore = ratings[bottleneck] || '-';
              if (title) {
                if (bottleneckScore === 10) {
                  title.innerHTML = `You are fully prepared! What are your next long-term <strong>${bottleneckName}</strong> goals?`;
                } else {
                  title.innerHTML = `What would it take to move your <strong>${bottleneckName}</strong> from <strong>${bottleneckScore}</strong> closer to 10?`;
                }
              }
              renderDynamicChecklist(slide, config, bottleneck);
            } else {
              if (title) title.innerText = config.title;
            }
            
            if (desc) desc.innerText = config.desc;
            
            if (config.type === 'choice') {
              renderDynamicChoices(slide, config, step);
            }
            
            // Append/Move Visualizer to placeholder in the active slide!
            const placeholder = slide.querySelector('.visualizer-placeholder');
            if (placeholder && sharedVisualizer) {
              placeholder.appendChild(sharedVisualizer);
              sharedVisualizer.style.display = 'flex';
            }
          }
          
          slide.style.display = 'block';
          setTimeout(() => slide.classList.add('active'), 10);
        }
        
        // Handle curve opacities for the visualizer
        const paths = {
          status: document.getElementById('horizon-active-status'),
          career: document.getElementById('horizon-active-career'),
          finance: document.getElementById('horizon-active-finance')
        };
        const travelers = {
          status: document.getElementById('horizon-traveler-status'),
          career: document.getElementById('horizon-traveler-career'),
          finance: document.getElementById('horizon-traveler-finance')
        };
        
        let bottleneck = 'status';
        let lowestScore = ratings.status > 0 ? ratings.status : 10;
        if (ratings.career > 0 && ratings.career < lowestScore) {
          lowestScore = ratings.career;
          bottleneck = 'career';
        }
        if (ratings.finance > 0 && ratings.finance < lowestScore) {
          lowestScore = ratings.finance;
          bottleneck = 'finance';
        }

        Object.keys(paths).forEach(key => {
          const path = paths[key];
          const trav = travelers[key];
          if (step === 9) {
            if (key === bottleneck) {
              if (path) path.style.opacity = '1';
              if (trav) trav.style.opacity = '1';
            } else {
              if (path) path.style.opacity = '0.15';
              if (trav) trav.style.opacity = '0.15';
            }
          } else {
            if (path) path.style.opacity = '1';
            if (trav) {
              const val = ratings[key];
              trav.style.opacity = val > 0 ? '1' : '0';
            }
          }
        });
        
        updateHorizonVisuals();
        
      } else {
        // Hide visualizer and restore it to main quiz card
        if (sharedVisualizer) {
          sharedVisualizer.style.display = 'none';
          quizCard.appendChild(sharedVisualizer);
        }
        restorePathOpacities();
        
        let slideSelector = '';
        if (step === 1) {
          slideSelector = '.quiz-step-slide[data-step="1"]';
        } else if (step === 2) {
          if (selectedFocus === 'status') slideSelector = '.quiz-step-slide[data-step="2-status"]';
          else if (selectedFocus === 'career') slideSelector = '.quiz-step-slide[data-step="2-career"]';
          else if (selectedFocus === 'finance') slideSelector = '.quiz-step-slide[data-step="2-finance"]';
        } else if (step === 3) {
          if (selectedFocus === 'status') {
            slideSelector = '.quiz-step-slide[data-step="3-status"]';
          } else if (selectedFocus === 'finance') {
            slideSelector = '.quiz-step-slide[data-step="3-finance"]';
          } else if (selectedFocus === 'career') {
            if (selectedStep2 === 'hired') {
              slideSelector = '.quiz-step-slide[data-step="3-career-hired"]';
            } else {
              slideSelector = '.quiz-step-slide[data-step="3-career-business"]';
            }
          }
        } else if (step === 'signup') {
          slideSelector = '.quiz-step-slide[data-step="signup"]';
        }
        
        const slide = quizCard.querySelector(slideSelector);
        if (slide) {
          slide.style.display = 'block';
          setTimeout(() => slide.classList.add('active'), 10);
        }
      }
    }
  }

  // Quiz matching logic
  const radios = document.querySelectorAll('input[name="focus_area"]');
  
  const focusToAdvisorId = {
    status: 'sarah',
    career: 'david',
    finance: 'amanda'
  };

  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selected = e.target.value;
      const advisorId = focusToAdvisorId[selected];
      
      if (advisorId) {
        const advisorCard = document.querySelector(`.advisor-intro-card[data-advisor-id="${advisorId}"]`);
        if (advisorCard) {
          // Remove previous highlight class from all cards
          document.querySelectorAll('.advisor-intro-card').forEach(c => {
            c.classList.remove('highlight-match');
          });
          
          // Force layout reflow to restart CSS keyframe animation
          void advisorCard.offsetWidth;
          
          // Add highlight class
          advisorCard.classList.add('highlight-match');
          
          // Scroll to the advisor card smoothly
          advisorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    });
  });



  // FAQ Accordion
  const faqToggles = document.querySelectorAll('.faq-toggle');
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const item = toggle.parentElement;
      item.classList.toggle('open');
    });
  });


  // Advisors Carousel Scrolling Navigation (supporting multiple carousels)
  const carouselWrappers = document.querySelectorAll('.advisors-carousel-container-wrapper');
  carouselWrappers.forEach(wrapper => {
    const track = wrapper.querySelector('.advisors-carousel-track');
    const prevBtn = wrapper.querySelector('.carousel-nav-btn.prev-btn');
    const nextBtn = wrapper.querySelector('.carousel-nav-btn.next-btn');

    if (track && prevBtn && nextBtn) {
      const cardWidth = 314; // card width + gap (290px + 24px)
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: cardWidth, behavior: 'smooth' });
      });
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      });
    }
  });

  // Advisor Profile Database
  const advisorDb = {
    sarah: {
      name: "Sarah Jenkins, Esq.",
      title: "Licensed Immigration Attorney • 8 years of experience",
      photo: "sarah_portrait.png",
      bio: "Hi! My name is Sarah. I am a licensed immigration attorney with over eight years of experience helping tech professionals, developers, and founders navigate the U.S. visa system. I lead with transparency, honesty, and clear timelines to empower you in making career and relocation decisions that suit your unique life goals. I prioritize creating a safe, strategic space that moves at your pace, helping you make sense of complex regulations with ease.",
      firstSession: "Our first session is a strategy call where we will review your current visa status, document history, and timeline. We will collaborate to gain a clear view of your visa options (such as H-1B, O-1, or EB-2 NIW) and outline a step-by-step roadmap for your application.",
      strengths: "I take pride in translating complex immigration policies into simple, actionable steps. My practice centers on thorough case analysis, drafting strategic evidence packages, and preparing clients to present their qualifications with absolute confidence.",
      idealClients: "If you are a high-skilled developer, engineer, or startup founder looking for visa options and long-term residency pathways. I have extensive experience working with clients who are facing sponsorship deadlines, status transitions, or RFEs. I work best with clients who are ready to take a proactive approach to securing their immigration future in the U.S.",
      location: "Virtual sessions (Offers services globally)",
      topSpecialties: ["O-1 & H-1B Visas", "Green Cards", "Visa Strategy"], // for booking confirmation
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["9:00 AM", "11:30 AM", "2:00 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["10:00 AM", "1:00 PM", "4:30 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["8:30 AM", "11:00 AM", "3:00 PM"] }
      ]
    },
    david_chee: {
      name: "David Chee",
      title: "Family Reunification Expert • 6 years of experience",
      photo: "david_chee_portrait.png",
      bio: "Hello! My name is David. I am an immigration consultant and family reunification specialist with six years of experience. I lead with empathy and patience—using clear, jargon-free guidance to support couples and families petitioning for their loved ones. Together we will navigate the application process smoothly, ensuring you feel supported at every step.",
      firstSession: "Our first session will be a warm introduction where we review the relationship history between the sponsor and beneficiary. We will map out your timeline, evaluate financial sponsorship eligibility, and draft a document checklist for a strong petition.",
      strengths: "I take pride in demystifying the family sponsorship process. My practice focuses on building comprehensive petition packages, verifying affidavits of support, and preparing couples for their green card interviews with USCIS.",
      idealClients: "Spouses, parents, and siblings looking to sponsor their family members for U.S. permanent residency. I work with families who want absolute clarity on consular filing stages and need a warm, supportive guide to organize their application files.",
      location: "Virtual sessions",
      topSpecialties: ["Family Visas", "Spousal Petitions", "Consular Processing"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["10:00 AM", "1:30 PM", "3:30 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["9:00 AM", "12:00 PM", "4:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["11:00 AM", "2:00 PM", "5:00 PM"] }
      ]
    },
    elena: {
      name: "Elena Ramirez",
      title: "Asylum & Refugee Specialist • 8 years of experience",
      photo: "elena_portrait.png",
      bio: "Hi! I'm Elena. I am a humanitarian immigration specialist focusing on asylum applications, refugee support, and TPS. Having gone through the U.S. immigration system myself, I bring deep empathy and trauma-informed support to help you tell your story. I prioritize building a safe, confidential space where you can share your path to safety at your own pace.",
      firstSession: "We will start by building trust and understanding your unique history. We will walk through asylum requirements, discuss what types of supporting evidence will strengthen your case, and outline a realistic timeline for interviews and court hearings.",
      strengths: "I take pride in preparing thorough humanitarian petitions and evidence files. My practice centers on translating personal testimonies into clear narratives that meet immigration standards while protecting your voice and dignity.",
      idealClients: "Individuals and families seeking asylum, temporary status, or humanitarian protection in the U.S. who need a compassionate, dedicated advocate to organize their case files and prepare them for interview loops.",
      location: "Virtual sessions",
      topSpecialties: ["Asylum Applications", "Humanitarian Relief", "TPS & DACA"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["9:30 AM", "11:00 AM", "3:00 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["1:00 PM", "3:30 PM", "5:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["10:00 AM", "12:30 PM", "4:30 PM"] }
      ]
    },
    hassan: {
      name: "Hassan Badoor",
      title: "Citizenship & Naturalization Specialist • 10 years of experience",
      photo: "hassan_portrait.png",
      bio: "Greetings! My name is Hassan. Over the past ten years, I have helped hundreds of permanent residents achieve their dream of becoming U.S. citizens. I lead Naturalization applications with structured preparation, mock interviews, and patience. Together we will build your confidence in the civic, history, and language requirements.",
      firstSession: "We will run a thorough eligibility check, reviewing your residency history and physical presence in the U.S. We will walk through the N-400 application and begin a mock civics interview to assess your current readiness.",
      strengths: "I take pride in naturalization interview preparation. My practice centers on mock civics exams, reviewing potential application red flags, and coaching clients on USCIS interview protocols to ensure success.",
      idealClients: "Green Card holders who are eligible to apply for U.S. citizenship and want to ensure their naturalization application is error-free. I help naturalization applicants who feel nervous about the interview and want guided practice to pass with confidence.",
      location: "Virtual sessions",
      topSpecialties: ["U.S. Citizenship", "N-400 Naturalization", "Civic Interview Prep"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["8:30 AM", "10:30 AM", "2:00 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["11:00 AM", "1:30 PM", "4:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["9:00 AM", "12:00 PM", "3:30 PM"] }
      ]
    },
    aisha: {
      name: "Aisha Haddad",
      title: "Student & Academic Visa Advisor • 5 years of experience",
      photo: "aisha_portrait.png",
      bio: "Hi! My name is Aisha. I am an international student advisor and academic transition guide. As a former international student myself, I understand how confusing university rules and SEVIS requirements can be. I guide students on F-1 and J-1 visas through university applications, maintaining legal status, OPT work authorization, and transition planning.",
      firstSession: "We will review your academic plans, current visa status, and post-grad career goals. We'll map out a clear timeline for maintaining your status, applying for CPT/OPT work authorization, and preparing you for embassy visa interviews.",
      strengths: "I take pride in academic visa rules and school admissions planning. My practice centers on guiding students through SEVIS forms, OPT work authorizations, and preparing strong university application files.",
      idealClients: "International students, recent graduates, or prospective students who need expert advice on academic visa rules, school transfers, work permissions, or university application requirements.",
      location: "Virtual sessions",
      topSpecialties: ["Student Visas", "F-1 & J-1 Status", "OPT & CPT Work Permits"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["10:00 AM", "2:00 PM", "4:30 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["9:30 AM", "11:30 AM", "3:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["1:00 PM", "3:00 PM", "5:30 PM"] }
      ]
    },
    michael: {
      name: "Michael Vargas",
      title: "Business & Investment Visa Advisor • 15 years of experience",
      photo: "michael_portrait.png",
      bio: "Hello! I am Michael. I have spent fifteen years working at the intersection of business law and immigration, guiding international founders, tech executives, and investors through E-2, L-1, and EB-5 visa applications. I lead with strategic planning and clear communication to align your business objectives with U.S. immigration requirements.",
      firstSession: "We will review your business plan, investment capital source and path, and corporate structure. We will evaluate which investor or executive visa best matches your timeline and budget, and outline the key requirements for U.S. company formation.",
      strengths: "I take pride in investor visa strategies and corporate setups. My practice focuses on business plan analysis, corporate entity structuring, source-of-funds documentation, and L-1 executive transferee petitions.",
      idealClients: "International entrepreneurs, investors, and business executives looking to establish a company branch in the U.S. or invest in U.S. enterprises. My ideal client is willing to coordinate their legal filings with a robust business plan to secure a visa pathway.",
      location: "Virtual sessions",
      topSpecialties: ["Investor Visas (E-2, EB-5)", "L-1 Visa Transitions", "Startup Formations"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["11:00 AM", "2:00 PM", "3:30 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["9:00 AM", "10:30 AM", "4:30 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["1:30 PM", "3:00 PM", "5:00 PM"] }
      ]
    },
    david: {
      name: "David K.",
      title: "Senior Tech Recruiter • 6 years of experience",
      photo: "david_k_portrait.png",
      bio: "Hi there! I am David. I am a veteran tech recruiter with six years of experience inside major FAANG companies. I use transparent feedback, ATS-friendly resume formats, and mock interview playbooks to help expat tech professionals position their international experience as a superpower in local job markets.",
      firstSession: "We will deconstruct your international resume and rebuild it for U.S. tech ATS scanners. We'll review your target roles, identify skill gaps in your profile, and map out a cold outreach and networking strategy.",
      strengths: "I take pride in FAANG-style interview prep and resume optimization. My practice centers on deconstructing technical and behavioral loops, optimizing LinkedIn profiles, and coaching clients on salary negotiation.",
      idealClients: "Expat job-seekers, software developers, product managers, and designers who want to transition to U.S. tech companies, land more callbacks, and master the technical/behavioral interview loops.",
      location: "Virtual sessions",
      topSpecialties: ["Resume & Portfolio Reviews", "Tech Interview Prep", "FAANG Recruiting"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["10:00 AM", "1:30 PM", "3:30 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["9:00 AM", "2:00 PM", "5:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["1:00 PM", "4:00 PM", "6:00 PM"] }
      ]
    },
    amanda: {
      name: "Amanda W.",
      title: "Certified Financial Planner • 9 years of experience",
      photo: "amanda_portrait.png",
      bio: "Hello! My name is Amanda. I am a Certified Financial Planner specializing in helping expats, new immigrants, and cross-border professionals build wealth. I use structured, conflict-free roadmaps to help you establish a secure financial foundation, navigate credit scores, plan expat tax obligations, and start investing in your new home safely.",
      firstSession: "We will perform a full financial health check. We'll outline steps to build or transfer your credit score, review expat tax filing obligations, and discuss how to open accounts and start investing in the U.S. safely.",
      strengths: "I take pride in expat credit building and tax planning. My practice centers on explaining U.S. banking, credit, and investment systems clearly, helping newly arrived professionals get funded and grow wealth.",
      idealClients: "Expats and newly arrived professionals who feel overwhelmed by the U.S. credit and tax systems. My ideal client is ready to establish a secure financial roadmap to buy property, optimize cross-border assets, or save for retirement.",
      location: "Virtual sessions",
      topSpecialties: ["Expat Credit Building", "Tax Planning", "Investment Setups"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["11:00 AM", "2:30 PM", "4:00 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["8:00 AM", "11:30 AM", "3:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["10:00 AM", "1:30 PM", "5:30 PM"] }
      ]
    },
    cloricea: {
      name: "Cloricea (Cloey)",
      title: "Certified Nutrition & Mental Health Advisor • 7 years of experience",
      photo: "cloricea_portrait.png",
      bio: "Hi! My name is Cloricea, or Cloey. I am a Caribbean-American mental health professional certified in nutrition and mental health. In my practice, I lead with humility and curiosity-- I use transparency, honesty, and open ended questions to empower you in making decisions that suit your unique values, needs, and goals. I prioritize creating a safe, compassionate space that works with your pace, while providing gentle \"carefrontations\" when I recognize a block. Together we will explore coping skills that support you in strengthening your relationship with yourself and those around you.",
      firstSession: "Our first session will be a chance for us to get to know each other better. We will collaborate to gain a clear view your current strengths, needs, and expectations in therapy. I will also share my professional experience and expectations so that we can determine if we are a good fit.",
      strengths: "I take pride in promoting resilience through holistic interventions because I believe that healing is a natural process. My practice centers on using mindfulness to build mind body awareness, strengthening self-care and community care, and using evidenced based tools to access mental blocks and create sustainable solutions.",
      idealClients: "If you are someone looking for a balanced approach to wellness to achieve sustainable growth versus quick fixes, we may be a good fit. I have significant experience working with individuals and families dealing with chronic stress, substance dependence, life transitions (job loss, end of a relationship, ), trauma and grief that disrupted their daily life and sense of self. I use a balance of processing and action in my work with clients. My ideal client is willing to shift from a safe space to a brave space-- they are courageous (even if a bit worried), ready to reflect on and challenge their patterns, and open to making lifestyle changes (nutrition, physical activity, sleep hygiene) to sustain their overall wellness.",
      location: "Virtual sessions",
      topSpecialties: ["Mental Health", "Nutrition", "Holistic Wellness"],
      days: [
        { id: "day1", name: "Wed", date: "Jun 10", slots: ["9:00 AM", "11:00 AM", "3:00 PM"] },
        { id: "day2", name: "Thu", date: "Jun 11", slots: ["10:00 AM", "1:00 PM", "4:00 PM"] },
        { id: "day3", name: "Fri", date: "Jun 12", slots: ["8:30 AM", "11:30 AM", "2:30 PM"] }
      ]
    }
  };

  // Interactive Scheduling Widget inside Details Modal
  const introCards = document.querySelectorAll('.advisor-intro-card');
  const advisorModal = document.getElementById('advisor-modal');
  const bookingModal = document.getElementById('booking-modal');
  
  introCards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-advisor-id');
      
      // Handle see more card clicks
      if (id === 'see-more') {
        if (!isUserLoggedIn) {
          const quizBox = document.querySelector('.quiz-box') || document.querySelector('.hero-quiz-card');
          if (quizBox) {
            quizBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          goToStep('signup');
        } else {
          const dirLink = document.querySelector('.nav-link[data-target="directory"]');
          if (dirLink) dirLink.click();
        }
        return;
      }
      
      const adv = advisorDb[id];
      if (!adv) return;

      // Populate Modal Info
      document.getElementById('adv-modal-photo').src = adv.photo;
      document.getElementById('adv-modal-photo').alt = adv.name;
      document.getElementById('adv-modal-name').innerText = adv.name;
      document.getElementById('adv-modal-title').innerText = adv.title;
      document.getElementById('adv-modal-avail-text').innerText = "Available Wed " + adv.days[0].date;
      document.getElementById('adv-modal-bio').innerText = adv.bio;
      document.getElementById('adv-modal-first-session').innerText = adv.firstSession;
      document.getElementById('adv-modal-strengths').innerText = adv.strengths;
      document.getElementById('adv-modal-ideal-clients').innerText = adv.idealClients;
      document.getElementById('adv-modal-location-text').innerText = adv.location;

      // State variables for selection
      let activeDayId = adv.days[0].id;
      let selectedDayText = `${adv.days[0].name}, ${adv.days[0].date}`;
      let selectedTime = null;
      
      const bookBtn = document.getElementById('adv-modal-book-btn');
      bookBtn.disabled = true;
      bookBtn.innerText = "Schedule";

      // Days Header
      const daysHeader = document.getElementById('adv-modal-days-header');
      daysHeader.innerHTML = '';
      adv.days.forEach((day, index) => {
        const btn = document.createElement('button');
        btn.className = `day-tab ${index === 0 ? 'active' : ''}`;
        btn.setAttribute('data-day', day.id);
        btn.innerHTML = `
          <span class="day-name">${day.name}</span>
          <span class="day-date">${day.date}</span>
        `;
        daysHeader.appendChild(btn);
      });

      // Time Slots Grid
      const slotsContent = document.getElementById('adv-modal-slots-content');
      slotsContent.innerHTML = '';
      adv.days.forEach((day, index) => {
        const group = document.createElement('div');
        group.className = `day-slots ${index === 0 ? 'active' : ''}`;
        group.setAttribute('data-day-slots', day.id);
        
        day.slots.forEach(slot => {
          const btn = document.createElement('button');
          btn.className = 'time-slot-btn';
          btn.setAttribute('data-time', slot);
          btn.innerText = slot;
          group.appendChild(btn);
        });
        
        slotsContent.appendChild(group);
      });

      // Wire tab click handlers inside modal
      const dayTabs = daysHeader.querySelectorAll('.day-tab');
      const daySlotGroups = slotsContent.querySelectorAll('.day-slots');
      const timeSlots = slotsContent.querySelectorAll('.time-slot-btn');

      dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          dayTabs.forEach(t => t.classList.remove('active'));
          daySlotGroups.forEach(g => g.classList.remove('active'));
          
          tab.classList.add('active');
          const targetDay = tab.getAttribute('data-day');
          const targetGroup = slotsContent.querySelector(`.day-slots[data-day-slots="${targetDay}"]`);
          if (targetGroup) targetGroup.classList.add('active');

          const clickedDayData = adv.days.find(d => d.id === targetDay);
          selectedDayText = `${clickedDayData.name}, ${clickedDayData.date}`;
          
          // Reset timeslot selection
          timeSlots.forEach(s => s.classList.remove('selected'));
          selectedTime = null;
          bookBtn.disabled = true;
          bookBtn.innerText = "Schedule";
        });
      });

      // Wire timeslot chip click handlers inside modal
      timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
          timeSlots.forEach(s => s.classList.remove('selected'));
          slot.classList.add('selected');
          selectedTime = slot.getAttribute('data-time');
          
          bookBtn.disabled = false;
          bookBtn.innerText = `Book for ${selectedTime}`;
        });
      });

      // Book session button click transitions to confirmation modal
      bookBtn.onclick = () => {
        if (!selectedTime) return;
        
        // Hide advisor modal
        advisorModal.classList.remove('open');
        
        // If user is not logged in, prompt sign up/login by scrolling to intake quiz
        if (!isUserLoggedIn) {
          const quizBox = document.querySelector('.quiz-box') || document.querySelector('.hero-quiz-card');
          if (quizBox) {
            quizBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          goToStep('signup');
          return;
        }
        
        // Pre-fill and show booking confirmation modal
        document.getElementById('modal-advisor-name').innerText = adv.name;
        document.getElementById('modal-booking-time').innerText = `${selectedDayText} at ${selectedTime}`;
        document.getElementById('modal-advisor-specialty').innerText = adv.topSpecialties[0];
        
        bookingModal.classList.add('open');
      };

      // Open Advisor Modal
      advisorModal.classList.add('open');
    });
  });

  // Modal Overlay Close logic for both modals
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(m => {
    const closeBtn = m.querySelector('.modal-close-btn');
    const form = m.querySelector('form');

    const closeModal = () => {
      m.classList.remove('open');
      if (form) form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal();
    });
  });

  // Booking Form Submission Handler
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('booking-name').value;
      const time = document.getElementById('modal-booking-time').innerText;
      const advisor = document.getElementById('modal-advisor-name').innerText;
      
      alert(`Booking Successful!\n\nThank you, ${name}! Your session with ${advisor} on ${time} has been successfully scheduled. A calendar invitation and confirmation email have been sent.`);
      bookingModal.classList.remove('open');
      bookingForm.reset();
    });
  }

  // Quiz Matching Animations & Triggers
  function showMatchingLoader(matchId) {
    const loaderModal = document.getElementById('matching-loader-modal');
    const progressFill = loaderModal.querySelector('.loader-progress-bar');
    const stepTitle = loaderModal.querySelector('.loader-step-title');
    const stepDesc = loaderModal.querySelector('.loader-step-desc');
    const avatarImg = document.getElementById('loader-avatar');
    
    const adv = advisorDb[matchId];
    if (adv) {
      avatarImg.src = adv.photo;
    }
    
    progressFill.style.width = '0%';
    stepTitle.innerText = "Analyzing profile...";
    stepDesc.innerText = "Scanning available slots for verified expat guides...";
    loaderModal.style.display = 'flex';
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      progressFill.style.width = `${progress}%`;
      
      if (progress >= 30 && progress < 70) {
        stepTitle.innerText = "Finding your match...";
        stepDesc.innerText = `Matching your request with top-rated ${adv ? adv.topSpecialties[0] : 'relocation'} experts...`;
      } else if (progress >= 70 && progress < 95) {
        stepTitle.innerText = "Securing availability...";
        stepDesc.innerText = `Connecting with ${adv ? adv.name : 'your expert'}...`;
      } else if (progress >= 95) {
        stepTitle.innerText = "Match secured!";
        stepDesc.innerText = "Found a perfect timeslot for your session!";
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          loaderModal.style.display = 'none';
          openMatchedAdvisor(matchId);
        }, 600);
      }
    }, 40);
  }

  function openMatchedAdvisor(matchId) {
    const card = document.querySelector(`.advisor-intro-card[data-advisor-id="${matchId}"]`);
    if (card) {
      document.querySelectorAll('.advisor-intro-card').forEach(c => {
        c.classList.remove('highlight-match');
      });
      
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      
      void card.offsetWidth;
      card.classList.add('highlight-match');
      
    }
  }

  // ==========================================================================
  // DEDICATED RESULTS PAGE LOGIC
  // ==========================================================================

  // Selected goal helper map (for matching checked values to descriptions)
  const goalExplanations = {
    visa: { title: "Secure Visa & Route", desc: "Your advisor will outline EB-2 NIW, O-1, or H-1B eligibility rules and structure a bulletproof roadmap." },
    talent: { title: "Assess Extraordinary Ability Route", desc: "We will map your papers, articles, and credentials against O-1 / EB-1 criteria to draft a strong petition." },
    lawyer: { title: "Verify Legal Referrals", desc: "Get matched with peer-recommended, expat-friendly immigration attorneys with verified track records." },
    nomad: { title: "Explore Remote Work Visas", desc: "Identify low-tax digital nomad options and residency requirements for remote employees." },
    translations: { title: "Official Translations & Records", desc: "Find certified translation services and map required records for USCIS/local filing standards." },
    forms: { title: "Organize Application Files", desc: "Receive step-by-step guidance on cover letters, history logs, and file templates." },
    family: { title: "Family & Dependent Relocation", desc: "Understand sponsor requirements and petition options for spouses and dependents." },
    tracking: { title: "Track Applications Without Errors", desc: "Access our custom filing timeline tool to prevent filing errors and delays." },
    greencard: { title: "Permanent Residency Strategy", desc: "Evaluate long-term green card pathways and physical stay rules." },
    presence: { title: "Compliance & Stay Audits", desc: "Audit stay logs and track entry-exit records to prevent visa compliance issues." },
    audits: { title: "RFE & Document Audits", desc: "Prepare evidentiary packages for audits, inquiries, or Requests for Evidence." },
    transition: { title: "Status Adjustments", desc: "Plan status adjustments from student or work visas to permanent resident without leaving the country." },
    resume: { title: "Resume Localization", desc: "Rebuild your CV layout and buzzwords to pass local ATS screens and impress managers." },
    linkedin: { title: "LinkedIn Optimization", desc: "Tailor your online summary and keyword density to trigger local recruiter searches." },
    portfolio: { title: "Portfolio Refactoring", desc: "Shape your projects and case studies to highlight business metrics that local teams value." },
    requirements: { title: "Local Market Gap Review", desc: "Compare your skills against active local job openings to focus your learning." },
    target_list: { title: "Target Company Pipeline", desc: "Filter and select 20 expat-friendly target companies currently hiring in your niche." },
    recruiters: { title: "Recruiter Warm Outreach", desc: "Draft outreach templates and identify key recruiters to fast-track conversations." },
    outreach: { title: "Expat Professional Networking", desc: "Master local networking etiquette, warm messaging, and secure info chats." },
    meetups: { title: "Local Networking Strategy", desc: "Locate key industry meetups and conferences to build local relationships." },
    mock: { title: "FAANG & Corporate Mock Loops", desc: "Run technical or behavioral mock interviews under real pressure and get live feedback." },
    behavioral: { title: "Behavioral Playbooks", desc: "Craft storytelling responses using the STAR method adapted to local hiring cultures." },
    negotiation: { title: "Salary & Offer Negotiation", desc: "Learn negotiation scripts and leverage counter-offers to maximize base and equity." },
    benchmarks: { title: "Total Compensation Auditing", desc: "Audit salary benchmarks for your level, location, and role to avoid leaving money on the table." },
    builder_card: { title: "Credit Builder Setup", desc: "Review zero-credit cards and secured lines that report to credit bureaus instantly." },
    foreign_link: { title: "Cross-Border Credit Linkage", desc: "Explore services to pull and link your home country credit score to local agencies." },
    monitor: { title: "Credit Score Tracking", desc: "Set up alert triggers and monitor utilization ratios to grow your credit score." },
    utilization: { title: "Credit Utilization Management", desc: "Get tailored ratios and alerts to optimize your payment schedules." },
    open_checking: { title: "Expat Banking Audits", desc: "Avoid monthly fees by selecting expat-friendly checking and savings accounts." },
    cheap_transfers: { title: "International Wire Pipelines", desc: "Review low-fee wire services and minimize forex conversion markups." },
    tax_id: { title: "Tax ID Applications (SSN/ITIN)", desc: "Receive document checkers and guidance to apply for your local tax ID quickly." },
    utility_link: { title: "Utility Reporting Setup", desc: "Report rent and utilities history to double your credit growth rate." },
    file_taxes: { title: "Dual-Status Tax Filings", desc: "Get mapped to expat tax preparers for clean dual-status or resident tax returns." },
    asset_report: { title: "Foreign Assets Disclosures (FBAR)", desc: "Map required FBAR/FATCA compliance forms to avoid high penalty fees." },
    mortgage: { title: "Expat Mortgage Qualification", desc: "Prepare document checklists and map expat-friendly lenders for home buying." },
    investments: { title: "Cross-Border Wealth Setup", desc: "Safeguard assets, avoid double taxes, and set up local broker accounts." }
  };

  // Dynamically populate Results View
  function renderResultsPage() {
    // 1. Update Scores Dashboard
    const valStatus = ratings.status || 0;
    const valCareer = ratings.career || 0;
    const valFinance = ratings.finance || 0;

    document.getElementById('results-score-status').innerText = `${valStatus}/10`;
    document.getElementById('results-score-career').innerText = `${valCareer}/10`;
    document.getElementById('results-score-finance').innerText = `${valFinance}/10`;

    // Category Label Names based on selectedFocus
    const focusConfig = quizContentConfig[selectedFocus || 'status'];
    if (focusConfig && focusConfig.categories) {
      document.getElementById('results-lbl-status').innerText = focusConfig.categories[0];
      document.getElementById('results-lbl-career').innerText = focusConfig.categories[1];
      document.getElementById('results-lbl-finance').innerText = focusConfig.categories[2];
    }

    // 2. Identify biggest bottleneck
    let bottleneck = 'status';
    let lowestScore = valStatus;
    if (valCareer < lowestScore) {
      lowestScore = valCareer;
      bottleneck = 'career';
    }
    if (valFinance < lowestScore) {
      lowestScore = valFinance;
      bottleneck = 'finance';
    }

    const bottleneckIdx = bottleneck === 'status' ? 0 : bottleneck === 'career' ? 1 : 2;
    const bottleneckName = (focusConfig && focusConfig.categories) ? focusConfig.categories[bottleneckIdx] : 'Immigration Status';
    
    document.getElementById('results-bottleneck-name').innerText = bottleneckName;
    
    const lookupFocus = selectedFocus || 'status';
    const bottleneckDesc = statusDescriptions[lookupFocus] ? statusDescriptions[lookupFocus][lowestScore] : 'Rate your score inside the quiz.';
    document.getElementById('results-bottleneck-desc').innerText = bottleneckDesc;

    // 3. Render Selected Goals action items list
    const goalsContainer = document.getElementById('results-goals-list');
    goalsContainer.innerHTML = '';
    
    if (selectedStep9 && selectedStep9.length > 0) {
      selectedStep9.forEach(val => {
        const expl = goalExplanations[val] || { title: val, desc: "Your matched advisor will define a concrete roadmap for this priority." };
        const goalEl = document.createElement('div');
        goalEl.className = 'results-goal-item';
        goalEl.innerHTML = `
          <div class="results-goal-icon">🎯</div>
          <div class="results-goal-info">
            <span class="results-goal-title">${expl.title}</span>
            <span class="results-goal-desc">${expl.desc}</span>
          </div>
        `;
        goalsContainer.appendChild(goalEl);
      });
    } else {
      // Default placeholder if none selected
      goalsContainer.innerHTML = `
        <div class="results-goal-item">
          <div class="results-goal-icon">💡</div>
          <div class="results-goal-info">
            <span class="results-goal-title">Custom Relocation Audit</span>
            <span class="results-goal-desc">Your matched advisor will perform a complete audit of your destination paperwork and timeline.</span>
          </div>
        </div>
      `;
    }

    // 4. Determine Matched Advisor (using same matching logic)
    let matchId = 'sarah';
    if (selectedFocus === 'status') {
      if (selectedStep3 === 'peer') {
        matchId = 'aisha';
      } else {
        if (selectedStep2 === 'family') {
          matchId = 'david_chee';
        } else if (selectedStep2 === 'greencard') {
          matchId = 'hassan';
        } else {
          matchId = 'sarah';
        }
      }
    } else if (selectedFocus === 'career') {
      if (selectedStep2 === 'hired') {
        matchId = 'david';
      } else {
        matchId = 'michael';
      }
    } else if (selectedFocus === 'finance') {
      matchId = 'amanda';
    }

    const adv = advisorDb[matchId] || advisorDb.sarah;
    
    // Render advisor card details
    const advContainer = document.getElementById('results-advisor-details');
    advContainer.innerHTML = `
      <div class="results-adv-info-row">
        <div class="results-adv-photo-wrap">
          <img src="${adv.photo}" alt="${adv.name}" class="results-adv-photo">
        </div>
        <div class="results-adv-meta">
          <span class="results-adv-name">${adv.name}</span>
          <span class="results-adv-title">${adv.title}</span>
        </div>
      </div>
      <p class="results-adv-bio">${adv.bio}</p>
    `;

    // 5. Populate advisor schedule tabs & slots
    const daysHeader = document.getElementById('results-days-header');
    const slotsContent = document.getElementById('results-slots-content');
    daysHeader.innerHTML = '';
    slotsContent.innerHTML = '';

    let activeDayId = adv.days[0].id;
    let selectedDayText = `${adv.days[0].name}, ${adv.days[0].date}`;
    let selectedTimeSlot = null;

    const bookBtn = document.getElementById('results-book-btn');
    bookBtn.disabled = true;
    bookBtn.innerText = "Confirm Selected Slot";

    adv.days.forEach((day, idx) => {
      const dayBtn = document.createElement('button');
      dayBtn.className = `day-tab ${idx === 0 ? 'active' : ''}`;
      dayBtn.setAttribute('data-day', day.id);
      dayBtn.innerHTML = `
        <span class="day-name" style="display:block; font-size:0.75rem; text-transform:uppercase;">${day.name}</span>
        <span class="day-date" style="font-size:0.85rem; font-weight:700;">${day.date}</span>
      `;
      
      dayBtn.addEventListener('click', () => {
        daysHeader.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
        dayBtn.classList.add('active');
        activeDayId = day.id;
        selectedDayText = `${day.name}, ${day.date}`;
        
        // Show correct time slots
        slotsContent.querySelectorAll('.day-slots').forEach(g => g.classList.remove('active'));
        const matchedGroup = slotsContent.querySelector(`.day-slots[data-day-slots="${day.id}"]`);
        if (matchedGroup) matchedGroup.classList.add('active');
      });

      daysHeader.appendChild(dayBtn);

      // Create slots group
      const slotsGroup = document.createElement('div');
      slotsGroup.className = `day-slots ${idx === 0 ? 'active' : ''}`;
      slotsGroup.style.display = idx === 0 ? 'grid' : 'none';
      slotsGroup.style.gridTemplateColumns = 'repeat(3, 1fr)';
      slotsGroup.style.gap = '8px';
      slotsGroup.setAttribute('data-day-slots', day.id);

      day.slots.forEach(slot => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'time-slot-btn';
        slotBtn.setAttribute('data-time', slot);
        slotBtn.innerText = slot;
        
        slotBtn.addEventListener('click', () => {
          slotsContent.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
          slotBtn.classList.add('selected');
          selectedTimeSlot = slot;
          bookBtn.disabled = false;
        });

        slotsGroup.appendChild(slotBtn);
      });

      slotsContent.appendChild(slotsGroup);
    });

    // Handle show/hide slots groups when day changes using CSS display property
    daysHeader.querySelectorAll('.day-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const dayId = tab.getAttribute('data-day');
        slotsContent.querySelectorAll('.day-slots').forEach(g => {
          if (g.getAttribute('data-day-slots') === dayId) {
            g.style.display = 'grid';
          } else {
            g.style.display = 'none';
          }
        });
      });
    });

    // 6. Bind Schedule Confirmation button
    bookBtn.onclick = () => {
      if (!isUserLoggedIn) {
        document.getElementById('results-auth-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      
      // Open booking confirmation modal
      const bookingModal = document.getElementById('booking-modal');
      document.getElementById('modal-advisor-name').innerText = adv.name;
      document.getElementById('modal-booking-time').innerText = `${selectedDayText} at ${selectedTimeSlot} (Central Time)`;
      document.getElementById('modal-advisor-specialty').innerText = adv.topSpecialties ? adv.topSpecialties.join(' • ') : 'General Expat Consultation';

      // Prepopulate logged in user email if possible
      const resultsEmailInput = document.getElementById('results-email');
      const resultsNameInput = document.getElementById('results-fullname');
      if (resultsEmailInput && resultsEmailInput.value) {
        document.getElementById('booking-email').value = resultsEmailInput.value;
      }
      if (resultsNameInput && resultsNameInput.value) {
        document.getElementById('booking-name').value = resultsNameInput.value;
      }

      bookingModal.classList.add('open');
    };

    // 7. Populates Success Stories based on bottleneck
    const storiesGrid = document.getElementById('results-stories-grid');
    storiesGrid.innerHTML = '';
    
    let stories = [];
    if (bottleneck === 'status') {
      stories = [
        { stars: "★★★★★", text: "I was struggling with my O-1 visa application. Sarah Jenkins helped me build the perfect portfolio, and I got approved in record time.", author: "Arthur F. (O-1 Visa Holder)" },
        { stars: "★★★★★", text: "Aisha guided me from F-1 student OPT to an H-1B cap-exempt role smoothly. I couldn't have figured it out myself.", author: "Sunita P. (Software Engineer)" },
        { stars: "★★★★★", text: "Elena Ramirez helped our family navigate the complex TPS application process. She was extremely empathetic and thorough.", author: "Luiz M. (TPS Beneficiary)" }
      ];
    } else if (bottleneck === 'career') {
      stories = [
        { stars: "★★★★★", text: "I didn't know how to negotiate my salary in the local market. David K.'s recruiting playbook paid for itself 100x over when I landed my FAANG offer.", author: "Eduardo Silva (Senior Dev)" },
        { stars: "★★★★★", text: "David helped rebuild my CV for ATS. The callback rates went from zero to 30% in three weeks. Highly recommend!", author: "Kasia K. (Product Designer)" },
        { stars: "★★★★★", text: "Michael's guidance on starting my consultancy as an expat saved me months of corporate legal planning and registration hassle.", author: "Pierre G. (Founder)" }
      ];
    } else {
      stories = [
        { stars: "★★★★★", text: "Moving here meant losing my credit history. Amanda W. showed me exactly how to hit a 750 score within 6 months. Absolute life saver.", author: "Sophia Martinez (Marketing Lead)" },
        { stars: "★★★★★", text: "Amanda helped us get pre-approved for an expat mortgage without a long local credit history. We bought our first house last week!", author: "Liam & Fiona (Homeowners)" },
        { stars: "★★★★★", text: "Sorting out double taxes on my home assets seemed impossible. Amanda made cross-border planning crystal clear and stress-free.", author: "Marcus T. (Asset Manager)" }
      ];
    }

    stories.forEach(st => {
      const card = document.createElement('div');
      card.className = 'story-card';
      card.innerHTML = `
        <div class="stars" style="color: #d97706; margin-bottom: 8px;">${st.stars}</div>
        <p style="font-size: 0.88rem; font-style: italic; line-height: 1.45; color: var(--text-primary); margin-bottom: 12px;">"${st.text}"</p>
        <span class="story-author" style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block;">— ${st.author}</span>
      `;
      storiesGrid.appendChild(card);
    });

    // 8. Update Auth & Locking states based on isUserLoggedIn
    const lockOverlay = document.getElementById('results-lock-overlay');
    const authContainer = document.getElementById('results-auth-container');
    const welcomeBanner = document.getElementById('results-welcome-banner');

    if (isUserLoggedIn) {
      if (lockOverlay) lockOverlay.classList.add('hidden');
      if (authContainer) authContainer.style.display = 'none';
      if (welcomeBanner) {
        welcomeBanner.style.display = 'flex';
      }
      updateHeaderNavActions(true);
    } else {
      if (lockOverlay) lockOverlay.classList.remove('hidden');
      if (authContainer) authContainer.style.display = 'block';
      if (welcomeBanner) welcomeBanner.style.display = 'none';
      updateHeaderNavActions(false);
    }
  }

  // Header Nav actions logged-in toggles
  function updateHeaderNavActions(loggedIn, user = null) {
    const navActions = document.querySelector('.nav-actions');
    const publicNav = document.querySelector('.public-nav-links');
    const portalNav = document.querySelector('.portal-nav-links');
    const portalSubNav = document.getElementById('portal-sub-nav');
    const dashboardLink = document.getElementById('nav-link-dashboard');
    const advisorPortalLink = document.getElementById('nav-link-advisor-portal');
    
    // Toggle public vs portal nav links
    if (publicNav) publicNav.style.display = loggedIn ? 'none' : 'flex';
    if (portalNav) portalNav.style.display = loggedIn ? 'flex' : 'none';
    if (portalSubNav) portalSubNav.style.display = loggedIn ? 'block' : 'none';

    if (dashboardLink) {
      const parentLi = dashboardLink.closest('li');
      const shouldShow = loggedIn && userRole === 'client';
      if (parentLi) {
        parentLi.style.display = shouldShow ? 'inline-block' : 'none';
      }
      dashboardLink.style.display = shouldShow ? 'inline-block' : 'none';
    }

    if (advisorPortalLink) {
      const parentLi = advisorPortalLink.closest('li');
      const shouldShow = loggedIn && userRole === 'advisor';
      if (parentLi) {
        parentLi.style.display = shouldShow ? 'inline-block' : 'none';
      }
      advisorPortalLink.style.display = shouldShow ? 'inline-block' : 'none';
    }

    if (!navActions) return;

    if (loggedIn) {
      let displayName = 'Expat';
      const currentUserObj = user || (auth ? auth.currentUser : null);
      if (currentUserObj) {
        if (currentUserObj.displayName) {
          displayName = currentUserObj.displayName.split(' ')[0];
        } else if (currentUserObj.email) {
          displayName = currentUserObj.email.split('@')[0].split('.')[0];
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }
      }
      
      navActions.innerHTML = `
        <span style="font-size: 0.88rem; font-weight: 600; color: var(--accent); margin-right: 12px; display: inline-block; vertical-align: middle;">👋 Welcome, ${displayName}!</span>
        <button class="btn btn-outline" id="btn-header-logout" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 100px;">Log Out</button>
      `;
      
      const logoutBtn = document.getElementById('btn-header-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (auth) {
            signOut(auth)
              .then(() => {
                isUserLoggedIn = false;
                renderResultsPage();
                const homeLink = document.querySelector('.nav-link[data-target="home"]');
                if (homeLink) homeLink.click();
              })
              .catch(err => console.error("Sign out failed:", err));
          } else {
            isUserLoggedIn = false;
            renderResultsPage();
            const homeLink = document.querySelector('.nav-link[data-target="home"]');
            if (homeLink) homeLink.click();
          }
        });
      }
    } else {
      navActions.innerHTML = `
        <button class="btn btn-outline" id="btn-header-signin">Sign In</button>
        <button class="btn btn-primary" id="btn-header-signup">Sign Up</button>
      `;
      
      // Wire these buttons to focus on the auth form if on results page, or just toggle state
      const signin = document.getElementById('btn-header-signin');
      const signup = document.getElementById('btn-header-signup');
      
      const resultsSec = document.getElementById('results');
      
      const handleAuthClick = (isLogin) => {
        if (resultsSec && resultsSec.classList.contains('active') && !isUserLoggedIn) {
          document.getElementById('results-auth-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
          const tabBtn = document.getElementById(isLogin ? 'results-tab-login' : 'results-tab-signup');
          if (tabBtn) tabBtn.click();
        } else {
          const globalModal = document.getElementById('global-auth-modal');
          if (globalModal) {
            globalModal.style.display = 'flex';
            globalModal.classList.add('open');
            const tabSignup = document.getElementById('global-tab-signup');
            const tabLogin = document.getElementById('global-tab-login');
            if (isLogin) {
              if (tabLogin) tabLogin.click();
            } else {
              if (tabSignup) tabSignup.click();
            }
          }
        }
      };
      
      if (signin) signin.addEventListener('click', () => handleAuthClick(true));
      if (signup) signup.addEventListener('click', () => handleAuthClick(false));
    }
  }

  // Bind Results page signup/login forms
  const resultsAuthForm = document.getElementById('results-signup-form');
  const resultsTabSignup = document.getElementById('results-tab-signup');
  const resultsTabLogin = document.getElementById('results-tab-login');
  const resultsGroupFullname = document.getElementById('results-group-fullname');
  
  const resFullnameInput = document.getElementById('results-fullname');
  const resEmailInput = document.getElementById('results-email');
  const resPasswordInput = document.getElementById('results-password');
  const resSubmitBtn = document.getElementById('results-btn-auth-submit');
  const resErrorMsg = document.getElementById('results-auth-error-msg');

  let resultsAuthIsSignup = true;

  if (resultsTabSignup && resultsTabLogin) {
    resultsTabSignup.addEventListener('click', () => {
      resultsAuthIsSignup = true;
      resultsTabSignup.classList.add('active');
      resultsTabLogin.classList.remove('active');
      if (resultsGroupFullname) resultsGroupFullname.style.display = 'block';
      if (resFullnameInput) resFullnameInput.setAttribute('required', 'required');
      if (resSubmitBtn) resSubmitBtn.innerText = 'Create Account & Save Plan';
      if (resErrorMsg) resErrorMsg.style.display = 'none';
    });

    resultsTabLogin.addEventListener('click', () => {
      resultsAuthIsSignup = false;
      resultsTabSignup.classList.remove('active');
      resultsTabLogin.classList.add('active');
      if (resultsGroupFullname) resultsGroupFullname.style.display = 'none';
      if (resFullnameInput) resFullnameInput.removeAttribute('required');
      if (resSubmitBtn) resSubmitBtn.innerText = 'Log In & Save Plan';
      if (resErrorMsg) resErrorMsg.style.display = 'none';
    });
  }

  if (resultsAuthForm) {
    resultsAuthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (resErrorMsg) resErrorMsg.style.display = 'none';
      
      const fullname = resultsAuthIsSignup ? resFullnameInput.value.trim() : '';
      const email = resEmailInput.value.trim();
      const password = resPasswordInput.value.trim();

      if (resultsAuthIsSignup && !fullname) {
        if (resErrorMsg) {
          resErrorMsg.innerText = "Please enter your full name.";
          resErrorMsg.style.display = 'block';
        }
        return;
      }

      if (resSubmitBtn) {
        resSubmitBtn.disabled = true;
        resSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
      }

      const handleResAuthError = (err) => {
        console.error("Results Auth failed:", err);
        if (resSubmitBtn) {
          resSubmitBtn.disabled = false;
          resSubmitBtn.innerText = resultsAuthIsSignup ? 'Create Account & Save Plan' : 'Log In & Save Plan';
        }
        if (resErrorMsg) {
          resErrorMsg.innerText = err.message || "Authentication failed. Please check credentials.";
          resErrorMsg.style.display = 'block';
        }
      };

      if (resultsAuthIsSignup) {
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            updateProfile(user, { displayName: fullname })
              .then(() => syncUserData(user))
              .then(() => {
                if (resSubmitBtn) {
                  resSubmitBtn.disabled = false;
                  resSubmitBtn.innerText = 'Create Account & Save Plan';
                }
                renderResultsPage();
                const advisorCard = document.getElementById('results-advisor-card-container');
                if (advisorCard) {
                  advisorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              })
              .catch(handleResAuthError);
          })
          .catch(handleResAuthError);
      } else {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            syncUserData(user)
              .then(() => {
                if (resSubmitBtn) {
                  resSubmitBtn.disabled = false;
                  resSubmitBtn.innerText = 'Log In & Save Plan';
                }
                renderResultsPage();
                const advisorCard = document.getElementById('results-advisor-card-container');
                if (advisorCard) {
                  advisorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              })
              .catch(handleResAuthError);
          })
          .catch(handleResAuthError);
      }
    });
  }

  const btnGoogleResults = document.getElementById('btn-google-results');
  if (btnGoogleResults) {
    btnGoogleResults.addEventListener('click', () => {
      if (!auth) return;
      if (resErrorMsg) resErrorMsg.style.display = 'none';
      
      if (resSubmitBtn) {
        resSubmitBtn.disabled = true;
        resSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
      }

      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          return syncUserData(user).then(() => {
            if (resSubmitBtn) {
              resSubmitBtn.disabled = false;
              resSubmitBtn.innerText = resultsAuthIsSignup ? 'Create Account & Save Plan' : 'Log In & Save Plan';
            }
            renderResultsPage();
            const advisorCard = document.getElementById('results-advisor-card-container');
            if (advisorCard) {
              advisorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        })
        .catch(err => {
          console.error("Google Auth failed:", err);
          if (resSubmitBtn) {
            resSubmitBtn.disabled = false;
            resSubmitBtn.innerText = resultsAuthIsSignup ? 'Create Account & Save Plan' : 'Log In & Save Plan';
          }
          if (resErrorMsg) {
            resErrorMsg.innerText = err.message || "Google authentication failed.";
            resErrorMsg.style.display = 'block';
          }
        });
    });
  }

  // Bind Results page Retake assessment button
  const retakeQuizBtn = document.getElementById('results-retake-quiz-btn');
  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener('click', () => {
      // Reset all quiz state
      selectedFocus = '';
      selectedStep2 = '';
      selectedStep3 = '';
      selectedStep7 = '';
      selectedStep8 = '';
      selectedStep9 = [];
      selectedStep10 = '';
      ratings = { status: 0, career: 0, finance: 0 };
      goalStepsToAsk = [];
      currentGoalStepIndex = 0;

      // Clear quiz UI selections if quizCard exists
      const qCard = document.querySelector('.hero-quiz-card');
      if (qCard) {
        qCard.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        qCard.querySelectorAll('.goal-checkbox-row').forEach(r => r.classList.remove('checked'));
        qCard.querySelectorAll('.goal-checkbox-input').forEach(i => i.checked = false);
        qCard.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
        // Reset visualizer if available
        const pFill = document.getElementById('hero-quiz-progress');
        if (pFill) pFill.style.width = '33.3%';
        const allSlides = qCard.querySelectorAll('.quiz-step-slide');
        allSlides.forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });
        const step1 = qCard.querySelector('.quiz-step-slide[data-step="1"]');
        if (step1) { step1.style.display = 'block'; setTimeout(() => step1.classList.add('active'), 10); }
        const prevBtnEl = qCard.querySelector('.quiz-prev-btn');
        if (prevBtnEl) prevBtnEl.style.display = 'none';
        const progressWrapper = qCard.querySelector('.quiz-progress-wrapper');
        if (progressWrapper) progressWrapper.classList.remove('hide-progress');
        const stepLabelEl = qCard.querySelector('.quiz-step-label');
        if (stepLabelEl) stepLabelEl.innerText = 'Step 1 of 3';
      }
      currentStep = 1;

      // Return to homepage
      sections.forEach(sec => sec.classList.toggle('active', sec.id === 'home'));
      const homeLink = document.querySelector('.nav-link[data-target="home"]');
      if (homeLink) {
        navLinks.forEach(l => l.classList.remove('active'));
        homeLink.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Bind Results page "Go to Expat Hub" button
  const btnResultsGoToHub = document.getElementById('btn-results-go-to-hub');
  if (btnResultsGoToHub) {
    btnResultsGoToHub.addEventListener('click', () => {
      justCompletedQuiz = false; // Reset the flag
      sections.forEach(sec => {
        sec.classList.toggle('active', sec.id === 'dashboard');
      });
      const hubLink = document.getElementById('nav-link-dashboard');
      if (hubLink) {
        navLinks.forEach(l => l.classList.remove('active'));
        hubLink.classList.add('active');
      }
      renderClientDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initial header nav state set
  updateHeaderNavActions(isUserLoggedIn);

  // CTA "Take the Intake Quiz" button — scrolls to hero quiz
  const ctaQuizBtn = document.getElementById('cta-take-quiz-btn');
  if (ctaQuizBtn) {
    ctaQuizBtn.addEventListener('click', () => {
      const quizCardEl = document.querySelector('.hero-quiz-card');
      if (quizCardEl) {
        quizCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // ==========================================================================
  // DIRECTORY FILTERING & SEARCH LOGIC
  // ==========================================================================
  const dirSearch = document.getElementById('dir-search');
  const filterPillBtns = document.querySelectorAll('.filter-pill-btn');
  const dirAdvisorGrid = document.getElementById('dir-advisor-grid');
  
  if (dirSearch && dirAdvisorGrid) {
    const dirCards = dirAdvisorGrid.querySelectorAll('.advisor-intro-card');
    let activeCategory = 'all';
    let searchQuery = '';

    const filterDirAdvisors = () => {
      dirCards.forEach(card => {
        const id = card.getAttribute('data-advisor-id');
        const adv = advisorDb[id];
        if (!adv) return;

        // Category filter check
        const categoryMatch = activeCategory === 'all' || card.getAttribute('data-category') === activeCategory;

        // Search text query check (name, title, specialties)
        const nameText = adv.name.toLowerCase();
        const titleText = adv.title.toLowerCase();
        const bioText = adv.bio.toLowerCase();
        const specialtiesText = adv.topSpecialties ? adv.topSpecialties.join(' ').toLowerCase() : '';
        const searchMatch = !searchQuery || 
                            nameText.includes(searchQuery) || 
                            titleText.includes(searchQuery) || 
                            bioText.includes(searchQuery) ||
                            specialtiesText.includes(searchQuery);

        if (categoryMatch && searchMatch) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    };

    // Text search input listener
    dirSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterDirAdvisors();
    });

    // Category button clicks
    filterPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterPillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-category');
        filterDirAdvisors();
      });
    });
  }

  // ==========================================================================
  // ADVISOR APPLICATION FORM SUBMISSION
  // ==========================================================================
  const applyForm = document.getElementById('advisor-apply-form');
  const successMessage = document.getElementById('apply-success-message');

  if (applyForm && successMessage) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Hide the form fields
      applyForm.style.display = 'none';
      // Show success screen
      successMessage.style.display = 'block';
      
      // Reset form fields
      applyForm.reset();
    });
  }

  // Bind Global Authentication Modal
  const globalAuthModal = document.getElementById('global-auth-modal');
  const btnCloseGlobalAuth = document.getElementById('btn-close-global-auth');
  const globalAuthForm = document.getElementById('global-auth-form');
  const globalTabSignup = document.getElementById('global-tab-signup');
  const globalTabLogin = document.getElementById('global-tab-login');
  const globalGroupFullname = document.getElementById('global-group-fullname');
  const globalFullnameInput = document.getElementById('global-fullname');
  const globalEmailInput = document.getElementById('global-email');
  const globalPasswordInput = document.getElementById('global-password');
  const globalSubmitBtn = document.getElementById('btn-global-auth-submit');
  const globalErrorMsg = document.getElementById('global-auth-error-msg');
  const btnGoogleGlobal = document.getElementById('btn-google-global');

  const globalBtnForgotPassword = document.getElementById('global-btn-forgot-password');

  let globalAuthIsSignup = true;

  if (btnCloseGlobalAuth && globalAuthModal) {
    btnCloseGlobalAuth.addEventListener('click', () => {
      globalAuthModal.style.display = 'none';
      globalAuthModal.classList.remove('open');
    });
    // Click outside to close
    globalAuthModal.addEventListener('click', (e) => {
      if (e.target === globalAuthModal) {
        globalAuthModal.style.display = 'none';
        globalAuthModal.classList.remove('open');
      }
    });
  }

  if (globalTabSignup && globalTabLogin) {
    globalTabSignup.addEventListener('click', () => {
      globalAuthIsSignup = true;
      globalTabSignup.classList.add('active');
      globalTabLogin.classList.remove('active');
      if (globalGroupFullname) globalGroupFullname.style.display = 'block';
      if (globalFullnameInput) globalFullnameInput.setAttribute('required', 'required');
      if (globalSubmitBtn) globalSubmitBtn.innerText = 'Create Account';
      if (globalErrorMsg) {
        globalErrorMsg.style.display = 'none';
        globalErrorMsg.style.color = '#c85a5a';
      }
      if (globalBtnForgotPassword) globalBtnForgotPassword.style.display = 'none';
    });

    globalTabLogin.addEventListener('click', () => {
      globalAuthIsSignup = false;
      globalTabSignup.classList.remove('active');
      globalTabLogin.classList.add('active');
      if (globalGroupFullname) globalGroupFullname.style.display = 'none';
      if (globalFullnameInput) globalFullnameInput.removeAttribute('required');
      if (globalSubmitBtn) globalSubmitBtn.innerText = 'Log In';
      if (globalErrorMsg) {
        globalErrorMsg.style.display = 'none';
        globalErrorMsg.style.color = '#c85a5a';
      }
      if (globalBtnForgotPassword) globalBtnForgotPassword.style.display = 'inline';
    });
  }

  if (globalBtnForgotPassword) {
    globalBtnForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      const email = globalEmailInput.value.trim();
      if (!email) {
        if (globalErrorMsg) {
          globalErrorMsg.innerText = "Please enter your email address first.";
          globalErrorMsg.style.color = "#c85a5a";
          globalErrorMsg.style.display = 'block';
        }
        return;
      }
      
      globalBtnForgotPassword.innerText = "Sending...";
      globalBtnForgotPassword.style.pointerEvents = 'none';
      
      sendPasswordResetEmail(auth, email)
        .then(() => {
          globalBtnForgotPassword.innerText = "Forgot Password?";
          globalBtnForgotPassword.style.pointerEvents = 'auto';
          if (globalErrorMsg) {
            globalErrorMsg.innerText = "Password reset email sent! Please check your inbox.";
            globalErrorMsg.style.color = "#10b981"; // Success green
            globalErrorMsg.style.display = 'block';
          }
        })
        .catch((error) => {
          globalBtnForgotPassword.innerText = "Forgot Password?";
          globalBtnForgotPassword.style.pointerEvents = 'auto';
          if (globalErrorMsg) {
            globalErrorMsg.innerText = error.message || "Failed to send password reset email.";
            globalErrorMsg.style.color = "#c85a5a";
            globalErrorMsg.style.display = 'block';
          }
        });
    });
  }

  if (globalAuthForm) {
    globalAuthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (globalErrorMsg) globalErrorMsg.style.display = 'none';

      const fullname = globalAuthIsSignup ? globalFullnameInput.value.trim() : '';
      const email = globalEmailInput.value.trim();
      const password = globalPasswordInput.value.trim();

      if (globalAuthIsSignup && !fullname) {
        if (globalErrorMsg) {
          globalErrorMsg.innerText = "Please enter your full name.";
          globalErrorMsg.style.display = 'block';
        }
        return;
      }

      if (globalSubmitBtn) {
        globalSubmitBtn.disabled = true;
        globalSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
      }

      const handleGlobalAuthError = (err) => {
        console.error("Global Auth failed:", err);
        if (globalSubmitBtn) {
          globalSubmitBtn.disabled = false;
          globalSubmitBtn.innerText = globalAuthIsSignup ? 'Create Account' : 'Log In';
        }
        if (globalErrorMsg) {
          globalErrorMsg.innerText = err.message || "Authentication failed. Please check credentials.";
          globalErrorMsg.style.display = 'block';
        }
      };

      if (globalAuthIsSignup) {
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            updateProfile(user, { displayName: fullname })
              .then(() => syncUserData(user))
              .then(() => {
                if (globalSubmitBtn) {
                  globalSubmitBtn.disabled = false;
                  globalSubmitBtn.innerText = 'Create Account';
                }
                globalAuthModal.style.display = 'none';
                globalAuthModal.classList.remove('open');
              })
              .catch(handleGlobalAuthError);
          })
          .catch(handleGlobalAuthError);
      } else {
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            syncUserData(user)
              .then(() => {
                if (globalSubmitBtn) {
                  globalSubmitBtn.disabled = false;
                  globalSubmitBtn.innerText = 'Log In';
                }
                globalAuthModal.style.display = 'none';
                globalAuthModal.classList.remove('open');
              })
              .catch(handleGlobalAuthError);
          })
          .catch(handleGlobalAuthError);
      }
    });
  }

  if (btnGoogleGlobal) {
    btnGoogleGlobal.addEventListener('click', () => {
      if (!auth) return;
      if (globalErrorMsg) globalErrorMsg.style.display = 'none';

      if (globalSubmitBtn) {
        globalSubmitBtn.disabled = true;
        globalSubmitBtn.innerHTML = `<span class="auth-spinner"></span> Authenticating...`;
      }

      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          return syncUserData(user).then(() => {
            if (globalSubmitBtn) {
              globalSubmitBtn.disabled = false;
              globalSubmitBtn.innerText = globalAuthIsSignup ? 'Create Account' : 'Log In';
            }
            globalAuthModal.style.display = 'none';
            globalAuthModal.classList.remove('open');
          });
        })
        .catch(err => {
          console.error("Global Google Auth failed:", err);
          if (globalSubmitBtn) {
            globalSubmitBtn.disabled = false;
            globalSubmitBtn.innerText = globalAuthIsSignup ? 'Create Account' : 'Log In';
          }
          if (globalErrorMsg) {
            globalErrorMsg.innerText = err.message || "Google authentication failed.";
            globalErrorMsg.style.display = 'block';
          }
        });
    });
  }

  // ==========================================================================
  // PHASE 3: CLIENT & ADVISOR DASHBOARDS, CHAT, & DOCUMENT LOCKER
  // ==========================================================================

  function getFocusKey(focusArea) {
    if (!focusArea) return 'status';
    const f = focusArea.toLowerCase();
    if (f.includes('visa') || f.includes('status')) return 'status';
    if (f.includes('job') || f.includes('career')) return 'career';
    if (f.includes('credit') || f.includes('finance')) return 'finance';
    return 'status';
  }

  let chatUnsubscribe = null;
  let advChatUnsubscribe = null;
  let activeSelectedClientId = null;

  // 1. Client Dashboard Logic
  async function renderClientDashboard() {
    if (!auth || !auth.currentUser) return;
    const user = auth.currentUser;
    const uid = user.uid;

    // Greeting & Avatar Initials
    const greeting = document.getElementById('db-user-greeting');
    const avatar = document.getElementById('hub-user-avatar');
    if (greeting) {
      const name = user.displayName || user.email.split('@')[0];
      greeting.innerText = `Welcome back, ${name.charAt(0).toUpperCase() + name.slice(1)}!`;
    }
    if (avatar) {
      const name = user.displayName || user.email.split('@')[0];
      avatar.innerText = name.charAt(0).toUpperCase();
    }

    if (!db) return;

    try {
      // Load user profile goals
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      let quizResults = {};
      let bottleneck = 'status';
      let focusArea = 'Status & Visas';

      if (userDoc.exists()) {
        const data = userDoc.data();
        quizResults = data.quizResults || {};
        bottleneck = quizResults.biggestBottleneck || 'status';
        focusArea = portalActiveFocusArea || quizResults.focusArea || 'Status & Visas';
      } else {
        focusArea = portalActiveFocusArea || 'Status & Visas';
      }

      // Update subheading details on success hub header
      const subheading = document.getElementById('db-user-subheading');
      if (subheading) {
        subheading.innerText = `${focusArea} Relocation Journey • Bottleneck: ${bottleneck.charAt(0).toUpperCase() + bottleneck.slice(1)}`;
      }

      // Highlight category nav tab
      document.querySelectorAll('.sub-nav-cat').forEach(cat => {
        const focusVal = cat.getAttribute('data-focus');
        cat.classList.toggle('active', focusVal === focusArea);
      });
      
      // 1.1 Checklist Population
      const checklistContainer = document.getElementById('db-checklist-container');
      if (checklistContainer) {
        checklistContainer.innerHTML = '';
        let checklistItems = getChecklistItems(focusArea, bottleneck);

        const savedGoals = quizResults.selectedGoals || [];
        
        // Calculate progress
        const checklistVals = checklistItems.map(item => typeof item === 'object' ? item.val : item);
        const checkedCount = savedGoals.filter(g => checklistVals.includes(g)).length;
        const totalCount = checklistItems.length;
        const pct = Math.round((checkedCount / totalCount) * 100);
        
        const progressBadge = document.getElementById('roadmap-progress-badge');
        const progressBar = document.getElementById('roadmap-progress-bar');
        if (progressBadge) {
          progressBadge.innerText = `${pct}% Completed`;
        }
        if (progressBar) {
          progressBar.style.width = `${pct}%`;
        }

        checklistItems.forEach((item, idx) => {
          const text = typeof item === 'object' ? item.label : item;
          const val = typeof item === 'object' ? item.val : item;
          const checked = savedGoals.includes(val) ? 'checked' : '';
          const goalRow = document.createElement('label');
          goalRow.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.9rem; line-height: 1.4; color: var(--text-primary); margin-bottom: 8px;';
          goalRow.innerHTML = `
            <input type="checkbox" class="db-goal-checkbox" data-goal="${val}" ${checked} style="margin-top: 3px;" />
            <span>${text}</span>
          `;
          checklistContainer.appendChild(goalRow);
        });

        // Attach checkbox update listeners
        checklistContainer.querySelectorAll('.db-goal-checkbox').forEach(box => {
          box.addEventListener('change', async () => {
            let updatedSelectedGoals = [...savedGoals];
            const boxGoal = box.getAttribute('data-goal');
            
            if (box.checked) {
              if (!updatedSelectedGoals.includes(boxGoal)) {
                updatedSelectedGoals.push(boxGoal);
              }
            } else {
              updatedSelectedGoals = updatedSelectedGoals.filter(g => g !== boxGoal);
            }

            try {
              await setDoc(userDocRef, {
                quizResults: {
                  ...quizResults,
                  selectedGoals: updatedSelectedGoals
                },
                updatedAt: new Date()
              }, { merge: true });
              console.log("Goal checklist updated in Firestore.");
              
              // Re-evaluate progress badge & bar locally
              const newCheckedCount = updatedSelectedGoals.filter(g => checklistVals.includes(g)).length;
              const newPct = Math.round((newCheckedCount / totalCount) * 100);
              if (progressBadge) progressBadge.innerText = `${newPct}% Completed`;
              if (progressBar) progressBar.style.width = `${newPct}%`;
            } catch (err) {
              console.error("Error saving goal state to Firestore:", err);
            }
          });
        });
      }

      // Update Message Center Advisor details dynamically
      const advisor = mockAdvisorsData[focusArea] || mockAdvisorsData['Status & Visas'];
      const chatAvatar = document.getElementById('chat-advisor-avatar');
      const chatName = document.getElementById('chat-advisor-name');
      if (chatAvatar) chatAvatar.src = advisor.avatar;
      if (chatName) chatName.innerText = `Chat with ${advisor.name} (${advisor.role})`;

      // 1.2 Document Vault File Listing & Dropzone
      renderVaultFileList(uid, focusArea);
      setupVaultUpload(uid);

      // 1.3 Connect Client Chat
      connectClientChat(uid);

      // 1.4 Render Bookings tab details
      renderBookings(focusArea);

    } catch (err) {
      console.error("Error rendering client dashboard:", err);
    }
  }

  // Helper to Render File Locker List
  async function renderVaultFileList(userId, focusArea) {
    const fileListContainer = document.getElementById('vault-file-list');
    const emptyText = document.getElementById('vault-empty-text');
    if (!fileListContainer || !db) return;

    // Clear previous items
    fileListContainer.querySelectorAll('.vault-file-row').forEach(row => row.remove());

    try {
      const docColRef = collection(db, 'users', userId, 'documents');
      const docsSnap = await getDocs(docColRef);

      if (docsSnap.empty) {
        if (emptyText) emptyText.style.display = 'none';
        const mockFiles = mockDocumentsData[focusArea] || [];
        mockFiles.forEach((fileData, idx) => {
          const fileRow = document.createElement('div');
          fileRow.className = 'vault-file-row';
          fileRow.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-secondary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem; display: block;">${fileData.name}</span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${fileData.size} • ${fileData.dateStr}</span>
              </div>
            </div>
            <button class="btn-delete-file" data-id="mock-${idx}" style="background: transparent; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 4px;">&times;</button>
          `;
          fileListContainer.appendChild(fileRow);
        });

        fileListContainer.querySelectorAll('.btn-delete-file').forEach(delBtn => {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            delBtn.closest('.vault-file-row').remove();
            if (fileListContainer.querySelectorAll('.vault-file-row').length === 0) {
              if (emptyText) emptyText.style.display = 'block';
            }
          });
        });
      } else {
        if (emptyText) emptyText.style.display = 'none';
        docsSnap.forEach(fileDoc => {
          const fileData = fileDoc.data();
          const fileRow = document.createElement('div');
          fileRow.className = 'vault-file-row';
          fileRow.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-secondary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem; display: block;">${fileData.name}</span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${fileData.size} • ${fileData.uploadedAt ? new Date(fileData.uploadedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
              </div>
            </div>
            <button class="btn-delete-file" data-id="${fileDoc.id}" style="background: transparent; border: none; color: #ef4444; font-size: 1.1rem; cursor: pointer; padding: 4px;">&times;</button>
          `;
          fileListContainer.appendChild(fileRow);
        });

        // Bind delete action
        fileListContainer.querySelectorAll('.btn-delete-file').forEach(delBtn => {
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const fileId = delBtn.getAttribute('data-id');
            try {
              await deleteDoc(doc(db, 'users', userId, 'documents', fileId));
              console.log("File metadata deleted from Firestore.");
              renderVaultFileList(userId, focusArea);
            } catch (err) {
              console.error("Error deleting file:", err);
            }
          });
        });
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  }

  // Helper to Setup Document Drag/Drop & Select
  function setupVaultUpload(userId) {
    const dropzone = document.getElementById('vault-dropzone');
    const fileInput = document.getElementById('vault-file-input');
    if (!dropzone || !fileInput) return;

    // Toggle select file
    dropzone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(userId, files[0]);
      }
    };
  }

  // Simulated File Upload (save metadata details to Firestore)
  async function handleFileUpload(userId, file) {
    if (!db) return;
    try {
      const docColRef = collection(db, 'users', userId, 'documents');
      // Format file size
      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
        : (file.size / 1024).toFixed(0) + ' KB';

      const payload = {
        name: file.name,
        size: sizeStr,
        uploadedAt: new Date()
      };

      await addDoc(docColRef, payload);
      console.log("Uploaded file metadata details successfully.");
      renderVaultFileList(userId);
    } catch (err) {
      console.error("Simulated file upload error:", err);
    }
  }

  // Connect Real-Time Client Chat
  function connectClientChat(clientId) {
    if (chatUnsubscribe) chatUnsubscribe();
    if (!db) return;

    const chatContainer = document.getElementById('chat-messages');
    const inputForm = document.getElementById('chat-input-form');
    const messageInput = document.getElementById('chat-message-input');

    if (!chatContainer || !inputForm || !messageInput) return;

    const chatSessionId = `chat_${clientId}`;
    const messagesCol = collection(db, 'chats', chatSessionId, 'messages');
    const chatQuery = query(messagesCol, orderBy('timestamp', 'asc'));

    // Listen to messages
    chatUnsubscribe = onSnapshot(chatQuery, (snapshot) => {
      chatContainer.innerHTML = '';
      if (snapshot.empty) {
        // Show mockup welcome messages from their guide!
        const mockMessages = [
          { text: "Hi there! I am David, your relocation guide. Welcome to Same Path! 👋", timeStr: "10:15 AM" },
          { text: "I've reviewed your scorecard bottleneck. I'd love to help you get your paperwork organized. Feel free to drop any draft documents in the Vault Locker on the left, and let me know if you have any questions!", timeStr: "10:16 AM" }
        ];
        mockMessages.forEach(msg => {
          const bubble = document.createElement('div');
          bubble.className = `chat-message-bubble advisor`;
          bubble.innerHTML = `
            <div>${msg.text}</div>
            <span class="chat-timestamp">${msg.timeStr}</span>
          `;
          chatContainer.appendChild(bubble);
        });
        return;
      }
      snapshot.forEach(msgDoc => {
        const msg = msgDoc.data();
        const bubble = document.createElement('div');
        bubble.className = `chat-message-bubble ${msg.senderId === clientId ? 'client' : 'advisor'}`;
        const timeStr = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
        
        bubble.innerHTML = `
          <div>${msg.text}</div>
          <span class="chat-timestamp">${timeStr}</span>
        `;
        chatContainer.appendChild(bubble);
      });
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    // Send Message
    inputForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;

      try {
        await addDoc(messagesCol, {
          senderId: clientId,
          senderName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
          text: text,
          timestamp: new Date()
        });
        messageInput.value = '';
      } catch (err) {
        console.error("Error sending message:", err);
      }
    };
  }

  // 2. Advisor Dashboard Logic
  async function renderAdvisorDashboard() {
    if (!db) return;

    const rosterContainer = document.getElementById('adv-clients-list');
    if (!rosterContainer) return;

    rosterContainer.innerHTML = '';

    try {
      // Get all clients who have onboarding results
      const usersColRef = collection(db, 'users');
      const usersQuery = query(usersColRef);
      const querySnap = await getDocs(usersQuery);

      let activeRowBound = false;

      querySnap.forEach(userDoc => {
        const uData = userDoc.data();
        if (uData.uid && uData.role === 'client') {
          const clientRow = document.createElement('div');
          clientRow.className = `client-row ${!activeRowBound ? 'active' : ''}`;
          clientRow.setAttribute('data-id', uData.uid);
          clientRow.style.cssText = 'padding: 16px; border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; background: var(--bg-primary); display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;';
          
          clientRow.innerHTML = `
            <div>
              <h4 style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${uData.displayName || uData.email.split('@')[0]}</h4>
              <p style="font-size: 0.78rem; color: var(--text-secondary);">${uData.email}</p>
            </div>
            <span class="badge" style="background-color: var(--accent-light); color: var(--accent); font-weight: 700; font-size: 0.7rem; border-radius: 12px;">Active Session</span>
          `;
          
          rosterContainer.appendChild(clientRow);

          // Click handler to load client details
          clientRow.addEventListener('click', () => {
            rosterContainer.querySelectorAll('.client-row').forEach(row => row.classList.remove('active'));
            clientRow.classList.add('active');
            loadClientDetailsForAdvisor(uData.uid, uData.displayName || uData.email.split('@')[0]);
          });

          if (!activeRowBound) {
            // Load first client by default
            loadClientDetailsForAdvisor(uData.uid, uData.displayName || uData.email.split('@')[0]);
            activeRowBound = true;
          }
        }
      });

      if (!activeRowBound) {
        rosterContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">No clients matching active sessions.</p>`;
        document.getElementById('adv-client-goals').innerHTML = '';
        document.getElementById('adv-client-files').innerHTML = '';
        document.getElementById('adv-chat-messages').innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; font-style: italic; margin-top: 100px;">No active chat session.</div>`;
      }

    } catch (err) {
      console.error("Error loading advisor roster:", err);
    }
  }

  // Load Client Detail Views in Advisor Portal
  async function loadClientDetailsForAdvisor(clientId, clientName) {
    activeSelectedClientId = clientId;
    if (!db) return;

    // Set Header
    const clientHeader = document.getElementById('chat-client-header-name');
    const clientAvatar = document.getElementById('chat-client-avatar');
    if (clientHeader) clientHeader.innerText = clientName;
    if (clientAvatar) clientAvatar.innerText = clientName.charAt(0).toUpperCase();

    try {
      // Load checked goals
      const userDoc = await getDoc(doc(db, 'users', clientId));
      const goalsContainer = document.getElementById('adv-client-goals');
      if (goalsContainer && userDoc.exists()) {
        goalsContainer.innerHTML = '';
        const savedGoals = userDoc.data().quizResults?.selectedGoals || [];
        if (savedGoals.length === 0) {
          goalsContainer.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">No milestones checked yet.</span>`;
        } else {
          savedGoals.forEach(gText => {
            const goalRow = document.createElement('div');
            goalRow.style.cssText = 'font-size: 0.88rem; color: var(--accent); font-weight: 600; display: flex; align-items: center; gap: 6px;';
            goalRow.innerHTML = `✓ <span style="color: var(--text-primary); font-weight: 400;">${gText}</span>`;
            goalsContainer.appendChild(goalRow);
          });
        }
      }

      // Load client files
      const filesContainer = document.getElementById('adv-client-files');
      if (filesContainer) {
        filesContainer.innerHTML = '';
        const filesSnap = await getDocs(collection(db, 'users', clientId, 'documents'));
        if (filesSnap.empty) {
          const mockFiles = [
            { name: "visa_application_draft_v2.pdf", size: "2.4 MB" },
            { name: "certified_academic_transcript.pdf", size: "1.8 MB" },
            { name: "employer_offer_letter.png", size: "920 KB" }
          ];
          mockFiles.forEach(fData => {
            const fRow = document.createElement('div');
            fRow.style.cssText = 'padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; margin-bottom: 8px;';
            fRow.innerHTML = `
              <span>📄 <strong>${fData.name}</strong> (${fData.size})</span>
              <a href="#" onclick="alert('Downloading shared file...'); return false;" style="color: var(--accent); font-weight: 600; text-decoration: none;">Download</a>
            `;
            filesContainer.appendChild(fRow);
          });
        } else {
          filesSnap.forEach(fDoc => {
            const fData = fDoc.data();
            const fRow = document.createElement('div');
            fRow.style.cssText = 'padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem;';
            fRow.innerHTML = `
              <span>📄 <strong>${fData.name}</strong> (${fData.size})</span>
              <a href="#" onclick="alert('Downloading shared file...'); return false;" style="color: var(--accent); font-weight: 600; text-decoration: none;">Download</a>
            `;
            filesContainer.appendChild(fRow);
          });
        }
      }

      // Connect Advisor Chat to Client Channel
      connectAdvisorChat(clientId);

    } catch (err) {
      console.error("Error loading client details for advisor:", err);
    }
  }

  // Connect Real-Time Advisor Chat
  function connectAdvisorChat(clientId) {
    if (advChatUnsubscribe) advChatUnsubscribe();
    if (!db) return;

    const chatContainer = document.getElementById('adv-chat-messages');
    const inputForm = document.getElementById('adv-chat-input-form');
    const messageInput = document.getElementById('adv-chat-message-input');

    if (!chatContainer || !inputForm || !messageInput) return;

    const chatSessionId = `chat_${clientId}`;
    const messagesCol = collection(db, 'chats', chatSessionId, 'messages');
    const chatQuery = query(messagesCol, orderBy('timestamp', 'asc'));

    // Listen to messages
    advChatUnsubscribe = onSnapshot(chatQuery, (snapshot) => {
      chatContainer.innerHTML = '';
      snapshot.forEach(msgDoc => {
        const msg = msgDoc.data();
        const bubble = document.createElement('div');
        bubble.className = `chat-message-bubble ${msg.senderId === 'advisor' ? 'client' : 'advisor'}`;
        const timeStr = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
        
        bubble.innerHTML = `
          <div>${msg.text}</div>
          <span class="chat-timestamp">${timeStr}</span>
        `;
        chatContainer.appendChild(bubble);
      });
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    // Send Message (Advisor Response)
    inputForm.onsubmit = async (e) => {
      e.preventDefault();
      const text = messageInput.value.trim();
      if (!text) return;

      try {
        await addDoc(messagesCol, {
          senderId: 'advisor',
          senderName: 'Expat Guide',
          text: text,
          timestamp: new Date()
        });
        messageInput.value = '';
      } catch (err) {
        console.error("Error sending response message:", err);
      }
    };
  }

  // 3. Bind Switch View Toggles for Testing
  const btnToggleToAdvisor = document.getElementById('btn-toggle-to-advisor');
  const btnToggleToClient = document.getElementById('btn-toggle-to-client');

  if (btnToggleToAdvisor) {
    btnToggleToAdvisor.addEventListener('click', () => {
      userRole = 'advisor';
      // Toggle navbar visibility links
      updateHeaderNavActions(true);
      // Route to advisor section
      sections.forEach(sec => sec.classList.toggle('active', sec.id === 'advisor-portal'));
      renderAdvisorDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnToggleToClient) {
    btnToggleToClient.addEventListener('click', () => {
      userRole = 'client';
      updateHeaderNavActions(true);
      sections.forEach(sec => sec.classList.toggle('active', sec.id === 'dashboard'));
      renderClientDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
