// Import the existing Firebase instance
import { db } from "./firebase.js";
import { doc, setDoc, getDoc, updateDoc, increment, arrayUnion, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const today = new Date().toISOString().split('T')[0]; // ✅ Define once and reuse

function checkForExistingSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (courseCode && sessionNumber) {
        console.log(`🔹 Course detected in URL: ${courseCode}, Session: ${sessionNumber}`);

        // Hide course setup form (for participants)
        const courseSetup = document.getElementById("course-setup");
        if (courseSetup) {
            courseSetup.style.display = "none"; 
            console.log("✅ Course setup hidden for participant view.");
        }

        // Show game area
        const gameArea = document.getElementById("game-area");
        if (gameArea) {
            gameArea.style.display = "flex";
            console.log("✅ Game area displayed.");
        }

        // Update the title
        const courseTitleElement = document.getElementById("course-title");
        if (courseTitleElement) {
            courseTitleElement.textContent = `Course Session: ${courseCode} (Session ${sessionNumber})`;
            courseTitleElement.classList.remove("hidden");
        }

        // ✅ Mark participant view in sessionStorage (Prevents them from seeing setup on reload)
        sessionStorage.setItem("isParticipant", "true");

        // ✅ Ensure Firestore initializes properly
        initializeSecondQuestionAnswers();  
        ensureStatsDocumentExists();  
    } else {
        console.log("ℹ️ No course session found in URL.");
    }
}
checkForExistingSession(); // ✅ Run it immediately

document.addEventListener("DOMContentLoaded", function () {
    // If participant, ensure setup stays hidden
    if (sessionStorage.getItem("isParticipant") === "true") {
        const courseSetup = document.getElementById("course-setup");
        if (courseSetup) {
            courseSetup.style.display = "none";
        }
    }

    // ✅ Hide statistics button for non-organisers
    const isOrganiser = sessionStorage.getItem("isOrganiser");
    const statsContainer = document.getElementById("stats-container");

    if (statsContainer) {
        if (isOrganiser === "true") {
            console.log("✅ Organiser detected: Showing statistics button.");
            statsContainer.style.display = "block";
        } else {
            console.log("👤 User view: Hiding statistics button.");
            statsContainer.style.display = "none";
        }
    }
});



async function ensureStatsDocumentExists() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot create document.");
        return;
    }

    // ✅ Define statsRef only once inside the function
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        const docSnap = await getDoc(statsRef);
        if (!docSnap.exists()) {
            await setDoc(statsRef, { 
                firstQuestionResponses: 0, 
                rawScores: [], 
                secondQuestionAnswers: {}, 
                secondQuestionResponses: 0,
                trackedThisSession: false,
                trackedSubmission: false
            });            
            console.log(`✅ Created new stats document ONCE for ${courseCode} - Session ${sessionNumber}`);
        }
    } catch (error) {
        console.error("❌ Firestore Write Error: Could not create document", error);
    }
}


// Function to toggle statistics panel visibility
window.toggleStatistics = function () {
    const statsDiv = document.getElementById("statsContainer");
    const statsButton = document.getElementById("toggle-stats");

    if (!statsDiv || !statsButton) {
        console.error("❌ Missing elements for statistics panel.");
        return;
    }

    if (statsDiv.classList.contains("hidden")) {
        statsDiv.classList.remove("hidden");
        statsDiv.style.display = "block"; // Ensure it shows up properly
        statsButton.textContent = "Hide Statistics";
        console.log("✅ Statistics panel is now visible.");
        updateStatisticsDisplay();  
    } else {
        statsDiv.classList.add("hidden");
        statsDiv.style.display = "none"; // Prevent it from interfering
        statsButton.textContent = "View Statistics";
        console.log("✅ Statistics panel is now hidden.");
    }
};

function updateSessionSelection() {
    const selectedSessions = [...document.querySelectorAll(".session-checkboxes input:checked")]
        .map(input => parseInt(input.value, 10));

    console.log("✅ Selected Sessions:", selectedSessions); // ✅ Debugging added

    loadStatistics(selectedSessions);
}

// ✅ Ensure it runs when a checkbox is toggled
document.querySelectorAll(".session-checkboxes input").forEach(input => {
    input.addEventListener("change", updateSessionSelection);
});


// ✅ Ensure it is globally accessible
window.updateSessionSelection = updateSessionSelection;


function switchTab(tabName) {
    document.querySelectorAll(".stats-panel").forEach(panel => panel.classList.remove("active"));
    document.querySelectorAll(".tab-button").forEach(button => button.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    document.querySelector(`[data-tab='${tabName}']`).classList.add("active");

    if (tabName === "raw-scores") {
        loadRawScoresChart();
    } else if (tabName === "question2") {
        loadQuestion2Chart();
    } else if (tabName === "word-cloud") {
        loadWordCloud();
    }
}


window.switchTab = switchTab;

// Function to allow drop
function allowDrop(event) {
    event.preventDefault(); // Always allow dropping
}
window.allowDrop = allowDrop;

// Function to handle drag event
function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}
window.drag = drag; // ✅ Attach to window immediately


