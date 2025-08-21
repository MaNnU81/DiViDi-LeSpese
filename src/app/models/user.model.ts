import { Timestamp } from "firebase/firestore";

export interface User {
    createdAt: Timestamp;
    debtsOpen: number;
    debtsSettled: number;
    email: string;
    nickname: string;
    userId: string;
    active: boolean;        // true (default); false quando disattivato
    deletedAt?: Timestamp;
    avatarUrl?: string;
}
