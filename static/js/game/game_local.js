// Import Firebase modules
import { doc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js';
import { db } from '/static/firebase_local.js';
import SessionManager from '/static/js/shared/session_local.js';

class GameManager {
    constructor() {
        this.db = db;
        this.session = new SessionManager();
        this.correctAnswersCount = 0;
        this.incorrectGuesses = [];
        this.finalQuestionResponse = '';
    }

    initialize() {
        if (typeof Sortable === 'undefined') {
            console.error('Sortable.js is not loaded!');
            return;
        }
        console.log('Sortable.js is loaded, version:', Sortable.version);
        
        this.setupSortable();
        this.setupEventListeners();
    }

    setupSortable() {
        console.log('Setting up sortable...');
        
        // Basic configuration for all sortable elements
        const sortableOptions = {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            fallbackClass: 'sortable-fallback',
            scroll: true,
            scrollSensitivity: 80,
            scrollSpeed: 30,
            draggable: '.draggable',  // Only drag elements with draggable class
            dragoverBubble: true,     // Enable dragover events on children
            removeCloneOnHide: true   // Remove clone when hiding
        };

        // Initialize word bank
        const wordBank = document.getElementById('word-bank');
        if (wordBank) {
            new Sortable(wordBank, {
                ...sortableOptions,
                sort: false,
                group: {
                    name: 'shared',
                    pull: 'clone',
                    put: true
                }
            });
        }

        // Initialize text boxes
        ['box1', 'box2', 'box3'].forEach(id => {
            const box = document.getElementById(id);
            if (box) {
                new Sortable(box, {
                    ...sortableOptions,
                    sort: false,
                    group: {
                        name: 'shared',
                        pull: true,
                        put: true
                    },
                    onAdd: (evt) => {
                        const box = evt.to;
                        const items = box.getElementsByClassName('draggable');
                        
                        // Move excess items back to word bank
                        if (items.length > 1) {
                            const wordBank = document.getElementById('word-bank');
                            while (items.length > 1) {
                                wordBank.appendChild(items[0]);
                            }
                        }
                        
                        box.classList.add('has-draggable');
                        this.checkSubmitButtonState();
                    },
                    onRemove: (evt) => {
                        evt.from.classList.remove('has-draggable', 'incorrect');
                        // Remove any existing correct answer display
                        const correctAnswer = evt.from.querySelector('.correct-answer');
                        if (correctAnswer) {
                            correctAnswer.remove();
                        }
                        this.checkSubmitButtonState();
                    }
                });
            }
        });

        // Initialize quarters
        ['quarter1', 'quarter2', 'quarter3', 'quarter4'].forEach(id => {
            const quarter = document.getElementById(id);
            if (quarter) {
                new Sortable(quarter, {
                    ...sortableOptions,
                    sort: false,
                    group: {
                        name: 'shared',
                        pull: true,
                        put: true
                    },
                    onAdd: (evt) => {
                        const quarter = evt.to;
                        const items = quarter.getElementsByClassName('draggable');
                        
                        // Move excess items back to word bank
                        if (items.length > 1) {
                            const wordBank = document.getElementById('word-bank');
                            while (items.length > 1) {
                                wordBank.appendChild(items[0]);
                            }
                        }
                        
                        quarter.classList.add('has-draggable');
                        this.checkSubmitButtonState();
                    },
                    onRemove: (evt) => {
                        evt.from.classList.remove('has-draggable', 'incorrect');
                        // Remove any existing correct answer display
                        const correctAnswer = evt.from.querySelector('.correct-answer');
                        if (correctAnswer) {
                            correctAnswer.remove();
                        }
                        this.checkSubmitButtonState();
                    }
                });
            }
        });
    }

    setupEventListeners() {
        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.addEventListener('click', () => this.checkAnswers());
        }

        const nextQuestionButton = document.getElementById('next-question-button');
        if (nextQuestionButton) {
            nextQuestionButton.addEventListener('click', () => this.nextQuestion());
        }

        // Setup final options
        const finalOptions = document.querySelectorAll('.final-option');
        finalOptions.forEach(option => {
            option.addEventListener('click', () => this.selectFinalOption(option));
        });

        const finalSubmitButton = document.getElementById('final-submit-button');
        if (finalSubmitButton) {
            finalSubmitButton.addEventListener('click', () => this.submitFinalAnswer());
        }
    }

    checkSubmitButtonState() {
        const dropZones = document.querySelectorAll('.text-box, .quarter');
        let allZonesHaveDraggable = true;

        dropZones.forEach(zone => {
            const draggableChild = zone.querySelector('.draggable');
            if (!draggableChild) {
                allZonesHaveDraggable = false;
            }
        });

        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.disabled = !allZonesHaveDraggable;
        }
    }

    async checkAnswers() {
        const correctAnswers = {
            box1: 'Aim',
            box2: 'Measure',
            box3: 'Change Ideas',
            quarter1: 'Plan',
            quarter2: 'Do',
            quarter3: 'Study',
            quarter4: 'Act'
        };

        await this.session.ensureStatsDocumentExists();

        const zones = document.querySelectorAll('.text-box, .quarter');
        this.correctAnswersCount = 0;

        zones.forEach(zone => {
            const draggable = zone.querySelector('.draggable');
            if (draggable) {
                // Remove any existing correct answer display
                const existingCorrectAnswer = zone.querySelector('.correct-answer');
                if (existingCorrectAnswer) {
                    existingCorrectAnswer.remove();
                }

                if (draggable.textContent === correctAnswers[zone.id]) {
                    this.correctAnswersCount++;
                    draggable.classList.add('correct');
                    zone.classList.remove('has-draggable', 'incorrect');
                } else {
                    draggable.classList.add('incorrect');
                    zone.classList.add('incorrect');
                    this.incorrectGuesses.push(draggable.textContent);

                    // Add correct answer display
                    const correctAnswer = document.createElement('div');
                    correctAnswer.className = 'correct-answer';
                    correctAnswer.textContent = `Correct: "${correctAnswers[zone.id]}"`;
                    zone.appendChild(correctAnswer);
                }
            }
        });

        // Update Firebase
        const statsRef = doc(this.db, "MFIgameStats",
            `${this.session.getCourseCode()}-Session${this.session.getSessionNumber()}-${this.session.getToday()}`
        );
        
        await updateDoc(statsRef, {
            firstQuestionResponses: arrayUnion({
                score: this.correctAnswersCount,
                incorrectGuesses: this.incorrectGuesses,
                timestamp: new Date().toISOString()
            })
        });

        // Update UI
        document.getElementById('initial-instructions').classList.add('hidden');
        document.getElementById('next-instructions').classList.remove('hidden');
        document.getElementById('next-question-button').style.display = 'block';
        document.getElementById('submit-button').style.display = 'none';
    }

    nextQuestion() {
        // Update text box labels
        document.querySelector('#box1 .box-label').textContent = 'Aim';
        document.querySelector('#box2 .box-label').textContent = 'Measure';
        document.querySelector('#box3 .box-label').textContent = 'Change Ideas';

        // Clear any existing draggables from boxes
        const boxes = document.querySelectorAll('.text-box, .quarter');
        boxes.forEach(box => {
            const draggable = box.querySelector('.draggable');
            if (draggable) {
                draggable.remove();
            }
            box.classList.remove('has-draggable');
        });

        // Hide draggable container only
        document.querySelector('.draggable-container').style.display = 'none';

        // Show final question
        const finalQuestionContainer = document.getElementById('final-question-container');
        if (finalQuestionContainer) {
            finalQuestionContainer.style.display = 'block';
        }
    }

    async selectFinalOption(option) {
        if (this.selectedFinalOption) {
            this.selectedFinalOption.classList.remove('selected');
        }
        option.classList.add('selected');
        this.selectedFinalOption = option;
        this.finalQuestionResponse = option.textContent;

        const submitButton = document.getElementById('final-submit-button');
        if (submitButton) {
            submitButton.disabled = false;
        }
    }

    async submitFinalAnswer() {
        if (!this.finalQuestionResponse) return;

        // Update Firebase
        const statsRef = doc(this.db, "MFIgameStats",
            `${this.session.getCourseCode()}-Session${this.session.getSessionNumber()}-${this.session.getToday()}`
        );

        try {
            await updateDoc(statsRef, {
                secondQuestionAnswers: {
                    [this.finalQuestionResponse]: arrayUnion(new Date().toISOString())
                },
                secondQuestionResponses: arrayUnion({
                    response: this.finalQuestionResponse,
                    timestamp: new Date().toISOString()
                })
            });

            // Show thank you message
            document.getElementById('final-question-container').style.display = 'none';
            document.getElementById('thank-you').style.display = 'block';
        } catch (error) {
            console.error("Error submitting final answer:", error);
        }
    }
}

// Create and initialize game manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.initialize();
});

// Export the GameManager class
export { GameManager };