// Function to handle drop event
function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    let dropTarget = event.target;

    console.log("Attempting to drop:", draggedElement ? draggedElement.id : "null", "into", dropTarget ? dropTarget.id : "null");

    if (!draggedElement || !dropTarget) {
        console.warn("Drop event failed: draggedElement or dropTarget is null.");
        return;
    }

    // Ensure the dropTarget is a valid drop zone
    if (dropTarget.classList.contains("text-box") || 
        dropTarget.classList.contains("quarter") || 
        dropTarget.parentElement.classList.contains("quarter")) {

        if (!dropTarget.classList.contains("quarter") && dropTarget.parentElement.classList.contains("quarter")) {
            dropTarget = dropTarget.parentElement;
        }

        console.log("Valid drop zone detected:", dropTarget.id);

        // Get the correct draggables container
        const draggablesContainer = document.getElementById('draggable-container');
        if (!draggablesContainer) {
            console.error("draggable-container not found! Ensure it exists in the HTML.");
            return;
        }

        // Check if the drop target already has a draggable inside (both for text-boxes and quarters)
        const existingDraggable = dropTarget.querySelector('.draggable');
        if (existingDraggable) {
            console.log("Existing draggable found:", existingDraggable.id, "- Moving it back to the draggables container");

            // Reset rotation before returning to draggable-container
            existingDraggable.style.transform = "rotate(0deg)";

            // Remove it from the drop zone before appending
            existingDraggable.remove();

            // Append to draggable-container
            draggablesContainer.appendChild(existingDraggable);

            // Ensure it remains draggable
            existingDraggable.setAttribute('draggable', 'true');
            existingDraggable.addEventListener('dragstart', drag);
        }

        // Append the new draggable to the drop target
        dropTarget.appendChild(draggedElement);
        console.log("New draggable placed:", draggedElement.id, "in", dropTarget.id);

        // Adjust rotation for quarter zones
        if (dropTarget.id === "quarter2") {
            draggedElement.style.transform = "rotate(-90deg)";
        } else if (dropTarget.id === "quarter3") {
            draggedElement.style.transform = "rotate(180deg)";
        } else if (dropTarget.id === "quarter4") {
            draggedElement.style.transform = "rotate(90deg)";
        } else {
            draggedElement.style.transform = "rotate(0deg"; // Ensure no rotation for text-boxes
        }
    } else {
        console.warn("Invalid drop target:", dropTarget.id);
    }

    checkSubmitButtonState();
}
window.drop = drop;

// Function to check the state of the submit button
function checkSubmitButtonState() {
    const dropZones = document.querySelectorAll('.text-box, .quarter');
    let hasDraggable = false;

    dropZones.forEach(zone => {
        // Check if the zone contains at least one draggable element
        const draggableChild = Array.from(zone.children).some(child => child.classList.contains('draggable'));
        if (draggableChild) {
            hasDraggable = true;
        }
        console.log(`Checking zone: ${zone.id}, Has draggable: ${draggableChild}`);
    });

    // Enable or disable the submit button based on presence of draggables
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = !hasDraggable;
}

let correctAnswersCount = 0;
let incorrectGuesses = [];
let finalQuestionResponse = '';

// ✅ Function to handle correct answers in the game
function trackCorrectAnswer(element) {
    if (!element || !(element instanceof HTMLElement)) {
        console.warn("⚠️ trackCorrectAnswer called with an invalid element:", element);
        return;
    }

    // ✅ Add the 'correct' class to visually indicate correctness
    element.classList.add("correct");
    element.classList.remove("incorrect");

    console.log(`✅ Marked ${element.id} as correct.`);
}


// ✅ Make it globally accessible
window.trackCorrectAnswer = trackCorrectAnswer;



