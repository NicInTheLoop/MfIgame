document.getElementById('course-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const courseCode = document.getElementById('course-code').value.trim();
    const sessionNumber = document.getElementById('session-number').value.trim();

    // Correct base URL for GitHub Pages
    const baseUrl = `${window.location.origin}/MfIgame/`;
    const sessionLink = `${baseUrl}?course=${encodeURIComponent(courseCode)}&session=${encodeURIComponent(sessionNumber)}`;

    // Display the generated link
    document.getElementById('link-output').textContent = sessionLink;
    document.getElementById('session-link').style.display = 'block';

    // Store course and session in localStorage for tracking
    saveToStorage('courseCode', courseCode);
    saveToStorage('sessionNumber', sessionNumber);
});

document.getElementById('copy-link').addEventListener('click', function () {
    const linkOutput = document.getElementById('link-output').textContent;
    navigator.clipboard.writeText(linkOutput)
        .then(() => {
            alert('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy link: ', err);
        });
});

window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const courseCode = urlParams.get('course');
    const sessionNumber = urlParams.get('session');

    if (courseCode && sessionNumber) {
        // Hide the course setup box
        document.getElementById('course-setup').classList.add('hidden');

        // Show the course title
        const courseTitle = `Course Session: ${courseCode} (Session ${sessionNumber})`;
        const courseTitleElement = document.getElementById('course-title');
        courseTitleElement.textContent = courseTitle;
        courseTitleElement.classList.remove('hidden');
    }
});


let correctAnswersCount = 0;
let incorrectGuesses = [];
let finalQuestionResponse = '';


function saveStatsLocally(data) {
    let stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    stats.push(data);
    localStorage.setItem('gameStats', JSON.stringify(stats));
    console.log('Statistics saved locally:', stats);
}

function submitGameData(data) {
    console.log('Saving game data locally:', data);
    saveStatsLocally(data);
    alert('Your data has been saved locally!');
}



// Global Function Definitions
function checkAnswers() {
    const correctAnswers = {
        box1: 'word17', // Correct answer for Aim
        box2: 'word3',  // Correct answer for Measure
        box3: 'word9',  // Correct answer for Change Ideas
        quarter1: 'word11', // Correct answer for Plan
        quarter2: 'word6',  // Correct answer for Do
        quarter3: 'word10', // Correct answer for Study
        quarter4: 'word20'  // Correct answer for Act
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
            element.classList.add('rotate-90');
        } else if (quarterId === "quarter3") {
            element.classList.add('rotate-180');
        } else if (quarterId === "quarter4") {
            element.classList.add('rotate-90-reverse');
        } else {
            element.classList.remove('rotate-90', 'rotate-180', 'rotate-90-reverse');
        }
    }

    Object.keys(correctAnswers).forEach(zoneId => {
        const zone = document.getElementById(zoneId);
        if (!zone) {
            console.warn(`Zone with ID ${zoneId} not found.`);
            return;
        }

        // Remove existing correction elements
        Array.from(zone.querySelectorAll('.correction')).forEach(correction => correction.remove());

        const draggableChild = zone.querySelector('.draggable');
        console.log(`Zone: ${zoneId}, Found: ${draggableChild ? draggableChild.id : 'None'}, Expected: ${correctAnswers[zoneId]}`);

        if (draggableChild && draggableChild.id === correctAnswers[zoneId]) {
            console.log(`Correct! Zone: ${zoneId}, Dragged ID: ${draggableChild.id}`);
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
        } else {
            console.warn(`Incorrect or empty. Zone: ${zoneId}, Dragged ID: ${draggableChild ? draggableChild.id : 'None'}`);
            zone.classList.add('incorrect');
            zone.classList.remove('correct');

            // Add a correction element
            const correction = document.createElement('div');
            correction.classList.add('correction');

            const correctText = answerLabels[correctAnswers[zoneId]] || 'Unknown';
            correction.textContent = draggableChild
                ? `${draggableChild.textContent} (Correct: ${correctText})`
                : `Correct: ${correctText}`;

            if (zoneId.startsWith('quarter')) {
                applyRotation(zoneId, correction);
            }

            zone.appendChild(correction);

            // Remove the draggable button from the zone
            if (draggableChild) {
                draggableChild.remove();
            }
                
            const submitButton = document.getElementById('submit-button');
            submitButton.disabled = true;
            
            // Submit data to API/Google Sheets
            const courseCode = localStorage.getItem('courseCode') || 'DefaultCourseCode';
            const sessionNumber = localStorage.getItem('sessionNumber') || 'DefaultSessionNumber';

            const data = {
                course: courseCode,
                session: sessionNumber,
                correctAnswers: correctAnswersCount,
                incorrectGuesses: incorrectGuesses,
            };

            submitGameData(data);
            console.log("Data sent to Google Sheets:", data);

        }
    });

    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', 'true');
        draggable.addEventListener('dragstart', drag);
    });

    // Hide initial instructions and show next instructions and next question button
    document.getElementById('initial-instructions').classList.add('hidden');
    console.log('Initial instructions hidden:', document.getElementById('initial-instructions').classList.contains('hidden'));

    const nextInstructions = document.getElementById('next-instructions');
    nextInstructions.classList.remove('hidden');
    nextInstructions.classList.add('visible');
    nextInstructions.style.display = ''; // Resets to CSS default
    console.log('Next instructions visible:', nextInstructions.classList.contains('visible'));

    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.classList.remove('hidden');
    nextQuestionButton.classList.add('visible');
    nextQuestionButton.style.display = ''; // Resets to CSS default
    console.log('Next question button visible:', nextQuestionButton.classList.contains('visible'));

    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
}

