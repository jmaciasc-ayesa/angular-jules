import { Routes } from '@angular/router';
import { PokemonListComponent } from './pokemon-list/pokemon-list.component'; // Import PokemonListComponent
import { PokemonDetailComponent } from './pokemon-detail/pokemon-detail.component';

export const routes: Routes = [
  { path: '', component: PokemonListComponent, pathMatch: 'full' }, // Default route to PokemonListComponent
  { path: 'pokemon/:name', component: PokemonDetailComponent },
  { path: '**', redirectTo: '' } // Redirect unknown paths to the default
];
