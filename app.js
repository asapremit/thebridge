document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.view-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      
      // Update links
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update sections
      sections.forEach(sec =>
        sec.classList.toggle('active', sec.id === targetId)
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Hero Step-by-Step Quiz Logic
  const quizCard = document.querySelector('.hero-quiz-card');
  if (quizCard) {
    let currentStep = 1;
    let selectedFocus = '';  // status, career, finance
    let selectedStep2 = '';  // visa, family, greencard, hired, business, credit, investing
    let selectedStep3 = '';  // lawyer, peer, tech, health, engineering, finance_biz, playbook, launch, basics, advanced
    
    const progressFill = document.getElementById('hero-quiz-progress');
    const stepLabel = quizCard.querySelector('.quiz-step-label');
    
    // Step 1: Focus Area click handler
    const focusRows = quizCard.querySelectorAll('.quiz-step-slide[data-step="1"] .quiz-choice-row');
    focusRows.forEach(row => {
      row.addEventListener('click', () => {
        selectedFocus = row.getAttribute('data-focus');
        
        // Reset selections for deep steps
        selectedStep2 = '';
        selectedStep3 = '';
        
        // Remove active class on all Step 2/3 rows
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
        
        // Reset selection for step 3
        selectedStep3 = '';
        quizCard.querySelectorAll('.quiz-step-slide[data-step^="3-"] .quiz-choice-row').forEach(r => r.classList.remove('active'));
        
        const currentSlide = row.closest('.quiz-step-slide');
        currentSlide.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        
        goToStep(3);
      });
    });
    
    // Step 3: Connect options click handler
    const step3Rows = quizCard.querySelectorAll('.quiz-step-slide[data-step^="3-"] .quiz-choice-row');
    step3Rows.forEach(row => {
      row.addEventListener('click', () => {
        const currentSlide = row.closest('.quiz-step-slide');
        currentSlide.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        selectedStep3 = row.getAttribute('data-step3');
      });
    });
    
    // Reset Buttons
    const resetBtns = quizCard.querySelectorAll('.quiz-back-btn');
    resetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Clear all selected choices
        quizCard.querySelectorAll('.quiz-choice-row').forEach(r => r.classList.remove('active'));
        selectedFocus = '';
        selectedStep2 = '';
        selectedStep3 = '';
        goToStep(1);
      });
    });
    
    // Submit Match Buttons
    const submitBtns = quizCard.querySelectorAll('.quiz-submit-btn');
    submitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Validate Step 3 selection for the currently active Slide
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
          alert("Please select a preference before matching!");
          return;
        }
        
        selectedStep3 = activeRow.getAttribute('data-step3');
        
        // Dynamic matching logic
        let matchId = '';
        if (selectedFocus === 'status') {
          if (selectedStep3 === 'peer') {
            matchId = 'aisha'; // Aisha is our academic and student visa peer guide
          } else {
            // Lawyer selected
            if (selectedStep2 === 'family') {
              matchId = 'david_chee'; // Family reunification advisor
            } else if (selectedStep2 === 'greencard') {
              matchId = 'hassan'; // Citizenship and naturalization expert
            } else {
              matchId = 'sarah'; // Default immigration attorney
            }
          }
        } else if (selectedFocus === 'career') {
          if (selectedStep2 === 'hired') {
            matchId = 'david'; // Tech FAANG recruiter
          } else {
            matchId = 'michael'; // Business investment visa advisor (helps founders)
          }
        } else if (selectedFocus === 'finance') {
          matchId = 'amanda'; // CFP credit and investing advisor
        }
        
        if (matchId) {
          // Go straight to the directory view
          const dirLink = document.querySelector('.nav-link[data-target="directory"]');
          if (dirLink) {
            dirLink.click();
          }

          // Select the category corresponding to the survey outcome
          const categoryBtn = document.querySelector(`.filter-pill-btn[data-category="${selectedFocus}"]`);
          if (categoryBtn) {
            categoryBtn.click();
          }

          // Highlight the advisor card and scroll it into view
          const card = document.querySelector(`.advisor-intro-card[data-advisor-id="${matchId}"]`);
          if (card) {
            // Remove previous matches/highlights and badges
            document.querySelectorAll('.advisor-intro-card').forEach(c => {
              c.classList.remove('highlight-match');
              const oldBadge = c.querySelector('.top-match-badge');
              if (oldBadge) oldBadge.remove();
            });

            // Create and append a premium Top Match badge
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

            // Scroll the highlighted card into view smoothly
            setTimeout(() => {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }

          // Reset the quiz to Step 1 for next time
          goToStep(1);
        }
      });
    });
    
    function goToStep(step) {
      currentStep = step;
      
      // Hide all slides
      const allSlides = quizCard.querySelectorAll('.quiz-step-slide');
      allSlides.forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
      });
      
      if (step === 1) {
        progressFill.style.width = '33.3%';
        stepLabel.innerText = "Step 1 of 3";
        const slide = quizCard.querySelector('.quiz-step-slide[data-step="1"]');
        slide.style.display = 'block';
        setTimeout(() => slide.classList.add('active'), 10);
      } else if (step === 2) {
        progressFill.style.width = '66.6%';
        stepLabel.innerText = "Step 2 of 3";
        
        let slideSelector = '';
        if (selectedFocus === 'status') slideSelector = '.quiz-step-slide[data-step="2-status"]';
        else if (selectedFocus === 'career') slideSelector = '.quiz-step-slide[data-step="2-career"]';
        else if (selectedFocus === 'finance') slideSelector = '.quiz-step-slide[data-step="2-finance"]';
        
        const slide = quizCard.querySelector(slideSelector);
        if (slide) {
          slide.style.display = 'block';
          setTimeout(() => slide.classList.add('active'), 10);
        }
      } else if (step === 3) {
        progressFill.style.width = '100%';
        stepLabel.innerText = "Step 3 of 3";
        
        let slideSelector = '';
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
        stepDesc.innerText = `Matching your request with top-rated ${adv ? adv.specialties[0] : 'relocation'} experts...`;
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
      
      setTimeout(() => {
        card.click();
      }, 600);
    }
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
});
