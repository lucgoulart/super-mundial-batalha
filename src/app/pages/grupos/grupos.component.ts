
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';

interface JogadorGrupo {
  id: string;
  nome: string;
  nome_time: string;
  simbolo_time: string | null;
  whatsapp: string;
  grupo: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  colocacao: number;
  escudoUrl: string | null;
}

interface PartidaGrupo {
  grupo: string;
  jogador_casa_id: string;
  jogador_visitante_id: string;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: string;
}

interface Grupo {
  nome: string;
  jogadores: JogadorGrupo[];
}

@Component({
  selector: 'app-grupos',
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.scss']
})
export class GruposComponent implements OnInit {

  grupos: Grupo[] = [];
  carregando = false;
  erro = '';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.carregarGrupos();
  }

  async carregarGrupos(): Promise<void> {
    this.carregando = true;
    this.erro = '';

    try {
      const client = this.supabaseService.client;

   const { data: resultadoJogadores, error: erroJogadores } =
  await client.functions.invoke('dynamic-handler', {
    body: { action: 'public_list' }
  });

if (erroJogadores) throw erroJogadores;

const jogadores = resultadoJogadores?.jogadores || [];

      const { data: partidas, error: erroPartidas } = await client
        .from('partidas')
        .select('grupo, jogador_casa_id, jogador_visitante_id, gols_casa, gols_visitante, status')
        .eq('fase', 'grupos');

      if (erroPartidas) throw erroPartidas;

  const estatisticas = (jogadores || []).map((jogador: any) => ({
  ...jogador,
  escudoUrl: jogador.escudoUrl || null,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  saldoGols: 0,
  colocacao: 0
})) as JogadorGrupo[];

      const mapa = new Map<string, JogadorGrupo>();

      estatisticas.forEach(jogador => {
        mapa.set(jogador.id, jogador);
      });

      (partidas || []).forEach((partida: PartidaGrupo) => {
        if (
          partida.status !== 'realizada' ||
          partida.gols_casa === null ||
          partida.gols_visitante === null
        ) {
          return;
        }

        const casa = mapa.get(partida.jogador_casa_id);
        const visitante = mapa.get(partida.jogador_visitante_id);

        if (!casa || !visitante) return;

        casa.jogos++;
        visitante.jogos++;

        casa.golsPro += partida.gols_casa;
        casa.golsContra += partida.gols_visitante;

        visitante.golsPro += partida.gols_visitante;
        visitante.golsContra += partida.gols_casa;

        if (partida.gols_casa > partida.gols_visitante) {
          casa.vitorias++;
          casa.pontos += 3;
          visitante.derrotas++;
        } else if (partida.gols_casa < partida.gols_visitante) {
          visitante.vitorias++;
          visitante.pontos += 3;
          casa.derrotas++;
        } else {
          casa.empates++;
          visitante.empates++;
          casa.pontos++;
          visitante.pontos++;
        }
      });

      estatisticas.forEach(jogador => {
        jogador.saldoGols = jogador.golsPro - jogador.golsContra;
      });

      const nomesGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      this.grupos = nomesGrupos.map(nome => {
        const jogadoresDoGrupo = estatisticas
          .filter(jogador => jogador.grupo === nome)
          .sort((a, b) => this.compararDesempenho(a, b));

        jogadoresDoGrupo.forEach((jogador, index) => {
          jogador.colocacao = index + 1;
        });

        return {
          nome,
          jogadores: jogadoresDoGrupo
        };
      });

    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      this.erro = 'Não foi possível carregar os grupos.';
    } finally {
      this.carregando = false;
    }
  }

  private compararDesempenho(a: JogadorGrupo, b: JogadorGrupo): number {
    return (
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldoGols - a.saldoGols ||
      b.golsPro - a.golsPro ||
      a.nome.localeCompare(b.nome)
    );
  }

  atualizar(): void {
    this.carregarGrupos();
  }
}
