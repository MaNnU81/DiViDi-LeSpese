// src/app/services/firebase.service.ts
import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp;
  analytics?: Analytics;

  private config = {
    apiKey: "AIzaSyCnuHrtVzDuJUFhjrzvpJ_AchPyOhDQjPs",
    authDomain: "dividi-lespese.firebaseapp.com",
    projectId: "dividi-lespese",
    storageBucket: "dividi-lespese.firebasestorage.app",
    messagingSenderId: "1063419664930",
    appId: "1:1063419664930:web:8fbefdc1f89e078371087b",
    measurementId: "G-G2PZK5V2BC"
  };

  constructor() {
    // Evita doppia init in HMR/test/SSR
    this.app = getApps().length ? getApps()[0] : initializeApp(this.config);


    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported) {
          this.analytics = getAnalytics(this.app);
        }
      }).catch(() => {/* ignora se non supportato */ });
    }
  }
}
