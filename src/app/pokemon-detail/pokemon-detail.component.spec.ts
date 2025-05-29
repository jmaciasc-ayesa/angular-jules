import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PokemonDetailComponent, PokemonDetailApiResponse } from './pokemon-detail.component'; // Ensure PokemonDetailApiResponse is exported

describe('PokemonDetailComponent', () => {
  let component: PokemonDetailComponent;
  let fixture: ComponentFixture<PokemonDetailComponent>;
  let httpMock: HttpTestingController;
  let mockActivatedRoute;

  const mockPokemonName = 'pikachu';
  const mockPokemonDetail: PokemonDetailApiResponse = {
    id: 25,
    name: 'pikachu',
    height: 4,
    weight: 60,
    sprites: {
      front_default: 'pikachu.png',
      other: { official_artwork: { front_default: 'official-pikachu.png' } }
    },
    types: [{ slot: 1, type: { name: 'electric', url: '' } }],
    abilities: [ // Updated abilities for better testing
      { ability: { name: 'static', url: 'url/to/static' }, is_hidden: false, slot: 1 },
      { ability: { name: 'lightning-rod', url: 'url/to/lr' }, is_hidden: true, slot: 3 }
    ],
    stats: [{ base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } }]
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ name: mockPokemonName }))
    };

    await TestBed.configureTestingModule({
      imports: [
        PokemonDetailComponent, // Standalone component
        HttpClientTestingModule,
        RouterLink // For the back button
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    // Initial detectChanges will trigger ngOnInit and the HTTP call
    fixture.detectChanges(); 
    // We need to flush the HTTP call that ngOnInit triggers
    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon/${mockPokemonName}`);
    req.flush(mockPokemonDetail); // Provide mock data
    expect(component).toBeTruthy();
  });

  it('should fetch Pokemon details on init and display them', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon/${mockPokemonName}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPokemonDetail);

    tick();
    fixture.detectChanges(); // Update view with fetched data

    let displayedDetails: PokemonDetailApiResponse | null | undefined;
    component.pokemonDetail$.subscribe(details => {
      displayedDetails = details;
    });
    
    expect(displayedDetails).toBeTruthy();
    expect(displayedDetails?.name).toBe(mockPokemonName);
    // Check preferred image URL (official artwork)
    expect(displayedDetails?.sprites.front_default).toBe(mockPokemonDetail.sprites.other?.official_artwork?.front_default);
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain(mockPokemonName); // Name is titlecased
    expect(compiled.querySelector('.pokemon-image')?.getAttribute('src')).toBe(mockPokemonDetail.sprites.other?.official_artwork?.front_default);
    expect(compiled.querySelector('.type-electric')?.textContent).toContain('Electric'); // Type is titlecased

    // Check for ability links
    // The selector needs to be specific to where abilities are rendered.
    // Based on pokemon-detail.component.html, abilities are in a list within .pokemon-info-section.
    // The structure is ul -> li -> a.
    const abilityElements = compiled.querySelectorAll('.pokemon-info-section ul:nth-of-type(2) li a.ability-link');
    expect(abilityElements.length).toBe(2);
    
    const staticLink = abilityElements[0] as HTMLAnchorElement;
    expect(staticLink.textContent).toContain('Static'); // titlecase pipe from Angular CommonModule
    expect(staticLink.getAttribute('href')).toBe('/ability/static');

    const lightningRodLink = abilityElements[1] as HTMLAnchorElement;
    expect(lightningRodLink.textContent).toContain('Lightning-Rod'); // titlecase pipe
    expect(lightningRodLink.getAttribute('href')).toBe('/ability/lightning-rod');
    
    const hiddenIndicator = compiled.querySelector('.pokemon-info-section ul:nth-of-type(2) li:nth-child(2) .hidden-ability-indicator');
    expect(hiddenIndicator).toBeTruthy();
    expect(hiddenIndicator?.textContent).toContain('(Hidden)');
  }));
  
  it('should display error message if route parameter :name is missing', fakeAsync(() => {
    mockActivatedRoute.paramMap = of(convertToParamMap({})); // No 'name' param
    
    // Re-initialize component with the new route mock for this test case
    TestBed.overrideProvider(ActivatedRoute, { useValue: mockActivatedRoute });
    fixture = TestBed.createComponent(PokemonDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController); // Re-inject if needed

    fixture.detectChanges(); // ngOnInit
    
    tick();
    fixture.detectChanges();

    let detailsFromObservable: PokemonDetailApiResponse | null | undefined;
    component.pokemonDetail$.subscribe(details => {
        detailsFromObservable = details;
    });
    expect(detailsFromObservable).toBeNull();
    expect(component.error).toContain('Pokemon name not provided in route.');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain('Pokemon name not provided in route.');
    
    httpMock.expectNone(`https://pokeapi.co/api/v2/pokemon/${mockPokemonName}`); // No HTTP call should be made
  }));

  it('should display error message on HTTP failure', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/pokemon/${mockPokemonName}`);
    req.error(new ErrorEvent('Network error'), { status: 500, statusText: 'Server Error' });

    tick();
    fixture.detectChanges();
    
    let detailsFromObservable: PokemonDetailApiResponse | null | undefined;
    component.pokemonDetail$.subscribe(details => {
        detailsFromObservable = details;
    });
    expect(detailsFromObservable).toBeNull();
    expect(component.error).toContain(`Failed to load details for Pokemon: ${mockPokemonName}`);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain(`Failed to load details for Pokemon: ${mockPokemonName}`);
  }));
});
