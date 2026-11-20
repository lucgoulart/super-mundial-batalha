
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

type FasePartida =
  | 'grupos'
  | 'playoff_1'
  | 'playoff_2'
  | 'oitavas'
  | 'quartas'
  | 'semifinais'
  | 'final';

interface Partida {
  id: string;
  fase: FasePartida;
  grupo: string | null;
  turno: number | null;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: 'pendente' | 'realizada';
  jogador_casa: Jogador | null;
  jogador_visitante: Jogador | null;
}
@Component({
  selector: 'app-partidas-publica',
  templateUrl: './partidas-publica.component.html',
  styleUrls: ['./partidas-publica.component.scss']
})
export class PartidasPublicaComponent implements OnInit {

  partidas: Partida[] = [];
  partidasFiltradas: Partida[] = [];

  carregando = false;
  erro = '';

  grupos = ['Todos', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  grupoSelecionado = 'Todos';
  turnoSelecionado = 1;

  faseSelecionada: FasePartida = 'grupos';

fases: { valor: FasePartida; nome: string }[] = [
  { valor: 'grupos', nome: 'Grupos' },
  { valor: 'playoff_1', nome: 'Playoff 1' },
  { valor: 'playoff_2', nome: 'Playoff 2' },
  { valor: 'oitavas', nome: 'Oitavas' },
  { valor: 'quartas', nome: 'Quartas' },
  { valor: 'semifinais', nome: 'Semifinais' },
  { valor: 'final', nome: 'Final' }
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
  .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: resultadoJogadores, error: erroJogadores } =
  await client.functions.invoke('dynamic-handler', {
    body: { action: 'public_list' }
  });

if (erroJogadores) throw erroJogadores;

const jogadores: Jogador[] = resultadoJogadores?.jogadores || [];

      const mapaJogadores = new Map<string, Jogador>(
        (jogadores || []).map((jogador: Jogador) => [
          jogador.id,
          jogador
        ])
      );

      this.partidas = (partidas || []).map((partida: any) => ({
        ...partida,
        jogador_casa: mapaJogadores.get(partida.jogador_casa_id) || null,
        jogador_visitante: mapaJogadores.get(partida.jogador_visitante_id) || null
      }));

      this.aplicarFiltros();

    } catch (error: any) {
      console.error('Erro ao carregar partidas públicas:', error);
      this.erro = 'Não foi possível carregar as partidas.';
    } finally {
      this.carregando = false;
    }
  }

 aplicarFiltros(): void {
  this.partidasFiltradas = this.partidas.filter(partida => {

    if (partida.fase !== this.faseSelecionada) {
      return false;
    }

    if (this.faseSelecionada !== 'grupos') {
      return true;
    }

    const grupoCorreto =
      this.grupoSelecionado === 'Todos' ||
      partida.grupo === this.grupoSelecionado;

    return grupoCorreto && partida.turno === this.turnoSelecionado;
  });
}
  selecionarGrupo(grupo: string): void {
    this.grupoSelecionado = grupo;
    this.aplicarFiltros();
  }

  selecionarFase(fase: FasePartida): void {
  this.faseSelecionada = fase;
  this.grupoSelecionado = 'Todos';
  this.turnoSelecionado = 1;
  this.aplicarFiltros();
}

  selecionarTurno(turno: number): void {
    this.turnoSelecionado = turno;
    this.aplicarFiltros();
  }

  formatarWhatsApp(whatsapp: string): string {
    const numero = whatsapp.replace(/\D/g, '');

    return numero.startsWith('55') ? numero : `55${numero}`;
  }

  getLinkWhatsApp(whatsapp: string): string {
    return `https://wa.me/${this.formatarWhatsApp(whatsapp)}`;
  }

  get totalPartidas(): number {
    return this.partidas.length;
  }

  get partidasRealizadas(): number {
    return this.partidas.filter(
      partida => partida.status === 'realizada'
    ).length;
  }

  get partidasPendentes(): number {
    return this.partidas.filter(
      partida => partida.status === 'pendente'
    ).length;
  }

  getNomeFase(fase: FasePartida): string {
  const nomes: Record<FasePartida, string> = {
    grupos: 'FASE DE GRUPOS',
    playoff_1: 'PLAYOFF 1',
    playoff_2: 'PLAYOFF 2',
    oitavas: 'OITAVAS DE FINAL',
    quartas: 'QUARTAS DE FINAL',
    semifinais: 'SEMIFINAIS',
    final: 'GRANDE FINAL'
  };

  return nomes[fase];
}

get tituloFase(): string {
  return this.getNomeFase(this.faseSelecionada);
}

get totalPartidasFase(): number {
  return this.partidasFiltradas.length;
}

totalDaFase(fase: FasePartida): number {
  return this.partidas.filter(p => p.fase === fase).length;
}

get mensagemVazia(): string {
  return this.totalDaFase(this.faseSelecionada) === 0
    ? 'Esta fase ainda não foi gerada. Aguarde a conclusão da etapa anterior.'
    : 'Nenhuma partida encontrada para esse filtro.';
}

}
