const keyConsent = "cookieConsent";

export function isConsentGiven(): boolean {
    if (typeof window !== 'undefined') {
        try {
            const item = window.localStorage.getItem(keyConsent);
            console.log("item", item);
            if (item) {
                const parsedItem = JSON.parse(item);
                if (typeof parsedItem === 'boolean') {
                    return parsedItem;
                }
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${keyConsent}":`, error);
        }

        return false;
    } else {
        return true;
    }
}

function setConsent(consent: boolean): void {
    try {
        if (typeof window !== 'undefined') {
            console.log("Setting consent to", consent);
            window.localStorage.setItem(keyConsent, JSON.stringify(consent));
        }
    } catch (error) {
        console.warn(`Error setting localStorage key "${keyConsent}":`, error);
    }
}

export function acceptAllCookies(): void {
    if (typeof window !== "undefined") {
        setConsent(true);
    }
}

export function acceptNecessaryCookies(): void {
    if (typeof window !== "undefined") {
        setConsent(false);
    }
}
