import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartidasPublicaComponent } from './partidas-publica.component';

describe('PartidasPublicaComponent', () => {
  let component: PartidasPublicaComponent;
  let fixture: ComponentFixture<PartidasPublicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartidasPublicaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartidasPublicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
