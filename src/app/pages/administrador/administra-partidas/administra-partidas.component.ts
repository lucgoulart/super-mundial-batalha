
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { AdminAuthService } from '../../../services/admin-auth.service';

interface JogadorPartida {
  id: string;
  nome: string;
  nome_time: string;
  simbolo_time: string | null;
  escudoUrl: string | null;
}

interface Partida {
  id: string;
  fase: string;
  grupo: string | null;
  turno: number | null;
  jogador_casa_id: string;
  jogador_visitante_id: string;
  gols_casa: number | null;
  gols_visitante: number | null;
  status: 'pendente' | 'realizada';
  jogador_casa: JogadorPartida | null;
  jogador_visitante: JogadorPartida | null;
}

@Component({
  selector: 'app-administra-partidas',
  templateUrl: './administra-partidas.component.html',
  styleUrls: ['./administra-partidas.component.scss']
})
export class AdministraPartidasComponent implements OnInit {

  partidas: Partida[] = [];
  partidasFiltradas: Partida[] = [];

  carregando = false;
  salvandoId: string | null = null;
  gerandoPlayoff1 = false;
  gerandoPlayoff2 = false;
  gerandoOitavas = false;
  gerandoQuartas = false;
  gerandoSemifinais = false;
  gerandoFinal = false;

  faseSelecionada = 'grupos';
  grupoSelecionado = 'Todos';
  turnoSelecionado = 1;

