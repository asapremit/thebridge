# Architecture Blueprint & Rebuilding Specifications: C2 GPS Compliance Auditor

This document provides a comprehensive, production-grade specification for rebuilding the C2 GPS Compliance Auditor from scratch. It details the system architecture, core business rules, database schemas, prompting strategies, and front-end interface flows so that an automated code generation tool or engineering team can recreate it flawlessly.

1. System Overview & Purpose
The C2 GPS Compliance Auditor is an enterprise-grade Quality Assurance (QA) tool designed for Workforce Solutions programs. Its primary purpose is to eliminate human error, fraud, and audit exceptions in Individual Training Account (ITA) applications, Case Staffing Forms, and educational reports.
The application ingests multi-format documentation (PDFs and Images) across seven specific evidence slots, performs cross-document optical character recognition (OCR) and high-precision verification using generative AI, and provides a centralized QA dashboard with live remediation guidance and case-management integration.

2. Technical Stack & File Tree
Runtime & Build Configuration
* Core Library: React 19.2.4 (TypeScript-based Single Page Application)
* Build Tool: Vite 6.2.0 (bundled with @vitejs/plugin-react)
* AI SDK: Google GenAI @google/genai (v1.41.0)
* Styling: Tailwind CSS (loaded via CDN & localized index.css configuration)
* Icons: Direct inline SVG configurations for high performance and styling precision

Target File Tree
/
├── App.tsx                     # Main application layout and state coordinator
├── index.tsx                   # Core DOM mounting entry point
├── index.html                  # Standard HTML5 skeleton & CDN script declarations
├── types.ts                    # Global shared TypeScript schemas, enums, and types
├── metadata.json               # Platform configuration metadata
├── tsconfig.json               # TS compiler guidelines (bundler resolution, ES2022)
├── vite.config.ts              # Bundler and environment variable forwarding definitions
├── services/
│   └── geminiService.ts        # AI Client, TWC Master ETPL, and prompting services
└── components/
    ├── Header.tsx              # Application header with branding and environment monitor
    ├── FileSlot.tsx            # Interactive individual document upload slot
    ├── FileUploader.tsx        # Standard file drop area (modular component)
    ├── AuditView.tsx           # Multi-point audit analyzer viewport and findings panel
    └── ChatAssistant.tsx       # Contextual floating AI assistant

3. Data Models & Interface Schemas (types.ts)
To ensure type-safety across components and service layers, define these explicit TypeScript contracts:

export enum AuditStatus {
  APPROVED = 'Approved',
  FLAGGED = 'Flagged',
  PENDING = 'Pending'
}
export type SlotAuditStatus = 'pass' | 'fail' | 'warning' | 'pending';
export interface SlotAuditDetail {
  status: SlotAuditStatus;
  message: string;
}
export interface AuditResult {
  status: AuditStatus;
  integrity_score: number;
  errors: string[];
  missing_information: string[];
  passing_checks: string[];
  action_required: string;
  slot_results: Record<string, SlotAuditDetail>;
}
export type SlotType = 
  | 'career_cruising'
  | 'staff_form'
  | 'sustainability_plan'
  | 'casas_report'
  | 'training_agreement'
  | 'bid_letter'
  | 'ita_justification';
export interface DocumentSlot {
  id: SlotType;
  label: string;
  description: string;
  file: File | null;
  required: boolean;
}
export interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  url: string;
  preview: string;
}

4. Core Business Rules (The 6-Point Audit Checklist)
The application validates the completeness and logic of the case files using six strict compliance pillars. The AI engine must evaluate all uploaded documents together against these rules:
1. Statewide ETPL Matching: The Training Provider listed on the Bid Letter or ITA Justification must exist on the Master Texas Eligible Training Provider List (ETPL) (e.g. Alamo Community College, TSTC, etc.). The checker must resolve common abbreviations (e.g., matching "TCC" to "Tarrant County College").
2. Identity Matching: The Customer Name and the TWIST ID (Texas Work-In-Texas database identifier, usually an 8-digit integer like 15787819) must be perfectly identical across every single document containing client metadata.
3. Logical Date Matching: The Planned Start Date specified on the Classroom Training Agreement must align perfectly with the dates indicated in the Bid Letter (invoice) and the ITA Justification counselor logs.
4. Career Path Goal Matching: The Occupational Goal (e.g., "Cloud Engineering", "Registered Nurse") written in the Case Staffing Form must match the recommended careers identified in the Career Cruising Matchmaker & Portfolio results.
5. Financial Sustainability Math: The monthly financial analysis on the Plan of Sustainability must mathematically prove that the client's Monthly Income is greater than or equal to Monthly Expenses (Income >= Expenses).
6. CASAS Score Verification: The standard educational scores reported on the CASAS Individual Skills Profile (ISP) document must match the manual score transcriptions recorded on the Case Staffing Form.

5. Service & AI Integration (services/geminiService.ts)
This layer initializes the Gemini SDK, formats files into generative inline parts, hosts the Statewide ETPL database, and manages structured prompt payloads.

Conversion of Files to Base64
Before sending files to the Gemini API, read them locally as Data URLs, extracting the raw Base64 contents:
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

