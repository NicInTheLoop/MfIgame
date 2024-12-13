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
        const child = element.querySelector('.draggable'); // First child element with class 'draggable'

        console.log(`Checking ${key}: expected ${correctAnswers[key]}, found ${child ? child.id : 'none'}`);

        // Check the answer
        if (child && child.id === correctAnswers[key]) {
            element.style.backgroundColor = '#BCCF04'; // Correct (lime green)
        } else {
            element.style.backgroundColor = 'grey'; // Incorrect

            // Change the incorrect draggable button to the usual pink
            if (child) {
                child.style.backgroundColor = '#e6027e'; // Usual pink
                // Append the correct answer in brackets
                child.textContent = `${child.textContent.split(' (Correct:')[0]} (Correct: ${document.getElementById(correctAnswers[key]).textContent})`;
            }

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
        }
    });

    document.getElementById('submit-button').addEventListener('click', () => {
        const submitButton = document.getElementById('submit-button');
        const nextQuestionButton = document.getElementById('next-question-button');
        const instructionsContainer = document.querySelector('.instructions-container');
        const oldInstructions = document.querySelector('.instructions');
    
        // Disable the submit button and update its style
        submitButton.disabled = true;
        submitButton.classList.add('disabled');
    
        // Show the next question button
        nextQuestionButton.style.display = 'inline-block';
    
        // Replace the instructions box
        oldInstructions.style.display = 'none'; // Hide the old instructions
        const newInstructions = document.createElement('div');
        newInstructions.className = 'instructions';
        newInstructions.innerHTML = '<h2>Click here to move on to the final question</h2>';
        instructionsContainer.appendChild(newInstructions);
    });
    
    

}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
