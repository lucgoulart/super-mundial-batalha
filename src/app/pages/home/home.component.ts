import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  mataMataLiberado = false;

  constructor(
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.verificarMataMata();
  }

  async verificarMataMata(): Promise<void> {
    try {
      const { count, error } = await this.supabaseService.client
        .from('partidas')
        .select('id', { count: 'exact', head: true })
        .eq('fase', 'grupos')
        .eq('status', 'realizada');

      if (error) {
        console.error('Erro ao verificar partidas:', error);
        this.mataMataLiberado = false;
        return;
      }

      this.mataMataLiberado = count === 96;

    } catch (error) {
      console.error('Erro ao verificar liberação do mata-mata:', error);
      this.mataMataLiberado = false;
    }
  }

}