// Function to check answers
async function checkAnswers() {
    await ensureStatsDocumentExists();  // ✅ Ensures the document is created ONCE

    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.error("❌ Error: courseCode or sessionNumber is missing.");
        return;
    }

    // ✅ Define statsRef only once inside the function
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        await updateDoc(statsRef, {
            firstQuestionResponses: increment(1)
        });

        console.log(`✅ Firestore updated: +1 first question response for ${courseCode} - ${sessionNumber}`);

    } catch (error) {
        console.error("❌ Firestore Update Error:", error);
    }

    const correctAnswers = {
        box1: 'word17', // Aim
        box2: 'word3',  // Measure
        box3: 'word9',  // Change Ideas
        quarter1: 'word11', // Plan
        quarter2: 'word6',  // Do
        quarter3: 'word10', // Study
        quarter4: 'word20'  // Act
    };

    const answerLabels = {
        word17: 'Aim',
        word3: 'Measure',
        word9: 'Change Ideas',
        word11: 'Plan',
        word6: 'Do',
        word10: 'Study',
        word20: 'Act'
    };

    function applyRotation(quarterId, element) {
        if (quarterId === "quarter2") {
            element.style.transform = "rotate(-90deg)";
        } else if (quarterId === "quarter3") {
            element.style.transform = "rotate(180deg)";
        } else if (quarterId === "quarter4") {
            element.style.transform = "rotate(90deg)";
        } else {
            element.style.transform = "rotate(0deg)";
        }
    }

    let correctCount = 0;
    let incorrectWords = [];

    Object.keys(correctAnswers).forEach(zoneId => {
        const zone = document.getElementById(zoneId);
        if (!zone) {
            console.warn(`Zone with ID ${zoneId} not found.`);
            return;
        }

        Array.from(zone.querySelectorAll('.correction-container')).forEach(correction => correction.remove());

        const draggableChild = zone.querySelector('.draggable');

        if (draggableChild && draggableChild.id === correctAnswers[zoneId]) {
            correctCount++;
        } else if (draggableChild) {
            incorrectWords.push(draggableChild.textContent);  

            zone.classList.add("incorrect-box");

            draggableChild.classList.add("incorrect-draggable");

            const correctionContainer = document.createElement('div');
            correctionContainer.classList.add('correction-container');

            const correctionText = document.createElement('div');
            correctionText.classList.add('correction-text');
            correctionText.textContent = `Correct: ${answerLabels[correctAnswers[zoneId]] || 'Unknown'}`;
            
            // ✅ Apply rotation for corrections inside quarters
            if (zone.classList.contains('quarter')) {
                applyRotation(zoneId, correctionText);
            }
            
            correctionContainer.appendChild(correctionText);
            zone.appendChild(correctionContainer);
        }
    });

    try {
        await updateDoc(statsRef, {
            firstQuestionResponses: increment(1)  
        });

        console.log(`✅ Updated Firestore: +1 first question response.`);

        await storeRawScore(correctCount);

        if (incorrectWords.length > 0) {
            let incorrectUpdate = {};
            incorrectWords.forEach(word => {
                incorrectUpdate[`incorrectGuesses.${word}`] = increment(1);
            });

            await updateDoc(statsRef, incorrectUpdate);
        }

    } catch (error) {
        console.error("❌ Firestore Update Error:", error);
    }

    // ✅ Hide initial instructions
    document.getElementById('initial-instructions').classList.add('hidden');

    // ✅ Show next instructions
    const nextInstructions = document.getElementById('next-instructions');
    nextInstructions.classList.remove('hidden');
    nextInstructions.classList.add('visible');
    nextInstructions.style.display = 'block'; 

    // ✅ Show "Next Question" button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.classList.remove('hidden');
    nextQuestionButton.classList.add('visible');
    nextQuestionButton.style.display = 'inline-block'; 

    // ✅ Disable & hide Submit button after clicking
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.classList.add('hidden'); 
}
    
window.checkAnswers = checkAnswers;


// Function to handle the final question
function nextQuestion() {
    // Reset the game area
    const correctAnswers = {
        box1: 'Aim',
        box2: 'Measure',
        box3: 'Change Ideas',
        quarter1: 'Plan',
        quarter2: 'Do',
        quarter3: 'Study',
        quarter4: 'Act'
    };

    const zones = document.querySelectorAll('.text-box, .quarter');
    
    zones.forEach(zone => {
        // ✅ Reset background to lime green
        zone.style.backgroundColor = '#BCCF04';
    
        // ✅ Remove all correction elements
        Array.from(zone.querySelectorAll('.correction-container')).forEach(correction => correction.remove());

        // ✅ Remove all non-arrow child elements
        Array.from(zone.children).forEach(child => {
            if (!child.classList.contains('arrow')) {
                zone.removeChild(child);
            }
        });

        // ✅ Clear any existing text content
        zone.textContent = ''; 

        // ✅ Add the correct answer text
        const answerText = document.createElement('span');
        answerText.textContent = correctAnswers[zone.id] || '';
        answerText.style.textAlign = 'center';
        zone.appendChild(answerText);

        // ✅ Ensure arrows are re-added in all quarters
        if (zone.classList.contains('quarter') && !zone.querySelector('.arrow')) {
            const arrow = document.createElement('div');
            arrow.classList.add('arrow');
            if (zone.id === 'quarter1') arrow.id = 'arrow1';
            if (zone.id === 'quarter2') arrow.id = 'arrow2';
            if (zone.id === 'quarter3') arrow.id = 'arrow3';
            if (zone.id === 'quarter4') arrow.id = 'arrow4';
            zone.appendChild(arrow);
        }
    });

    // ✅ Hide previous game elements
    document.getElementById('instructions-container').classList.add('hidden');
    document.getElementById('draggable-container').classList.add('hidden');
    document.getElementById('submit-button').classList.add('hidden');
    document.getElementById('next-question-button').classList.add('hidden');

    // ✅ Show the final question
    const finalQuestionContainer = document.getElementById('final-question-container');
    finalQuestionContainer.style.display = 'block'; 
    finalQuestionContainer.classList.remove('hidden');
    finalQuestionContainer.classList.add('visible');

    // ✅ Ensure the final submit button is disabled initially
    const finalSubmitButton = document.getElementById('final-submit-button');
    finalSubmitButton.disabled = true;
}

window.nextQuestion = nextQuestion;


let selectedFinalOption = null; // Track the selected answer
window.nextQuestion = nextQuestion;

