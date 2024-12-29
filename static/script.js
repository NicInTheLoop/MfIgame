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


function submitGameData(data) {
    console.log('Submitting data to API:', JSON.stringify(data, null, 2));

    fetch('https://script.google.com/macros/s/AKfycbx8plC_7LyN0nR5wHkAIWECeyqXtXCs8qTIqys4LtKiECl7TNvp4o_IoL-tuifcigvuYw/exec', {
        method: 'POST',
        mode: 'cors', // Enable CORS
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((result) => {
            console.log('Data submitted successfully:', result);
        })
        .catch((error) => {
            console.error('Error submitting data:', error);
        });
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
    const draggables = document.querySelectorAll('.draggable');
    const dropZones = document.querySelectorAll('.text-box, .quarter');
    let allDropped = true;

    dropZones.forEach(zone => {
        if (!zone.querySelector('.draggable')) {
            allDropped = false;
        }
    });

    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.disabled = !allDropped;
    }
}


function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();

    let data;
    if (event.type === 'touchend') {
        // Find the element marked as dragging
        data = document.querySelector('[data-dragging="true"]');
    } else {
        // Get the dragged element's ID
        const draggedId = event.dataTransfer.getData("text");
        data = document.getElementById(draggedId);
    }

    const dropZone = event.target.closest('.text-box, .quarter');
    console.log(`Dropped in: ${dropZone ? dropZone.id : 'None'}`);
    if (dropZone && data) {
        // Append the dragged element to the drop zone
        dropZone.appendChild(data);

        // Apply rotation based on the drop zone
        if (dropZone.id === "quarter2") {
            data.style.transform = "rotate(-90deg)";
        } else if (dropZone.id === "quarter3") {
            data.style.transform = "rotate(180deg)";
        } else if (dropZone.id === "quarter4") {
            data.style.transform = "rotate(90deg)";
        } else {
            data.style.transform = "rotate(0deg)";
        }
    }

    // Clear dragging data
    if (data) {
        data.removeAttribute('data-dragging');
    }

    // Recheck the submit button state
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

    const courseCode = localStorage.getItem('courseCode') || 'DefaultCourseCode';
    const sessionNumber = localStorage.getItem('sessionNumber') || 'DefaultSessionNumber';

    const data = {
        course: courseCode,
        session: sessionNumber,
        finalResponse: selectedFinalOption.textContent,
    };

    submitGameData(data);
    console.log("Final question data sent to Google Sheets:", data);


    console.log('Final answer submitted:', selectedFinalOption.textContent);
}

function dragStart(event) {
    if (event.type === 'touchstart') {
        // Store the dragged element's ID in the data transfer object for touch
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
