
import { Component } from '@angular/core';

@Component({
  selector: 'app-formato',
  templateUrl: './formato.component.html',
  styleUrls: ['./formato.component.scss']
})
export class FormatoComponent {

  grupos: string[] = [
    'GRUPO A',
    'GRUPO B',
    'GRUPO C',
    'GRUPO D',
    'GRUPO E',
    'GRUPO F',
    'GRUPO G',
    'GRUPO H'
  ];

  confrontosTerceiros: string[][] = [
    ['3º colocado', '3º colocado'],
    ['3º colocado', '3º colocado'],
    ['3º colocado', '3º colocado'],
    ['3º colocado', '3º colocado']
  ];

  posicoesDiretas: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];

  confrontosAcesso: number[][] = [
    [13, 20],
    [14, 19],
    [15, 18],
    [16, 17]
  ];

}
