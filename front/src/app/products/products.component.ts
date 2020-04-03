import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NotificationService } from '../service/notification.service';

import { Product } from '../model/product.model';
import { Pallier } from '../model/pallier.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  lastupdate: number;
  server: string = 'http://localhost:8080/';
  isRun: boolean;
  progressbarvalue: number = 0;
  maxAchat: number;

  //cette variable sert à faire évoluer les seuils de bonus
  seuil: number;
  //on récupére le produit du world
  product: Product;
  @Input()
  set prod(value: Product) {
    this.product = value;

    //on initialise le coût d'achat
    this.maxAchat = this.product.cout;

    if (this.product.managerUnlocked && this.product.timeleft > 0) {
      this.lastupdate = Date.now();
      this.progressbarvalue = this.product.vitesse;
    }
  }
  //on récupère les gains du joueur 
  _money: number;
  @Input()
  set money(value: number) {
    this._money = value;
  }
  //on récupère la valeur du commutateur de quantité d'achat
  _qtmulti: number;
  @Input()
  set qtmulti(value: number) {
    if (value >= 100000) {
      this._qtmulti = this.calcMaxCanBuy();
    }
    else {
      this._qtmulti = value;
    }
  }
  //on renvoie à la couche mère le le Product en production 
  @Output() notifyProduction: EventEmitter<Product> = new EventEmitter<Product>();
  //on renvoie à la couche mère le coût total du produit acheté 
  @Output() public notifyPurchase = new EventEmitter();

  constructor(private notifyService: NotificationService) { }


  ngOnInit(): void {
    setInterval(() => {
      this.calcScore();
    }, 100);
  }

  ngAfterViewInit() {


  }
  //fonction de production utilisé quand le joueur lance une production
  production() {
    if (this.product.quantite >= 1 && !this.isRun) {
      this.product.timeleft = this.product.vitesse;
      this.lastupdate = Date.now();
      this.isRun = true;
    }
  }
  //calcul du score du joueur après une production, elle est lancé chaque 100ms par le hook ngOnInit et mis à jour les resultats 
  calcScore() {
    if (this.isRun) {
      if (this.product.timeleft > 0) {
        this.product.timeleft = this.product.timeleft - (Date.now() - this.lastupdate);
        this.progressbarvalue = this.product.vitesse
        //this.progressbarvalue = ((this.product.vitesse - this.product.timeleft) / this.product.vitesse) * 100;
      }
      else {
        this.product.timeleft = 0;
        this.lastupdate = 0;
        this.isRun = false;
        this.progressbarvalue = 0;
      }
      this.notifyProduction.emit(this.product);
    }
    if (this.product.managerUnlocked) {
      this.production();
    }
  }

  //cette fonction calcul la quantité maximal que que le joueur peut acheter en fonction de son argent
  calcMaxCanBuy(): number {
    let quantiteMax: number = 0;
    if (this.product.cout * this.product.croissance <= this._money) {
      let calPrelem = (this.product.cout - (this._money * (1 - this.product.croissance))) / this.product.cout;
      let quant = (Math.log(calPrelem)) / Math.log(this.product.croissance);
      quantiteMax = Math.round(quant - 1);
      if (isNaN(quantiteMax) || quantiteMax < 0) {
        quantiteMax = 0;
      }

    }
    return quantiteMax;

  }

  // cette fonction lance l'achat d'un produit
  achatProduct() {
    //console.log(this.calcMaxCanBuy())
    var coutAchat = 0;
    if (this._qtmulti <= this.calcMaxCanBuy()) {
      coutAchat = this.product.cout * this._qtmulti;
      this.product.cout = this.product.cout * this.product.croissance ** this._qtmulti;
      this.product.revenu = (this.product.revenu / this.product.quantite) * (this.product.quantite + this._qtmulti);
      this.notifyPurchase.emit({cout: coutAchat, product: this.product });
      this.product.quantite = this.product.quantite + this._qtmulti;
      //bonus d'achat spécifique à chaque produit
      this.product.palliers.pallier.forEach(value => {
        if (!value.unlocked && this.product.quantite > value.seuil) {
          this.product.palliers.pallier[this.product.palliers.pallier.indexOf(value)].unlocked = true;
          this.calcUpgrade(value);
          this.notifyService.showSuccess("déblocage d'un bonus " + value.typeratio + " effectué pour " + this.product.name, "BONUS")
        }
      })
    }
  }

  //ici on calcul si le joeur a débloqué un bonus et il y'a 3 type de bonus, à savoir vitesse, gain ou encore ange
  calcUpgrade(pallier: Pallier) {
    switch (pallier.typeratio) {
      case 'vitesse':
        this.product.vitesse = this.product.vitesse / pallier.ratio;
        break;
      case 'gain':
        this.product.revenu = this.product.revenu * pallier.ratio;
        break;
    }
  }

}
