import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterLink } from '@angular/router'; // Import RouterLink
import { PokemonListComponent, Pokemon, PokeApiResponse, PokemonDetail } from './pokemon-list.component'; // Pokemon interface might need to be exported

// MockPokemonDetail is effectively the PokemonDetail interface from pokemon-list.component.ts
// We've imported it as PokemonDetail

describe('PokemonListComponent', () => {
  let component: PokemonListComponent;
  let fixture: ComponentFixture<PokemonListComponent>;
  let httpMock: HttpTestingController;

  const mockPokemonListResponse: PokeApiResponse = {
    count: 1,
    next: null,
    previous: null,
    results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/pikachu/' }]
  };

  // This mock should align with the PokemonDetail interface from pokemon-list.component.ts
  const mockPikachuDetailResponse: PokemonDetail = {
    name: 'pikachu',
    id: 25, // id is part of PokemonDetail, good to include
    sprites: { front_default: 'pikachu.png' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PokemonListComponent, // Standalone component
        HttpClientTestingModule,
        RouterLink // Import RouterLink because it's used in the template
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges(); // ngOnInit will cause HTTP calls, so flush them if not testing init
    if (component.pokemonList.length === 0 && component.isLoading) { // Basic check to see if init started
        const listReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
        listReq.flush({count:0, results:[]}); // Flush with empty to satisfy the call for this simple test
    }
    expect(component).toBeTruthy();
  });

  it('should fetch Pokemon list and their details on init', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    // 1. Expect initial list call
    const listReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
    expect(listReq.request.method).toBe('GET');
    listReq.flush(mockPokemonListResponse);

    // 2. Expect detail call for each Pokemon from the list
    const detailReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    expect(detailReq.request.method).toBe('GET');
    detailReq.flush(mockPikachuDetailResponse);
    
    tick(); // Allow all microtasks (like forkJoin) to complete
    fixture.detectChanges(); // Update view with fetched data

    expect(component.pokemonList.length).toBe(1);
    expect(component.pokemonList[0].name).toBe('pikachu');
    expect(component.pokemonList[0].imageUrl).toBe('pikachu.png');
    expect(component.isLoading).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const imgElement = compiled.querySelector('.pokemon-image') as HTMLImageElement;
    expect(imgElement).toBeTruthy();
    expect(imgElement.src).toContain('pikachu.png');
    const linkElement = compiled.querySelector('.pokemon-link') as HTMLAnchorElement;
    expect(linkElement.getAttribute('href')).toBe('/pokemon/pikachu');
  }));

  it('should handle error when fetching initial Pokemon list', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const listReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
    listReq.error(new ErrorEvent('Network error'), { status: 500, statusText: 'Server Error' });

    tick();
    fixture.detectChanges();

    expect(component.pokemonList.length).toBe(0);
    expect(component.error).toBe('Failed to load Pokemon list.');
    expect(component.isLoading).toBeFalse();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain('Failed to load Pokemon list.');
  }));

  it('should handle error when fetching a specific Pokemon detail', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const listReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
    listReq.flush(mockPokemonListResponse); // Initial list succeeds

    const detailReq = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon/pikachu/');
    detailReq.error(new ErrorEvent('Detail fetch error'), { status: 500, statusText: 'Server Error' });

    tick(); // Allow forkJoin to complete with the error
    fixture.detectChanges();
    
    expect(component.pokemonList.length).toBe(1); // List still has one item
    expect(component.pokemonList[0].name).toBe('pikachu');
    expect(component.pokemonList[0].imageUrl).toBeUndefined(); // Image URL should be undefined due to error
    expect(component.isLoading).toBeFalse();
    
    const compiled = fixture.nativeElement as HTMLElement;
    // Check that the image placeholder is shown (or no image)
    const imgElement = compiled.querySelector('.pokemon-image') as HTMLImageElement;
    expect(imgElement).toBeNull(); // No image should be rendered
    const placeholder = compiled.querySelector('.no-image-placeholder');
    // Note: The template in previous steps for pokemon-list.component.html had a placeholder
    // <div *ngIf="!pokemon.imageUrl" class="no-image-placeholder">No Image</div>
    // So we should check for this or similar. The provided test code didn't have this check.
    expect(placeholder).toBeTruthy();
    expect(placeholder?.textContent).toContain('No Image');
  }));
});