  grupos = ['Todos', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  constructor(
    private supabaseService: SupabaseService,
    private adminAuthService: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.carregarPartidas();
  }

  async carregarPartidas(): Promise<void> {
    this.carregando = true;

    try {
      const client = this.supabaseService.client;

      const { data: partidas, error } = await client
        .from('partidas')
        .select('*')
        .order('grupo')
        .order('turno');

      if (error) throw error;

     const { data: respostaJogadores, error: erroJogadores } =
  await client.functions.invoke('dynamic-handler', {
    body: {
      action: 'public_list'
    }
  });

if (erroJogadores) throw erroJogadores;

const jogadores: JogadorPartida[] =
  respostaJogadores?.jogadores || [];

      const mapaJogadores = new Map<string, JogadorPartida>(
        (jogadores || []).map((j: JogadorPartida) => [j.id, j])
      );

      this.partidas = (partidas || []).map((partida: any) => ({
        ...partida,
        jogador_casa: mapaJogadores.get(partida.jogador_casa_id) || null,
        jogador_visitante: mapaJogadores.get(partida.jogador_visitante_id) || null
      }));

      this.aplicarFiltros();

    } catch (error: any) {
      console.error('Erro ao carregar partidas:', error);
      alert(error.message || 'Não foi possível carregar as partidas.');
    } finally {
      this.carregando = false;
    }
  }

  selecionarFase(fase: string): void {
    this.faseSelecionada = fase;
    this.aplicarFiltros();
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

  selecionarTurno(turno: number): void {
    this.turnoSelecionado = turno;
    this.aplicarFiltros();
  }

  async salvarResultado(partida: Partida): Promise<void> {
    if (
      partida.gols_casa === null ||
      partida.gols_visitante === null ||
      !Number.isInteger(Number(partida.gols_casa)) ||
      !Number.isInteger(Number(partida.gols_visitante)) ||
      Number(partida.gols_casa) < 0 ||
      Number(partida.gols_visitante) < 0
    ) {
      alert('Informe um placar válido para os dois jogadores.');
      return;
    }

    this.salvandoId = partida.id;

    try {
      await this.adminAuthService.executarOperacao({
        action: 'save_match_result',
        id: partida.id,
        gols_casa: Number(partida.gols_casa),
        gols_visitante: Number(partida.gols_visitante)
      });

      partida.status = 'realizada';

      alert('Resultado salvo com sucesso!');

    } catch (error: any) {
      console.error('Erro ao salvar resultado:', error);
      alert(error.message || 'Não foi possível salvar o resultado.');
    } finally {
      this.salvandoId = null;
    }
  }

  async gerarPlayoff1(): Promise<void> {
    if (!this.podeGerarPlayoff1) {
      alert(
        'Para gerar o Playoff 1, todas as 96 partidas da fase de grupos precisam estar concluídas.'
      );
      return;
    }

    const confirmar = confirm(
      'Deseja gerar os quatro confrontos do Playoff 1 com base na classificação final dos grupos?'
    );

    if (!confirmar) return;

    this.gerandoPlayoff1 = true;

    try {
      await this.adminAuthService.executarOperacao({
        action: 'generate_playoff_1'
      });

      await this.carregarPartidas();

      this.selecionarFase('playoff_1');

      alert('Playoff 1 gerado com sucesso!');

    } catch (error: any) {
      console.error('Erro ao gerar Playoff 1:', error);
      alert(error.message || 'Não foi possível gerar o Playoff 1.');
    } finally {
      this.gerandoPlayoff1 = false;
    }
  }

async gerarPlayoff2(): Promise<void> {
  if (!this.podeGerarPlayoff2) {
    alert(
      'Para gerar o Playoff 2, os quatro jogos do Playoff 1 precisam estar concluídos.'
    );
    return;
  }

  const confirmar = confirm(
    'Deseja gerar os quatro confrontos do Playoff 2 com base na classificação e nos vencedores do Playoff 1?'
  );

  if (!confirmar) return;

  this.gerandoPlayoff2 = true;

  try {
    await this.adminAuthService.executarOperacao({
      action: 'generate_playoff_2'
    });

    await this.carregarPartidas();

    this.selecionarFase('playoff_2');

    alert('Playoff 2 gerado com sucesso!');

  } catch (error: any) {
    console.error('Erro ao gerar Playoff 2:', error);
    alert(error.message || 'Não foi possível gerar o Playoff 2.');
  } finally {
    this.gerandoPlayoff2 = false;
  }
}


  async gerarOitavas(): Promise<void> {
    if (!this.podeGerarOitavas) {
      alert(
        'Para gerar as Oitavas, os quatro jogos do Playoff 2 precisam estar concluídos.'
      );
      return;
    }

    const confirmar = confirm(
      'Deseja gerar os oito confrontos das Oitavas de Final com base nos 12 classificados diretos e nos quatro vencedores do Playoff 2?'
    );

    if (!confirmar) return;

    this.gerandoOitavas = true;

    try {
      await this.adminAuthService.executarOperacao({
        action: 'generate_round_of_16'
      });

      await this.carregarPartidas();

      this.selecionarFase('oitavas');

      alert('Oitavas de Final geradas com sucesso!');

    } catch (error: any) {
      console.error('Erro ao gerar Oitavas:', error);
      alert(error.message || 'Não foi possível gerar as Oitavas de Final.');
    } finally {
      this.gerandoOitavas = false;
    }
  }

    async gerarQuartas(): Promise<void> {
    if (!this.podeGerarQuartas) {
      alert(
        'Para gerar as Quartas de Final, as oito partidas das Oitavas precisam estar concluídas.'
      );
      return;
    }

    const confirmar = confirm(
      'Deseja gerar as quatro partidas das Quartas de Final com base nos vencedores das Oitavas?'
    );

    if (!confirmar) return;

    this.gerandoQuartas = true;

    try {
      await this.adminAuthService.executarOperacao({
        action: 'generate_quarters'
      });

      await this.carregarPartidas();

      this.selecionarFase('quartas');

      alert('Quartas de Final geradas com sucesso!');

    } catch (error: any) {
      console.error('Erro ao gerar Quartas:', error);
      alert(error.message || 'Não foi possível gerar as Quartas de Final.');
    } finally {
      this.gerandoQuartas = false;
    }
  }


  async gerarSemifinais(): Promise<void> {
  if (!this.podeGerarSemifinais) {
    alert(
      'Para gerar as Semifinais, as quatro partidas das Quartas precisam estar concluídas.'
    );
    return;
  }

  const confirmar = confirm(
    'Deseja gerar as duas Semifinais com base nos vencedores das Quartas?'
  );

  if (!confirmar) return;

  this.gerandoSemifinais = true;

  try {
    await this.adminAuthService.executarOperacao({
      action: 'generate_semifinals'
    });

    await this.carregarPartidas();

    this.selecionarFase('semifinais');

    alert('Semifinais geradas com sucesso!');

  } catch (error: any) {
    console.error('Erro ao gerar Semifinais:', error);
    alert(error.message || 'Não foi possível gerar as Semifinais.');
  } finally {
    this.gerandoSemifinais = false;
  }
}

async gerarFinal(): Promise<void> {
  if (!this.podeGerarFinal) {
    alert(
      'Para gerar a Final, as duas partidas das Semifinais precisam estar concluídas.'
    );
    return;
  }

  const confirmar = confirm(
    'Deseja gerar a Final com base nos vencedores das Semifinais?'
  );

  if (!confirmar) return;

  this.gerandoFinal = true;

  try {
    await this.adminAuthService.executarOperacao({
      action: 'generate_final'
    });

    await this.carregarPartidas();

    this.selecionarFase('final');

    alert('Final gerada com sucesso!');

  } catch (error: any) {
    console.error('Erro ao gerar Final:', error);
    alert(error.message || 'Não foi possível gerar a Final.');
  } finally {
    this.gerandoFinal = false;
  }
}


  async resetarResultados(): Promise<void> {
    const confirmar = confirm(
      'ATENÇÃO! O campeonato será reiniciado. Todos os resultados serão apagados e as partidas eliminatórias serão removidas. As 96 partidas dos grupos e os jogadores serão mantidos. Deseja continuar?'
    );

    if (!confirmar) return;

    try {
      await this.adminAuthService.executarOperacao({
        action: 'reset_matches'
      });

      this.faseSelecionada = 'grupos';
      this.grupoSelecionado = 'Todos';
      this.turnoSelecionado = 1;

      await this.carregarPartidas();

      alert('Campeonato reiniciado com sucesso!');

    } catch (error: any) {
      console.error('Erro ao resetar campeonato:', error);
      alert(error.message || 'Não foi possível resetar o campeonato.');
    }
  }

  get totalPartidas(): number {
    return this.partidas.length;
  }

  get partidasRealizadas(): number {
    return this.partidas.filter(p => p.status === 'realizada').length;
  }

  get partidasPendentes(): number {
    return this.partidas.filter(p => p.status === 'pendente').length;
  }

  get partidasGrupos(): number {
    return this.partidas.filter(p => p.fase === 'grupos').length;
  }

  get partidasGruposRealizadas(): number {
    return this.partidas.filter(
      p => p.fase === 'grupos' && p.status === 'realizada'
    ).length;
  }

  get existePlayoff1(): boolean {
    return this.partidas.some(p => p.fase === 'playoff_1');
  }

  get podeGerarPlayoff1(): boolean {
    return (
      this.partidasGrupos === 96 &&
      this.partidasGruposRealizadas === 96 &&
      !this.existePlayoff1
    );
  }

  get totalPartidasPlayoff1(): number {
    return this.partidas.filter(p => p.fase === 'playoff_1').length;
  }

  get partidasPlayoff1Realizadas(): number {
  return this.partidas.filter(
    p => p.fase === 'playoff_1' && p.status === 'realizada'
  ).length;
}

get existePlayoff2(): boolean {
  return this.partidas.some(p => p.fase === 'playoff_2');
}

get totalPartidasPlayoff2(): number {
  return this.partidas.filter(p => p.fase === 'playoff_2').length;
}

get podeGerarPlayoff2(): boolean {
  return (
    this.totalPartidasPlayoff1 === 4 &&
    this.partidasPlayoff1Realizadas === 4 &&
    !this.existePlayoff2
  );
}

get existeOitavas(): boolean {
  return this.partidas.some(p => p.fase === 'oitavas');
}

get totalPartidasOitavas(): number {
  return this.partidas.filter(p => p.fase === 'oitavas').length;
}

get partidasOitavasRealizadas(): number {
  return this.partidas.filter(
    p => p.fase === 'oitavas' && p.status === 'realizada'
  ).length;
}

get podeGerarOitavas(): boolean {
  return (
    this.totalPartidasPlayoff2 === 4 &&
    this.partidas.filter(
      p => p.fase === 'playoff_2' && p.status === 'realizada'
    ).length === 4 &&
    !this.existeOitavas
  );
}

 

  get totalPartidasQuartas(): number {
    return this.partidas.filter(p => p.fase === 'quartas').length;
  }

  get partidasQuartasRealizadas(): number {
    return this.partidas.filter(
      p => p.fase === 'quartas' && p.status === 'realizada'
    ).length;
  }

  get podeGerarQuartas(): boolean {
    return (
      this.totalPartidasOitavas === 8 &&
      this.partidasOitavasRealizadas === 8 &&
      !this.existeQuartas
    );
  }

get existeQuartas(): boolean {
  return this.partidas.some(p => p.fase === 'quartas');
}

get totalPartidasSemifinais(): number {
  return this.partidas.filter(p => p.fase === 'semifinais').length;
}

get partidasSemifinaisRealizadas(): number {
  return this.partidas.filter(
    p => p.fase === 'semifinais' && p.status === 'realizada'
  ).length;
}

get existeSemifinais(): boolean {
  return this.partidas.some(p => p.fase === 'semifinais');
}

get podeGerarSemifinais(): boolean {
  return (
    this.totalPartidasQuartas === 4 &&
    this.partidasQuartasRealizadas === 4 &&
    !this.existeSemifinais
  );
}

get totalPartidasFinal(): number {
  return this.partidas.filter(p => p.fase === 'final').length;
}

get existeFinal(): boolean {
  return this.partidas.some(p => p.fase === 'final');
}

get podeGerarFinal(): boolean {
  return (
    this.totalPartidasSemifinais === 2 &&
    this.partidasSemifinaisRealizadas === 2 &&
    !this.existeFinal
  );
}
}
