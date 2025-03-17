import { SessionManager } from '../shared/session.js';
import { db } from "../../firebase.js";
import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

class GameManager {
    constructor() {
        this.db = db;
        this.session = new SessionManager();
        this.correctAnswersCount = 0;
        this.incorrectGuesses = [];
        this.finalQuestionResponse = '';
        this.selectedFinalOption = null;
        this.initialize();
    }

    initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupSortable();
            this.setupEventListeners();
        });
    }

    setupSortable() {
        const sortableOptions = {
            group: {
                name: 'shared',
                pull: 'clone',
                put: true
            },
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            swapThreshold: 0.65,
            sort: false
        };

        // Initialize word bank
        new Sortable(document.getElementById('word-bank'), {
            ...sortableOptions,
            group: {
                name: 'shared',
                pull: true,
                put: true
            },
            removeOnSpill: false,
            revertOnSpill: true
        });

        // Initialize drop zones (text boxes)
        ['box1', 'box2', 'box3'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                new Sortable(element, {
                    ...sortableOptions,
                    group: {
                        name: 'shared',
                        pull: true,
                        put: true
                    },
                    onAdd: () => this.checkSubmitButtonState()
                });
            }
        });

        // Initialize quarters
        ['quarter1', 'quarter2', 'quarter3', 'quarter4'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                new Sortable(element, {
                    ...sortableOptions,
                    group: {
                        name: 'shared',
                        pull: true,
                        put: true
                    },
                    onAdd: (evt) => {
                        const quarter = evt.to;
                        if (!quarter) return;
                        
                        const items = quarter.getElementsByClassName('draggable');
                        
                        // If there's more than one item, move all previous items back to word bank
                        if (items.length > 1) {
                            const wordBank = document.getElementById('word-bank');
                            if (wordBank) {
                                // Keep only the newly added item (last item)
                                const newItem = items[items.length - 1];
                                // Move all other items back to word bank
                                while (items.length > 1) {
                                    wordBank.appendChild(items[0]);
                                }
                            }
                        }
                        
                        // Add has-draggable class to quarter
                        quarter.classList.add('has-draggable');
                        this.checkSubmitButtonState();
                    },
                    onRemove: (evt) => {
                        // Remove has-draggable class when item is removed
                        const quarter = evt.from;
                        if (quarter) {
                            quarter.classList.remove('has-draggable');
                        }
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
            if (draggable && draggable.textContent === correctAnswers[zone.id]) {
                this.correctAnswersCount++;
                draggable.classList.add('correct');
            } else if (draggable) {
                draggable.classList.add('incorrect');
                this.incorrectGuesses.push(draggable.textContent);
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
        // Hide game elements
        document.getElementById('game-area').style.display = 'none';
        document.getElementById('draggable-container').style.display = 'none';

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
        
        await updateDoc(statsRef, {
            secondQuestionResponses: arrayUnion({
                response: this.finalQuestionResponse,
                timestamp: new Date().toISOString()
            })
        });

        // Show thank you message
        document.getElementById('final-question-container').style.display = 'none';
        const thankYouDiv = document.createElement('div');
        thankYouDiv.id = 'thank-you';
        thankYouDiv.innerHTML = '<h2>Thank you for participating!</h2>';
        document.querySelector('.right-container').appendChild(thankYouDiv);
    }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new GameManager();
});

// Export functions for global access
window.selectFinalOption = (option) => game.selectFinalOption(option);
