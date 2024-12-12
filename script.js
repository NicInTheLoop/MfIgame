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
            draggable.style.transform = 'rotate(-90deg)'; // Rotate the draggable element
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

    let allCorrect = true;

    for (const [boxId, correctWordId] of Object.entries(correctAnswers)) {
        const box = document.getElementById(boxId);
        const word = box.querySelector('.draggable');
        if (word && word.id === correctWordId) {
            word.style.backgroundColor = 'green';
        } else {
            allCorrect = false;
            if (word) {
                word.style.backgroundColor = 'grey';
                // Show the correct answer below the incorrect one
                const correctWord = document.getElementById(correctWordId).cloneNode(true);
                correctWord.style.backgroundColor = 'green';
                correctWord.style.transform = 'rotate(0deg)'; // Reset rotation for correct answer
                box.appendChild(correctWord);
            }
        }
    }

    if (allCorrect) {
        document.getElementById('next-question-button').style.display = 'block';
    }
}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
