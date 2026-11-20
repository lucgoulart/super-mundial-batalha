
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';

interface JogadorRanking {
  id: string;
  nome: string;
  whatsapp: string;
  nome_time: string;
  simbolo_time: string | null;
  escudoUrl: string | null;
  grupo: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  colocacaoGrupo: number;
}

interface PartidaRanking {
  grupo: string;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: string;
  jogador_casa_id: string;
  jogador_visitante_id: string;
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {

  rankingGeral: JogadorRanking[] = [];
  playoffTerceiros: JogadorRanking[] = [];
  eliminados: JogadorRanking[] = [];

  carregando = false;
  erro = '';

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit(): void {
    this.carregarRanking();
  }

  async carregarRanking(): Promise<void> {
    this.carregando = true;
    this.erro = '';

    try {
      const client = this.supabaseService.client;

      // BUSCAR JOGADORES E URLS DOS ESCUDOS
      const { data: resultadoJogadores, error: erroJogadores } =
        await client.functions.invoke('dynamic-handler', {
          body: {
            action: 'public_list'
          }
        });

      if (erroJogadores) throw erroJogadores;

      if (!resultadoJogadores?.jogadores) {
        throw new Error('Não foi possível consultar os jogadores.');
      }

      const jogadores = resultadoJogadores.jogadores;

      // BUSCAR PARTIDAS DA FASE DE GRUPOS
      const { data: partidas, error: erroPartidas } = await client
        .from('partidas')
        .select(
          'grupo, gols_casa, gols_visitante, status, jogador_casa_id, jogador_visitante_id'
        )
        .eq('fase', 'grupos');

      if (erroPartidas) throw erroPartidas;

      // INICIALIZAR ESTATÍSTICAS DOS JOGADORES
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
        colocacaoGrupo: 0
      })) as JogadorRanking[];

      const mapa = new Map<string, JogadorRanking>();

      estatisticas.forEach(jogador => {
        mapa.set(jogador.id, jogador);
      });

      // CALCULAR ESTATÍSTICAS DAS PARTIDAS
      (partidas || []).forEach((partida: PartidaRanking) => {
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

      // CALCULAR SALDO DE GOLS
      estatisticas.forEach(jogador => {
        jogador.saldoGols = jogador.golsPro - jogador.golsContra;
      });

      // CALCULAR COLOCAÇÃO DENTRO DOS GRUPOS
      const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      grupos.forEach(grupo => {
        const jogadoresDoGrupo = this.ordenarGrupo(
          estatisticas.filter(jogador => jogador.grupo === grupo),
          (partidas || []) as PartidaRanking[]
        );

        jogadoresDoGrupo.forEach((jogador, index) => {
          jogador.colocacaoGrupo = index + 1;
        });
      });

      // 16 JOGADORES QUE FICARAM EM PRIMEIRO OU SEGUNDO
      const classificados = estatisticas
        .filter(jogador =>
          jogador.colocacaoGrupo === 1 || jogador.colocacaoGrupo === 2
        )
        .sort((a, b) => this.compararDesempenhoGeral(a, b));

      // 8 TERCEIROS COLOCADOS
      this.playoffTerceiros = estatisticas
        .filter(jogador => jogador.colocacaoGrupo === 3)
        .sort((a, b) => this.compararDesempenhoGeral(a, b));

      // 8 QUARTOS COLOCADOS
      this.eliminados = estatisticas
        .filter(jogador => jogador.colocacaoGrupo === 4)
        .sort((a, b) => this.compararDesempenhoGeral(a, b));

      // RANKING CONSOLIDADO COM OS 32 PARTICIPANTES
      this.rankingGeral = [
        ...classificados,
        ...this.playoffTerceiros,
        ...this.eliminados
      ];

    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      this.erro = 'Não foi possível carregar o ranking geral.';
    } finally {
      this.carregando = false;
    }
  }

  // CRITÉRIOS PRINCIPAIS DE CLASSIFICAÇÃO
  private compararCriteriosPrincipais(
    a: JogadorRanking,
    b: JogadorRanking
  ): number {
    return (
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      b.saldoGols - a.saldoGols ||
      b.golsPro - a.golsPro
    );
  }

  // ORDENAR JOGADORES DENTRO DO GRUPO
  private ordenarGrupo(
    jogadores: JogadorRanking[],
    partidas: PartidaRanking[]
  ): JogadorRanking[] {

    const ordenados = [...jogadores].sort((a, b) =>
      this.compararCriteriosPrincipais(a, b)
    );

    const resultado: JogadorRanking[] = [];
    let inicio = 0;

    while (inicio < ordenados.length) {
      let fim = inicio + 1;

      while (
        fim < ordenados.length &&
        this.compararCriteriosPrincipais(
          ordenados[inicio],
          ordenados[fim]
        ) === 0
      ) {
        fim++;
      }

      const empatados = ordenados.slice(inicio, fim);

      if (empatados.length > 1) {
        const ids = new Set(empatados.map(j => j.id));

        const confrontoDireto = new Map<string, {
          pontos: number;
          golsPro: number;
          golsContra: number;
        }>();

        empatados.forEach(jogador => {
          confrontoDireto.set(jogador.id, {
            pontos: 0,
            golsPro: 0,
            golsContra: 0
          });
        });

        partidas.forEach(partida => {
          if (
            partida.status !== 'realizada' ||
            partida.gols_casa === null ||
            partida.gols_visitante === null ||
            !ids.has(partida.jogador_casa_id) ||
            !ids.has(partida.jogador_visitante_id)
          ) {
            return;
          }

          const casa = confrontoDireto.get(partida.jogador_casa_id)!;
          const visitante = confrontoDireto.get(partida.jogador_visitante_id)!;

          casa.golsPro += partida.gols_casa;
          casa.golsContra += partida.gols_visitante;

          visitante.golsPro += partida.gols_visitante;
          visitante.golsContra += partida.gols_casa;

          if (partida.gols_casa > partida.gols_visitante) {
            casa.pontos += 3;
          } else if (partida.gols_casa < partida.gols_visitante) {
            visitante.pontos += 3;
          } else {
            casa.pontos++;
            visitante.pontos++;
          }
        });

        empatados.sort((a, b) => {
          const confrontoA = confrontoDireto.get(a.id)!;
          const confrontoB = confrontoDireto.get(b.id)!;

          const saldoA = confrontoA.golsPro - confrontoA.golsContra;
          const saldoB = confrontoB.golsPro - confrontoB.golsContra;

          return (
            confrontoB.pontos - confrontoA.pontos ||
            saldoB - saldoA ||
            confrontoB.golsPro - confrontoA.golsPro ||
            a.golsContra - b.golsContra ||
            a.nome.localeCompare(b.nome)
          );
        });
      }

      resultado.push(...empatados);
      inicio = fim;
    }

    return resultado;
  }

  // COMPARAR DESEMPENHO GERAL
  private compararDesempenhoGeral(
    a: JogadorRanking,
    b: JogadorRanking
  ): number {
    return (
      this.compararCriteriosPrincipais(a, b) ||
      a.golsContra - b.golsContra ||
      a.nome.localeCompare(b.nome)
    );
  }

  // TOTAL DE JOGADORES
  get totalJogadores(): number {
    return this.rankingGeral.length;
  }
}
