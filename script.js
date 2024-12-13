// Enable drag-and-drop functionality
const draggables = document.querySelectorAll('.draggable');
const blanks = document.querySelectorAll('.text-box, .quarter');
const draggableContainer = document.getElementById('draggable-container'); // Define the draggable area

draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', draggable.id);
        draggable.classList.add('dragging');
    });

    draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
    });
});

blanks.forEach(blank => {
    blank.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
        e.dataTransfer.dropEffect = 'move';
    });

    blank.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const draggable = document.getElementById(id);
        if (draggable) {
            // If the blank already has a child, remove it and put it back into the draggable area
            if (blank.children.length > 0) {
                const existingChild = blank.children[0];
                draggableContainer.appendChild(existingChild);
            }
            blank.appendChild(draggable);
            // Rotate the text inside the quarter
            if (blank.classList.contains('quarter')) {
                if (blank.id === 'quarter1') {
                    draggable.style.transform = 'rotate(0deg)';
                } else if (blank.id === 'quarter2') {
                    draggable.style.transform = 'rotate(-90deg)';
                } else if (blank.id === 'quarter3') {
                    draggable.style.transform = 'rotate(180deg)';
                } else if (blank.id === 'quarter4') {
                    draggable.style.transform = 'rotate(90deg)';
                }
            } else {
                draggable.style.transform = 'rotate(0deg)'; // Reset rotation for text-boxes
            }
        }
    });
});

// Ensure the event listener is only attached once
document.getElementById('submit-button').addEventListener('click', () => {
    const blanks = document.querySelectorAll('.text-box, .quarter');
    let emptyCount = 0;

    // Count blank spaces
    blanks.forEach(blank => {
        if (!blank.querySelector('.draggable')) {
            emptyCount++;
        }
    });

    console.log(`Number of blank spaces: ${emptyCount}`); // Debugging log

    // If there are too many blanks, alert and exit
    if (emptyCount >= 4) {
        alert("You've left too many answers blank. Drag and drop answers into the correct boxes in the cycle.");
        return; // Exit the function here
    }

    // If there are fewer than 4 blanks, proceed
    submitAnswers();

    // Disable the submit button after it has been pressed
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.classList.add('disabled');

    // Show the next question button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.style.display = 'inline-block';
});

function allowDrop(event) {
    event.preventDefault();
}

function submitAnswers() {
    console.log("submitAnswers called");

    const correctAnswers = {
        box1: 'word17', // Aim
        box2: 'word3',  // Measure
        box3: 'word9',  // Change Ideas
        quarter1: 'word11', // Plan
        quarter2: 'word6',  // Do
        quarter3: 'word10', // Study
        quarter4: 'word20'  // Act
    };

    Object.keys(correctAnswers).forEach(key => {
        const element = document.getElementById(key);
        const child = element.querySelector('.draggable'); // First child element with class 'draggable'

        console.log(`Checking ${key}: expected ${correctAnswers[key]}, found ${child ? child.id : 'none'}`);

        // Clear previous children added for corrections
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }

        // Check the answer
        if (child && child.id === correctAnswers[key]) {
            element.style.backgroundColor = '#BCCF04'; // Correct (lime green)
            element.appendChild(child); // Ensure the child is re-appended
        } else {
            element.style.backgroundColor = 'grey'; // Incorrect or blank

            // If the box is blank, show the correct answer
            if (!child) {
                const correctElement = document.createElement('div');
                correctElement.textContent = `blank (Correct: ${document.getElementById(correctAnswers[key]).textContent})`;
                correctElement.style.color = 'white';
                correctElement.style.backgroundColor = 'grey';
                correctElement.style.border = '2px solid #e6027e';
                correctElement.style.padding = '10px 15px';
                correctElement.style.margin = '5px';
                correctElement.style.borderRadius = '5px';
                correctElement.style.display = 'inline-block';

                // Apply the same rotation as the draggable button
                if (element.classList.contains('quarter')) {
                    if (element.id === 'quarter1') {
                        correctElement.style.transform = 'rotate(0deg)';
                    } else if (element.id === 'quarter2') {
                        correctElement.style.transform = 'rotate(-90deg)';
                    } else if (element.id === 'quarter3') {
                        correctElement.style.transform = 'rotate(180deg)';
                    } else if (element.id === 'quarter4') {
                        correctElement.style.transform = 'rotate(90deg)';
                    }
                }

                element.appendChild(correctElement);
            } else {
                // Change the incorrect draggable button to the usual pink
                child.style.backgroundColor = '#e6027e'; // Usual pink
                // Append the correct answer in brackets
                child.textContent = `${child.textContent.split(' (Correct:')[0]} (Correct: ${document.getElementById(correctAnswers[key]).textContent})`;

                // Apply the same rotation as the draggable button
                if (element.classList.contains('quarter')) {
                    if (element.id === 'quarter1') {
                        child.style.transform = 'rotate(0deg)';
                    } else if (element.id === 'quarter2') {
                        child.style.transform = 'rotate(-90deg)';
                    } else if (element.id === 'quarter3') {
                        child.style.transform = 'rotate(180deg)';
                    } else if (element.id === 'quarter4') {
                        child.style.transform = 'rotate(90deg)';
                    }
                }
                element.appendChild(child); // Ensure the child is re-appended
            }
        }
    });

    // Disable the submit button after it has been pressed
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.classList.add('disabled');

    // Show the next question button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.style.display = 'inline-block';

    // Update the instructions
    const initialInstructions = document.getElementById('initial-instructions');
    const nextInstructions = document.getElementById('next-instructions');
    initialInstructions.style.display = 'none';
    nextInstructions.style.display = 'block';

    // Disable dragging for all draggable elements
    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', 'false');
        draggable.removeEventListener('dragstart', drag);
        draggable.removeEventListener('dragend', drag);
    });
}

function resetGame() {
    // Reset the game to its initial state
    const blanks = document.querySelectorAll('.text-box, .quarter');
    blanks.forEach(blank => {
        while (blank.firstChild) {
            const child = blank.firstChild;
            draggableContainer.appendChild(child);
            blank.removeChild(child);
        }
        blank.style.backgroundColor = ''; // Reset background color
    });

    // Enable dragging for all draggable elements
    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', 'true');
        draggable.addEventListener('dragstart', drag);
        draggable.addEventListener('dragend', drag);
    });

    // Reset the submit button
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = false;
    submitButton.classList.remove('disabled');

    // Hide the next question button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.style.display = 'none';

    // Reset the instructions
    const initialInstructions = document.getElementById('initial-instructions');
    const nextInstructions = document.getElementById('next-instructions');
    initialInstructions.style.display = 'block';
    nextInstructions.style.display = 'none';
}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