function selectFinalOption(option) {
    // Deselect any previously selected option
    if (selectedFinalOption) {
        selectedFinalOption.classList.remove('selected');
    }

    // Select the clicked option
    option.classList.add('selected');
    selectedFinalOption = option;

    // Enable the submit button
    const submitButton = document.getElementById('final-submit-button');
    submitButton.disabled = false;
}
window.selectFinalOption = selectFinalOption;

function submitFinalAnswer() {
    // Disable the submit button
    const submitButton = document.getElementById('final-submit-button');
    submitButton.disabled = true;

    // Keep the selected option pink and make unselected options teal
    const options = document.querySelectorAll('.final-option');
    options.forEach(option => {
        if (option === selectedFinalOption) {
            option.style.backgroundColor = '#E6007E'; // Pink for the chosen answer
        } else {
            option.style.backgroundColor = '#14a19a'; // Teal for unchosen answers
        }
    });

    console.log('Final answer submitted:', selectedFinalOption.textContent);
    trackSecondQuestionAnswer(selectedFinalOption.textContent); // Track second question answer
}
window.submitFinalAnswer = submitFinalAnswer;


// Function to track Incorrect Guesses
async function trackIncorrectGuess(guess) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot log data.");
        return;
    }

    // ✅ Define statsRef only once inside the function
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        const docSnap = await getDoc(statsRef);
        let data = docSnap.exists() ? docSnap.data() : {};

        if (!docSnap.exists()) {
            await setDoc(statsRef, { incorrectGuesses: {} });
            console.log(`✅ Created new stats document for ${courseCode} - Session ${sessionNumber}`);
        }

        let incorrectGuesses = data.incorrectGuesses || {};

        // ✅ Increase the count for this incorrect guess
        incorrectGuesses[guess] = (incorrectGuesses[guess] || 0) + 1;

        await updateDoc(statsRef, { 
            incorrectGuesses: incorrectGuesses // ✅ Store updated incorrect guesses
        });

        console.log(`✅ Tracked incorrect guess: "${guess}" - now guessed ${incorrectGuesses[guess]} times.`);
    } catch (error) {
        console.error("❌ Firestore Write Error:", error);
    }
}

window.trackIncorrectGuess = trackIncorrectGuess;


// Add a function to store the final score in Firestore
async function storeRawScore(finalScore) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot log data.");
        return;
    }

    // ✅ Define statsRef only once inside the function
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        const docSnap = await getDoc(statsRef);

        // ✅ No more checking `trackedThisAttempt`
        await updateDoc(statsRef, { 
            rawScores: arrayUnion(finalScore)
        });

        // ✅ Always mark submission/session tracking
        await updateDoc(statsRef, {
            trackedSubmission: true,  
            trackedThisSession: true 
        });

        console.log(`✅ Stored raw score: ${finalScore}`);
        console.log("✅ Marked submission and session tracking as complete.");
    } catch (error) {
        console.error("❌ Firestore Write Error:", error);
    }
}


// Function to track responses to the second question
async function trackSecondQuestionAnswer(answerText) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot log data.");
        return;
    }

    // ✅ Define statsRef only once inside the function
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        const docSnap = await getDoc(statsRef);

        if (!docSnap.exists()) {
            await setDoc(statsRef, { secondQuestionResponses: 0, secondQuestionAnswers: {} });
            console.log(`✅ Created new stats document for ${courseCode} - Session ${sessionNumber}`);
        }

        let data = docSnap.exists() ? docSnap.data() : {};
        let answerCounts = data.secondQuestionAnswers || {};

        if (answerText in answerCounts) {
            answerCounts[answerText] += 1;
        } else {
            answerCounts[answerText] = 1;
        }

        await updateDoc(statsRef, {
            secondQuestionResponses: increment(1), // Track total second question responses
            secondQuestionAnswers: answerCounts // Store how many times each answer was chosen
        });

        console.log(`✅ Stored second question answer: "${answerText}".`);
    } catch (error) {
        console.error("❌ Firestore Write Error:", error);
    }
}

window.trackSecondQuestionAnswer = trackSecondQuestionAnswer;

