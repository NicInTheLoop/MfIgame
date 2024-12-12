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
    if (!document.getElementById('submit-button').classList.contains('disabled')) {
        submitAnswers();
        // Disable the submit button after it has been pressed
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.classList.add('disabled');
    }
});

function allowDrop(event) {
    event.preventDefault();
}

function submitAnswers() {
    console.log("submitAnswers called");

    const correctAnswers = {
        box1: 'word20', // Act
        box2: 'word3',  // Measure
        box3: 'word9',  // Change Ideas
        quarter1: 'word11', // Plan
        quarter2: 'word6',  // Do
        quarter3: 'word10', // Study
        quarter4: 'word17'  // Aim
    };

    Object.keys(correctAnswers).forEach(key => {
        const element = document.getElementById(key);
        const child = element.children[0]; // First child element

        // Clear previous children added for corrections
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }

        // Check the answer
        if (child && child.id === correctAnswers[key]) {
            element.style.backgroundColor = '#BCCF04'; // Correct (lime green)
            element.textContent = child.textContent; // Reset to only the dragged word
        } else {
            element.style.backgroundColor = 'grey'; // Incorrect

            // Change the incorrect draggable button to a lighter shade of pink
            if (child) {
                child.style.backgroundColor = '#f4a6d7'; // Lighter shade of pink
            }

            // Show correct answer in a styled box
            const correctElement = document.createElement('div');
            correctElement.textContent = document.getElementById(correctAnswers[key]).textContent;
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
        }
    });
}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
