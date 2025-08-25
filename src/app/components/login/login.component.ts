import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail  } from 'firebase/auth';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;

    const { email, password } = this.form.getRawValue() as {
      email: string;
      password: string;
    };

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      this.router.navigate(['/profile']);
    } catch (err: any) {
      this.snack.open(this.mapAuthError(err?.code), 'Chiudi', { duration: 4500 });
    } finally {
      this.loading = false;
    }
  }

  private mapAuthError(code?: string): string {
    switch (code) {
      case 'auth/invalid-email': return 'Email non valida.';
      case 'auth/missing-password': return 'Inserisci la password.';
      case 'auth/wrong-password': return 'Password errata.';
      case 'auth/user-not-found': return 'Utente non trovato.';
      case 'auth/too-many-requests': return 'Troppi tentativi. Riprova più tardi.';
      default: return 'Accesso non riuscito. Controlla le credenziali.';
    }
  }


  async onForgotPassword() {
  const email = this.form.controls.email.value?.toString().trim();

  if (!email) {
    this.snack.open('Inserisci la tua email per ricevere il link di reset.', 'Chiudi', { duration: 3500 });
    return;
  }

  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    this.snack.open('Email di reset inviata. Controlla la posta.', 'Ok', { duration: 4000 });
  } catch (err: any) {
    this.snack.open(this.mapAuthError(err?.code), 'Chiudi', { duration: 4500 });
  }
}
}