function checkSubmitButtonState() {
    const dropZones = document.querySelectorAll('.text-box, .quarter'); // Select all drop zones
    const filledZones = Array.from(dropZones).filter(zone => zone.querySelector('.draggable')).length;

    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        // Enable the button only if at least 3 zones are filled
        submitButton.disabled = filledZones < 3;
    }

    console.log(`Filled zones: ${filledZones}/${dropZones.length}`);
}


function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    const dropZone = event.target.closest('.text-box, .quarter');
    if (draggedElement && dropZone) {
        dropZone.appendChild(draggedElement);
    }
    checkSubmitButtonState();
}

// DOMContentLoaded Listener
document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.getElementById('submit-button');
    const nextQuestionButton = document.getElementById('next-question-button');

    // Existing logic to set initial state and add event listeners
    submitButton.disabled = true;
    submitButton.addEventListener('click', checkAnswers);
    nextQuestionButton.addEventListener('click', nextQuestion);

    const draggables = document.querySelectorAll('.draggable');
    const blanks = document.querySelectorAll('.text-box, .quarter');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', drag);
    });
    blanks.forEach(blank => {
        blank.addEventListener('dragover', allowDrop);
        blank.addEventListener('drop', drop);
    });

    checkSubmitButtonState(); // Initial state check

    // Call the query parameter handling function
    handleQueryParameters();
});

// Attach globally accessible functions (if needed by HTML)
window.submitAnswers = checkAnswers;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;

function handleQueryParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const session = urlParams.get('session');

    if (course && session) {
        // Hide the course setup form
        const courseSetup = document.getElementById('course-setup');
        if (courseSetup) {
            courseSetup.classList.add('hidden');
        }

        // Show course details
        const courseTitle = `Course: ${course}, Session: ${session}`;
        const courseTitleElement = document.getElementById('course-title');
        if (courseTitleElement) {
            courseTitleElement.textContent = courseTitle;
            courseTitleElement.classList.remove('hidden');
        }
    }
}

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
        zone.style.backgroundColor = '#BCCF04'; // Reset to lime green

        // Remove all non-arrow child elements
        Array.from(zone.children).forEach(child => {
            if (!child.classList.contains('arrow')) {
                zone.removeChild(child);
            }
        });

        // Clear any existing text content
        zone.textContent = ''; // Completely remove existing text like A, B, C

        // Add the correct answer text
        const answerText = document.createElement('span');
        answerText.textContent = correctAnswers[zone.id] || '';
        answerText.style.textAlign = 'center';
        zone.appendChild(answerText);

        // Re-add arrows for quarters
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

    // Hide game-related elements
    document.getElementById('instructions-container').classList.add('hidden');
    document.getElementById('draggable-container').classList.add('hidden');
    document.getElementById('submit-button').classList.add('hidden');
    document.getElementById('next-question-button').classList.add('hidden');

    // Show the final question
    const finalQuestionContainer = document.getElementById('final-question-container');
    finalQuestionContainer.style.display = 'block'; // Ensure visibility
    finalQuestionContainer.classList.remove('hidden');
    finalQuestionContainer.classList.add('visible');

    // Ensure the final submit button is disabled initially
    const finalSubmitButton = document.getElementById('final-submit-button');
    finalSubmitButton.disabled = true;
}

let selectedFinalOption = null; // Track the selected answer

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

function submitFinalAnswer() {
    const data = {
        timestamp: Date.now(),
        course: getFromStorage('courseCode', 'DefaultCourseCode'),
        session: getFromStorage('sessionNumber', 'DefaultSessionNumber'),
        correctAnswers: correctAnswersCount,
        incorrectGuesses: incorrectGuesses,
        finalResponse: selectedFinalOption
    };

    submitGameData(data);
}

function dragStart(event) {
    if (event.type === 'touchstart') {
        event.target.dataset.dragging = 'true';
    } else {
        event.dataTransfer.setData("text", event.target.id);
    }
}

function dragOver(event) {
    event.preventDefault(); // Allow dropping
}

// Add event listeners for both mouse and touch
function enableDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    const dropZones = document.querySelectorAll('.text-box, .quarter');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', dragStart);
        draggable.addEventListener('touchstart', dragStart);
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('drop', drop);
        zone.addEventListener('touchend', drop);
    });
}

// Initialize drag and drop functionality
document.addEventListener('DOMContentLoaded', enableDragAndDrop);

document.addEventListener('DOMContentLoaded', () => {
    if (typeof course !== 'undefined' && typeof session !== 'undefined') {
        const courseTitleElement = document.getElementById('course-title');
        if (courseTitleElement) {
            courseTitleElement.textContent = `Course: ${course}, Session: ${session}`;
            courseTitleElement.classList.remove('hidden');
        }
    }
});

function calculateAndDisplayStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) {
        console.error('Stats container not found in the DOM.');
        return;
    }
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const totalGames = stats.length;
    const totalScore = stats.reduce((sum, game) => sum + (game.correctAnswers || 0), 0);
    const averageScore = totalGames > 0 ? (totalScore / totalGames).toFixed(2) : 0;

    statsContainer.innerHTML = `
        <h3>Game Statistics</h3>
        <p>Total Games Played: ${totalGames}</p>
        <p>Total Correct Answers: ${totalScore}</p>
        <p>Average Score: ${averageScore}</p>
    `;
}

document.addEventListener('DOMContentLoaded', calculateAndDisplayStats);

function resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        localStorage.removeItem('gameStats');
        calculateAndDisplayStats();
        alert('Statistics have been reset.');
    }
}

