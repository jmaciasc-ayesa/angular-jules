import { Routes } from '@angular/router';
import { PokemonDetailComponent } from './pokemon-detail/pokemon-detail.component'; // Import the new component

export const routes: Routes = [
  { path: 'pokemon/:name', component: PokemonDetailComponent }
  // Assuming AppComponent handles the root path and displays PokemonListComponent directly.
  // If PokemonListComponent were to be routed, a route like { path: '', component: PokemonListComponent } would be added.
];
