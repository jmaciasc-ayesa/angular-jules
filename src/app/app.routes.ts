import { Routes } from '@angular/router';
import { PokemonListComponent } from './pokemon-list/pokemon-list.component';
import { PokemonDetailComponent } from './pokemon-detail/pokemon-detail.component';
import { AbilityDetailComponent } from './ability-detail/ability-detail.component'; // Import AbilityDetailComponent

export const routes: Routes = [
  { path: '', component: PokemonListComponent, pathMatch: 'full' },
  { path: 'pokemon/:name', component: PokemonDetailComponent },
  { path: 'ability/:name', component: AbilityDetailComponent }, // New route for ability details
  { path: '**', redirectTo: '' } // Wildcard route
];
