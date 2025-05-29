import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { AbilityDetailComponent, AbilityApiResponse } from './ability-detail.component'; // Ensure AbilityApiResponse is exported

describe('AbilityDetailComponent', () => {
  let component: AbilityDetailComponent;
  let fixture: ComponentFixture<AbilityDetailComponent>;
  let httpMock: HttpTestingController;
  let mockActivatedRoute;

  const mockAbilityName = 'static';
  const mockAbilityResponse: AbilityApiResponse = {
    id: 9,
    name: 'static',
    effect_entries: [
      { effect: 'Has a 30% chance of paralyzing attacking Pokémon on contact.', short_effect: 'Paralyzes on contact.', language: { name: 'en', url: '' } },
      { effect: 'げんきにしびれる', short_effect: 'しびれる', language: { name: 'ja', url: '' } }
    ],
    flavor_text_entries: [
      { flavor_text: 'Paralyzes on contact.', language: { name: 'en', url: '' }, version_group: { name: 'sword-shield', url: ''}},
      { flavor_text: '触られた 時 まれに まひさせる。', language: { name: 'ja', url: '' }, version_group: { name: 'sword-shield', url: ''}}
    ]
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ name: mockAbilityName }))
    };

    await TestBed.configureTestingModule({
      imports: [
        AbilityDetailComponent, // Standalone component
        HttpClientTestingModule,
        RouterLink // For the back link
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AbilityDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges(); // Trigger ngOnInit
    // Need to flush the HTTP call from ngOnInit
    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/ability/${mockAbilityName}`);
    req.flush(mockAbilityResponse);
    expect(component).toBeTruthy();
  });

  it('should fetch ability details on init and display them', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/ability/${mockAbilityName}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAbilityResponse);

    tick();
    fixture.detectChanges(); // Update view with fetched data

    component.ability$.subscribe(details => {
      expect(details).toBeTruthy();
      expect(details?.name).toBe(mockAbilityName);
      expect(details?.shortEffect).toBe('Paralyzes on contact.');
      expect(details?.flavorText).toContain('Paralyzes on contact.');
    });
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.ability-name')?.textContent).toContain(mockAbilityName);
    // Assuming the first p in ability-section is shortEffect or effect if shortEffect is not present
    const firstSectionP = compiled.querySelector('.ability-section p');
    expect(firstSectionP?.textContent).toContain('Paralyzes on contact.');
  }));

  it('should display error message if route parameter :name is missing', fakeAsync(() => {
    mockActivatedRoute.paramMap = of(convertToParamMap({})); // No 'name' param
    // We need to re-initialize the component for the paramMap change to take effect for ngOnInit
    // or ensure component's ngOnInit uses the latest from mockActivatedRoute.
    // For this setup, re-creating the component or re-running detectChanges should be enough
    // if the observable paramMap in the component is set up correctly.
    // Let's ensure component re-initialization or clean TestBed state if needed.
    // For simplicity, we'll assume the component's ngOnInit will pick up the new paramMap.
    fixture.detectChanges(); // ngOnInit
    
    tick(); // Allow async operations to complete
    fixture.detectChanges(); // Update view

    component.ability$.subscribe(details => expect(details).toBeNull());
    expect(component.error).toContain('Ability name not provided in route.');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain('Ability name not provided in route.');
    httpMock.expectNone(`https://pokeapi.co/api/v2/ability/${mockAbilityName}`); // No HTTP call
  }));

  it('should display error message on HTTP failure', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit

    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/ability/${mockAbilityName}`);
    req.error(new ErrorEvent('Network error'), { status: 500, statusText: 'Server Error' });

    tick();
    fixture.detectChanges();
    
    component.ability$.subscribe(details => expect(details).toBeNull());
    expect(component.error).toContain(`Failed to load details for ability: ${mockAbilityName}`);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-message')?.textContent).toContain(`Failed to load details for ability: ${mockAbilityName}`);
  }));
  
  it('should select English effect and flavor text', fakeAsync(() => {
    const multiLangResponse: AbilityApiResponse = {
      ...mockAbilityResponse, // spread base mock
      id: mockAbilityResponse.id, // ensure id is present
      name: mockAbilityResponse.name, // ensure name is present
      effect_entries: [
        { effect: 'Japanese effect', short_effect: 'J short', language: { name: 'ja', url: '' } },
        { effect: 'English effect', short_effect: 'E short', language: { name: 'en', url: '' } }
      ],
      flavor_text_entries: [
        { flavor_text: 'Japanese flavor', language: { name: 'ja', url: '' }, version_group: { name: 'red-blue', url: ''}},
        { flavor_text: 'English flavor', language: { name: 'en', url: '' }, version_group: { name: 'red-blue', url: ''}}
      ]
    };
    fixture.detectChanges(); // ngOnInit
    const req = httpMock.expectOne(`https://pokeapi.co/api/v2/ability/${mockAbilityName}`);
    req.flush(multiLangResponse);
    tick();
    fixture.detectChanges(); // update view
    component.ability$.subscribe(details => {
      expect(details?.effect).toBe('English effect');
      expect(details?.shortEffect).toBe('E short');
      expect(details?.flavorText).toBe('English flavor');
    });
  }));
});
