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

function drag(event) {
    event.dataTransfer.setData("text", event.target.id);
}

function drop(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text");
    var draggedElement = document.getElementById(data);
    if (event.target.classList.contains('text-box') || event.target.classList.contains('quarter')) {
        event.target.appendChild(draggedElement);
    }
}

function submitAnswers() {
    // Correct answers
    const correctAnswers = {
        box1: "Aim",
        box2: "Measures",
        box3: "Change Ideas",
        quarter1: "Plan",
        quarter2: "Do",
        quarter3: "Study",
        quarter4: "Act"
    };

    let score = 0; // Initialize score
    let hasGuesses = false; // Track if there are any guesses

    // Collect guesses and check each box and quarter
    const guesses = {};
    for (const [id, correctAnswer] of Object.entries(correctAnswers)) {
        const element = document.getElementById(id);
        const answerElement = element.querySelector(".draggable");
        const answer = answerElement ? answerElement.textContent : "";
        guesses[id] = answer;
        if (answer) {
            hasGuesses = true; // There is at least one guess
        }
        if (answer === correctAnswer) {
            element.style.backgroundColor = "#BCCF04"; // Lime green for correct answer
            score++; // Increment score for correct answer
        } else {
            element.style.backgroundColor = "grey"; // Grey for incorrect answer
            // Display the incorrect guess followed by the correct answer
            if (answerElement && !answerElement.querySelector(".correct-answer")) {
                const correctAnswerElement = document.createElement("span");
                correctAnswerElement.textContent = ` (Correct: ${correctAnswer})`;
                correctAnswerElement.style.color = "white";
                correctAnswerElement.style.marginLeft = "10px";
                correctAnswerElement.classList.add("correct-answer");
                answerElement.appendChild(correctAnswerElement);
            }
            // Reset the rotation for the incorrect answer
            if (element.classList.contains("quarter")) {
                answerElement.style.transform = "none";
            }
        }
    }

    // Exclude cases where no guesses were made
    if (!hasGuesses) {
        alert("Please make at least one guess before submitting.");
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = false;
        submitButton.classList.remove('disabled');
        return;
    }

    // Display the score to the player
    alert(`Your score is ${score} out of 7`);

    // Show the next question button
    document.getElementById('next-question-button').style.display = 'block';

    // Collect additional data (e.g., course name)
    const courseName = prompt("Please enter the course name:");

    // Send the results to the server
    fetch('/submit-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guesses, score, courseName })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function ensureArrowsVisible() {
    const arrows = ['arrow1', 'arrow2', 'arrow3', 'arrow4'];
    arrows.forEach(arrowId => {
        const arrow = document.getElementById(arrowId);
        if (arrow) {
            arrow.style.display = 'block';
            arrow.style.visibility = 'visible';
        }
    });
}

function nextQuestion() {
    // Hide the instructions and draggable buttons
    document.getElementById('instructions-container').style.display = 'none';
    document.getElementById('draggable-container').style.display = 'none';

    // Display the new question
    const newQuestionContainer = document.getElementById('new-question-container');
    newQuestionContainer.style.display = 'block';
    newQuestionContainer.innerHTML = `
        <div class="new-question">
            <h3>How familiar are you with the entire Model for Improvement (ie from start to finish)?</h3>
            <button onclick="checkAnswer('Answer 1')">First time I've seen it</button>
            <button onclick="checkAnswer('Answer 2')">Seen it, trying it</button>
            <button onclick="checkAnswer('Answer 3')">Tried it, want to know more</button>
            <button onclick="checkAnswer('Answer 4')">Know it well</button>
        </div>
    `;

    // Populate the Game Area with the correct answers
    const correctAnswers = {
        box1: "Aim",
        box2: "Measures",
        box3: "Change Ideas",
        quarter1: "Plan",
        quarter2: "Do",
        quarter3: "Study",
        quarter4: "Act"
    };

    for (const [id, correctAnswer] of Object.entries(correctAnswers)) {
        const element = document.getElementById(id);
        element.innerHTML = `<span>${correctAnswer}</span>`;
        element.style.backgroundColor = ""; // Reset background color
    }

    // Ensure the arrows are still visible
    ensureArrowsVisible();
}

function checkAnswer(answer) {
    // Implement the logic to check the answer and provide feedback
    alert(`You selected: ${answer}`);
}