function exportStats() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const csvContent = [
        ['Date', 'Course', 'Session', 'Correct Answers', 'Incorrect Guesses', 'Final Response'],
        ...stats.map(stat => [
            new Date(stat.timestamp).toLocaleString(),
            stat.course,
            stat.session,
            stat.correctAnswers,
            stat.incorrectGuesses?.join('; '),
            stat.finalResponse,
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'game_statistics.csv';
    link.click();
}

function showTab(tabId) {
    const tabContent = document.getElementById(tabId);
    if (!tabContent) {
        console.error(`Tab with ID ${tabId} does not exist.`);
        return;
    }
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    tabContent.classList.remove('hidden');
}

function displaySubmissionTally() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const tally = stats.length;

    document.getElementById('submission-tally').innerHTML = `
        <p>Total Submissions: ${tally}</p>
    `;
}

showTab('stats-tally');
displaySubmissionTally();

function createBarChart() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const correctCounts = stats.map(stat => stat.correctAnswers);

    const ctx = document.getElementById('bar-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map((_, index) => `Player ${index + 1}`),
            datasets: [{
                label: 'Correct Guesses',
                data: correctCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createWordCloud() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const incorrectGuesses = stats.flatMap(stat => stat.incorrectGuesses || []);
    const wordCounts = {};

    incorrectGuesses.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const wordArray = Object.entries(wordCounts).map(([word, count]) => [word, count]);

    WordCloud(document.getElementById('word-cloud'), { list: wordArray });
}

function isLocalStorageAvailable() {
    try {
        const testKey = 'test';
        localStorage.setItem(testKey, 'testValue');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

if (isLocalStorageAvailable()) {
    // Safe to use localStorage
} else {
    console.error('LocalStorage is not available in this context.');
}

function updateSubmissionTally() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const tally = {};

    stats.forEach(stat => {
        const session = stat.session || 'Unknown';
        tally[session] = (tally[session] || 0) + 1;
    });

    const tallyList = document.getElementById('submission-tally-list');
    tallyList.innerHTML = ''; // Clear previous tally
    Object.keys(tally).forEach(session => {
        const listItem = document.createElement('li');
        listItem.textContent = `${session}: ${tally[session]} submissions`;
        tallyList.appendChild(listItem);
    });
}

// Call this whenever stats are updated
updateSubmissionTally();

function viewStats() {
    const session = document.getElementById('stats-session-select').value;
    const stats = JSON.parse(localStorage.getItem('gameStats')) || [];
    const filteredStats = session === 'all'
        ? stats
        : stats.filter(stat => stat.session === session);

    const statsDisplay = document.getElementById('stats-display');
    statsDisplay.innerHTML = `<h4>Statistics for ${session === 'all' ? 'All Sessions' : `Session ${session}`}</h4>`;

    // Example: Display total correct answers
    const totalCorrect = filteredStats.reduce((sum, stat) => sum + (stat.correctAnswers || 0), 0);
    statsDisplay.innerHTML += `<p>Total Correct Answers: ${totalCorrect}</p>`;
}

function generateLink() {
    const courseName = document.getElementById('course-name').value.trim();
    const sessionNumber = document.getElementById('session-number').value;

    if (!courseName) {
        alert('Please enter a course name.');
        return;
    }

    const baseUrl = `${window.location.origin}/MfIgame/`;
    const sessionLink = `${baseUrl}?course=${encodeURIComponent(courseName)}&session=${encodeURIComponent(sessionNumber)}`;

    const linkOutput = document.getElementById('link-output');
    linkOutput.textContent = sessionLink;

    const generatedLinkContainer = document.getElementById('generated-link');
    generatedLinkContainer.classList.remove('hidden');
}

function copyLink() {
    const linkOutput = document.getElementById('link-output').textContent;
    navigator.clipboard.writeText(linkOutput)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy link:', err));
}

function setCourse(event) {
    event.preventDefault();
    const courseName = document.getElementById('course-name').value.trim();
    if (!courseName) {
        alert('Please enter a course name.');
        return;
    }

    document.getElementById('current-course').textContent = courseName;
    document.getElementById('selected-course').classList.remove('hidden');
    document.getElementById('session-options').classList.remove('hidden');
    document.getElementById('submission-tally-container').classList.remove('hidden');
    document.getElementById('stats-view-container').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('backroom-course-form').addEventListener('submit', setCourse);
    updateSubmissionTally();
});

const targetNode = document.getElementById('target-element-id');
if (targetNode) {
    const observer = new MutationObserver(callbackFunction);
    observer.observe(targetNode, { attributes: true });
} else {
    console.error('Target node for MutationObserver does not exist.');
}
