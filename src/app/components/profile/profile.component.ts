// src/app/components/profile/profile.component.ts
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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
import { User } from '../../models/user.model';

import { getAuth, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private firebase = inject(FirebaseService);
  private userService = inject(UserService);
  private snack = inject(MatSnackBar);

  fbUser: FirebaseUser | null = null;
  loading = signal(true);
  saving = signal(false);

  profile: User | null = null;
  sub?: Subscription;
  unlistenAuth?: () => void;

  readonly defaultAvatar = '/img/default-avatar.png';

  form = this.fb.group({
    email: [{ value: '', disabled: true }],
    // userId: [{ value: '', disabled: true }],
    nickname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
    avatarUrl: [{ value: '', disabled: true }], // per ora solo visualizzazione
    debtsOpen: [{ value: 0, disabled: true }],
    debtsSettled: [{ value: 0, disabled: true }],
    active: [{ value: true, disabled: true }]
  });

  ngOnInit(): void {
    const auth = getAuth(this.firebase.app);
    this.unlistenAuth = onAuthStateChanged(auth, (user) => {
      this.fbUser = user;
      this.unsubscribeProfile();

      if (!user) {
        this.loading.set(false);
        this.profile = null;
        this.form.reset();
        return;
      }

      this.sub = this.userService.getUserById(user.uid).subscribe({
        next: (u) => {
          this.profile = u;
          this.form.patchValue({
            email: u?.email ?? user.email ?? '',
            // userId: u?.userId ?? user.uid,
            nickname: u?.nickname ?? '',
            avatarUrl: u?.avatarUrl ?? this.defaultAvatar,
            debtsOpen: u?.debtsOpen ?? 0,
            debtsSettled: u?.debtsSettled ?? 0,
            active: u?.active ?? false
          }, { emitEvent: false });
          this.loading.set(false);
        },
        error: (err) => {
          this.snack.open(err?.message ?? 'Errore nel caricamento profilo', 'Chiudi', { duration: 4000 });
          this.loading.set(false);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeProfile();
    if (this.unlistenAuth) this.unlistenAuth();
  }

  private unsubscribeProfile() {
    if (this.sub) { this.sub.unsubscribe(); this.sub = undefined; }
  }

  async save() {
    if (!this.fbUser) {
      this.snack.open('Non sei autenticato.', 'Chiudi', { duration: 3000 });
      return;
    }
    if (this.form.controls.nickname.invalid) return;

    const nickname = (this.form.controls.nickname.value || '').trim();
    this.saving.set(true);
    try {
      await this.userService.updateUser(this.fbUser.uid, { nickname });
      this.snack.open('Profilo aggiornato ✅', 'OK', { duration: 2000 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Errore durante il salvataggio', 'Chiudi', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }

  // Placeholder per futuro upload avatar
  changeAvatarSoon() {
    this.snack.open('Upload immagine profilo in arrivo 😉', 'OK', { duration: 2500 });
  }

  async signOutNow() {
    const auth = getAuth(this.firebase.app);
    await signOut(auth);
    this.snack.open('Sei uscito.', 'OK', { duration: 2000 });
    this.form.reset();
    this.profile = null;
  }

  avatarSrc(): string {
    const v = this.form.controls.avatarUrl.value;
    return v && v.length > 0 ? v : this.defaultAvatar;
  }
}