The Compliance Audit Prompt
Execute a generateContent call using the gemini-3-pro-preview model. Provide the system instructions, the MASTER_ETPL_LIST (an array of ~100 official Texas training schools), and the base64-encoded files.
Enforce a strict JSON response schema matching the AuditResult interface:
const prompt = `
  You are the C2 GPS Compliance Auditor. Your role is a high-precision QA expert for Workforce Solutions.
  
  CORE VALIDATION DATA (Expanded Statewide ETPL):
  You MUST verify that the Training Provider name found on the "Bid Letter" or "ITA Justification" is an exact or functionally identical match to one of the following providers in our master database:
  [Insert MASTER_ETPL_LIST]
  
  Note: Handle common abbreviations (e.g., "TCC" for "Tarrant County College").
  
  AUDIT REQUIREMENTS:
  1. ETPL MATCHING: Extract the Training Provider name. If it is NOT in the Master ETPL list, FLAG IT.
  2. IDENTITY: Verify "Customer Name" and "TWIST ID" (e.g., 15787819) are identical across ALL documents.
  3. LOGIC & DATES: Ensure the "Planned Start Date" on the Training Agreement matches the Bid Letter/ITA Justification.
  4. CAREER MATCH: Verify "Occupational Goal" on the Staff Form matches the "Career Matchmaker Results" from Career Cruising.
  5. MATH: Verify sustainability (Income >= Expenses) on the Plan of Sustainability.
  6. CASAS: Verify that CASAS ISP report scores match those recorded on the Staffing form.
  
  Respond STRICTLY in JSON format matching the requested schema.
`;

The Compliance Chat Session
To support interactive QA, initialize a multi-turn chat session pre-loaded with the current audit's status, score, and errors. Program the assistant to act as a supportive QA expert who suggests concrete remediation actions (e.g., "obtain caseworker signatures", "verify CASAS transcription").
Formatting rule: Clean all markdown headers (#, ##, **) dynamically from the bot responses before rendering to preserve a clean UI.

6. Frontend Component Architecture
A. The Master Layout (App.tsx)
Coordinates global client states: isAnalyzing (boolean), slots (array of DocumentSlot), and auditResult (object).
File Upload Behavior: When a file is added to a slot, set the state and clear any active auditResult to enforce re-audit on file modifications.
Progress Tracking: Calculate the ratio of uploaded files to total files as a percentage and show it in a smooth, glow-accented CSS linear indicator.
Dual Column Grid Layout: Responsive grid: 5-column width on large screens for uploading, and 7-column width for the dynamic audit findings viewport.

B. Header Component (components/Header.tsx)
Sticky backdrop navigation bar.
C2 Logo Loader: Loads a high-contrast logo via a direct URL. If loading fails, it dynamically catches the error and generates an elegant blue icon block with "C2" typography.
Environment Monitor: Displays a live green pulse animation indicating that the system is fully operational.

C. File Slot Panel (components/FileSlot.tsx)
Each document upload slot operates like an isolated sandbox:
Uploading Simulator: When a file is selected, show an isolated reading progress bar that animates from 0% to 100% using randomized increments at 80ms intervals. This provides rich, low-latency visual feedback.
Aesthetic State Variations: Transition borders and background colors according to the file state:
Empty: Dashed slate border, changing to blue on hover.
Uploading: Soft blue glow and active reading meter.
Passed: Solid green border and white checkmark emblem.
Flagged (Failed): Alert-red boundary with a cross emblem and custom error message text.
Warning (Gap): Soft amber alert container.

D. Audit Viewport (components/AuditView.tsx)
Displays analysis states and structures findings:
Loading Steps Sequence: To represent a deep analytical process, the component cycles through eight specific OCR and logic validation messages (e.g., Identity checking, sustainability checking) at 2.8-second intervals.
Findings Triage: Results are split into three responsive boards:
Green (Validated Compliance): List of successfully matching rules.
Red (Verification Errors): Discrepancies and TWIST inconsistencies.
Amber (Missing Gaps): Omitted signatures, blank dates, or optional files.
Actionable Remediation Parser: The AI-generated "Action Required" string is parsed using a regex splitting function. It strips bullet markers, isolates numbered or newline-separated items, and outputs them as a styled, sequential checklist with custom counter tokens.
Administrative Override System: If an audit contains red flags, the user cannot transmit findings unless they check an Administrative Bypass agreement. This forces accountability before letting them click "Transmit Final Data" to send findings to the regional database.

E. Floating Compliance Chatbot (components/ChatAssistant.tsx)
A floating widget containing a contextual chatbot:
Immediate Feedback Loop: To ensure non-blocking feedback, the moment the user hits send, the UI inserts the message and generates a soft-purple status bubble reading: "I've received your question and am working on the best answers for you...".
Streaming Content: The bot uses sendMessageStream to fetch chunks of the AI's response in real-time, progressively replacing the temporary status message with the streamed output.

7. Rebuilding Verification Plan
To verify a successful rebuild, perform the following validation protocol:
Linter Verification: Execute npm run lint or call the lint_applet tool to confirm there are no unresolved types or syntax issues in /types.ts or /services/geminiService.ts.
Compilation Check: Compile the single page application via Vite using the compile_applet tool. Ensure that all TSX assets resolve correctly and build files are generated in dist/.
Cross-Document Mock Verification: Verify compliance behavior by testing documents with mismatched TWIST IDs or high monthly expenses. The system should transition to Flagged, lower the integrity score below 80, present red alert containers in /components/AuditView.tsx, and require administrative checkbox bypass authorization before enabling the submit button.
