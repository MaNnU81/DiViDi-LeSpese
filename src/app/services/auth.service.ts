
import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private fb = inject(FirebaseService);
  private auth = getAuth(this.fb.app);

  private _user$ = new BehaviorSubject<FirebaseUser | null>(this.auth.currentUser);
  /** Stato auth come stream */
  readonly user$ = this._user$.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, user => this._user$.next(user));
  }

  get currentUser(): FirebaseUser | null {
    return this._user$.value;
  }

  logout() {
    return signOut(this.auth);
  }
}
