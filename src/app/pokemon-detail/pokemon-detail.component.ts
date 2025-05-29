import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Import RouterLink for the back button
import { HttpClient, HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

// Interface for the detailed Pokemon data from API
export interface PokemonDetailApiResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    back_default?: string;
    front_shiny?: string;
    back_shiny?: string;
    other?: {
      dream_world?: {
        front_default?: string;
      };
      official_artwork?: { // Corrected from 'official-artwork'
        front_default?: string;
      };
    };
  };
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  abilities: Array<{
    ability: {
      name: string;
      url: string;
    };
    is_hidden: boolean;
    slot: number;
  }>;
  // Add other properties as needed, e.g., stats
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }>;
}


@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink], // Add HttpClientModule and RouterLink
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.css']
})
export class PokemonDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  pokemonDetail$: Observable<PokemonDetailApiResponse | null | undefined>; // Observable to hold Pokemon details or null/undefined for loading/error
  error: string | null = null;

  ngOnInit(): void {
    this.pokemonDetail$ = this.route.paramMap.pipe(
      switchMap(params => {
        const name = params.get('name');
        if (!name) {
          this.error = 'Pokemon name not provided in route.';
          return of(null); // Or throw an error, or navigate away
        }
        this.error = null; // Reset error
        // Set loading state before making the HTTP call
        // For an observable approach, the template handles "loading" by waiting for the observable to emit.
        // If we needed a separate isLoading flag, it would be set here.
        return this.http.get<PokemonDetailApiResponse>(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`).pipe(
          map(details => {
            // Prefer official artwork if available
            const imageUrl = details.sprites?.other?.official_artwork?.front_default ||
                             details.sprites?.front_default;
            return { ...details, sprites: { ...details.sprites, front_default: imageUrl } };
          }),
          catchError(err => {
            console.error('Error fetching Pokemon details:', err);
            this.error = `Failed to load details for Pokemon: ${name}.`;
            return of(null); // Emit null on error to allow template to show error message
          })
        );
      })
    );
  }
}
