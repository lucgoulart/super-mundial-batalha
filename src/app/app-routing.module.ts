import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { FormatoComponent } from './pages/formato/formato.component';
import { RegulamentoComponent } from './pages/regulamento/regulamento.component';
import { AdministradorComponent } from './pages/administrador/administrador.component';
import { AdministraJogadoresComponent } from './pages/administrador/administra-jogadores/administra-jogadores.component';
import { AdministraPartidasComponent } from './pages/administrador/administra-partidas/administra-partidas.component';
import { JogadoresPublicaComponent } from './pages/jogadores-publica/jogadores-publica.component';
import { PartidasPublicaComponent } from './pages/partidas-publica/partidas-publica.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { GruposComponent } from './pages/grupos/grupos.component';
import { MataMataComponent } from './pages/mata-mata/mata-mata.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'formato',
    component: FormatoComponent
  },
  {
    path: 'regulamento',
    component: RegulamentoComponent
  },
  {
    path: 'jogadores',
    component: JogadoresPublicaComponent
  },
  {
  path: 'partidas',
  component: PartidasPublicaComponent
  },
   {
  path: 'ranking',
  component: RankingComponent
  },
  {
  path: 'grupos',
  component: GruposComponent
},
{
  path: 'mata-mata',
  component: MataMataComponent
},
  {
    path: 'administrador',
    component: AdministradorComponent,
    children: [
      {
        path: 'administra-jogadores',
        component: AdministraJogadoresComponent
      },
      {
        path: 'administra-partidas',
        component: AdministraPartidasComponent
      },
      {
        path: '',
        redirectTo: 'administra-jogadores',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}