import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PokemonListComponent } from './pokemon-list.component';
import { PokeApiResponse } from './pokemon-list.component'; // Import the interface

describe('PokemonListComponent', () => {
  let component: PokemonListComponent;
  let fixture: ComponentFixture<PokemonListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PokemonListComponent, // Import the standalone component
        HttpClientTestingModule
      ],
      providers: [
        // provideHttpClient(), // provideHttpClient() is not needed here as HttpClientTestingModule provides its own mock
        // withInterceptorsFromDi() // This is also not needed for the testing module directly
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify that no unmatched requests are outstanding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call fetchPokemon on init', () => {
    spyOn(component, 'fetchPokemon');
    fixture.detectChanges(); // Triggers ngOnInit
    expect(component.fetchPokemon).toHaveBeenCalled();
  });

  it('should fetch and display pokemon list on init', () => {
    const mockPokemonResponse: PokeApiResponse = {
      count: 2,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }
      ]
    };

    fixture.detectChanges(); // ngOnInit is called

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
    expect(req.request.method).toBe('GET');
    req.flush(mockPokemonResponse);

    fixture.detectChanges(); // Update the view with fetched data

    expect(component.pokemonList.length).toBe(2);
    expect(component.pokemonList[0].name).toBe('bulbasaur');
    expect(component.error).toBeNull();

    // Optional: Check if names are rendered in the DOM
    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('li');
    expect(listItems.length).toBe(2);
    expect(listItems[0].textContent).toContain('bulbasaur');
  });

  it('should set error message on HTTP failure', () => {
    fixture.detectChanges(); // ngOnInit is called

    const req = httpMock.expectOne('https://pokeapi.co/api/v2/pokemon?limit=100&offset=0');
    expect(req.request.method).toBe('GET');
    // Respond with an error
    req.flush('Failed to fetch', { status: 500, statusText: 'Server Error' });

    fixture.detectChanges();

    expect(component.pokemonList.length).toBe(0);
    expect(component.error).toBe('Failed to load Pokemon list.');

    // Optional: Check if error message is rendered
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain('Failed to load Pokemon list.');
  });
});
