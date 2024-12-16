document.addEventListener('DOMContentLoaded', function() {
    const submitButton = document.getElementById('submit-button');
    const nextQuestionButton = document.getElementById('next-question-button');
    const instructionsContainer = document.getElementById('instructions-container');
    const draggableContainer = document.getElementById('draggable-container');
    const finalQuestionContainer = document.querySelector('.final-question-container');

    // Initial state
    submitButton.disabled = true;

    window.allowDrop = function(event) {
        event.preventDefault();
    }

    window.drag = function(event) {
        event.dataTransfer.setData("text", event.target.id);
    }

    window.drop = function(event) {
        event.preventDefault();
        var data = event.dataTransfer.getData("text");
        var draggedElement = document.getElementById(data);
        var dropTarget = event.target;

        // Ensure the drop target is a valid drop zone
        if (dropTarget.classList.contains("text-box") || dropTarget.classList.contains("quarter") || dropTarget.parentElement.classList.contains("quarter")) {
            if (!dropTarget.classList.contains("quarter") && dropTarget.parentElement.classList.contains("quarter")) {
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
        checkSubmitButtonState();
    }

    function checkSubmitButtonState() {
        const dropZones = document.querySelectorAll('.text-box, .quarter');
        let hasDraggable = false;

        dropZones.forEach(zone => {
            if (zone.children.length > 0) {
                hasDraggable = true;
            }
        });

        console.log("Checking submit button state. Has draggable:", hasDraggable);

        if (hasDraggable) {
            submitButton.disabled = false;
            submitButton.style.backgroundColor = '#87898A'; // Grey background
            submitButton.style.cursor = 'pointer';
        } else {
            submitButton.disabled = true;
            submitButton.style.backgroundColor = '#ccc'; // Disabled background
            submitButton.style.cursor = 'not-allowed';
        }
    }

    window.submitAnswers = function () {
        console.log("submitAnswers called");
    
        const correctAnswers = {
            box1: 'word17', // Correct answer for Aim
            box2: 'word3',  // Correct answer for Measure
            box3: 'word9',  // Correct answer for Change Ideas
            quarter1: 'word11', // Correct answer for Plan
            quarter2: 'word6',  // Correct answer for Do
            quarter3: 'word10', // Correct answer for Study
            quarter4: 'word20'  // Correct answer for Act
        };
    
        Object.keys(correctAnswers).forEach(zoneId => {
            const zone = document.getElementById(zoneId);
            const child = zone.querySelector('.draggable');
    
            // Clear previous content
            while (zone.firstChild) {
                zone.removeChild(zone.firstChild);
            }
    
            // Check if the answer is correct
            if (child && child.id === correctAnswers[zoneId]) {
                zone.style.backgroundColor = '#BCCF04'; // Correct - lime green
                zone.appendChild(child); // Reattach the draggable element
            } else {
                zone.style.backgroundColor = 'grey'; // Incorrect - grey
    
                // Show correct answer if the box is empty or incorrect
                const correction = document.createElement('div');
                correction.textContent = child
                    ? `${child.textContent} (Correct: ${document.getElementById(correctAnswers[zoneId]).textContent})`
                    : `Correct: ${document.getElementById(correctAnswers[zoneId]).textContent}`;
                correction.style.color = 'white';
                correction.style.padding = '5px';
                zone.appendChild(correction);
            }
        });
    
        // Update instructions and enable "Next Question" button
        document.getElementById('initial-instructions').style.display = 'none';
        document.getElementById('next-instructions').style.display = 'block';
        document.getElementById('next-question-button').style.display = 'block';
    
        // Disable submit button
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#ccc';
    };

    function nextQuestion() {
        // Hide the instructions, draggable buttons, and submit button
        instructionsContainer.style.display = 'none';
        draggableContainer.style.display = 'none';
        submitButton.style.display = 'none';
        nextQuestionButton.style.display = 'none';

        // Display the final question
        finalQuestionContainer.style.display = 'block';

        // Ensure the final question is aligned within the .right-container
        document.querySelector('.right-container').appendChild(finalQuestionContainer);
    }

    // Attach event listeners
    submitButton.addEventListener('click', submitAnswers);
    nextQuestionButton.addEventListener('click', nextQuestion);

    // Enable drag-and-drop functionality
    const draggables = document.querySelectorAll('.draggable');
    const blanks = document.querySelectorAll('.text-box, .quarter');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', drag);
    });

    blanks.forEach(blank => {
        blank.addEventListener('dragover', allowDrop);
        blank.addEventListener('drop', drop);
    });

    // Initial check to ensure the submit button state is correct
    checkSubmitButtonState();
});
