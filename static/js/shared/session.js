// Import Firebase
import { db } from "../../firebase.js";
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

export class SessionManager {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.courseCode = this.urlParams.get("course");
        this.sessionNumber = this.urlParams.get("session");
        this.today = new Date().toISOString().split('T')[0];
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
        const courseSetup = document.getElementById("course-setup");
        const statsContainer = document.getElementById("stats-container");
        
        if (!isOrganiser) {
            if (courseSetup) courseSetup.style.display = "none";
            if (statsContainer) statsContainer.style.display = "none";
            sessionStorage.setItem("isParticipant", "true");
        } else {
            if (statsContainer) statsContainer.style.display = "block";
        }
    }

    async ensureStatsDocumentExists() {
        if (!this.courseCode || !this.sessionNumber) return;

        const statsRef = doc(db, "MFIgameStats", `${this.courseCode}-Session${this.sessionNumber}-${this.today}`);
        try {
            const docSnap = await getDoc(statsRef);
            if (!docSnap.exists()) {
                await setDoc(statsRef, { 
                    firstQuestionResponses: 0, 
                    rawScores: [], 
                    secondQuestionAnswers: {}, 
                    secondQuestionResponses: 0,
                    trackedThisSession: false,
                    trackedSubmission: false
                });
            }
        } catch (error) {
            console.error("Firestore Write Error:", error);
        }
    }

    showCourseSetup() {
        const courseSetup = document.getElementById("course-setup");
        if (courseSetup) courseSetup.style.display = "block";
    }

    getCourseCode() { return this.courseCode; }
    getSessionNumber() { return this.sessionNumber; }
    getToday() { return this.today; }
}
