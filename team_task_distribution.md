# UCRIX Scam Away AI: Detailed Team Task Distribution

To ensure everyone knows exactly what to do without getting lost in "big ideas," here is a highly specific, step-by-step breakdown of tasks for each team member. 

---

## 👨‍💻 Member 1: Lead Developer (You)
**Role:** Core Architecture & Complex Logic

**Specific Coding Tasks:**
1.  **Project Setup:** Initialize the Vite + React app, set up routing (`react-router-dom`), and ensure everyone can clone the repo and run `npm run dev`.
2.  **State Management:** Create a React Context (or use Zustand/Redux) to hold global state, like the current "Risk Score" and the global "Blacklist".
3.  **Core Risk Engine (`src/utils/rulesEngine.js`):** Write the JavaScript functions that take in text and return a risk score (0-100) based on keywords.
4.  **Component Integration:** Take the isolated components built by Members 2, 3, and 4 and wire them together so data flows correctly between them.

---

## 🎨 Member 2: Frontend Developer & Content 
**Role:** Build the educational UI and user input forms.

**Specific Coding Tasks:**
1.  **Build `ReportModal.jsx` (Scam Reporting Form):** Create a popup modal form where users can submit new scams to the community. Include a text area for the scam message, a dropdown for the category (Phishing, Job, etc.), and a 'Submit' button.
2.  **Build Demo Presets UI:** Code a set of "Quick Test" buttons on the main scanner page (e.g., "Test Fake Pos Laju Text", "Test Safe Text"). When clicked, these buttons should automatically fill the scanner input. This will make your live presentation much smoother!
3.  **Build `KnowledgeCentre.jsx`:** Create a static page layout using CSS Grid/Flexbox to display "Cheat Sheets" for different scams.
4.  **Build the Quiz Component:** Code an interactive React component that shows a text message scenario and just **two buttons: "Safe" and "Scam"**. When the user clicks, it reveals if they were correct and updates their score.

**Specific Content Tasks (Non-Coding):**
1.  **Curate Cheat Sheets:** Write 3 short paragraphs explaining common Malaysian scams (e.g., LHDN Tax Scam, Pos Laju Parcel Scam, Telegram Job Scam). Save this as a text document for the team.
2.  **Write Quiz Scenarios:** Create 5 text scenarios for the "Spot the Scam" quiz (e.g., "Scenario 1: You receive an SMS saying your parcel is stuck at customs, click here to pay RM5. -> Answer: Scam").

---

## 📊 Member 3: Data Engineer & Dashboard Developer
**Role:** Handle data logic, build the admin dashboards, and write the technical report.

**Specific Coding Tasks (Expanded):**
1.  **Build `ModeratorDashboard.jsx` (New Coding Task):** This is a heavy logic component. You will build the interface where admins review submitted reports. Write the JavaScript logic (using `.map()` and `.filter()`) to display a list of "Pending Reports", and create "Approve" and "Reject" buttons that remove the item from the queue and move it to a "Confirmed Blacklist" array.
2.  **Build `TrendsDashboard.jsx`:** Use a charting library (like `recharts` which is in your `package.json`) to create a simple Bar Chart showing "Scams by Category" using the data from the reports.
3.  **Create `mockData.json`:** Write a JSON file containing at least 10 fake scam reports to populate the Moderator Dashboard so it looks active during the demo. Example structure:
    ```json
    [ { "id": 1, "type": "phishing", "text": "Click here for LHDN refund", "status": "pending" } ]
    ```
4.  **Mock Blacklist:** Create an array of fake "blacklisted" phone numbers in a JavaScript file that Member 1 can use for the rules engine.

**Specific Documentation Tasks (Non-Coding):**
1.  **Write "System Architecture" Section:** Write a 1-page document explaining how the React frontend talks to the `rulesEngine.js`. 
2.  **Write "Data Flow" Section:** Explain how user input moves from the scanner to the risk result screen. (Use the diagram provided in `implementation.md` as a guide).

---

## 🔊 Member 4: Accessibility Developer & Presentation Lead
**Role:** Implement "Elderly Mode" and design the final pitch.

**Specific Coding Tasks:**
1.  **Code "Elderly Mode" Logic:** Add a toggle button in the UI. When clicked, it should add a CSS class (e.g., `className="elderly-mode"`) to the main `<body>` tag. Write the CSS to make fonts larger when that class is active.
2.  **Implement Text-to-Speech:** Research the built-in browser API called `Web Speech API`. Write a small JavaScript helper function like this:
    ```javascript
    function speakRiskResult(text) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    ```
    Attach this function to a "Read Aloud" button on the results screen.

**Specific Presentation Tasks (Non-Coding):**
1.  **Create the Pitch Deck (PowerPoint/Canva):** Follow this exact slide structure:
    *   Slide 1: Title & Tagline
    *   Slide 2: The Problem (Scams in Malaysia)
    *   Slide 3: **Our SDG Impact (Crucial for competition - clearly list SDGs 4, 9, 10, 16 here)**
    *   Slide 4: Solution Overview (Scam Away AI)
    *   Slide 5: Live Demo Time
2.  **Write the Demo Script:** Write down exactly what the team will say and do during the live demo (e.g., "First, I will scan this fake PosLaju SMS... notice how the risk score turns red...").
3.  **Write "Business Value" Section:** For the final report, write a 1-page document explaining why this project is important for society and how it aligns with the SDGs.
