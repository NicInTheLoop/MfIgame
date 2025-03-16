// Import the existing Firebase instance
import { db } from "./firebase.js";
import { doc, setDoc, getDoc, updateDoc, increment, arrayUnion, getDocs, collection } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const today = new Date().toISOString().split('T')[0];

// Initialize Sortable for drag and drop
document.addEventListener('DOMContentLoaded', () => {
    // Initialize word bank
    new Sortable(document.getElementById('word-bank'), {
        group: 'shared',
        animation: 150,
        sort: false
    });

    // Initialize drop zones
    ['box1', 'box2', 'box3'].forEach(id => {
        new Sortable(document.getElementById(id), {
            group: 'shared',
            animation: 150,
            onAdd: (evt) => checkSubmitButtonState()
        });
    });

    // Initialize quarters
    ['quarter1', 'quarter2', 'quarter3', 'quarter4'].forEach(id => {
        new Sortable(document.getElementById(id), {
            group: 'shared',
            animation: 150,
            onAdd: (evt) => checkSubmitButtonState()
        });
    });
});

// Function to check for existing session
function checkForExistingSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (courseCode && sessionNumber) {
        console.log(`🔹 Course detected in URL: ${courseCode}, Session: ${sessionNumber}`);
    
        // Check if the user is the organiser
        const isOrganiser = sessionStorage.getItem("isOrganiser") === "true";
    
        if (!isOrganiser) {
            // Hide course setup for participants
            const courseSetup = document.getElementById("course-setup");
            if (courseSetup) {
                courseSetup.style.display = "none"; 
                console.log("✅ Course setup hidden for participant view.");
            }
        }
    
        // Show game area
        const gameArea = document.getElementById("game-area");
        if (gameArea) {
            gameArea.style.display = "flex";
            console.log("✅ Game area displayed.");
        }
    
        // Mark participant view in sessionStorage if they're not the organiser
        if (!isOrganiser) {
            sessionStorage.setItem("isParticipant", "true");
        }
    } else {
        // If no course is detected, ensure the course setup is always visible
        console.log("ℹ️ No course session found in URL. Showing setup form.");
        const courseSetup = document.getElementById("course-setup");
        if (courseSetup) {
            courseSetup.style.display = "block";
        }
    }
}

checkForExistingSession();

// Function to ensure stats document exists
async function ensureStatsDocumentExists() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot create document.");
        return;
    }

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

// Function to update session selection
function updateSessionSelection() {
    const selectedSessions = [...document.querySelectorAll(".session-checkboxes input:checked")]
        .map(input => parseInt(input.value, 10));

    console.log("✅ Selected Sessions:", selectedSessions); // Debugging added

    loadStatistics(selectedSessions);
}

// Function to switch tab
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

// Simplified chart creation using Chart.js
function loadRawScoresChart(selectedSessions = []) {
    const ctx = document.getElementById('rawScoresChart').getContext('2d');
    const statsRef = collection(db, "MFIgameStats");
    
    getDocs(statsRef).then(querySnapshot => {
        const data = [];
        querySnapshot.forEach(doc => {
            const sessionMatch = doc.id.match(/Session(\d+)/);
            if (sessionMatch && selectedSessions.includes(parseInt(sessionMatch[1]))) {
                const scores = doc.data().rawScores || [];
                data.push(...scores);
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: Math.max(...data) + 1}, (_, i) => i.toString()),
                datasets: [{
                    label: 'Score Distribution',
                    data: Array.from({length: Math.max(...data) + 1}, (_, i) => 
                        data.filter(score => score === i).length
                    ),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Students'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    }
                }
            }
        });
    });
}

// Enhanced word cloud using d3-cloud
function loadWordCloud(selectedSessions = []) {
    const width = 500;
    const height = 400;

    // Clear previous word cloud
    d3.select("#wordCloudCanvas").html("");

    // Fetch incorrect guesses from Firestore
    const statsRef = collection(db, "MFIgameStats");
    getDocs(statsRef).then(querySnapshot => {
        const wordFreq = {};
        
        querySnapshot.forEach(doc => {
            const sessionMatch = doc.id.match(/Session(\d+)/);
            if (sessionMatch && selectedSessions.includes(parseInt(sessionMatch[1]))) {
                const incorrectGuesses = doc.data().incorrectGuesses || [];
                incorrectGuesses.forEach(word => {
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                });
            }
        });

        const words = Object.entries(wordFreq).map(([text, size]) => ({
            text,
            size: 10 + (size * 10) // Scale font size
        }));

        d3.layout.cloud()
            .size([width, height])
            .words(words)
            .padding(5)
            .rotate(() => 0)
            .fontSize(d => d.size)
            .on("end", draw)
            .start();

        function draw(words) {
            d3.select("#wordCloudCanvas")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", `translate(${width/2},${height/2})`)
                .selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", d => `${d.size}px`)
                .style("fill", () => `hsl(${Math.random() * 360}, 70%, 50%)`)
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text(d => d.text);
        }
    });
}

