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
    // Implement the logic to check the answers and provide feedback
    // For now, just show the next question button
    document.getElementById('next-question-button').style.display = 'block';
}

function nextQuestion() {
    console.log("nextQuestion called");
    // Implement the logic to load the next question
    alert('Next question logic not implemented yet.');
}