// Function to initialize the second question answers in Firestore
async function initializeSecondQuestionAnswers() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot initialize Firestore.");
        return;
    }

    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}`);

    try {
        const docSnap = await getDoc(statsRef);
        if (!docSnap.exists()) {
            await setDoc(statsRef, { secondQuestionAnswers: [] });  // Initialize with an empty array
            console.log(`✅ Second question tracking initialized for ${courseCode} - Session ${sessionNumber}`);
        }
    } catch (error) {
        console.error("❌ Firestore Initialization Error:", error);
    }
}

initializeSecondQuestionAnswers();


window.loadAvailableCourses = async function () {
    console.log("📊 Fetching available courses...");

    try {
        const statsQuery = await getDocs(collection(db, "MFIgameStats"));
        const statsDropdown = document.getElementById("stats-course-selector");

        statsDropdown.innerHTML = ""; // Clear previous options

        let foundCourses = false;
        statsQuery.forEach((docSnap) => {
            const courseId = docSnap.id; // Document ID
            const option = document.createElement("option");
            option.value = courseId;
            option.textContent = courseId; // Display document ID (course-session)
            statsDropdown.appendChild(option);
            foundCourses = true;
        });

        if (!foundCourses) {
            console.warn("⚠️ No course stats found in Firestore.");
            statsDropdown.innerHTML = "<option disabled>No stats available</option>";
        } else {
            console.log("✅ Course sessions loaded.");
        }
    } catch (error) {
        console.error("❌ Error fetching course list:", error);
    }
};


// Function to fetch and display live statistics for the organiser
window.updateStatisticsDisplay = async function () {
    console.log("📊 Fetching statistics for entered course...");

    try {
        const courseCode = document.getElementById("course-code").value.trim();
        if (!courseCode) {
            console.warn("⚠️ No course code entered. Cannot fetch stats.");
            return;
        }

        console.log(`🔍 Fetching stats from Firestore for course: ${courseCode}`);

        // Query all sessions for the given course
        const statsQuery = await getDocs(collection(db, "MFIgameStats"));
        let totalFirstResponses = 0;
        let totalSecondResponses = 0;
        let foundStats = false;

        statsQuery.forEach((docSnap) => {
            if (docSnap.id.startsWith(courseCode)) { // Filter stats for this course
                const data = docSnap.data();
                console.log(`✅ Stats found for ${docSnap.id}:`, data);

                totalFirstResponses += data.firstQuestionResponses || 0;
                totalSecondResponses += data.secondQuestionResponses || 0;
                foundStats = true;
            }
        });

        if (!foundStats) {
            console.warn(`⚠️ No statistics found for course: ${courseCode}`);
        }

        // ✅ Use the correct IDs from `index_local.html`
        const firstQuestionElement = document.getElementById("stats-first-question");
        const secondQuestionElement = document.getElementById("stats-second-question");

        if (firstQuestionElement) {
            firstQuestionElement.textContent = totalFirstResponses;
        } else {
            console.error("❌ Element 'stats-first-question' not found in the HTML.");
        }

        if (secondQuestionElement) {
            secondQuestionElement.textContent = totalSecondResponses;
        } else {
            console.error("❌ Element 'stats-second-question' not found in the HTML.");
        }

    } catch (error) {
        console.error("❌ Error fetching stats:", error);
    }
};

// Run this function every 5 seconds for live updates
setInterval(updateStatisticsDisplay, 5000);


// Function to load statistics for the selected course
async function loadStatistics(selectedSessions = []) {
    console.log("📊 Loading Statistics...");

    const container = document.getElementById("statsContainer");
    if (!container) {
        console.error("❌ Cannot load Statistics: 'statsContainer' not found.");
        return;
    }
    container.innerHTML = ""; // Clear previous content

    const courseCode = document.getElementById("course-code").value.trim();
    const sessionNumber = parseInt(document.getElementById("session-number").value.trim(), 10);
    if (!courseCode || isNaN(sessionNumber)) return;

    // Default to current session if no selection
    if (selectedSessions.length === 0) {
        selectedSessions = [sessionNumber];
        console.log(`📌 Default session selected: ${sessionNumber}`);
        loadRawScoresChart([sessionNumber]); // ✅ Force the raw score chart to load immediately
        loadQuestion2Chart(selectedSessions);
        loadWordCloud(selectedSessions);
    }        

    const statsQuery = await getDocs(collection(db, "MFIgameStats"));
    let sessionData = {};

    statsQuery.forEach(docSnap => {
        const sessionMatch = docSnap.id.match(/Session(\d+)/);
        if (sessionMatch) {
            const sessionNum = parseInt(sessionMatch[1], 10);
            if (selectedSessions.includes(sessionNum)) {
                sessionData[sessionNum] = docSnap.data();
            }
        }
    });

    if (Object.keys(sessionData).length === 0) {
        console.warn("⚠️ No statistics found for selected sessions.");
        return;
    }

    // Create tabs for each session selected
    let tabsContainer = document.querySelector(".stats-tabs");
    if (!tabsContainer) {
        tabsContainer = document.createElement("div");
        tabsContainer.classList.add("stats-tabs");
        container.insertBefore(tabsContainer, container.firstChild);
    }
    tabsContainer.innerHTML = ""; // ✅ Clear previous tabs

    const contentContainer = document.createElement("div");
    contentContainer.classList.add("stats-content");
    container.appendChild(contentContainer);

    selectedSessions.forEach(sessionNum => {
        // Create tab button
        const tabButton = document.createElement("button");
        tabButton.textContent = `Session ${sessionNum}`;
        tabButton.classList.add("tab-button");
        tabButton.dataset.session = sessionNum;
        tabButton.onclick = () => switchTab(sessionNum);
        tabsContainer.appendChild(tabButton);

        // Create stats panel
        const sessionWrapper = document.createElement("div");
        sessionWrapper.classList.add("stats-panel");
        sessionWrapper.id = `session-${sessionNum}`;
        sessionWrapper.style.display = sessionNum === sessionNumber ? "block" : "none";
        sessionWrapper.innerHTML = `<h3 style='text-align: center; color: #e6007e;'>Session ${sessionNum}</h3>`;
        
        // Add raw scores graph
        const rawScoresCanvas = document.createElement("canvas");
        rawScoresCanvas.id = `rawScoresChart${sessionNum}`;
        sessionWrapper.appendChild(rawScoresCanvas);
        
        // Add word cloud canvas
        const wordCloudCanvas = document.createElement("canvas");
        wordCloudCanvas.id = `wordCloudCanvas${sessionNum}`;
        sessionWrapper.appendChild(wordCloudCanvas);
        
        contentContainer.appendChild(sessionWrapper);
        
        console.log(`📊 Loading raw scores for selected session: ${sessionNum}`);
        loadRawScoresChart([sessionNum]); // ✅ Now logs session before loading the chart
        
    });

    console.log("✅ Statistics Loaded Successfully.");
}




async function loadRawScoresChart(selectedSessions = []) {
    console.log("📊 Loading Raw Scores Chart...");

    selectedSessions.forEach(sessionNum => {
        const canvasId = `rawScoresChart${sessionNum}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas for Session ${sessionNum} not found: ${canvasId}`);
            return;
        }

        const ctx = canvas.getContext("2d");
        const courseCode = document.getElementById("course-code").value.trim();
        if (!courseCode) return;

        const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNum}`);
        getDoc(statsRef).then(docSnap => {
            if (!docSnap.exists()) {
                console.warn(`⚠️ No data found in Firestore for ${courseCode}-Session${sessionNum}.`);
                return;
            }

            let rawScores = docSnap.data().rawScores || [];
            console.log(`✅ Retrieved Raw Scores for ${courseCode}-Session${sessionNum}:`, rawScores);
            if (!rawScores || rawScores.length === 0) {
                console.error(`❌ No raw scores available for Session ${sessionNum}.`);
                return;
            }            
            console.log(`🔍 Checking Raw Scores Array:`, rawScores);

            if (rawScores.length === 0) {
                console.warn(`⚠️ No raw score data found for Session ${sessionNum}.`);
                return;
            }

            const maxScore = Math.max(...rawScores, 7); // ✅ Limits the range to the actual highest score
            const scoreCounts = Array(maxScore + 1).fill(0);

            rawScores.forEach(score => {
                if (typeof score === "number" && score >= 0 && score <= 7) {
                    scoreCounts[score] = (scoreCounts[score] || 0) + 1;
                } else {
                    console.warn(`⚠️ Unexpected raw score value:`, score);
                }
            });
            
            console.log(`✅ Processed Score Counts for ${courseCode}-Session${sessionNum}:`, scoreCounts);

            if (window[`rawScoresChartInstance${sessionNum}`]) {
                console.log(`🔄 Destroying existing chart for Session ${sessionNum}`);
                window[`rawScoresChartInstance${sessionNum}`].destroy();
            }           
            
            console.log(`📊 Chart Data for Session ${sessionNum}:`, Object.keys(scoreCounts), Object.values(scoreCounts));

            window[`rawScoresChartInstance${sessionNum}`] = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: Object.keys(scoreCounts),
                    datasets: [{
                        label: "Raw Scores",
                        data: Object.values(scoreCounts),
                        backgroundColor: [
                            "#ea0923", // red
                            "#f9800e", // orange
                            "#FFFF00", // yellow
                            "#bccf04", // lime green
                            "#14a19a", // teal
                            "#045275", // blue
                            "#4b0082", // purple
                            "#E6007E" // pink
                        ]                        
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: { y: { ticks: { stepSize: 1 } } }
                }
            });
        }).catch(error => console.error("❌ Error fetching raw scores from Firebase:", error));
    });
}



