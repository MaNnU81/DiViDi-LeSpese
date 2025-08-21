
import { Timestamp } from 'firebase/firestore';

export interface Participant {
    participantId: string;
    userId?: string;
    displayName: string;   
    email: string;         
    share: number;
    isSettled: boolean;
}


export interface Expense {
    createdAt: Timestamp;
    createdBy: string;
    currency: string;
    debtId: string;
    description: string;
    imageUrl: string;
    participants: Participant[];
    splitMethod: 'equal';
    updatedAt: Timestamp;
    status?: 'open' | 'settled';
}


export interface ExpenseItem {
    amount: number;
    createdAt: Timestamp;
    description: string;
    imageUrl?: string;
    paidBy: string;
    state: 'pending' | 'approved' | 'rejected';  // state
}