// Import the existing Firebase instance
import { db } from "./firebase.js";
import { doc, setDoc, getDoc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
});


async function ensureStatsDocumentExists() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot create document.");
        return;
    }

    const today = new Date().toISOString().split('T')[0];
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


// Function to copy the generated link to clipboard
document.getElementById("copy-link").addEventListener("click", function () {
    const linkOutput = document.getElementById("link-output").textContent;  

    if (!linkOutput) {
        console.warn("⚠️ No session link available to copy.");
        alert("⚠️ No session link found. Please generate a session first.");
        return;
    }

    navigator.clipboard.writeText(linkOutput)
        .then(() => {
            alert("✅ Link copied to clipboard!");
        })
        .catch(err => {
            console.error("❌ Failed to copy link:", err);
        });
});


// Function to toggle statistics panel visibility
window.toggleStatistics = function () { 
    const statsDiv = document.getElementById("course-stats");
    const statsButton = document.getElementById("toggle-stats");

    if (!statsDiv) {
        console.error("❌ statsDiv not found. Check if 'course-stats' exists in HTML.");
        return;
    }
    if (!statsButton) {
        console.error("❌ statsButton not found. Check if 'toggle-stats' exists in HTML.");
        return;
    }

    if (statsDiv.classList.contains("hidden")) {
        statsDiv.classList.remove("hidden");
        statsButton.textContent = "Hide Statistics";
        console.log("✅ Statistics panel is now visible.");
        updateStatisticsDisplay();  // Fetch latest stats when shown
    } else {
        statsDiv.classList.add("hidden");
        statsButton.textContent = "View Statistics";
        console.log("✅ Statistics panel is now hidden.");
    }
};



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
            draggedElement.style.transform = "rotate(0deg)"; // Ensure no rotation for text-boxes
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
            applyRotation(zoneId, correctionText);
            
            correctionContainer.appendChild(correctionText);
            zone.appendChild(correctionContainer);
        }
    });

    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

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

    const today = new Date().toISOString().split('T')[0];
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

    const today = new Date().toISOString().split('T')[0];
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

    const today = new Date().toISOString().split('T')[0];
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



// Function to fetch and display live statistics for the organiser
window.updateStatisticsDisplay = async function () {
    const filterType = document.getElementById("stats-filter").value;
    let totalUsers = 0;
    let totalSecond = 0;
    let statsRef;

    try {
        if (filterType === "all") {
            const statsQuery = await getDocs(collection(db, "MFIgameStats"));

            statsQuery.forEach((docSnap) => {
                const data = docSnap.data();
                totalUsers += (data.completedUsers ? data.completedUsers.length : 0);
                totalSecond += data.secondQuestionResponses || 0;
            });

            document.getElementById("stats-first-question").textContent = `Users Who Completed First Question: ${totalUsers}`;
            document.getElementById("stats-second-question").textContent = `Users Who Answered Second Question: ${totalSecond}`;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const courseCode = urlParams.get("course");
            const sessionNumber = urlParams.get("session");
            let docId = courseCode ? `${courseCode}-Session${sessionNumber}` : "all-courses";

            if (filterType === "today") {
                const today = new Date().toISOString().split("T")[0];
                docId += `-${today}`;
            }

            statsRef = doc(db, "MFIgameStats", docId);
            const docSnap = await getDoc(statsRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById("stats-first-question").textContent = `Users Who Completed First Question: ${data.completedUsers ? data.completedUsers.length : 0}`;
                document.getElementById("stats-second-question").textContent = `Users Who Answered Second Question: ${data.secondQuestionResponses || 0}`;
            } else {
                document.getElementById("stats-first-question").textContent = "No statistics available yet.";
                document.getElementById("stats-second-question").textContent = "No statistics available yet.";
            }
        }
    } catch (error) {
        console.error("❌ Error fetching stats:", error);
    }
};

// Run this function every 5 seconds for live updates
setInterval(updateStatisticsDisplay, 5000);

// ✅ DOMContentLoaded - Single, Cleaned-Up Listener
document.addEventListener("DOMContentLoaded", function () {
    // Elements for course/session setup
    const courseForm = document.getElementById("course-form");
    const sessionLinkContainer = document.getElementById("session-link");
    const linkOutput = document.getElementById("link-output");
    const courseTitleElement = document.getElementById("course-title");
    const courseSetup = document.getElementById("course-setup");
    const gameArea = document.getElementById("game-area");

    // Elements for game interactions
    const nextQuestionButton = document.getElementById("next-question-button");
    const draggables = document.querySelectorAll(".draggable");
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

    


    // ✅ Setup event listener for next question button
    if (nextQuestionButton) {
        nextQuestionButton.addEventListener("click", nextQuestion);
    }

    // ✅ Initial check for submit button state
    checkSubmitButtonState();
});

// ✅ Function to open statistics page in a new tab
function viewStatistics() {
    const isGitHubPages = window.location.hostname === "nicintheloop.github.io";
    const basePath = isGitHubPages ? "/MfIgame" : "";
    const statisticsLink = `${window.location.origin}${basePath}/statistics`;
    window.open(statisticsLink, "_blank");
}

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
