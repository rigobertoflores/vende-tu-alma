import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AccesoComponent } from './pages/acceso.component';
import { CatalogoComponent } from './pages/catalogo.component';
import { MiAlmaComponent } from './pages/mi-alma.component';
import { BuscarComponent } from './pages/buscar.component';
import { TratoComponent } from './pages/trato.component';
import { MarcadorComponent } from './pages/marcador.component';
import { AdminComponent } from './pages/admin.component';

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'acceso', component: AccesoComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'mi-alma', component: MiAlmaComponent },
  { path: 'buscar', component: BuscarComponent },
  { path: 'trato', component: TratoComponent },
  { path: 'marcador', component: MarcadorComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' },
];
