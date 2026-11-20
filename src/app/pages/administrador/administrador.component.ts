import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.scss']
})
export class AdministradorComponent {

  codigo = '';
  autenticado = false;
  erro = false;
  carregando = false;

  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  async validarCodigo(): Promise<void> {
    if (!this.codigo.trim() || this.carregando) {
      this.erro = true;
      return;
    }

    this.erro = false;
    this.carregando = true;

    const autorizado = await this.adminAuthService.validarCodigo(
      this.codigo
    );

    this.carregando = false;

    if (autorizado) {
      this.autenticado = true;
      this.codigo = '';

      this.router.navigate(['/administrador/administra-jogadores']);
    } else {
      this.erro = true;
    }
  }

  sair(): void {
    this.adminAuthService.sair();
    this.autenticado = false;

    this.router.navigate(['/']);
  }
}