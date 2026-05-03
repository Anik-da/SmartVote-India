import { auth, db } from './firebase-config.js';
import { 
    signInWithPhoneNumber 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Initiates phone authentication by sending an OTP.
 * @param {string} phoneNumber - The phone number in E.164 format (e.g., +919876543210).
 * @param {Object} appVerifier - The reCAPTCHA verifier instance.
 * @returns {Promise<Object>} - The confirmation result object.
 */
export async function loginUser(phoneNumber, appVerifier) {
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return confirmationResult;
    } catch (error) {
        console.error("Firebase Service: loginUser Error", error);
        throw error;
    }
}

/**
 * Verifies the OTP code.
 * @param {Object} confirmationResult - The confirmation result from loginUser.
 * @param {string} code - The 6-digit OTP code.
 * @returns {Promise<Object>} - The user object.
 */
export async function verifyOTP(confirmationResult, code) {
    try {
        const result = await confirmationResult.confirm(code);
        const user = result.user;

        // Check/Create user document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                phoneNumber: user.phoneNumber,
                createdAt: new Date().toISOString(),
                progress: {
                    quizScore: 0,
                    completedModules: []
                }
            });
        }
        return user;
    } catch (error) {
        console.error("Firebase Service: verifyOTP Error", error);
        throw error;
    }
}

/**
 * Fetches all educational modules from Firestore.
 * @returns {Promise<Array>} - Array of module data.
 */
export async function fetchModules() {
    try {
        const querySnapshot = await getDocs(collection(db, "modules"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Firebase Service: fetchModules Error", error);
        throw error;
    }
}

/**
 * Saves a quiz score for the current user.
 * @param {string} userId - The user's UID.
 * @param {number} score - The raw score.
 * @param {number} total - Total questions.
 */
export async function saveQuizScore(userId, score, total) {
    try {
        const userRef = doc(db, "users", userId);
        const percentage = Math.round((score / total) * 100);
        
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentBest = userDoc.data().progress?.quizScore || 0;
            if (percentage > currentBest) {
                await updateDoc(userRef, {
                    "progress.quizScore": percentage,
                    "progress.lastQuizDate": new Date().toISOString()
                });
            }
        } else {
            // Fallback: create if missing
            await setDoc(userRef, {
                progress: {
                    quizScore: percentage,
                    lastQuizDate: new Date().toISOString()
                }
            }, { merge: true });
        }
        return percentage;
    } catch (error) {
        console.error("Firebase Service: saveQuizScore Error", error);
        throw error;
    }
}

/**
 * Saves or updates module progress for a user.
 * @param {string} userId - The user's UID.
 * @param {Object} progress - The progress object (moduleId: value).
 */
export async function saveModuleProgress(userId, progress) {
    try {
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, { progress }, { merge: true });
    } catch (error) {
        console.error("Firebase Service: saveModuleProgress Error", error);
        throw error;
    }
}

/**
 * Fetches all quiz questions from Firestore.
 * @returns {Promise<Array>} - Array of question objects.
 */
export async function fetchQuizQuestions() {
    try {
        const querySnapshot = await getDocs(collection(db, "quiz_questions"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Firebase Service: fetchQuizQuestions Error", error);
        throw error;
    }
}

/**
 * Seeds data into a collection if it's empty.
 * @param {string} collectionName - Name of the collection.
 * @param {Array} dataArray - Array of objects to seed.
 * @param {string} idField - Optional field to use as doc ID.
 */
export async function seedCollectionIfEmpty(collectionName, dataArray, idField = null) {
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        if (snapshot.empty) {
            console.log(`Seeding ${collectionName}...`);
            for (const item of dataArray) {
                if (idField && item[idField]) {
                    const docId = item[idField].toLowerCase().replace(/ /g, '-');
                    await setDoc(doc(db, collectionName, docId), item);
                } else {
                    // Use addDoc for auto-generated IDs
                    const { addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                    await addDoc(colRef, item);
                }
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Firebase Service: seedCollectionIfEmpty (${collectionName}) Error`, error);
        throw error;
    }
}

/**
 * Fetches a user document from Firestore.
 * @param {string} userId - The user's UID.
 * @returns {Promise<Object|null>} - The user data object, or null if not found.
 */
export async function fetchUserData(userId) {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Firebase Service: fetchUserData Error", error);
        throw error;
    }
}

/**
 * Seeds a module document by its ID.
 * @param {string} moduleId - The module document ID.
 * @param {Object} moduleData - The module data to save.
 */
export async function seedModule(moduleId, moduleData) {
    try {
        await setDoc(doc(db, "modules", moduleId), moduleData);
    } catch (error) {
        console.error("Firebase Service: seedModule Error", error);
        throw error;
    }
}
