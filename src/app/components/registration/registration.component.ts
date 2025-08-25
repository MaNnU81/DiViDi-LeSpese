// src/app/users/registration/registration.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FirebaseService } from '../../services/firebase.service';
import { UserService } from '../../services/user.service';
import { User as AppUser } from '../../models/user.model';

import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent implements OnInit, OnDestroy {
  // DI
  private fb = inject(FormBuilder);
  private firebase = inject(FirebaseService);
  private userService = inject(UserService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  // Stato Auth / profilo
  fbUser: FirebaseUser | null = null;
  loggedIn = false;
  profileExists = false;
  private unlistenAuth?: () => void;

  // Stato UI
  loading = signal(false);

  // Form
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    passwordConfirm: [''],
    nickname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]]
  });

  ngOnInit(): void {
    const auth = getAuth(this.firebase.app);

    this.unlistenAuth = onAuthStateChanged(auth, async (user) => {
      this.fbUser = user;
      this.loggedIn = !!user;

      // Gestione validator password
      if (!this.loggedIn) {
        this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
        this.form.controls.passwordConfirm.setValidators([Validators.required, Validators.minLength(6)]);
      } else {
        this.form.controls.password.clearValidators();
        this.form.controls.passwordConfirm.clearValidators();
        this.form.controls.password.setValue('');
        this.form.controls.passwordConfirm.setValue('');
      }
      this.form.controls.password.updateValueAndValidity();
      this.form.controls.passwordConfirm.updateValueAndValidity();

      // Se loggato, controlla se esiste già il profilo e gestisci email readonly
      this.profileExists = false;
      if (this.loggedIn) {
        const db = getFirestore(this.firebase.app);
        const ref = doc(db, `users/${user!.uid}`);
        const snap = await getDoc(ref);
        this.profileExists = snap.exists();

        this.form.controls.email.setValue(user!.email ?? '');
        this.form.controls.email.disable();

        // 🔁 Redirect immediato alla pagina profilo se già esiste
        if (this.profileExists) {
          this.router.navigateByUrl('/profile');
          return;
        }
      } else {
        this.form.controls.email.enable();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.unlistenAuth) this.unlistenAuth();
  }

  private passwordsMatch(): boolean {
    if (this.loggedIn) return true;
    const raw = this.form.getRawValue();
    return !!raw.password && !!raw.passwordConfirm && raw.password === raw.passwordConfirm;
  }

  async onSubmit() {
    if (this.form.invalid) return;

    if (!this.passwordsMatch()) {
      this.snack.open('Le password non coincidono', 'Chiudi', { duration: 3000 });
      return;
    }

    const raw = this.form.getRawValue();
    const email = (raw.email || '').toLowerCase().trim();
    const nickname = (raw.nickname || '').trim();

    if (!email) {
      this.snack.open('Email mancante', 'Chiudi', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    try {
      const auth = getAuth(this.firebase.app);
      let uid: string;
      let userEmail: string;

      if (!this.loggedIn) {
        // Crea account Auth
        const cred = await createUserWithEmailAndPassword(auth, email, raw.password!);
        uid = cred.user.uid;
        userEmail = cred.user.email!.toLowerCase();
      } else {
        // Utente già loggato
        uid = this.fbUser!.uid;
        userEmail = this.fbUser!.email!.toLowerCase();
      }

      // Crea profilo Firestore
      const appUser: AppUser = {
        userId: uid,
        email: userEmail,
        nickname,
        debtsOpen: 0,
        debtsSettled: 0,
        active: true,
        createdAt: undefined as any, // viene impostato dal service con serverTimestamp()
        avatarUrl: '/img/default-avatar.png'
      };

      await this.userService.createUser(appUser);

      this.snack.open('Registrazione completata 🎉', 'OK', { duration: 2500 });
      this.form.reset();

      // Redirect al profilo
      this.router.navigateByUrl('/profile');
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Errore durante la registrazione', 'Chiudi', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  // Facoltativo: utile per testare nuove registrazioni
  async signOutNow() {
    const auth = getAuth(this.firebase.app);
    await signOut(auth);
    this.snack.open('Sei uscito. Puoi registrare un nuovo account.', 'OK', { duration: 2500 });
    this.form.reset();
    this.profileExists = false;
  }
}
