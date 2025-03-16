// Non-module version for Flask
class SessionManager {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.courseCode = this.urlParams.get("course");
        this.sessionNumber = this.urlParams.get("session");
        this.today = new Date().toISOString().split('T')[0];
        this.setupCourseForm();
        this.initializeSession();
    }

    setupCourseForm() {
        const courseForm = document.getElementById('course-form');
        if (courseForm) {
            courseForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const courseCode = document.getElementById('course-code').value;
                const sessionNumber = document.getElementById('session-number').value;
                
                // Generate session link and display it
                const sessionLink = this.generateSessionLink(courseCode, sessionNumber);
                const linkContainer = document.getElementById('session-link');
                const linkOutput = document.getElementById('link-output');
                
                if (linkContainer && linkOutput) {
                    linkContainer.style.display = 'block';
                    linkOutput.textContent = sessionLink;
                }

                // Setup copy button with fallback
                const copyButton = document.getElementById('copy-link');
                if (copyButton) {
                    copyButton.onclick = () => {
                        // Create a temporary textarea
                        const textarea = document.createElement('textarea');
                        textarea.value = sessionLink;
                        textarea.style.position = 'fixed';  // Avoid scrolling to bottom
                        document.body.appendChild(textarea);
                        textarea.focus();
                        textarea.select();

                        try {
                            document.execCommand('copy');
                            copyButton.textContent = 'Copied!';
                            copyButton.classList.remove('failed');
                            copyButton.classList.add('copied');
                        } catch (err) {
                            console.error('Error copying link:', err);
                            copyButton.textContent = 'Copy Failed!';
                            copyButton.classList.remove('copied');
                            copyButton.classList.add('failed');
                        }

                        document.body.removeChild(textarea);
                        setTimeout(() => {
                            copyButton.textContent = 'Copy Link';
                            copyButton.classList.remove('copied', 'failed');
                        }, 2000);
                    };
                }

                // Store organiser status and create stats document
                sessionStorage.setItem('isOrganiser', 'true');
                await this.createStatsDocument(courseCode, sessionNumber);
            });
        }
    }

    generateSessionLink(courseCode, sessionNumber) {
        // For Flask, we want to keep the user on the root path
        const baseUrl = window.location.origin;
        const rootPath = window.location.pathname;
        const queryParams = new URLSearchParams({
            course: courseCode,
            session: sessionNumber
        });
        return `${baseUrl}${rootPath}?${queryParams.toString()}`;
    }

    async createStatsDocument(courseCode, sessionNumber) {
        const docRef = firebase.firestore().collection("MFIgameStats").doc(
            `${courseCode}-Session${sessionNumber}-${this.today}`
        );
        
        try {
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                await docRef.set({
                    firstQuestionResponses: 0,
                    rawScores: [],
                    secondQuestionAnswers: {},
                    secondQuestionResponses: 0,
                    trackedThisSession: false,
                    trackedSubmission: false
                });
            }
        } catch (error) {
            console.error("Error creating stats document:", error);
        }
    }

    getCourseCode() {
        return this.courseCode;
    }

    getSessionNumber() {
        return this.sessionNumber;
    }

    getToday() {
        return this.today;
    }

    async initializeSession() {
        if (this.courseCode && this.sessionNumber) {
            const isOrganiser = sessionStorage.getItem("isOrganiser") === "true";
            this.setupUIForRole(isOrganiser);
            await this.ensureStatsDocumentExists();
        } else {
            this.showCourseSetup();
        }
    }

    setupUIForRole(isOrganiser) {
        const organiserView = document.getElementById("organiser-view");
        const courseInfo = document.getElementById("course-info");
        
        if (!isOrganiser && this.courseCode && this.sessionNumber) {
            // Participant view with valid session
            if (organiserView) organiserView.classList.add("hidden");
            if (courseInfo) {
                courseInfo.textContent = `Course: ${this.courseCode} - Session ${this.sessionNumber}`;
                courseInfo.classList.remove("hidden");
            }
            sessionStorage.setItem("isParticipant", "true");
        } else if (isOrganiser) {
            // Organiser view
            if (organiserView) organiserView.classList.remove("hidden");
            if (courseInfo) courseInfo.classList.add("hidden");
        } else {
            // Default view (no session)
            if (organiserView) organiserView.classList.remove("hidden");
            if (courseInfo) courseInfo.classList.add("hidden");
            this.showCourseSetup();
        }
    }

    showCourseSetup() {
        const courseSetup = document.getElementById("course-setup");
        if (courseSetup) courseSetup.style.display = "block";
    }

    async ensureStatsDocumentExists() {
        if (!this.courseCode || !this.sessionNumber) return;

        const docRef = firebase.firestore().collection("MFIgameStats").doc(
            `${this.courseCode}-Session${this.sessionNumber}-${this.today}`
        );
        
        try {
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                await docRef.set({
                    firstQuestionResponses: 0,
                    rawScores: [],
                    secondQuestionAnswers: {},
                    secondQuestionResponses: 0,
                    trackedThisSession: false,
                    trackedSubmission: false
                });
            }
        } catch (error) {
            console.error("Error creating stats document:", error);
        }
    }
}
