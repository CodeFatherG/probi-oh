export interface Consent {
    CardData: boolean;
    ConditionData: boolean;
    SimulationData: boolean;
    UserId: boolean;
}

export function getConsent(): Consent {
    const consent = localStorage.getItem('consent');
    if (consent) {
        return JSON.parse(consent);
    }

    return {
        CardData: false,
        ConditionData: false,
        SimulationData: false,
        UserId: true,
    };
}

export function setConsent(consent: Consent): void {
    localStorage.setItem('consent', JSON.stringify(consent));
}
