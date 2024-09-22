import { initializeApp } from "firebase/app";
import { Analytics, getAnalytics, setConsent, setUserId } from "firebase/analytics";
import { getUserId } from "../analytics/user-id";

const firebaseConfig = {
    apiKey: "AIzaSyAyfy_QtXWVtPa8WUY42330Y9UW2VAu_Q0",
    authDomain: "probi-oh.firebaseapp.com",
    projectId: "probi-oh",
    storageBucket: "probi-oh.appspot.com",
    messagingSenderId: "971517622548",
    appId: "1:971517622548:web:b71b689f38b7d05e4e2a01",
    measurementId: "G-VM56B9Y57V"
};

const firebaseApp = initializeApp(firebaseConfig);
let analytics: Analytics | undefined = undefined;

export function getFirebaseAnalytics(): Analytics | undefined {
    return analytics;
}

export function initialiseFirebaseAnalytics() {
    setConsent({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        personalization_storage: 'denied',
    });
    
    analytics = getAnalytics(firebaseApp);
    setUserId(analytics, getUserId());
}

