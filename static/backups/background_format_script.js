document.getElementById('course-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const courseCode = document.getElementById('course-code').value.trim();
    const sessionNumber = document.getElementById('session-number').value.trim();
    const isGitHubPages = window.location.hostname === 'nicintheloop.github.io';
    const basePath = isGitHubPages ? '/MfIgame' : '';
    const sessionLink = `${window.location.origin}${basePath}/?course=${encodeURIComponent(courseCode)}&session=${sessionNumber}`;

    // Update the link output and show the link container
    document.getElementById('link-output').textContent = sessionLink;
    document.getElementById('session-link').style.display = 'block';
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

        // Show the game area
        document.getElementById('game-area').style.display = 'flex';
    }
});


let correctAnswersCount = 0;
let incorrectGuesses = [];
let finalQuestionResponse = '';

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


function allowDrop(event) {
    event.preventDefault(); // Always allow dropping
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

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

        // Check if the drop target already has a draggable inside
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
            draggedElement.style.transform = "rotate(0deg)";
        }
    } else {
        console.warn("Invalid drop target:", dropTarget.id);
    }

    checkSubmitButtonState();
}



// DOMContentLoaded Listener
document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.getElementById('submit-button');
    const nextQuestionButton = document.getElementById('next-question-button');

    // Set initial state
    submitButton.disabled = true;

    // Add event listeners
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

    // Initial check to disable/enable the submit button
    checkSubmitButtonState();
});

// Attach globally accessible functions (if needed by HTML)
window.submitAnswers = checkAnswers;
window.allowDrop = allowDrop;
window.drag = drag;
window.drop = drop;

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
}

// Function to view statistics
function viewStatistics() {
    // Open the statistics page in a new tab
    const isGitHubPages = window.location.hostname === 'nicintheloop.github.io';
    const basePath = isGitHubPages ? '/MfIgame' : '';
    const statisticsLink = `${window.location.origin}${basePath}/statistics`;
    window.open(statisticsLink, '_blank');
}

// Example function to collect and save statistics
function collectStatistics() {
    // Example: Collect data
    const correctCount = correctAnswersCount;
    const incorrect = incorrectGuesses;
    const finalResponse = finalQuestionResponse;

    // Save to local storage or send to a backend
    const statistics = {
        correctCount,
        incorrect,
        finalResponse,
    };

    // Save in local storage or send to an API
    localStorage.setItem('gameStatistics', JSON.stringify(statistics));
    console.log('Statistics collected:', statistics);
}

// Ensure statistics are saved when the game completes
document.getElementById('final-submit-button').addEventListener('click', collectStatistics);
