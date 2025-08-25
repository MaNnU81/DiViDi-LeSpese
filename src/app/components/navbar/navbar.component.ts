// src/app/components/navbar/navbar.component.ts
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FirebaseService } from '../../services/firebase.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

import { User as FirebaseUser } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatMenuModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private firebase = inject(FirebaseService);
  private userService = inject(UserService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private authSvc = inject(AuthService);

  fbUser: FirebaseUser | null = null;
  profile: User | null = null;
  loading = true;

  private subProfile?: Subscription;
  private subAuth?: Subscription;

  readonly defaultAvatar = '/img/default-avatar.png';

  ngOnInit(): void {
    // Ascolta lo stato auth tramite il service
    this.subAuth = this.authSvc.user$.subscribe(user => {
      this.fbUser = user;
      this.loading = false;

      // (ri)sottoscrivi il profilo quando cambia lo user
      this.subProfile?.unsubscribe();
      if (user) {
        this.subProfile = this.userService.getUserById(user.uid).subscribe({
          next: u => this.profile = u,
          error: () => this.profile = null
        });
      } else {
        this.profile = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.subAuth?.unsubscribe();
    this.subProfile?.unsubscribe();
  }

  avatarSrc(): string {
    return this.profile?.avatarUrl || this.defaultAvatar;
  }

  displayName(): string {
    return this.profile?.nickname || this.fbUser?.email || 'Utente';
  }

  async doSignOut() {
    await this.authSvc.logout();
    this.snack.open('Sei uscito.', 'OK', { duration: 1800 });
    this.router.navigateByUrl('/register');
  }
}