// Function to check answers
async function checkAnswers() {
    await ensureStatsDocumentExists();  

    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.error("❌ Error: courseCode or sessionNumber is missing.");
        return;
    }

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

    document.getElementById('initial-instructions').classList.add('hidden');

    const nextInstructions = document.getElementById('next-instructions');
    nextInstructions.classList.remove('hidden');
    nextInstructions.classList.add('visible');
    nextInstructions.style.display = 'block'; 

    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.classList.remove('hidden');
    nextQuestionButton.classList.add('visible');
    nextQuestionButton.style.display = 'inline-block'; 

    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.classList.add('hidden'); 
}

// Function to store raw score
async function storeRawScore(finalScore) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot log data.");
        return;
    }

    const statsRef = doc(db, "MFIgameStats", `${courseCode}-Session${sessionNumber}-${today}`);

    try {
        await updateDoc(statsRef, { 
            rawScores: arrayUnion(finalScore)
        });

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

// Function to track second question answer
async function trackSecondQuestionAnswer(answerText) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get("course");
    const sessionNumber = urlParams.get("session");

    if (!courseCode || !sessionNumber) {
        console.warn("⚠️ No course or session found in URL, cannot log data.");
        return;
    }

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

    let tabsContainer = document.querySelector(".stats-tabs");
    if (!tabsContainer) {
        tabsContainer = document.createElement("div");
        tabsContainer.classList.add("stats-tabs");
        container.insertBefore(tabsContainer, container.firstChild);
    }
    tabsContainer.innerHTML = ""; // Clear previous tabs

    const contentContainer = document.createElement("div");
    contentContainer.classList.add("stats-content");
    container.appendChild(contentContainer);

    selectedSessions.forEach(sessionNum => {
        const tabButton = document.createElement("button");
        tabButton.textContent = `Session ${sessionNum}`;
        tabButton.classList.add("tab-button");
        tabButton.dataset.session = sessionNum;
        tabButton.onclick = () => switchTab(sessionNum);
        tabsContainer.appendChild(tabButton);

        const sessionWrapper = document.createElement("div");
        sessionWrapper.classList.add("stats-panel");
        sessionWrapper.id = `session-${sessionNum}`;
        sessionWrapper.style.display = sessionNum === sessionNumber ? "block" : "none";
        sessionWrapper.innerHTML = `<h3 style='text-align: center; color: #e6007e;'>Session ${sessionNum}</h3>`;
        
        const rawScoresCanvas = document.createElement("canvas");
        rawScoresCanvas.id = `rawScoresChart${sessionNum}`;
        sessionWrapper.appendChild(rawScoresCanvas);
        
        const wordCloudCanvas = document.createElement("canvas");
        wordCloudCanvas.id = `wordCloudCanvas${sessionNum}`;
        sessionWrapper.appendChild(wordCloudCanvas);
        
        contentContainer.appendChild(sessionWrapper);
        
        console.log(`📊 Loading raw scores for selected session: ${sessionNum}`);
        loadRawScoresChart([sessionNum]); // Now logs session before loading the chart
        
    });

    console.log("✅ Statistics Loaded Successfully.");
}

// Function to load question 2 chart
async function loadQuestion2Chart(selectedSessions) {
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

    if (window.question2ChartInstance) {
        window.question2ChartInstance.destroy();
    }

    window.question2ChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(answerCounts),
            datasets: [{
                data: Object.values(answerCounts), 
                backgroundColor: ["#96d5b5", "#14a19a", "#00718b", "#045275"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false 
                }
            }
        }
    });
    
    console.log("✅ 2nd Question Chart Loaded Successfully.");
}

// Function to load word cloud
async function loadWordCloud(selectedSessions) {
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

    canvas.width = 1600;  
    canvas.height = 1000;


    WordCloud(canvas, {
        list: wordList,
        weightFactor: 10, 
        minSize: 10,
        maxSize: 80, 
        rotateRatio: 0, 
        fontWeight: "bold",
        backgroundColor: "white",
        color: function (word) {
            return correctWords.includes(word) ? "#e6007e" : ["#96d5b5", "#14a19a", "#00718b", "#045275"][Math.floor(Math.random() * 4)];
        },
        shuffle: false, 
    });

    console.log("✅ Word Cloud Loaded Successfully with Improved Clarity and Scaling.");
}

