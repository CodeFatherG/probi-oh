import { v4 as uuidv4 } from 'uuid';

let userId: string | null = null;

export const getUserId = (): string => {
    if (!userId) {
        userId = localStorage.getItem('userId');
        if (!userId) {
            persistUserId();
        }
    }

    return userId as string;
};

export const persistUserId = (): void => {
    if (!userId) {
        userId = uuidv4();
    }

    localStorage.setItem('userId', userId);
}