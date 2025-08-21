import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { getFirestore, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';

import { serverTimestamp } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private fb: FirebaseService) { }

    async createUser(user: User): Promise<void> {
    if (!user?.userId) throw new Error('createUser: userId mancante');
    if (!user?.email) throw new Error('createUser: email mancante');

    const db = getFirestore(this.fb.app);
    const userId = user.userId;
    const ref = doc(db, `users/${userId}`);

    // Evita overwrite se già presente
    const snap = await getDoc(ref);
    if (snap.exists()) {
      throw new Error(`createUser: l'utente ${userId} esiste già`);
    }

    const payload: User = {
      userId,
      email: (user.email ?? '').trim().toLowerCase(),
      nickname: (user.nickname ?? '').trim(),
      debtsOpen: 0,
      debtsSettled: 0,
      active: true,
      createdAt: serverTimestamp() as any // se il model richiede Timestamp puro, lascia il cast
    };

    await setDoc(ref, payload, { merge: false });
  }

      deactivateUser(userId: string, options: { alias: string; reason?: string }): Promise<void>{
    throw new Error('Not implemented');
  }


  deleteUser(userId: string): Promise<void>{
    throw new Error('Not implemented');
  }


  getUserById(userId: string): Observable<User | null> {
    const db = getFirestore(this.fb.app);
    const ref = doc(db, `users/${userId}`);

    return new Observable<User | null>((subscriber) => {
      const unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
          subscriber.next(null);
        } else {
          // tipizzazione semplice: i Timestamp di Firestore arrivano come tali
          subscriber.next(snap.data() as User);
        }
      }, (err) => subscriber.error(err));

      return () => unsub();
    });
  }

  async updateUser(userId: string, patch: Partial<User>): Promise<void> {
    const db = getFirestore(this.fb.app);
    const ref = doc(db, `users/${userId}`);

    // whitelist dei campi aggiornabili
    const allowed: (keyof User)[] = ['nickname'];
    const safePatch: Partial<User> = {};

    for (const k of allowed) {
      if (patch[k] !== undefined) {
        (safePatch as any)[k] = patch[k];
      }
    }

    if (Object.keys(safePatch).length === 0) {
      // nessun campo ammesso presente
      return;
    }

    await updateDoc(ref, safePatch as any);
  }

   listUsersByEmail(emails: string[]): Promise<User[]> {
    throw new Error('Not implemented');
  }
}
