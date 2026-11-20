
import { Component, OnInit } from '@angular/core';
import { AdminAuthService } from '../../../services/admin-auth.service';

interface Jogador {
  id: string;
  nome: string;
  whatsapp: string;
  idFifa: string;
  time: string;
  escudoUrl: string | null;
  simboloTime: string | null;
  grupo: string;
}

interface JogadorBanco {
  id: string;
  nome: string;
  whatsapp: string;
  id_fifa: string;
  nome_time: string;
  simbolo_time: string | null;
  escudoUrl?: string | null;
  escudo_url?: string | null;
  simbolo_time_url?: string | null;
  grupo: string;
}

@Component({
  selector: 'app-administra-jogadores',
  templateUrl: './administra-jogadores.component.html',
  styleUrls: ['./administra-jogadores.component.scss']
})
export class AdministraJogadoresComponent implements OnInit {

  readonly limiteJogadores = 32;

  jogadores: Jogador[] = [];

  modalAberto = false;
  jogadorEmEdicao: string | null = null;

  termoPesquisa = '';
  escudoPreview: string | null = null;
  mensagemErro = '';

  carregando = false;
  carregandoLista = false;

  private arquivoEscudo: File | null = null;

  formulario = {
    nome: '',
    whatsapp: '',
    idFifa: '',
    time: '',
     grupo: ''
  };

  constructor(
    private adminAuthService: AdminAuthService
  ) {}

  ngOnInit(): void {
    this.carregarJogadores();
  }

  get totalJogadores(): number {
    return this.jogadores.length;
  }

  get vagasDisponiveis(): number {
    return Math.max(0, this.limiteJogadores - this.totalJogadores);
  }

  get percentualOcupacao(): number {
    return Math.round(
      (this.totalJogadores / this.limiteJogadores) * 100
    );
  }

  get jogadoresFiltrados(): Jogador[] {
    const termo = this.termoPesquisa.trim().toLowerCase();

    if (!termo) {
      return this.jogadores;
    }

    return this.jogadores.filter(jogador =>
      jogador.nome.toLowerCase().includes(termo) ||
      jogador.idFifa.toLowerCase().includes(termo) ||
      jogador.time.toLowerCase().includes(termo)
    );
  }

  // BUSCAR JOGADORES NO SUPABASE

  async carregarJogadores(): Promise<void> {
    this.carregandoLista = true;

    try {
      const resultado = await this.adminAuthService
        .executarOperacao<{
          jogadores: JogadorBanco[];
        }>({
          action: 'list'
        });

      this.jogadores = (resultado.jogadores || []).map(jogador => ({
        id: jogador.id,
        nome: jogador.nome,
        whatsapp: jogador.whatsapp,
        idFifa: jogador.id_fifa,
        time: jogador.nome_time,
        simboloTime: jogador.simbolo_time,
        grupo: jogador.grupo || '',
        escudoUrl:
          jogador.escudoUrl ||
          jogador.escudo_url ||
          jogador.simbolo_time_url ||
          null
      }));

    } catch (error: any) {
      console.error('Erro ao carregar jogadores:', error);

      this.mensagemErro =
        error?.message || 'Não foi possível carregar os jogadores.';

    } finally {
      this.carregandoLista = false;
    }
  }

  // ABRIR CADASTRO

  abrirCadastro(): void {
    if (this.vagasDisponiveis <= 0 || this.carregando) {
      return;
    }

    this.limparFormulario();
    this.modalAberto = true;
  }

  // EDITAR JOGADOR

  editarJogador(jogador: Jogador): void {
    if (this.carregando) {
      return;
    }

    this.limparFormulario();

    this.jogadorEmEdicao = jogador.id;

    this.formulario = {
      nome: jogador.nome,
      whatsapp: jogador.whatsapp,
      idFifa: jogador.idFifa,
      time: jogador.time,
      grupo: jogador.grupo
    };

    this.escudoPreview = jogador.escudoUrl;
    this.modalAberto = true;
  }

  // SELECIONAR ESCUDO

