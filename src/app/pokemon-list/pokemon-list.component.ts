import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router'; // Import RouterLink
import { forkJoin, of } from 'rxjs'; // Import forkJoin and of
import { map, switchMap, catchError } from 'rxjs/operators'; // Import operators

// Interface for the items in the 'results' array from the initial fetch
interface PokemonListItem {
  name: string;
  url: string; // This is the detail URL
}

// Interface for the overall response of the initial fetch
export interface PokeApiResponse { // Export this interface
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

// Interface for the data we want to store for each Pokemon (name and image)
export interface Pokemon { // Made exportable as it might be used in spec.ts
  name: string;
  imageUrl?: string; // Optional, as it's fetched in a second step
  detailsUrl: string; // Keep the details URL for linking later
}

// Interface for the detailed Pokemon data (to extract sprites)
export interface PokemonDetail { // Export this interface
  id: number;
  name: string;
  sprites: {
    front_default: string;
    // other sprites can be added if needed
  };
  // other properties like types, abilities etc. can be added
}

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink], // Add RouterLink here
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.css']
})
export class PokemonListComponent implements OnInit {
  pokemonList: Pokemon[] = [];
  error: string | null = null;
  isLoading: boolean = true; // Add a loading state

  private http = inject(HttpClient);

  ngOnInit(): void {
    this.fetchPokemon();
  }

  fetchPokemon(): void {
    this.isLoading = true;
    this.error = null;
    this.http.get<PokeApiResponse>('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0')
      .pipe(
        switchMap(response => {
          // Create an array of Pokemon objects with name and detailsUrl
          const pokemonInitialData: Pokemon[] = response.results.map(p => ({
            name: p.name,
            detailsUrl: p.url // Store the detail URL
          }));

          // Create an array of observables, each fetching details for one Pokemon
          const detailObservables = pokemonInitialData.map(pokemon =>
            this.http.get<PokemonDetail>(pokemon.detailsUrl).pipe(
              map(detail => ({
                ...pokemon, // Spread the initial data (name, detailsUrl)
                imageUrl: detail.sprites?.front_default // Add the imageUrl
              })),
              catchError(err => {
                console.error(`Error fetching details for ${pokemon.name}:`, err);
                // Return the Pokemon without image data in case of an error for that specific detail call
                return of({ ...pokemon, imageUrl: undefined });
              })
            )
          );
          // If detailObservables is empty (e.g. initial request returned no results), return an empty array.
          if (detailObservables.length === 0) {
              return of([]);
          }
          return forkJoin(detailObservables); // Execute all detail fetches
        }),
        catchError(err => {
          console.error('Error fetching initial Pokemon list:', err);
          this.error = 'Failed to load Pokemon list.';
          this.isLoading = false;
          return of([]); // Return an empty array on error to prevent further processing
        })
      )
      .subscribe({
        next: (detailedPokemonList) => {
          this.pokemonList = detailedPokemonList;
          this.isLoading = false;
        },
        // Error is already handled in the catchError within the pipe for the initial call
        // The forkJoin will also complete if individual fetches fail due to its own catchError
      });
  }
}
