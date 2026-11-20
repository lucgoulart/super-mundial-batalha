
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {

  private readonly functionName = 'dynamic-handler';
  private codigoAutorizacao: string | null = null;

  constructor(private supabaseService: SupabaseService) {}

  async validarCodigo(codigo: string): Promise<boolean> {
    try {
      const { data, error } =
        await this.supabaseService.client.functions.invoke(
          this.functionName,
          {
            body: { code: codigo }
          }
        );

      if (error || data?.authorized !== true) {
        this.codigoAutorizacao = null;
        return false;
      }

      this.codigoAutorizacao = codigo;

      return true;

    } catch (error) {
      console.error('Erro ao validar código:', error);
      this.codigoAutorizacao = null;
      return false;
    }
  }

  estaAutenticado(): boolean {
    return this.codigoAutorizacao !== null;
  }

  async executarOperacao<T = any>(
    operacao: Record<string, any>
  ): Promise<T> {

    if (!this.codigoAutorizacao) {
      throw new Error('Acesso administrativo não autorizado.');
    }

    const { data, error } =
      await this.supabaseService.client.functions.invoke(
        this.functionName,
        {
          body: {
            ...operacao,
            code: this.codigoAutorizacao
          }
        }
      );

    if (error) {
      throw new Error(
        error.message || 'Não foi possível executar a operação.'
      );
    }

    if (data?.authorized !== true) {
      throw new Error(
        data?.error || 'Operação não autorizada.'
      );
    }

    return data as T;
  }

  sair(): void {
    this.codigoAutorizacao = null;
  }
}