async function loadQuestion2Chart(selectedSessions) {
    console.log("📊 Loading 2nd Question Chart...");

    const canvas = document.getElementById("question2Chart");
    if (!canvas) {
        console.error("❌ Cannot load 2nd Question Chart: Canvas element not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const courseCode = document.getElementById("course-code").value.trim();
    if (!courseCode) return;

    const statsQuery = await getDocs(collection(db, "MFIgameStats"));
    let answerCounts = {
        "1st time I've seen it": 0,
        "Seen it, tried it or trying it": 0,
        "Know it - used it": 0,
        "Use it well - want to learn more": 0
    };

    statsQuery.forEach(docSnap => {
        const sessionMatch = docSnap.id.match(/Session(\d+)/);
        if (sessionMatch) {
            const sessionNum = parseInt(sessionMatch[1], 10);
            if (Array.isArray(selectedSessions) && selectedSessions.includes(sessionNum)) { 
                const answers = docSnap.data().secondQuestionAnswers || {};
                Object.keys(answers).forEach(answer => {
                    if (answer in answerCounts) {
                        answerCounts[answer] += answers[answer];
                    }
                });
            }
        }
    });
    

    console.log("✅ Second Question Data:", answerCounts);
    if (Object.values(answerCounts).every(value => value === 0)) {
        console.warn("⚠️ No data found for 2nd Question Chart. The chart may appear blank.");
        return;
    }    

    // Ensure the previous chart is destroyed to prevent overlapping
    if (window.question2ChartInstance) {
        window.question2ChartInstance.destroy();
    }

    window.question2ChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(answerCounts),
            datasets: [{
                data: Object.values(answerCounts), // ✅ Removed the label
                backgroundColor: ["#96d5b5", "#14a19a", "#00718b", "#045275"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false // ✅ Disables the legend completely
                }
            }
        }
    });
    
    console.log("✅ 2nd Question Chart Loaded Successfully.");
}


