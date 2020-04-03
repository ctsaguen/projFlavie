import { Pallier } from './pallier.model';

export class Product {
    id : number;
    name : string;
    logo : string;
    cout : number;
    croissance: number;
    revenu: number;
    vitesse: number;
    quantite: number;
    timeleft: number;
    managerUnlocked: boolean;
    palliers : { "pallier" : Pallier[]};
   }