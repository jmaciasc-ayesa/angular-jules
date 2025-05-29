import { Component, OnInit, inject } from '@angular/core'; // Import inject
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClient and HttpClientModule

interface Pokemon {
  name: string;
  url: string;
}

interface PokeApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pokemon[];
}

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // Add HttpClientModule here for standalone components
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})
export class PokemonListComponent implements OnInit {
  pokemonList: Pokemon[] = [];
  error: string | null = null;

  private http = inject(HttpClient); // Inject HttpClient

  ngOnInit(): void {
    this.fetchPokemon();
  }

  fetchPokemon(): void {
    this.http.get<PokeApiResponse>('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0')
      .subscribe({
        next: (response) => {
          this.pokemonList = response.results;
        },
        error: (err) => {
          console.error('Error fetching Pokemon:', err);
          this.error = 'Failed to load Pokemon list.';
        }
      });
  }
}
