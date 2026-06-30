function initMatchReveal() {
    // Prevent duplicate overlays
    let overlay = document.getElementById('match-reveal-overlay');
    if (overlay) {
        overlay.remove();
    }
    overlay = document.createElement('div');
    overlay.id = 'match-reveal-overlay';
    overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9999; background:#fcfbf9; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; box-sizing:border-box; overflow-y:auto; padding: 40px 24px;';
    
    // Add loading text initially
    overlay.innerHTML = '<div style="display:flex; height:80vh; align-items:center; justify-content:center;"><h2 id="loading-text" style="font-family: \'Instrument Serif\', serif; font-size: 2.8rem; font-style: italic; color: #112F20; text-align: center; margin: 0; font-weight:400; animation: pulse 1.5s infinite;">Analyzing your relocation timeline...</h2></div>';
    document.body.appendChild(overlay);
    // Capture state immediately before app.js resets it!
    const quizState = typeof window.getQuizState === 'function' ? window.getQuizState() : {
        ratings: { status: 3, career: 8, finance: 8 },
        selectedFocus: 'status',
        selectedStep2: '',
        selectedStep3: '',
        selectedStep9: [],
        categories: ["Status", "Career", "Finance"]
    };

    // Step 1: Loading sequencer (4 phrases cycling in 2 seconds)
    const msgs = [
        "Analyzing your relocation timeline...",
        "Calculating global readiness indexes...",
        "Identifying bottleneck thresholds...",
        "Synthesizing customized roadmaps..."
    ];
    let i = 0;
    const loader = setInterval(() => {
        i++;
        if (i >= msgs.length) {
            clearInterval(loader);
        } else {
            const loadingText = document.getElementById('loading-text');
            if (loadingText) {
                loadingText.innerText = msgs[i];
            }
        }
    }, 500);

    setTimeout(() => {
        clearInterval(loader);
        renderMatchUI(overlay, quizState);
    }, 2000);
}

function makeProgressRingReveal(label, percentage, color, bg, border, textColor) {
    const r = 24;
    const circumference = 2 * Math.PI * r;
    return `
      <div class="progress-dial-card" style="background: ${bg}; border: 1px solid ${border}; border-radius: 16px; padding: 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); min-width: 100px; flex: 1;">
        <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: ${textColor}; letter-spacing: 0.08em; display: block;">${label}</span>
        <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
          <svg width="64" height="64" viewBox="0 0 64 64" style="transform: rotate(-90deg);">
            <circle cx="32" cy="32" r="${r}" stroke="rgba(0,0,0,0.04)" stroke-width="5" fill="transparent" />
            <circle cx="32" cy="32" r="${r}" stroke="${color}" stroke-width="5" fill="transparent"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
                    class="progress-ring-circle-reveal"
                    data-pct="${percentage}"
                    style="transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1); stroke-linecap: round;" />
          </svg>
          <span style="position: absolute; font-size: 1rem; font-family: 'Instrument Serif', serif; font-weight: 700; color: ${textColor};">${percentage}%</span>
        </div>
      </div>
    `;
}