// Function to update statistics display
window.updateStatisticsDisplay = async function () {
    console.log("📊 Fetching statistics for entered course...");

    try {
        const courseCode = document.getElementById("course-code").value.trim();
        if (!courseCode) {
            console.warn("⚠️ No course code entered. Cannot fetch stats.");
            return;
        }

        console.log(`🔍 Fetching stats from Firestore for course: ${courseCode}`);

        const statsQuery = await getDocs(collection(db, "MFIgameStats"));
        let totalFirstResponses = 0;
        let totalSecondResponses = 0;
        let foundStats = false;

        statsQuery.forEach((docSnap) => {
            if (docSnap.id.startsWith(courseCode)) { 
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

// Function to populate demo stats
function populateDemoStats() {
    const demoData = {
        rawScores: generateScores(0, 7, 20),
        wordCloud: generateWordCloud(10),
        secondQuestionAnswers: {
            'Not at all familiar': Math.floor(Math.random() * 10),
            'Slightly familiar': Math.floor(Math.random() * 10),
            'Moderately familiar': Math.floor(Math.random() * 10),
            'Very familiar': Math.floor(Math.random() * 10)
        }
    };

    // Update charts with demo data
    const rawScoresCtx = document.getElementById('rawScoresChart').getContext('2d');
    new Chart(rawScoresCtx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 8}, (_, i) => i.toString()),
            datasets: [{
                data: Array.from({length: 8}, (_, i) => 
                    demoData.rawScores.filter(score => score === i).length
                ),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Students' }
                },
                x: {
                    title: { display: true, text: 'Score' }
                }
            }
        }
    });

    // Create word cloud with demo data
    const width = 500;
    const height = 400;
    d3.select("#wordCloudCanvas").html("");
    
    const words = Object.entries(demoData.wordCloud).map(([text, size]) => ({
        text,
        size: 10 + (size * 10)
    }));

    d3.layout.cloud()
        .size([width, height])
        .words(words)
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => d.size)
        .on("end", draw)
        .start();

    function draw(words) {
        d3.select("#wordCloudCanvas")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2},${height/2})`)
            .selectAll("text")
            .data(words)
            .enter()
            .append("text")
            .style("font-size", d => `${d.size}px`)
            .style("fill", () => `hsl(${Math.random() * 360}, 70%, 50%)`)
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .text(d => d.text);
    }
}

// Helper function to generate random scores
function generateScores(min, max, count) {
    return Array.from({length: count}, () => 
        Math.floor(Math.random() * (max - min + 1)) + min
    );
}

// Helper function to generate word cloud data
function generateWordCloud(maxWords) {
    const words = ["Learn", "Assess", "Goal", "Think", "Purpose", "Change", "Study", "Plan"];
    return words.reduce((acc, word) => {
        acc[word] = Math.floor(Math.random() * 10) + 1;
        return acc;
    }, {});
}

// Make functions globally accessible
window.populateDemoStats = populateDemoStats;
window.checkForExistingSession = checkForExistingSession;
window.toggleStatistics = toggleStatistics;
window.updateSessionSelection = updateSessionSelection;
window.switchTab = switchTab;
window.checkAnswers = checkAnswers;
window.nextQuestion = nextQuestion;
window.selectFinalOption = selectFinalOption;
window.submitFinalAnswer = submitFinalAnswer;
window.trackIncorrectGuess = trackIncorrectGuess;
window.trackSecondQuestionAnswer = trackSecondQuestionAnswer;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    checkForExistingSession();
    
    // Initialize course form
    const courseForm = document.getElementById("course-form");
    if (courseForm) {
        courseForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const courseCode = document.getElementById("course-code").value.trim();
            const sessionNumber = document.getElementById("session-number").value.trim();
            
            if (!courseCode || !sessionNumber) {
                alert("Please enter both course code and session number.");
                return;
            }

            sessionStorage.setItem("isOrganiser", "true");
            const sessionLink = `${window.location.origin}${window.location.pathname}?course=${encodeURIComponent(courseCode)}&session=${encodeURIComponent(sessionNumber)}`;
            
            document.getElementById("link-output").textContent = sessionLink;
            document.getElementById("session-link").style.display = "block";

            try {
                await setDoc(doc(db, "MFIgameSessions", `${courseCode}-Session${sessionNumber}`), {
                    course: courseCode,
                    session: sessionNumber,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            } catch (error) {
                console.error("Error storing session:", error);
            }
        });
    }

    // Initialize copy link button
    const copyButton = document.getElementById("copy-link");
    if (copyButton) {
        copyButton.addEventListener("click", () => {
            const linkOutput = document.getElementById("link-output");
            if (!linkOutput?.textContent.trim()) {
                alert("Please generate a session first.");
                return;
            }
            navigator.clipboard.writeText(linkOutput.textContent.trim())
                .then(() => alert("Link copied!"))
                .catch(err => console.error("Copy failed:", err));
        });
    }

    // Initialize course code input for stats button
    const courseInput = document.getElementById("course-code");
    const statsButton = document.getElementById("toggle-stats");
    if (courseInput && statsButton) {
        courseInput.addEventListener("input", () => {
            statsButton.disabled = !courseInput.value.trim();
            statsButton.style.opacity = courseInput.value.trim() ? "1" : "0.5";
        });
    }

    // Initialize session checkboxes
    document.querySelectorAll(".session-checkboxes input").forEach(input => {
        input.addEventListener("change", updateSessionSelection);
    });
});

console.log("✅ Script initialization complete");