async function loadWordCloud(selectedSessions) {
    console.log("☁️ Loading Word Cloud...");

    const canvas = document.getElementById("wordCloudCanvas");
    if (!canvas) {
        console.error("❌ Cannot load Word Cloud: Canvas element not found.");
        return;
    }

    const courseCode = document.getElementById("course-code").value.trim();
    if (!courseCode) return;

    const statsQuery = await getDocs(collection(db, "MFIgameStats"));
    let incorrectCounts = {};

    statsQuery.forEach(docSnap => {
        const sessionMatch = docSnap.id.match(/Session(\d+)/);
        if (sessionMatch) {
            const sessionNum = parseInt(sessionMatch[1], 10);
            if (Array.isArray(selectedSessions) && selectedSessions.includes(sessionNum)) { 
                const incorrectGuesses = docSnap.data().incorrectGuesses || {};
                Object.keys(incorrectGuesses).forEach(word => {
                    incorrectCounts[word] = (incorrectCounts[word] || 0) + incorrectGuesses[word];
                });
            }
        }
    });
    

    if (Object.keys(incorrectCounts).length === 0) {
        console.warn("⚠️ No incorrect words found. Checking Firebase data...");
        console.log("✅ Incorrect Words Data from Firebase:", incorrectCounts);
        return;
    }    

    console.log("✅ Incorrect Words Data:", incorrectCounts);

    const correctWords = ["Aim", "Measure", "Change Ideas", "Plan", "Do", "Study", "Act"];
    const wordList = Object.entries(incorrectCounts).map(([word, count]) => [word, count]);

    // ✅ Increase resolution for better clarity
    canvas.width = 1600;  // ✅ Wider for better visibility
    canvas.height = 1000;


    WordCloud(canvas, {
        list: wordList,
        weightFactor: 10, // ✅ Adjusted for better proportional scaling
        minSize: 10,
        maxSize: 80, // ✅ Ensure larger words appear much bigger
        rotateRatio: 0, // ✅ No random rotation for readability
        fontWeight: "bold",
        backgroundColor: "white",
        color: function (word) {
            return correctWords.includes(word) ? "#e6007e" : ["#96d5b5", "#14a19a", "#00718b", "#045275"][Math.floor(Math.random() * 4)];
        },
        shuffle: false, // ✅ Ensure word prominence is based ONLY on frequency
    });

    console.log("✅ Word Cloud Loaded Successfully with Improved Clarity and Scaling.");
}






// ✅ DOMContentLoaded - Single, Cleaned-Up Listener
document.addEventListener("DOMContentLoaded", function () {
    // Elements for course/session setup
    const courseForm = document.getElementById("course-form");
    const sessionLinkContainer = document.getElementById("session-link");
    const linkOutput = document.getElementById("link-output");
    const courseTitleElement = document.getElementById("course-title");
    const courseSetup = document.getElementById("course-setup");
    const gameArea = document.getElementById("game-area");

    const copyButton = document.getElementById("copy-link");

    // ✅ Ensure the copy button exists before adding the event listener
    if (copyButton) {
        copyButton.addEventListener("click", function () {
            if (!linkOutput || !linkOutput.textContent.trim()) {
                console.warn("⚠️ No session link available to copy.");
                alert("⚠️ No session link found. Please generate a session first.");
                return;
            }

            navigator.clipboard.writeText(linkOutput.textContent.trim())
                .then(() => {
                    alert("✅ Link copied to clipboard!");
                })
                .catch(err => {
                    console.error("❌ Failed to copy link:", err);
                });
        });
    } else {
        console.error("❌ 'copy-link' button not found in the document.");
    }

    // Elements for game interactions
    const nextQuestionButton = document.getElementById("next-question-button");
    const draggables = document.querySelectorAll(".draggable");

    if (draggables.length === 0) {
        console.warn("⚠️ No draggable elements found in the DOM.");
    }

    draggables.forEach(draggable => {
        draggable.addEventListener("dragstart", drag);
        console.log(`✅ Dragstart event added to: ${draggable.id}`);
    });

    const blanks = document.querySelectorAll(".text-box, .quarter");

    // ✅ Setup event listeners for draggable functionality
    draggables.forEach(draggable => draggable.addEventListener("dragstart", drag));
    blanks.forEach(blank => {
        blank.addEventListener("dragover", allowDrop);
        blank.addEventListener("drop", drop);
    });

    // ✅ Handle session creation and storage in Firebase
    if (courseForm) {
        courseForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const courseCode = document.getElementById("course-code").value.trim();
            const sessionNumber = document.getElementById("session-number").value.trim();

            if (!courseCode || !sessionNumber) {
                alert("Please enter both the course code and session number.");
                return;
            }

            // Store organiser status
            sessionStorage.setItem("isOrganiser", "true");

            // Construct session link
            const sessionLink = `${window.location.origin}${window.location.pathname}?course=${encodeURIComponent(courseCode)}&session=${encodeURIComponent(sessionNumber)}`;

            // Show generated session link instead of redirecting
            linkOutput.textContent = sessionLink;
            sessionLinkContainer.style.display = "block";

            // Store session details in Firebase
            try {
                const sessionRef = doc(db, "MFIgameSessions", `${courseCode}-Session${sessionNumber}`);
                await setDoc(sessionRef, {
                    course: courseCode,
                    session: sessionNumber,
                    createdAt: new Date().toISOString(),
                }, { merge: true });

                console.log(`✅ Session stored in Firebase: ${courseCode} - Session ${sessionNumber}`);
            } catch (error) {
                console.error("❌ Error storing session in Firebase:", error);
            }
        });
    }

    // Add the event listener for course code input to enable the "View Statistics" button
    const courseInput = document.getElementById("course-code");
    const statsButton = document.getElementById("toggle-stats");

    if (courseInput && statsButton) {
        courseInput.addEventListener("input", function () {
            if (courseInput.value.trim() !== "") {
                statsButton.disabled = false; // Enable button
                statsButton.style.opacity = "1"; // Make it fully visible
            } else {
                statsButton.disabled = true; // Disable button
                statsButton.style.opacity = "0.5"; // Make it look faded
            }
        });
    }

    // ✅ Setup event listener for next question button
    if (nextQuestionButton) {
        nextQuestionButton.addEventListener("click", nextQuestion);
    }

    // ✅ Initial check for submit button state
    checkSubmitButtonState();
});