function getMatchRationale(advisorId, selectedFocus, selectedStep9, selectedStep2) {
    if (advisorId === 'sarah') {
        if (selectedStep2 === 'visa') {
            return "Sarah is a licensed attorney who specializes in streamlining the exact visa process you need. She will run a complete analysis of your O-1/EB-2 NIW viability, audit legal costs, and draft a compliance-friendly timeline tailored for your relocation.";
        }
        if (selectedStep2 === 'family') {
            return "Sarah has successfully guided hundreds of families through the complex I-130 and consular processing maze. She will ensure your affidavits of support and bona fide relationship evidence are foolproof.";
        }
        return "Sarah will thoroughly review your current immigration status and draft a compliance-friendly, risk-mitigated timeline for your seamless relocation to the US.";
    }
    if (advisorId === 'hassan') {
        if (selectedStep2 === 'citizenship') {
            return "Hassan has 10+ years coaching clients specifically on the path to citizenship. He helps bridge your naturalization filing with strict continuous physical presence logs and intensive USCIS interview prep.";
        }
        return "Hassan helps bridge complex immigration filings with essential credit and tax optimization strategies, ensuring your transition covers both legal and financial bases.";
    }
    if (advisorId === 'elena') {
        if (selectedStep2 === 'asylum') {
            return "Elena successfully navigated asylum and refugee status transitions herself. She brings deep empathy, direct templates, and crucial community resource mapping to support your humanitarian relief case.";
        }
        return "Elena successfully navigated complex status transitions and has direct templates to share, offering you a structured pathway through difficult immigration hurdles.";
    }
    if (advisorId === 'david_chee') {
        if (selectedStep2 === 'family') {
            return "David Chee specializes exclusively in consular family sponsorship. He will rigorously verify your petition's affidavits of support and ensure your dependent visa coordination is perfectly aligned.";
        }
        return "David Chee specializes in consular family sponsorship and will meticulously verify your petition affidavits of support to prevent costly delays.";
    }
    if (advisorId === 'david') {
        if (selectedStep2 === 'find_job') {
            return "David K. is a former FAANG recruiter who knows exactly what sponsors look for. He will rebuild your resume to bypass strict ATS scanners and connect you with hidden employer networks that actively sponsor visas.";
        }
        if (selectedStep2 === 'interview') {
            return "David K. excels at interview preparation. He will run intensive mock behavioral loops using the STAR method and refine your personal branding to ensure you stand out in the local tech market.";
        }
        return "David K. specializes in mapping foreign CV profiles to local hiring requirements, ensuring your unique international experience becomes your biggest asset.";
    }
    if (advisorId === 'michael') {
        if (selectedStep2 === 'salary') {
            return "Michael has 15 years of experience negotiating top-tier compensation packages. He will provide localized benchmarking and counter-offer playbooks to ensure you don't leave money on the table.";
        }
        return "Michael will guide you on U.S. company formation, E-2/L-1 visa structures, and robust investor business plans to set your enterprise up for success.";
    }
    if (advisorId === 'aisha') {
        return "Aisha will map out your CPT/OPT work authorizations and navigate complex SEVIS rules, ensuring your academic transitions smoothly bridge into long-term career opportunities.";
    }
    if (advisorId === 'amanda') {
        if (selectedStep2 === 'investing') {
            return "Amanda is a Certified Financial Planner who specializes in helping expats secure mortgages without long local credit histories. She will architect a conflict-free wealth accumulation plan and navigate cross-border tax compliance for your new home.";
        }
        if (selectedStep2 === 'credit') {
            return "Amanda will outline a highly structured roadmap to establish and rapidly build your U.S. credit score from day one, leveraging alternative data reporting and secured credit strategies.";
        }
        return "Amanda will perform a complete financial health check and meticulously plan your expat double-taxation liabilities, ensuring your financial foundation is rock solid.";
    }
    if (advisorId === 'cloricea') {
        return "Cloey will provide essential mindfulness practices and holistic wellness strategies to help you handle transition-related anxiety and manage the complex life adaptation shifts of moving abroad.";
    }
    return "This expert advisor has been specifically matched to your profile to provide targeted support and actionable guidance for your relocation goals.";
}

