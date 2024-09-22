
import { getFirebaseAnalytics, initialiseFirebaseAnalytics } from "../firebase/firebase";
import { logEvent } from "firebase/analytics";

export function initialiseAnalytics() {
    initialiseFirebaseAnalytics();

    const environment = process.env.DEVELOPMENT ? 'development' : process.env.PREVIEW ? 'preview' : process.env.PRODUCTION ? 'production' : 'unknown';
    logHit('environment', { environment });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logHit(eventName: string, eventParams: any) {
    const analytics = getFirebaseAnalytics();

    if (analytics) {
        logEvent(analytics, eventName, eventParams);
    }
}
