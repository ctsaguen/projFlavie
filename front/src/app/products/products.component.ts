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

  seuil: number;

  product: Product;
  @Input()
  set prod(value: Product) {
    this.product = value;

    this.maxAchat = this.product.cout;

    if (this.product.managerUnlocked && this.product.timeleft > 0) {
      this.lastupdate = Date.now();
      this.progressbarvalue = this.product.vitesse;
    }
  }
  _money: number;
  @Input()
  set money(value: number) {
    this._money = value;
  }
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
  @Output() notifyProduction: EventEmitter<Product> = new EventEmitter<Product>();
  @Output() public notifyPurchase = new EventEmitter();

  constructor(private notifyService: NotificationService) { }


  ngOnInit(): void {
    setInterval(() => {
      this.calcScore();
    }, 100);
  }

  ngAfterViewInit() {


  }
  production() {
    if (this.product.quantite >= 1 && !this.isRun) {
      this.product.timeleft = this.product.vitesse;
      this.lastupdate = Date.now();
      this.isRun = true;
    }
  }
  calcScore() {
    if (this.isRun) {
      if (this.product.timeleft > 0) {
        this.product.timeleft = this.product.timeleft - (Date.now() - this.lastupdate);
        this.progressbarvalue = this.product.vitesse
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

  achatProduct() {
    var coutAchat = 0;
    if (this._qtmulti <= this.calcMaxCanBuy()) {
      coutAchat = this.product.cout * this._qtmulti;
      this.product.cout = this.product.cout * this.product.croissance ** this._qtmulti;
      this.product.revenu = (this.product.revenu / this.product.quantite) * (this.product.quantite + this._qtmulti);
      this.notifyPurchase.emit({cout: coutAchat, product: this.product });
      this.product.quantite = this.product.quantite + this._qtmulti;
      this.product.palliers.pallier.forEach(value => {
        if (!value.unlocked && this.product.quantite > value.seuil) {
          this.product.palliers.pallier[this.product.palliers.pallier.indexOf(value)].unlocked = true;
          this.calcUpgrade(value);
          this.notifyService.showSuccess("déblocage d'un bonus " + value.typeratio + " effectué pour " + this.product.name, "BONUS")
        }
      })
    }
  }

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