async function renderMatchUI(overlay, capturedQuizState) {
    // Read actual quiz state from the window helper or passed state
    const quizState = capturedQuizState || (typeof window.getQuizState === 'function' ? window.getQuizState() : {
        ratings: { status: 3, career: 8, finance: 8 },
        selectedFocus: 'status',
        selectedStep2: '',
        selectedStep3: '',
        selectedStep9: [],
        categories: ["Status", "Career", "Finance"]
    });

    const ratings = quizState.ratings || { status: 3, career: 8, finance: 8 };
    const selectedFocus = quizState.selectedFocus || 'status';
    const selectedStep2 = quizState.selectedStep2 || '';
    const selectedStep9 = quizState.selectedStep9 || [];
    const categories = quizState.categories || ["Status", "Career", "Finance"];

    // Calculate actual lowest score bottleneck
    let bottleneck = selectedFocus || 'status';
    let lowestScore = ratings[bottleneck] || 0;
    
    // Only calculate lowest if the user actually provided ratings (e.g., > 0)
    if (ratings.status > 0 || ratings.career > 0 || ratings.finance > 0) {
        bottleneck = 'status';
        lowestScore = ratings.status;
        if (ratings.career < lowestScore) {
            lowestScore = ratings.career;
            bottleneck = 'career';
        }
        if (ratings.finance < lowestScore) {
            lowestScore = ratings.finance;
            bottleneck = 'finance';
        }
    }

    const displayBottleneck = bottleneck === 'status' ? categories[0] : bottleneck === 'career' ? categories[1] : categories[2];

    // Dials percentage (scale of 10)
    const pctStatus = (ratings.status || 3) * 10;
    const pctCareer = (ratings.career || 8) * 10;
    const pctFinance = (ratings.finance || 8) * 10;

    // Dynamic generation engine for match-reveal.js
    const goalNames = {
      visa: "Visa Prep & Documentation",
      family: "Family Reunification & Dependent Visas",
      citizenship: "Citizenship & Naturalization",
      asylum: "Asylum & Humanitarian Relief",
      hired: "Job Placement & Career Placement",
      business: "Expat Business & Entity Formation",
      credit: "Credit Building & Local Banking",
      investing: "Expat Mortgage Sourcing & Wealth Setup"
    };

    // Safely look up selectedStep10 (timeline)
    const timelineVal = (typeof selectedStep10 !== 'undefined' && selectedStep10) ? selectedStep10 : (window.selectedStep10 || "3-6 months");
    const targetGoal = goalNames[selectedStep2] || "your relocation setup";

    let stageDesignation = "Planning Stage";
    if (lowestScore >= 7) {
      stageDesignation = "Execution Stage";
    } else if (lowestScore >= 4) {
      stageDesignation = "Preparation Stage";
    }

    let findingsSentence1 = "";
    if (selectedFocus === 'status') {
      if (selectedStep2 === 'visa') {
        findingsSentence1 = `You are focusing on secure immigration status, specifically targetting visa preparation and paperwork. With a target relocation window of ${timelineVal}, you need to immediately address visa application eligibility and checklist compliance.`;
      } else if (selectedStep2 === 'family') {
        findingsSentence1 = `Your priority is reuniting with family members in your destination country. Your target timeline of ${timelineVal} means coordinating petitions and family visas must be handled with high precision to avoid consulate delays.`;
      } else if (selectedStep2 === 'citizenship') {
        findingsSentence1 = `You are on the path to naturalization and citizenship. Planning this transition within ${timelineVal} requires careful travel logging and continuous physical presence verification.`;
      } else {
        findingsSentence1 = `You are seeking humanitarian asylum status. Navigating these requirements within ${timelineVal} requires immediate connection to specialized legal aid and local resource networks.`;
      }
    } else if (selectedFocus === 'career') {
      if (selectedStep2 === 'hired') {
        findingsSentence1 = `You are aiming to land a job and secure sponsorship in your new destination. With a relocation timeline of ${timelineVal}, optimize your CV to pass local ATS filters and focus on sponsor-friendly employers.`;
      } else {
        findingsSentence1 = `You are establishing an expat business or entity. Formulating E-2/L-1 structures and setting up corporate banking within ${timelineVal} is critical for authorization viability.`;
      }
    } else { // finance
      if (selectedStep2 === 'credit') {
        findingsSentence1 = `You need to build local credit history and set up accounts from scratch. With a timeline of ${timelineVal}, leveraging global credit linkage and secured accounts must begin immediately.`;
      } else {
        findingsSentence1 = `You are planning property investment or cross-border mortgage qualification. Structuring your foreign income proof and asset disclosures within ${timelineVal} will prevent punitive penalties.`;
      }
    }

    let findingsSentence2 = "";
    if (lowestScore <= 3) {
      findingsSentence2 = `Your self-assessed readiness of ${lowestScore}/10 indicates major gaps in your roadmap. You are in the ${stageDesignation}, and immediate guidance is required to structure your next steps before your timeline is compromised.`;
    } else if (lowestScore <= 6) {
      findingsSentence2 = `Your self-assessed readiness of ${lowestScore}/10 places you in the ${stageDesignation}. While you have completed basic research, you have active bottlenecks in documentation and compliance that need expert validation.`;
    } else {
      findingsSentence2 = `Your self-assessed readiness of ${lowestScore}/10 indicates you are in the ${stageDesignation} with solid preparation. You are ready to run a final compliance audit on your files with a professional.`;
    }

    const strengthsText = `${findingsSentence1} ${findingsSentence2}`;

    // Strategic Recommendations list items
    const goalExplanationsLocal = {
      visa: { title: "Secure Visa & Route", desc: "EB-2 NIW, O-1, or H-1B eligibility rules and roadmap structure." },
      talent: { title: "Assess Extraordinary Ability Route", desc: "Map papers, articles, and credentials against O-1 / EB-1 criteria." },
      lawyer: { title: "Verify Legal Referrals", desc: "Expat-friendly immigration attorneys with verified track records." },
      nomad: { title: "Explore Remote Work Visas", desc: "Identify low-tax digital nomad options and residency rules." },
      translations: { title: "Official Translations & Records", desc: "Certified translations and records mapping for filing." },
      forms: { title: "Organize Application Files", desc: "Guidance on cover letters, history logs, and file templates." },
      family: { title: "Family & Dependent Relocation", desc: "Sponsor requirements and petition options for dependents." },
      tracking: { title: "Track Applications Without Errors", desc: "Filing timeline tools to prevent filing errors and delays." },
      greencard: { title: "Permanent Residency Strategy", desc: "Evaluate long-term green card pathways and stay rules." },
      presence: { title: "Compliance & Stay Audits", desc: "Audit stay logs and track entry-exit records to prevent issues." },
      audits: { title: "RFE & Document Audits", desc: "Evidentiary packages for audits, inquiries, or RFEs." },
      transition: { title: "Status Adjustments", desc: "Plan status adjustments without leaving the destination country." },
      resume: { title: "Resume Localization", desc: "Rebuild CV layout and buzzwords to pass local ATS screens." },
      linkedin: { title: "LinkedIn Optimization", desc: "Tailor online summary and keywords to trigger searches." },
      portfolio: { title: "Portfolio Refactoring", desc: "Shape projects to highlight business metrics local teams value." },
      requirements: { title: "Local Market Gap Review", desc: "Compare skills against active local job openings." },
      target_list: { title: "Target Company Pipeline", desc: "Filter and select 20 expat-friendly target companies." },
      recruiters: { title: "Recruiter Warm Outreach", desc: "Templates and lists to fast-track conversations." },
      outreach: { title: "Expat Professional Networking", desc: "Etiquette, warm messaging, and securing info chats." },
      meetups: { title: "Local Networking Strategy", desc: "Locate key industry meetups and conferences." },
      mock: { title: "FAANG & Corporate Mock Loops", desc: "Mock interviews under real pressure with feedback." },
      behavioral: { title: "Behavioral Playbooks", desc: "Craft STAR responses adapted to local hiring cultures." },
      negotiation: { title: "Salary & Offer Negotiation", desc: "Negotiation scripts to maximize base and equity." },
      benchmarks: { title: "Total Compensation Auditing", desc: "Audit salary benchmarks to avoid leaving money." },
      builder_card: { title: "Credit Builder Setup", desc: "Review zero-credit cards and secured lines." },
      foreign_link: { title: "Cross-Border Credit Linkage", desc: "Explore services to pull and link home country credit score." },
      monitor: { title: "Credit Score Tracking", desc: "Set up alert triggers and monitor utilization ratios." },
      utilization: { title: "Credit Utilization Management", desc: "Tailored ratios and alerts to optimize payment schedules." },
      open_checking: { title: "Expat Banking Audits", desc: "Expat-friendly checking and savings accounts." },
      cheap_transfers: { title: "International Wire Pipelines", desc: "Low-fee wire services to minimize forex conversion markups." },
      tax_id: { title: "Tax ID Applications (SSN/ITIN)", desc: "Document checkers to apply for local tax ID quickly." },
      utility_link: { title: "Utility Reporting Setup", desc: "Report rent and utilities history to double credit growth." },
      file_taxes: { title: "Dual-Status Tax Filings", desc: "Expat tax preparers for clean dual-status filings." },
      asset_report: { title: "Foreign Assets Disclosures (FBAR)", desc: "Map required FBAR/FATCA compliance forms." },
      mortgage: { title: "Expat Mortgage Qualification", desc: "Prepare checklists and map lenders for home buying." },
      investments: { title: "Cross-Border Wealth Setup", desc: "Safeguard assets, avoid double taxes, and set up local accounts." }
    };

    const categoryKeys = {
      status: ['visa', 'talent', 'lawyer', 'nomad', 'translations', 'forms', 'family', 'tracking', 'greencard', 'presence', 'audits', 'transition'],
      career: ['resume', 'linkedin', 'portfolio', 'requirements', 'target_list', 'recruiters', 'outreach', 'meetups', 'mock', 'behavioral', 'negotiation', 'benchmarks'],
      finance: ['builder_card', 'foreign_link', 'monitor', 'utilization', 'open_checking', 'cheap_transfers', 'tax_id', 'utility_link', 'file_taxes', 'asset_report', 'mortgage', 'investments']
    };

    const activeKeys = categoryKeys[selectedFocus || 'status'] || categoryKeys.status;
    const userSelectedKey = (selectedStep9 && selectedStep9[0]) ? selectedStep9[0] : activeKeys[0];
    
    const chosenKeys = [userSelectedKey];
    for (let k of activeKeys) {
      if (chosenKeys.length >= 4) break;
      if (!chosenKeys.includes(k)) {
        chosenKeys.push(k);
      }
    }

    const insights = chosenKeys.map(key => {
      const expl = goalExplanationsLocal[key] || { title: key, desc: "Custom strategic recommendation." };
      return `${expl.title} (${expl.desc})`;
    });

    let suggestSentence1 = "";
    if (selectedFocus === 'status') {
      suggestSentence1 = `Focus on compiling visa-specific compliance files. Your matched advisor can guide you on the exact government forms and timeline milestones required to secure your approval.`;
    } else if (selectedFocus === 'career') {
      suggestSentence1 = `Prioritize aligning your professional profile with the destination's local market standards. Your advisor will audit your profile to increase call-back rates and coach you on behavioral loops.`;
    } else {
      suggestSentence1 = `Leverage international credit transfer channels and expat-friendly bank accounts to establish your local footprint. Your advisor will design a step-by-step financial plan.`;
    }

    const primaryGoalTitle = (selectedStep9 && selectedStep9[0]) ? `${goalExplanationsLocal[selectedStep9[0]]?.title}` : "your relocation timeline";
    const suggestSentence2 = `We recommend starting with a detailed timeline review focusing on ${primaryGoalTitle} to ensure no compliance risks arise.`;

    const suggestionsText = `${suggestSentence1} ${suggestSentence2}`;

    const quotes = {
      status: {
        text: `Preparing our files for ${targetGoal} within ${timelineVal} required highly structured timelines. Our legal matched advisor prevented consular delays.`,
        author: "ELENA R., BRAZIL ➔ BOSTON"
      },
      career: {
        text: `Relocating and job hunting under ${timelineVal} timeline was challenging. Rebuilding my cross-border profile for local recruiters unlocked calls.`,
        author: "CHEN W., SINGAPORE ➔ AUSTIN"
      },
      finance: {
        text: `Setting up credit history and local checking inside ${timelineVal} saved us thousands. The transfer networks playbook made a huge impact.`,
        author: "SOPHIA M., LONDON ➔ NEW YORK"
      }
    };

    const quote = quotes[bottleneck] || quotes.status;
    const testimonialQuote = quote.text;
    const testimonialAuthor = quote.author;

    // Global Database of Advisors
    const advisorsList = [
        {
            id: 'sarah',
            name: "Sarah Jenkins, Esq.",
            title: "Licensed Immigration Attorney • 8 yrs exp",
            photo: "sarah_portrait.png",
            specialties: ["O-1 & H-1B", "Green Cards", "Visa Strategy"],
            rating: "4.9",
            reviews: "42",
            available: "Available Wed",
            category: "status"
        },
        {
            id: 'hassan',
            name: "Hassan Badoor",
            title: "Citizenship & Naturalization Specialist • 10 yrs exp",
            photo: "hassan_portrait.png",
            specialties: ["Citizenship", "Naturalization", "Immigration Law"],
            rating: "5.0",
            reviews: "56",
            available: "Available Thu",
            category: "status"
        },
        {
            id: 'elena',
            name: "Elena Ramirez",
            title: "Asylum & Refugee Specialist • 8 yrs exp",
            photo: "elena_portrait.png",
            specialties: ["Asylum", "Refugee", "Humanitarian"],
            rating: "4.9",
            reviews: "28",
            available: "Available Wed",
            category: "status"
        },
        {
            id: 'david_chee',
            name: "David Chee",
            title: "Family Reunification Expert • 6 yrs exp",
            photo: "david_chee_portrait.png",
            specialties: ["Family Visa", "Sponsorship", "Green Cards"],
            rating: "4.8",
            reviews: "31",
            available: "Available Wed",
            category: "status"
        },
        {
            id: 'david',
            name: "David K.",
            title: "Senior Tech Recruiter • 6 yrs exp",
            photo: "david_k_portrait.png",
            specialties: ["Resume Review", "Interview Prep", "FAANG Recruiting"],
            rating: "4.9",
            reviews: "45",
            available: "Available Mon",
            category: "career"
        },
        {
            id: 'michael',
            name: "Michael Vargas",
            title: "Business & Investment Visa Advisor • 15 yrs exp",
            photo: "michael_portrait.png",
            specialties: ["Investor Visas", "L-1 Transitions", "Startups"],
            rating: "5.0",
            reviews: "64",
            available: "Available Tue",
            category: "career"
        },
        {
            id: 'aisha',
            name: "Aisha Haddad",
            title: "Student & Academic Visa Advisor • 5 yrs exp",
            photo: "aisha_portrait.png",
            specialties: ["Student Visas", "OPT & CPT", "Status Maintenance"],
            rating: "4.8",
            reviews: "29",
            available: "Available Thu",
            category: "career"
        },
        {
            id: 'amanda',
            name: "Amanda W.",
            title: "Certified Financial Planner • 9 yrs exp",
            photo: "amanda_portrait.png",
            specialties: ["Credit Building", "Tax Planning", "Investing"],
            rating: "4.9",
            reviews: "37",
            available: "Available Fri",
            category: "finance"
        },
        {
            id: 'cloricea',
            name: "Cloricea (Cloey)",
            title: "Nutrition & Mental Health Advisor • 7 yrs exp",
            photo: "cloricea_portrait.png",
            specialties: ["Mental Health", "Nutrition", "Holistic Wellness"],
            rating: "4.9",
            reviews: "25",
            available: "Available Mon",
            category: "wellness"
        }
    ];

    // Determine 4 recommended advisors based on selectedFocus
    let recommendedIds = [];
    if (selectedFocus === 'status') {
        recommendedIds = ['sarah', 'hassan', 'elena', 'david_chee'];
    } else if (selectedFocus === 'career') {
        recommendedIds = ['david', 'michael', 'aisha', 'sarah'];
    } else if (selectedFocus === 'finance') {
        recommendedIds = ['amanda', 'michael', 'hassan', 'david_chee'];
    } else {
        recommendedIds = ['cloricea', 'sarah', 'david', 'amanda'];
    }
    const recommendedAdvisors = recommendedIds.map(id => advisorsList.find(a => a.id === id)).filter(Boolean);

    overlay.innerHTML = `
        <style>
            #match-reveal-overlay {
                background: #fcfbf9 !important;
                color: #111827;
                font-family: 'Inter', sans-serif;
            }
            .reveal-container {
                max-width: 1100px;
                width: 100%;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 40px;
            }
            .reveal-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 40px;
                width: 100%;
            }
            .reveal-left {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            .reveal-right {
                display: flex;
                flex-direction: column;
                gap: 24px;
                background: #fff;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                padding: 32px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            }
            @media (min-width: 1024px) {
                .reveal-grid {
                    grid-template-columns: repeat(12, 1fr);
                }
                .reveal-left {
                    grid-column: span 6;
                }
                .reveal-right {
                    grid-column: span 6;
                }
            }
            .reveal-header-label {
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                color: #d97706;
                letter-spacing: 0.08em;
                margin-bottom: 4px;
            }
            .reveal-title {
                font-family: 'Instrument Serif', serif;
                font-size: 3.2rem;
                font-style: italic;
                font-weight: 400;
                line-height: 1.15;
                color: #112F20;
                margin: 0;
            }
            .insight-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 14px 18px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
                display: flex;
                align-items: center;
                gap: 12px;
                box-sizing: border-box;
            }
            .insight-dot {
                width: 8px;
                height: 8px;
                background: #d97706;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .insight-text {
                font-size: 0.85rem;
                color: #374151;
                font-weight: 500;
                margin: 0;
            }
            .advisor-row-scroll-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                padding: 10px 4px 24px;
                width: 100%;
                box-sizing: border-box;
                justify-content: flex-start;
            }
            .outcome-section-title {
                font-family: 'Instrument Serif', serif;
                font-size: 2rem;
                font-weight: 400;
                color: #112F20;
                margin: 0 0 8px 0;
            }
            .outcome-section-desc {
                font-size: 0.9rem;
                color: #4b5563;
                line-height: 1.5;
                margin: 0 0 16px 0;
            }
            .next-step-list {
                margin: 0;
                padding-left: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .next-step-list li {
                font-size: 0.88rem;
                color: #374151;
                line-height: 1.45;
            }
            .next-step-list a {
                color: #112F20;
                text-decoration: underline;
                font-weight: 600;
                transition: color 0.2s;
            }
            .next-step-list a:hover {
                color: #10b981;
            }
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        </style>

        <div class="reveal-container">
            <!-- Top Section -->
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 8px;">
                <span class="reveal-header-label">Analysis Complete</span>
                <h1 class="reveal-title">Your custom pathway is ready.</h1>
            </div>

            <!-- Two Column Grid for Detailed Outcome (Teach-for-America style) -->
            <div class="reveal-grid">
                <!-- Left Column: Diagnostic Overview & Dials -->
                <div class="reveal-left">
                    <div>
                        <span class="reveal-header-label" style="color: #4b5563;">Relocation Assessment</span>
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: #112F20; margin: 8px 0 16px 0; line-height: 1.25;">
                            Your primary bottleneck is <span style="text-decoration: underline; text-decoration-color: #d97706;">${displayBottleneck}</span>.
                        </h2>
                        <p style="font-size: 0.9rem; color: #4b5563; line-height: 1.5; margin: 0 0 20px 0;">
                            Our system evaluated your onboarding profile and selected goals. Below are your dynamic category status dials and the top diagnostic insights.
                        </p>
                    </div>

                    <!-- circular progress rings with dynamic category labels -->
                    <div style="display: flex; gap: 12px; width: 100%; box-sizing: border-box;">
                        ${makeProgressRingReveal(categories[0] || 'Status', pctStatus, '#d97706', '#fffbeb', '#fde68a', '#b45309')}
                        ${makeProgressRingReveal(categories[1] || 'Career', pctCareer, '#10b981', '#f0fdf4', '#bbf7d0', '#15803d')}
                        ${makeProgressRingReveal(categories[2] || 'Finance', pctFinance, '#10b981', '#f0fdf4', '#bbf7d0', '#15803d')}
                    </div>

                    <!-- Expat Testimonial Quote -->
                    <div style="background: rgba(17, 47, 32, 0.03); border-left: 4px solid #112F20; padding: 18px 20px; border-radius: 12px; margin-top: 8px; box-sizing: border-box; border: 1px solid rgba(17, 47, 32, 0.05); border-left-width: 5px;">
                        <p style="font-size: 0.88rem; font-style: italic; color: #112F20; margin: 0 0 10px 0; line-height: 1.5; font-weight: 500;">
                            "${testimonialQuote}"
                        </p>
                        <span style="font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: block;">— ${testimonialAuthor}</span>
                    </div>

                    <!-- Qualitative Insights -->
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 16px;">
                        <h4 style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #4b5563; letter-spacing: 0.05em; margin: 0 0 4px 0;">Strategic Recommendations</h4>
                        ${insights.map(item => `
                            <div class="insight-card">
                                <div class="insight-dot"></div>
                                <p class="insight-text">${item}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Right Column: Personalized Outcome (Teach-for-America style) -->
                <div class="reveal-right">
                    <!-- Section 1: Our Findings -->
                    <div>
                        <h3 class="outcome-section-title">What We Found</h3>
                        <p class="outcome-section-desc">${strengthsText}</p>
                    </div>

                    <!-- Section 2: Career / Pathway Suggestions -->
                    <div>
                        <h3 class="outcome-section-title">Pathway Suggestions</h3>
                        <p class="outcome-section-desc">${suggestionsText}</p>
                    </div>

                    <!-- Section 3: Action Roadmap -->
                    <div>
                        <h3 class="outcome-section-title" style="margin-bottom: 16px;">Your Action Roadmap</h3>
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div style="display: flex; gap: 16px; align-items: flex-start;">
                                <div style="width: 28px; height: 28px; background: #112F20; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0; margin-top: 2px;">1</div>
                                <div>
                                    <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #112F20;">Book your 1-1 session</h5>
                                    <p style="margin: 0; font-size: 0.85rem; color: #4b5563; line-height: 1.4;">Select one of your matched advisors below to review your timeline and get immediate answers.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 16px; align-items: flex-start;">
                                <div style="width: 28px; height: 28px; background: #f3f4f6; color: #6b7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0; margin-top: 2px;">2</div>
                                <div>
                                    <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #112F20;">Complete your personalized workbook</h5>
                                    <p style="margin: 0; font-size: 0.85rem; color: #4b5563; line-height: 1.4;">Download the <a href="#" onclick="alert('Downloading Relocation Workbook...'); return false;" style="color: #10b981; text-decoration: none; font-weight: 600;">Expat Relocation Workbook</a> and fill out your baseline data.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 16px; align-items: flex-start;">
                                <div style="width: 28px; height: 28px; background: #f3f4f6; color: #6b7280; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0; margin-top: 2px;">3</div>
                                <div>
                                    <h5 style="margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #112F20;">Submit your documents for review</h5>
                                    <p style="margin: 0; font-size: 0.85rem; color: #4b5563; line-height: 1.4;">Upload your existing paperwork or resume to your secure portal for your advisor to audit.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Full-Width Curated Advisors Section -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; margin-top: 12px; width: 100%;">
                <div style="margin-bottom: 24px;">
                    <span class="reveal-header-label">Curated Expert Matching</span>
                    <h2 class="reveal-title" style="font-size: 2.5rem; margin-top: 6px; margin-bottom: 8px;">Suggested Advisor Matches</h2>
                    <p style="font-size: 0.92rem; color: #4b5563; line-height: 1.5; margin: 0; max-width: 800px;">
                        We've matched you with four expat advisors who specialize in resolving your specific <strong>${displayBottleneck}</strong> bottleneck. Select one to link with them and launch your personalized dashboard.
                    </p>
                </div>

                <!-- Horizontal scrolling row of advisor cards + See More card -->
                <div class="advisor-row-scroll-container">
                    ${recommendedAdvisors.map(advisor => {
                        const matchRationale = getMatchRationale(advisor.id, selectedFocus, selectedStep9, selectedStep2);
                        return `
                            <!-- Advisor Card -->
                            <div style="background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:16px; display:flex; flex-direction:column; box-shadow:0 4px 12px rgba(0,0,0,0.02); min-width:285px; max-width:285px; box-sizing:border-box; transition: transform 0.2s, box-shadow 0.2s; position:relative;" class="advisor-card-hover-effect">
                                <!-- Image wrapper -->
                                <div style="position:relative; width:100%; aspect-ratio:1.15; border-radius:12px; overflow:hidden; margin-bottom:12px; background:#f3f4f6;">
                                    <img src="${advisor.photo}" alt="${advisor.name}" style="width:100%; height:100%; object-fit:cover; display:block;" />
                                    <!-- Verified Badge overlay -->
                                    <div style="position:absolute; top:8px; right:8px; width:22px; height:22px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                                        <svg viewBox="0 0 24 24" fill="#10B981" style="width:14px; height:14px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                    </div>
                                    <!-- Availability Badge overlay -->
                                    <div style="position:absolute; bottom:8px; left:8px; background:#10B981; color:#fff; font-size:0.68rem; font-weight:700; padding:4px 8px; border-radius:6px; letter-spacing:0.02em;">
                                        ${advisor.available}
                                    </div>
                                </div>
                                <!-- Card Body -->
                                <h3 style="font-size:1.1rem; font-weight:700; color:#112F20; margin:0 0 4px 0; letter-spacing:-0.01em;">${advisor.name}</h3>
                                <p style="font-size:0.75rem; color:#6b7280; margin:0 0 10px 0; font-weight:500; line-height:1.2;">${advisor.title}</p>
                                
                                <!-- Tailored Match Rationale Block -->
                                <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px 12px; margin: 0 0 14px 0; box-sizing:border-box;">
                                    <strong style="font-size:0.68rem; color:#15803d; text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:2px; font-weight:800;">💡 Why you match specifically:</strong>
                                    <p style="font-size:0.75rem; color:#166534; line-height:1.35; margin:0; font-weight:500;">
                                        ${matchRationale}
                                    </p>
                                </div>
                                
                                <!-- Tag Badges -->
                                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px;">
                                    ${advisor.specialties.map(spec => `
                                        <span style="font-size:0.65rem; font-weight:600; color:#15803d; background:rgba(16,185,129,0.06); padding:4px 8px; border-radius:100px; border: 1px solid rgba(16,185,129,0.06);">${spec}</span>
                                    `).join('')}
                                </div>
                                <!-- Footer row -->
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:12px; border-top:1px solid #f3f4f6;">
                                    <div style="display:flex; align-items:center; gap:4px;">
                                        <span style="color:#d97706; font-size:0.85rem; line-height:1;">★</span>
                                        <span style="font-size:0.82rem; font-weight:700; color:#112F20;">${advisor.rating}</span>
                                        <span style="font-size:0.75rem; color:#6b7280;">(${advisor.reviews})</span>
                                    </div>
                                    <button class="confirm-btn" style="background:#f3f4f6; color:#112F20; border:none; font-size:0.75rem; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all 0.2s; margin-top:0;" onclick="dismissOverlay('${advisor.id}')">
                                        Book Session
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}

                    <!-- See More Card -->
                    <div style="background:#fcfbf9; border:2px dashed #cbd5e1; border-radius:16px; padding:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; min-width:260px; max-width:260px; box-sizing:border-box; cursor:pointer; transition: all 0.2s;" class="see-more-card" onclick="dismissOverlay('see-more')">
                        <div style="width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#fff; box-shadow:0 4px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#112F20" stroke-width="2.5" style="width:20px; height:20px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </div>
                        <span style="font-size:0.8rem; font-weight:800; color:#112F20; letter-spacing:0.08em; text-transform:uppercase;">See More</span>
                    </div>
                </div>

                <!-- Skip / Footer Actions -->
                <div style="text-align: center; margin-top: 12px;">
                    <a href="#" onclick="dismissOverlay('skip')" style="font-size: 0.9rem; color: #6b7280; text-decoration: none; font-weight: 600; cursor: pointer; border-bottom: 1px dashed #9ca3af; transition: color 0.2s;">
                        Skip guide selection for now
                    </a>
                </div>
            </div>
        </div>

        <script>
            // Hover transitions support inline
            const style = document.createElement('style');
            style.textContent = \`
                .advisor-card-hover-effect:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important;
                }
                .advisor-card-hover-effect .confirm-btn:hover {
                    background-color: #112F20 !important;
                    color: #fff !important;
                }
                .see-more-card:hover {
                    border-color: #112F20 !important;
                    background-color: #f7f6f4 !important;
                }
                .see-more-card:hover div {
                    background-color: #112F20 !important;
                }
                .see-more-card:hover div stroke {
                    stroke: #fff !important;
                }
                .see-more-card:hover svg {
                    stroke: #fff !important;
                }
            \`;
            document.head.appendChild(style);
        </script>
    `;

    // Animate circular progress rings
    setTimeout(() => {
        overlay.querySelectorAll('.progress-ring-circle-reveal').forEach(circle => {
            const pct = parseFloat(circle.getAttribute('data-pct'));
            const r = 24;
            const circumference = 2 * Math.PI * r;
            const offset = circumference - (pct / 100) * circumference;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = offset;
        });
    }, 50);
}

async function dismissOverlay(choice) {
    const overlay = document.getElementById('match-reveal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    let guideId = 'unassigned';
    
    if (choice === 'see-more') {
        // Redirect to full directory view
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(sec => {
            sec.classList.toggle('active', sec.id === 'directory');
        });
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-target') === 'directory');
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Re-enable navbar navigation
        const navbar = document.querySelector('.navbar');
        const subnav = document.getElementById('portal-sub-nav');
        if (navbar) navbar.style.display = '';
        if (subnav) subnav.style.display = '';
        return;
    }

    if (choice !== 'skip' && choice !== 'unassigned') {
        guideId = choice; // Sarah, Hassan, Elena, etc.
    }

    // Save selected guide & transition to dashboard
    if (typeof window.saveSelectedGuideAndHandoff === 'function') {
        await window.saveSelectedGuideAndHandoff(guideId);
    } else {
        // Fallback save in local storage & firestore
        if (window.auth && window.auth.currentUser) {
            const uid = window.auth.currentUser.uid;
            let localUsers = JSON.parse(localStorage.getItem('bridge_users') || '{}');
            if (localUsers[uid]) {
                localUsers[uid].activeGuide = guideId;
                localUsers[uid].updatedAt = new Date().toISOString();
                localStorage.setItem('bridge_users', JSON.stringify(localUsers));
            }
            if (window.db && typeof window.updateDoc === 'function' && typeof window.doc === 'function') {
                try {
                    const userDocRef = window.doc(window.db, 'users', uid);
                    await window.updateDoc(userDocRef, {
                        activeGuide: guideId,
                        updatedAt: new Date()
                    });
                } catch (err) {
                    console.warn("Firestore update failed in fallback dismissOverlay:", err);
                }
            }
        }
        
        // Re-enable navigation
        const navbar = document.querySelector('.navbar');
        const subnav = document.getElementById('portal-sub-nav');
        if (navbar) navbar.style.display = '';
        if (subnav) subnav.style.display = '';

        if (typeof window.updateHeaderNavActions === 'function' && window.auth && window.auth.currentUser) {
            window.updateHeaderNavActions(true, window.auth.currentUser);
        }

        // Transition views to results (Custom Pathway)
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(sec => {
            sec.classList.toggle('active', sec.id === 'results');
        });

        if (typeof window.renderResultsPage === 'function') {
            window.renderResultsPage();
        }
    }
}

// Expose globally
window.initMatchReveal = initMatchReveal;
window.renderMatchUI = renderMatchUI;
window.dismissOverlay = dismissOverlay;