// ✅ Debugging function for Firestore writes
window.testFirestore = async function () {
    try {
        const statsRef = doc(db, "gameStats", "firstQuestion");
        await updateDoc(statsRef, { correctAnswers: increment(1) });
        console.log("✅ Firestore write successful!");
    } catch (error) {
        console.error("❌ Firestore Write Error:", error);
    }
};

console.log("✅ testFirestore function is now available globally.");
console.log("✅ Reached the end of script.js execution.");


async function populateDemoStats() {
    console.log("🚀 Populating Firebase with demo statistics...");

    const courseCode = "DemoCourse";
    const sessions = [1, 2, 3, 4];
    const sessionData = {
        1: {
            rawScores: generateScores(0, 4, 25), // ✅ Lower scores
            secondQuestionAnswers: { 
                "1st time I've seen it": 20, 
                "Seen it, tried it or trying it": 2, 
                "Know it - used it": 0, 
                "Use it well - want to learn more": 3 
            },
            incorrectGuesses: generateWordCloud(15)
        },
        2: {
            rawScores: generateScores(3, 7, 25), // ✅ Scores increasing
            secondQuestionAnswers: { 
                "1st time I've seen it": 2, 
                "Seen it, tried it or trying it": 20, 
                "Know it - used it": 1, 
                "Use it well - want to learn more": 3 
            },
            incorrectGuesses: generateWordCloud(10)
        },
        3: {
            rawScores: generateScores(5, 7, 25), // ✅ Most people scoring 5+
            secondQuestionAnswers: { 
                "1st time I've seen it": 0, 
                "Seen it, tried it or trying it": 20, 
                "Know it - used it": 5, 
                "Use it well - want to learn more": 3 
            },
            incorrectGuesses: generateWordCloud(5)
        },
        4: {
            rawScores: generateScores(6, 7, 25), // ✅ Nearly everyone scoring high
            secondQuestionAnswers: { 
                "1st time I've seen it": 0, 
                "Seen it, tried it or trying it": 10, 
                "Know it - used it": 12, 
                "Use it well - want to learn more": 3 
            },
            incorrectGuesses: generateWordCloud(3)
        }
    };

    for (const session of sessions) {
        const sessionRef = doc(db, "MFIgameStats", `${courseCode}-Session${session}`);
        try {
            await setDoc(sessionRef, sessionData[session], { merge: true });
            console.log(`✅ Session ${session} demo data added to Firebase.`);
        } catch (error) {
            console.error(`❌ Error writing Session ${session} data:`, error);
        }
    }
    
    console.log("✅ Demo statistics successfully populated!");
}

// ✅ Function to generate random scores within a range
function generateScores(min, max, count) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

// ✅ Function to generate word cloud data
function generateWordCloud(maxWords) {
    const words = ["Audit", "Objective", "Result", "Intervention", "Study", "Goal", "Assess", "Check", "Aim", "Plan", "Do", "Study", "Act"];
    let wordCounts = {};
    for (let i = 0; i < maxWords; i++) {
        const word = words[Math.floor(Math.random() * words.length)];
        wordCounts[word] = (wordCounts[word] || 0) + Math.floor(Math.random() * 5) + 1; // Random frequency
    }
    return wordCounts;
}

// ✅ Make function globally accessible
window.populateDemoStats = populateDemoStats;
