import { Injectable } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  
firebaseConfig = {
  apiKey: "AIzaSyCnuHrtVzDuJUFhjrzvpJ_AchPyOhDQjPs",
  authDomain: "dividi-lespese.firebaseapp.com",
  projectId: "dividi-lespese",
  storageBucket: "dividi-lespese.firebasestorage.app",
  messagingSenderId: "1063419664930",
  appId: "1:1063419664930:web:8fbefdc1f89e078371087b",
  measurementId: "G-G2PZK5V2BC"
};

// Initialize Firebase
app = initializeApp(this.firebaseConfig);
analytics = getAnalytics(this.app);

  constructor() { }
}
