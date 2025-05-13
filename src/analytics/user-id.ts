import { v4 as uuidv4 } from 'uuid';
import { isConsentGiven } from './cookieConsent';

let userId: string | null = null;

export const getUserId = (): string => {
    if (!isConsentGiven()) {
        // Do not return userId if consent is not given
        // This is to ensure that we do not store any user data if the user has not given consent
        // This is important for GDPR compliance
        return "";
    }

    if (!userId) {
        userId = localStorage.getItem('userId');
        if (!userId) {
            persistUserId();
        }
    }

    return userId as string;
};

export const persistUserId = (): void => {
    if (!isConsentGiven()) {
        // Do not persist userId if consent is not given
        // This is to ensure that we do not store any user data if the user has not given consent
        // This is important for GDPR compliance
        return;
    }

    if (!userId) {
        userId = uuidv4();
    }

    localStorage.setItem('userId', userId);
}

export const clearUserId = (): void => {
    localStorage.removeItem('userId');
    userId = null;
}
