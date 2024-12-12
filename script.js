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
        const child = element.children[0];
        if (child && child.id === correctAnswers[key]) {
            element.style.backgroundColor = 'green';
        } else {
            element.style.backgroundColor = 'grey';
            // Show the correct answer in brackets
            const correctElement = document.createElement('span');
            correctElement.textContent = ` (${document.getElementById(correctAnswers[key]).textContent})`;
            correctElement.style.color = 'red';
            element.appendChild(correctElement);
        }
    });
}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
