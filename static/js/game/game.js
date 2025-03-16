import { SessionManager } from '../shared/session.js';
import { db } from "../../firebase.js";
import { doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

class GameManager {
    constructor() {
        this.session = new SessionManager();
        this.correctAnswersCount = 0;
        this.incorrectGuesses = [];
        this.finalQuestionResponse = '';
    }

    initialize() {
        // Create an invisible drag image element
        const dragImage = document.createElement('div');
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.opacity = '0';
        document.body.appendChild(dragImage);

        // Prevent default drag behavior globally
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, true);

        const sortableOptions = {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            swapThreshold: 0.65,
            handle: '.draggable'
        };

        // Initialize word bank as the main container
        new Sortable(document.getElementById('word-bank'), {
            ...sortableOptions,
            sort: false,
            group: {
                name: 'shared',
                pull: true,
                put: true // Allow items to be put back
            }
        });

        // Initialize drop zones
        ['box1', 'box2', 'box3'].forEach(id => {
            new Sortable(document.getElementById(id), {
                ...sortableOptions,
                onAdd: () => this.checkSubmitButtonState()
            });
        });

        // Initialize quarters with one-item limit
        ['quarter1', 'quarter2', 'quarter3', 'quarter4'].forEach(id => {
            new Sortable(document.getElementById(id), {
                ...sortableOptions,
                onAdd: (evt) => {
                    const quarter = evt.to;
                    const items = quarter.getElementsByClassName('draggable');
                    
                    // If there's more than one item, move all previous items back to word bank
                    if (items.length > 1) {
                        const wordBank = document.getElementById('word-bank');
                        // Keep only the newly added item (last item)
                        const newItem = items[items.length - 1];
                        // Move all other items back to word bank
                        while (items.length > 1) {
                            wordBank.appendChild(items[0]);
                        }
                    }
                    
                    this.checkSubmitButtonState();
                }
            });
        });

        this.setupEventListeners();
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
    }

    checkSubmitButtonState() {
        const dropZones = document.querySelectorAll('.text-box, .quarter');
        let hasDraggable = false;

        dropZones.forEach(zone => {
            const draggableChild = zone.querySelector('.draggable');
            if (draggableChild) {
                hasDraggable = true;
            }
        });

        const submitButton = document.getElementById('submit-button');
        if (submitButton) {
            submitButton.disabled = !hasDraggable;
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
        const statsRef = doc(db, "MFIgameStats", 
            `${this.session.getCourseCode()}-Session${this.session.getSessionNumber()}-${this.session.getToday()}`);
        
        await updateDoc(statsRef, {
            firstQuestionResponses: arrayUnion(1)
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

        const submitButton = document.getElementById('final-submit-button');
        if (submitButton) {
            submitButton.disabled = false;
        }

        // Update Firebase
        const statsRef = doc(db, "MFIgameStats", 
            `${this.session.getCourseCode()}-Session${this.session.getSessionNumber()}-${this.session.getToday()}`);
        
        await updateDoc(statsRef, {
            secondQuestionResponses: arrayUnion(1),
            secondQuestionAnswers: arrayUnion(option.textContent)
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.initialize();
});

// Export functions for global access
window.selectFinalOption = (option) => game.selectFinalOption(option);
