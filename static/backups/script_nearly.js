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

        submitButton.disabled = !hasDraggable;
    }

    function checkAnswers() {
        // Disable the submit button to prevent multiple submissions
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#ccc';
        console.log('Submit button disabled');
    
        const correctAnswers = {
            box1: 'word17', // Correct answer for Aim
            box2: 'word3',  // Correct answer for Measure
            box3: 'word9',  // Correct answer for Change Ideas
            quarter1: 'word11', // Correct answer for Plan
            quarter2: 'word6',  // Correct answer for Do
            quarter3: 'word10', // Correct answer for Study
            quarter4: 'word20'  // Correct answer for Act
        };
    
        function applyRotation(quarterId, element) {
            if (quarterId === "quarter2") {
                element.style.transform = "rotate(-90deg)";
            } else if (quarterId === "quarter3") {
                element.style.transform = "rotate(180deg)";
            } else if (quarterId === "quarter4") {
                element.style.transform = "rotate(90deg)";
            } else {
                element.style.transform = "rotate(0deg)";
            }
            element.style.transformOrigin = "center center"; // Ensure the rotation origin is correct
        }
    
        // Process each zone
        Object.keys(correctAnswers).forEach(zoneId => {
            const zone = document.getElementById(zoneId);
            if (!zone) {
                console.warn(`Zone with ID ${zoneId} not found.`);
                return; // Skip this zone if it doesn't exist
            }
    
            const child = zone.querySelector('.draggable');
    
            // Remove draggable children and existing corrections
            Array.from(zone.children).forEach(childNode => {
                if (childNode.classList.contains('draggable') || childNode.textContent.includes('Correct:')) {
                    zone.removeChild(childNode);
                }
            });
    
            // Check if the answer is correct
            if (child && child.id === correctAnswers[zoneId]) {
                zone.style.backgroundColor = '#BCCF04'; // Correct - lime green
                zone.appendChild(child); // Reattach the draggable element
            } else {
                zone.style.backgroundColor = 'grey'; // Incorrect - grey
    
                // Add correction
                const correction = document.createElement('div');
                correction.textContent = child
                    ? `${child.textContent} (Correct: ${document.getElementById(correctAnswers[zoneId]).textContent})`
                    : `Correct: ${document.getElementById(correctAnswers[zoneId]).textContent}`;
                correction.style.color = 'white';
                correction.style.padding = '5px';
                correction.style.textAlign = 'center';
                zone.appendChild(correction);
    
                // Apply rotation if in a quarter
                if (zoneId.startsWith('quarter')) {
                    applyRotation(zoneId, correction);
                }
            }
        });
    
        // Rebind dragstart event to ensure draggables are functional
        const draggables = document.querySelectorAll('.draggable');
        draggables.forEach(draggable => {
            draggable.setAttribute('draggable', 'true'); // Ensure draggable attribute
            draggable.addEventListener('dragstart', drag); // Reattach dragstart
        });
    
        // Update instructions and enable "Next Question" button
        document.getElementById('initial-instructions').style.display = 'none';
        document.getElementById('next-instructions').style.display = 'block';
        document.getElementById('next-question-button').style.display = 'block';
    }       

    function nextQuestion() {
        // Reset the game area to lime green
        const zones = document.querySelectorAll('.text-box, .quarter');
        zones.forEach(zone => {
            zone.style.backgroundColor = '#BCCF04'; // Reset to lime green
            zone.innerHTML = ''; // Clear all child elements
        });

        // Update the game area with the correct answers
        const correctAnswers = {
            box1: 'Aim',
            box2: 'Measure',
            box3: 'Change Ideas',
            quarter1: 'Plan',
            quarter2: 'Do',
            quarter3: 'Study',
            quarter4: 'Act'
        };

        Object.keys(correctAnswers).forEach(zoneId => {
            const zone = document.getElementById(zoneId);
            if (!zone) {
                console.warn(`Zone with ID ${zoneId} not found.`);
                return;
            }

            // Add the correct answer to the zone
            const answerElement = document.createElement('span');
            answerElement.textContent = correctAnswers[zoneId];
            zone.appendChild(answerElement);

            // Apply rotation if the zone is a quarter
            if (zoneId.startsWith('quarter')) {
                answerElement.style.display = 'block'; // Ensure text is displayed
                answerElement.style.textAlign = 'center';
                answerElement.style.transformOrigin = 'center center';
                if (zoneId === 'quarter2') {
                    answerElement.style.transform = 'rotate(-90deg)';
                } else if (zoneId === 'quarter3') {
                    answerElement.style.transform = 'rotate(180deg)';
                } else if (zoneId === 'quarter4') {
                    answerElement.style.transform = 'rotate(90deg)';
                } else {
                    answerElement.style.transform = 'rotate(0deg)';
                }
            }
        });
        
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
    submitButton.addEventListener('click', checkAnswers);
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
