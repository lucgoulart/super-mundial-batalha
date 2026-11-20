import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JogadoresPublicaComponent } from './jogadores-publica.component';

describe('JogadoresPublicaComponent', () => {
  let component: JogadoresPublicaComponent;
  let fixture: ComponentFixture<JogadoresPublicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JogadoresPublicaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JogadoresPublicaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
