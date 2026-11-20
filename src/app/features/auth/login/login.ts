import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth'; 

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

    private readonly auth = inject(AuthService);

  login(): void {
    this.auth.login();
  }
}