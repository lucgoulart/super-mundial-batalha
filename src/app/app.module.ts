import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { FormatoComponent } from './pages/formato/formato.component';
import { RegulamentoComponent } from './pages/regulamento/regulamento.component';
import { AdministradorComponent } from './pages/administrador/administrador.component';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdministraJogadoresComponent } from './pages/administrador/administra-jogadores/administra-jogadores.component';
import { JogadoresPublicaComponent } from './pages/jogadores-publica/jogadores-publica.component';
import { AdministraPartidasComponent } from './pages/administrador/administra-partidas/administra-partidas.component';
import { PartidasPublicaComponent } from './pages/partidas-publica/partidas-publica.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { GruposComponent } from './pages/grupos/grupos.component';
import { MataMataComponent } from './pages/mata-mata/mata-mata.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    FormatoComponent,
    RegulamentoComponent,
    AdministradorComponent,
    AdministraJogadoresComponent,
    JogadoresPublicaComponent,
    AdministraPartidasComponent,
    PartidasPublicaComponent,
    RankingComponent,
    GruposComponent,
    MataMataComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