  selecionarEscudo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) {
      return;
    }

    const formatosPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
      this.mensagemErro = 'Formato inválido. Utilize PNG, JPG ou WEBP.';
      input.value = '';
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      this.mensagemErro = 'A imagem deve ter no máximo 2 MB.';
      input.value = '';
      return;
    }

    this.arquivoEscudo = arquivo;

    const leitor = new FileReader();

    leitor.onload = () => {
      this.escudoPreview = leitor.result as string;
      this.mensagemErro = '';
    };

    leitor.readAsDataURL(arquivo);
  }

  // CADASTRAR OU ATUALIZAR JOGADOR

  async salvarJogador(): Promise<void> {
    if (this.carregando) {
      return;
    }

    this.mensagemErro = '';

    const nome = this.formulario.nome.trim();
    const whatsapp = this.formulario.whatsapp.trim();
    const idFifa = this.formulario.idFifa.trim();
    const time = this.formulario.time.trim();

    if (!nome || !whatsapp || !idFifa || !time) {
      this.mensagemErro = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const editando = this.jogadorEmEdicao !== null;

    if (!editando && this.vagasDisponiveis <= 0) {
      this.mensagemErro = 'O limite de 32 jogadores foi atingido.';
      return;
    }

    this.carregando = true;

    try {
      let caminhoEscudo: string | null = null;

      // Mantém o escudo atual durante a edição,
      // caso nenhuma imagem nova seja selecionada.

      if (editando) {
        const jogadorAtual = this.jogadores.find(
          jogador => jogador.id === this.jogadorEmEdicao
        );

        caminhoEscudo = jogadorAtual?.simboloTime || null;
      }

      // ENVIA NOVO ESCUDO PARA O STORAGE

      if (this.arquivoEscudo) {
        const fileBase64 = await this.converterArquivoBase64(
          this.arquivoEscudo
        );

        const resultadoUpload = await this.adminAuthService
          .executarOperacao<{
            caminho: string;
          }>({
            action: 'upload',
            fileBase64,
            fileName: this.arquivoEscudo.name,
            contentType: this.arquivoEscudo.type
          });

        caminhoEscudo = resultadoUpload.caminho;
      }

      const dadosJogador = {
        nome,
        whatsapp,
        id_fifa: idFifa,
        nome_time: time,
        grupo: this.formulario.grupo,
        simbolo_time: caminhoEscudo
      };

      if (editando) {

        // ATUALIZA JOGADOR NO BANCO

          await this.adminAuthService.executarOperacao({
      action: 'update',
      id: this.jogadorEmEdicao,
      jogador: dadosJogador
    });

      } else {

        // CADASTRA NOVO JOGADOR NO BANCO

        await this.adminAuthService.executarOperacao({
          action: 'create',
          jogador: dadosJogador
        });

      }

      // ATUALIZA A LISTA COM OS DADOS DO BANCO

      await this.carregarJogadores();

      this.modalAberto = false;
      this.limparFormulario();

    } catch (error: any) {
      console.error('Erro ao salvar jogador:', error);

      this.mensagemErro =
        error?.message || 'Não foi possível salvar o jogador.';

    } finally {
      this.carregando = false;
    }
  }

  // EXCLUIR JOGADOR

  async excluirJogador(jogador: Jogador): Promise<void> {
    if (this.carregando) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o jogador ${jogador.nome}?`
    );

    if (!confirmar) {
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    try {
      await this.adminAuthService.executarOperacao({
        action: 'delete',
        id: jogador.id
      });

      this.jogadores = this.jogadores.filter(
        item => item.id !== jogador.id
      );

    } catch (error: any) {
      console.error('Erro ao excluir jogador:', error);

      this.mensagemErro =
        error?.message || 'Não foi possível excluir o jogador.';

    } finally {
      this.carregando = false;
    }
  }

  // FECHAR MODAL

  fecharCadastro(): void {
    if (this.carregando) {
      return;
    }

    this.modalAberto = false;
    this.limparFormulario();
  }

  // LIMPAR FORMULÁRIO

  private limparFormulario(): void {
    this.formulario = {
      nome: '',
      whatsapp: '',
      idFifa: '',
      time: '',
      grupo: ''
    };

    this.jogadorEmEdicao = null;
    this.escudoPreview = null;
    this.arquivoEscudo = null;
    this.mensagemErro = '';
  }

  // CONVERTER IMAGEM PARA BASE64

 private converterArquivoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = leitor.result as string;

      // Remove o cabeçalho data:image/...;base64,
      const base64 = resultado.split(',')[1];

      if (!base64) {
        reject(new Error('Não foi possível converter a imagem.'));
        return;
      }

      resolve(base64);
    };

    leitor.onerror = () => {
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };

    leitor.readAsDataURL(arquivo);
  });
}

  trackById(index: number, jogador: Jogador): string {
    return jogador.id;
  }
}
