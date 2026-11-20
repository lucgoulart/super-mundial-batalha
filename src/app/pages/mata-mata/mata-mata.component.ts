
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';

interface Jogador {
  id: string;
  nome: string;
  whatsapp: string;
  nome_time: string;
  simbolo_time: string | null;
  escudoUrl: string | null;
  grupo: string;
}

type Fase =
  | 'playoff_1'
  | 'playoff_2'
  | 'oitavas'
  | 'quartas'
  | 'semifinais'
  | 'final';

interface Partida {
  id: string;
  fase: Fase;
  jogador_casa_id: string;
  jogador_visitante_id: string;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: 'pendente' | 'realizada';
  created_at: string;
  jogador_casa: Jogador | null;
  jogador_visitante: Jogador | null;
}

@Component({
  selector: 'app-mata-mata',
  templateUrl: './mata-mata.component.html',
  styleUrls: ['./mata-mata.component.scss']
})
export class MataMataComponent implements OnInit {

  carregando = false;
  erro = '';

  partidas: Partida[] = [];

  fases: { valor: Fase; nome: string; descricao: string }[] = [
    {
      valor: 'playoff_1',
      nome: 'Playoff 1',
      descricao: 'Disputa entre os terceiros colocados'
    },
    {
      valor: 'playoff_2',
      nome: 'Playoff 2',
      descricao: 'Disputa pelas últimas vagas nas Oitavas'
    },
    {
      valor: 'oitavas',
      nome: 'Oitavas de Final',
      descricao: '16 jogadores disputam a classificação'
    },
    {
      valor: 'quartas',
      nome: 'Quartas de Final',
      descricao: 'Oito jogadores seguem na disputa'
    },
    {
      valor: 'semifinais',
      nome: 'Semifinais',
      descricao: 'Os quatro melhores disputam a vaga na Final'
    },
    {
      valor: 'final',
      nome: 'Grande Final',
      descricao: 'A decisão do título'
    }
  ];

  constructor(
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.carregarPartidas();
  }

  async carregarPartidas(): Promise<void> {
    this.carregando = true;
    this.erro = '';

    try {
      const client = this.supabaseService.client;

      const { data: partidas, error } = await client
        .from('partidas')
        .select('*')
        .neq('fase', 'grupos')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: respostaJogadores, error: erroJogadores } =
        await client.functions.invoke('dynamic-handler', {
          body: { action: 'public_list' }
        });

      if (erroJogadores) throw erroJogadores;

      const jogadores: Jogador[] =
        respostaJogadores?.jogadores || [];

      const mapaJogadores = new Map<string, Jogador>(
        jogadores.map(jogador => [jogador.id, jogador])
      );

      this.partidas = (partidas || []).map((partida: any) => ({
        ...partida,
        jogador_casa: mapaJogadores.get(partida.jogador_casa_id) || null,
        jogador_visitante: mapaJogadores.get(partida.jogador_visitante_id) || null
      }));

    } catch (error: any) {
      console.error('Erro ao carregar chaveamento:', error);
      this.erro = 'Não foi possível carregar o chaveamento do campeonato.';
    } finally {
      this.carregando = false;
    }
  }

  partidasDaFase(fase: Fase): Partida[] {
    return this.partidas
      .filter(partida => partida.fase === fase)
      .sort((a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
  }

  totalDaFase(fase: Fase): number {
    return this.partidasDaFase(fase).length;
  }

  partidasConcluidas(fase: Fase): number {
    return this.partidasDaFase(fase).filter(
      partida => partida.status === 'realizada'
    ).length;
  }

  getVencedor(partida: Partida): Jogador | null {
    if (
      partida.status !== 'realizada' ||
      partida.gols_casa === null ||
      partida.gols_visitante === null ||
      partida.gols_casa === partida.gols_visitante
    ) {
      return null;
    }

    return partida.gols_casa > partida.gols_visitante
      ? partida.jogador_casa
      : partida.jogador_visitante;
  }

  jogadorVenceu(partida: Partida, lado: 'casa' | 'visitante'): boolean {
    const vencedor = this.getVencedor(partida);

    if (!vencedor) return false;

    return lado === 'casa'
      ? vencedor.id === partida.jogador_casa?.id
      : vencedor.id === partida.jogador_visitante?.id;
  }

  get campeao(): Jogador | null {
    const final = this.partidasDaFase('final');

    if (final.length !== 1) return null;

    return this.getVencedor(final[0]);
  }

  get totalPartidas(): number {
    return this.partidas.length;
  }

  get totalConcluidas(): number {
    return this.partidas.filter(
      partida => partida.status === 'realizada'
    ).length;
  }

  get totalPendentes(): number {
    return this.partidas.filter(
      partida => partida.status === 'pendente'
    ).length;
  }

  nomeTime(jogador: Jogador | null): string {
    return jogador?.nome_time || 'Time a definir';
  }

  nomeJogador(jogador: Jogador | null): string {
    return jogador?.nome || 'Aguardando classificação';
  }

}
