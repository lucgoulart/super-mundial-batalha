import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministraPartidasComponent } from './administra-partidas.component';

describe('AdministraPartidasComponent', () => {
  let component: AdministraPartidasComponent;
  let fixture: ComponentFixture<AdministraPartidasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdministraPartidasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdministraPartidasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
