import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Import RouterLink
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

// Interface for effect entries
interface EffectEntry {
  effect: string;
  short_effect: string;
  language: {
    name: string;
    url: string;
  };
}

// Interface for flavor text entries
interface FlavorTextEntry {
  flavor_text: string;
  language: {
    name: string;
    url: string;
  };
  version_group: {
    name: string;
    url: string;
  };
}

// Interface for the main Ability API response
export interface AbilityApiResponse {
  id: number;
  name: string;
  effect_entries: EffectEntry[];
  flavor_text_entries: FlavorTextEntry[];
  // Add other fields if needed, e.g., generation, pokemon that have this ability
}

// Interface for processed ability data to be used in template
interface DisplayAbility {
  name: string;
  effect?: string;
  shortEffect?: string;
  flavorText?: string;
}

@Component({
  selector: 'app-ability-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink], // Add HttpClientModule and RouterLink
  templateUrl: './ability-detail.component.html',
  styleUrls: ['./ability-detail.component.css']
})
export class AbilityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  ability$: Observable<DisplayAbility | null | undefined> = of(null); // Initialize to avoid TS2564
  error: string | null = null;

  ngOnInit(): void {
    this.ability$ = this.route.paramMap.pipe(
      switchMap(params => {
        const name = params.get('name');
        if (!name) {
          this.error = 'Ability name not provided in route.';
          return of(null);
        }
        this.error = null;
        return this.http.get<AbilityApiResponse>(`https://pokeapi.co/api/v2/ability/${name.toLowerCase()}`).pipe(
          map(apiResponse => {
            const englishEffectEntry = apiResponse.effect_entries.find(e => e.language.name === 'en');
            // Try to find a relevant English flavor text, e.g., from a common version group like 'sword-shield' or 'ultra-sun-ultra-moon' or 'omega-ruby-alpha-sapphire' or take the latest available.
            // For simplicity, let's try a few preferred ones or take the first English one.
            const preferredVersionGroups = ['sword-shield', 'ultra-sun-ultra-moon', 'omega-ruby-alpha-sapphire', 'black-white'];
            let englishFlavorTextEntry: FlavorTextEntry | undefined;
            for (const vg of preferredVersionGroups) {
                englishFlavorTextEntry = apiResponse.flavor_text_entries.find(ft => ft.language.name === 'en' && ft.version_group.name === vg);
                if (englishFlavorTextEntry) break;
            }
            if (!englishFlavorTextEntry) { // Fallback to first English entry if preferred not found
                englishFlavorTextEntry = apiResponse.flavor_text_entries.find(ft => ft.language.name === 'en');
            }

            return {
              name: apiResponse.name,
              effect: englishEffectEntry?.effect,
              shortEffect: englishEffectEntry?.short_effect,
              flavorText: englishFlavorTextEntry?.flavor_text?.replace(/\n/g, ' ') // Replace newlines
            };
          }),
          catchError(err => {
            console.error('Error fetching ability details:', err);
            this.error = `Failed to load details for ability: ${name}.`;
            return of(null);
          })
        );
      })
    );
  }
}
