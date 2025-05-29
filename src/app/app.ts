import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PokemonListComponent } from './pokemon-list/pokemon-list.component'; // Import the component

@Component({
  selector: 'app-root',
  standalone: true, // Ensure standalone is true
  imports: [
    RouterOutlet, // Keep RouterOutlet
    PokemonListComponent // Add PokemonListComponent here
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // Corrected from styleUrl to styleUrls
})
export class App {
  title = 'Angular App'; // Changed to public and updated title
}
