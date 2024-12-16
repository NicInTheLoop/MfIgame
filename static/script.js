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

    // Proceed with submitAnswers if the above condition is not met
    submitAnswers();
});

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text");
    var draggedElement = document.getElementById(data);
    var dropTarget = event.target;

    // Ensure the drop target is a quarter
    if (dropTarget.classList.contains("quarter") || dropTarget.parentElement.classList.contains("quarter")) {
        if (!dropTarget.classList.contains("quarter")) {
            dropTarget = dropTarget.parentElement;
        }
        dropTarget.appendChild(draggedElement);

        // Apply rotation based on the quarter
        if (dropTarget.id === "quarter2") {
            draggedElement.style.transform = "rotate(-90deg)";
        } else if (dropTarget.id === "quarter3") {
            draggedElement.style.transform = "rotate(180deg)";
        } else if (dropTarget.id === "quarter4") {
            draggedElement.style.transform = "rotate(90deg)";
        } else {
            draggedElement.style.transform = "rotate(0deg)";
        }
    }

    // Enable the submit button if at least one guess is placed
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = false;
    submitButton.style.backgroundColor = '#87898A'; // Grey background
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
                correctElement.textContent = `Correct: ${document.getElementById(correctAnswers[key]).textContent}`;
                correctElement.style.color = 'white';
                correctElement.style.backgroundColor = 'grey';
                element.appendChild(correctElement);

                // Apply rotation based on the quarter
                if (element.id === "quarter2") {
                    correctElement.style.transform = "rotate(-90deg)";
                } else if (element.id === "quarter3") {
                    correctElement.style.transform = "rotate(180deg)";
                } else if (element.id === "quarter4") {
                    correctElement.style.transform = "rotate(90deg)";
                } else {
                    correctElement.style.transform = "rotate(0deg)";
                }
            }
        }
    });

    // Disable the submit button and change its color
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#D3D3D3'; // Very pale grey

    // Show the next question button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.style.display = 'block';
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

    // Fill the game area with the correct answers
    document.getElementById('box1').textContent = 'Aim';
    document.getElementById('box2').textContent = 'Measure';
    document.getElementById('box3').textContent = 'Change Ideas';
    document.getElementById('quarter1').innerHTML = '<span>Plan</span>';
    document.getElementById('quarter2').innerHTML = '<span>Do</span>';
    document.getElementById('quarter3').innerHTML = '<span>Study</span>';
    document.getElementById('quarter4').innerHTML = '<span>Act</span>';

    // Set the background color of text boxes and quarters to lime green
    document.getElementById('box1').style.backgroundColor = '#BCCF04';
    document.getElementById('box2').style.backgroundColor = '#BCCF04';
    document.getElementById('box3').style.backgroundColor = '#BCCF04';
    document.getElementById('quarter1').style.backgroundColor = '#BCCF04';
    document.getElementById('quarter2').style.backgroundColor = '#BCCF04';
    document.getElementById('quarter3').style.backgroundColor = '#BCCF04';
    document.getElementById('quarter4').style.backgroundColor = '#BCCF04';

    // Remove all draggable elements from the game area
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.remove();
    });

    // Hide the instructions, draggable buttons, and submit button
    document.getElementById('instructions-container').style.display = 'none';
    document.getElementById('draggable-container').style.display = 'none';
    document.getElementById('submit-button').style.display = 'none';
    document.getElementById('next-question-button').style.display = 'none';

    // Display the final question
    const finalQuestionContainer = document.querySelector('.final-question-container');
    finalQuestionContainer.style.display = 'block';
}

// Reset function to ensure arrows stay in place and buttons are draggable
function reset() {
    const draggables = document.querySelectorAll('.draggable');
    const draggableContainer = document.getElementById('word-bank');
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
        draggable.style.transform = "rotate(0deg)"; // Reset rotation
    });

    // Reset the submit button
    const submitButton = document.getElementById('submit-button');
    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#87898A'; // Grey background

    // Hide the next question button
    const nextQuestionButton = document.getElementById('next-question-button');
    nextQuestionButton.style.display = 'none';

    // Reset the instructions
    const initialInstructions = document.getElementById('initial-instructions');
    const nextInstructions = document.getElementById('next-instructions');
    initialInstructions.style.display = 'block';
    nextInstructions.style.display = 'none';
}
