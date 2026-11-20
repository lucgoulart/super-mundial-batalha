import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministraJogadoresComponent } from './administra-jogadores.component';

describe('AdministraJogadoresComponent', () => {
  let component: AdministraJogadoresComponent;
  let fixture: ComponentFixture<AdministraJogadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdministraJogadoresComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministraJogadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
