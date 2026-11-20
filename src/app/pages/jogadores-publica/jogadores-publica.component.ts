import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';

interface JogadorPublico {
  id: string;
  nome: string;
  whatsapp: string;
  id_fifa: string;
  nome_time: string;
  grupo: string;
  simbolo_time: string | null;
  escudoUrl: string | null;
}

@Component({
  selector: 'app-jogadores-publica',
  templateUrl: './jogadores-publica.component.html',
  styleUrls: ['./jogadores-publica.component.scss']
})
export class JogadoresPublicaComponent implements OnInit {

  jogadores: JogadorPublico[] = [];
  termoPesquisa = '';

grupos: string[] = [
  'todos', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
];

grupoSelecionado = 'todos';

  carregando = false;
  mensagemErro = '';

  constructor(
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.carregarJogadores();
  }

  async carregarJogadores(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    try {
      const { data, error } = await this.supabaseService.client
        .from('jogadores')
        .select(`
          id,
          nome,
          whatsapp,
          id_fifa,
          nome_time,
          grupo,
          simbolo_time
        `)
        .order('grupo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;

      this.jogadores = (data || []).map(jogador => ({
        ...jogador,
        escudoUrl: jogador.simbolo_time
          ? this.supabaseService.client
              .storage
              .from('simbolos-times')
              .getPublicUrl(jogador.simbolo_time).data.publicUrl
          : null
      }));

    } catch (error: any) {
      console.error('Erro ao carregar jogadores:', error);
      this.mensagemErro = 'Não foi possível carregar os jogadores.';
    } finally {
      this.carregando = false;
    }
  }

  gerarLinkWhatsApp(whatsapp: string): string {
    const numero = whatsapp.replace(/\D/g, '');
    return `https://wa.me/${numero}`;
  }

  get jogadoresFiltrados(): JogadorPublico[] {
  const termo = this.termoPesquisa.trim().toLowerCase();

  return this.jogadores.filter(jogador => {

    const correspondePesquisa =
      jogador.nome.toLowerCase().includes(termo) ||
      jogador.nome_time.toLowerCase().includes(termo) ||
      jogador.id_fifa.toLowerCase().includes(termo);

    const correspondeGrupo =
      this.grupoSelecionado === 'todos' ||
      jogador.grupo === this.grupoSelecionado;

    return correspondePesquisa && correspondeGrupo;
  });
}

selecionarGrupo(grupo: string): void {
  this.grupoSelecionado = grupo;
}

}