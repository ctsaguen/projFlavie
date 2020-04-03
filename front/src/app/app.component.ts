import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { RestService } from './service/rest.service';
import { NotificationService } from './service/notification.service';
import { ProductsComponent } from './products/products.component'

import { World } from './model/world.model';
import { Product } from './model/product.model';
import { Pallier } from './model/pallier.model'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  @ViewChildren(ProductsComponent) public productsComponent: QueryList<ProductsComponent>;
  title = 'client';
  username: string = '';
  qtmulti: number = 1;
  world: World = new World();
  server: string;
  dispoManager: boolean;
  dispoUpgrad: boolean;
  dispoAngel: boolean;

  constructor(private service: RestService, private notifyService: NotificationService) {
    this.server = 'http://localhost:8080/';
    this.createUsername();
    service.getWorld().then(world => {
      console.log(world);
      this.world = world;
    });

  }

  ngOnInit(): void {
    //sauvegarder le monde 
    setInterval(() => {
     // this.service.saveWorld(this.world);
      this.bonusAllunlock()
      this.disponibiliteManager();
      this.disponibiliteUpgrades();
    }, 1000);
  }

  //ici on teste la disponibilité d'un manager pour le signaler visuellement à l'utilisateur d'un changement et c'est utilisé dans lors des nombreuses productions.
  disponibiliteManager(): void {
    this.dispoManager = false;
    this.world.managers.pallier.forEach(val => {
      if (!this.dispoManager) {
        if (this.world.money > val.seuil && !val.unlocked) {
          this.dispoManager = true;
        }
      }
    })
  }
  //on test la disponibité la disponibilité des upgrades
  disponibiliteUpgrades() {
    this.dispoUpgrad = false;
    this.world.upgrades.pallier.map(upgrade => {
      if (!this.dispoUpgrad) {
        if (!upgrade.unlocked && this.world.money > upgrade.seuil) {
          this.dispoUpgrad = true
        }
      }
    })
  }

  //on test la disponibité la disponibilité des angels
  disponibiliteAngels() {
    this.dispoAngel = false;
    this.world.angelupgrades.pallier.map(angel => {
      if (!this.dispoUpgrad) {
        if (!angel.unlocked && this.world.activeangels > angel.seuil) {
          this.dispoAngel = true
        }
      }
    })
  }


  //commutateur de changement des valeurs possible d'achat de produit, on a soit 1 produit, soit 10, soit 100 ou le max
  commutateur() {
    switch (this.qtmulti) {
      case 1:
        this.qtmulti = 10
        break;
      case 10:
        this.qtmulti = 100
        break;
      case 100:
        this.qtmulti = 100000
        break;
      default:
        this.qtmulti = 1
    }
  }
  //Prise en compte des productions effectués dans le component Product
  onProductionDone(p: Product) {
    this.world.money = this.world.money + p.quantite * p.revenu * (1 + (this.world.activeangels * this.world.angelbonus / 100));
    this.world.score = this.world.score + p.quantite * p.revenu * (1 + (this.world.activeangels * this.world.angelbonus / 100));
   // this.service.saveWorld(this.world);
    this.world.totalangels = Math.round(this.world.totalangels + (150 * Math.sqrt(this.world.score / Math.pow(10, 15))));
  }

  //on valide l'achat d'un produit dans le component Product
  onNotifyPurchase(data) {
    this.world.money -= data.cout;
    this.service.putProduit(data.product);
  }

  //ici on enregistre les changements de nom d'utilisateur effectué par l'utilisateur
  onUsernameChanged(): void {
    localStorage.setItem("username", this.username);
    this.service.setUser(this.username);
  }
  //ici on crée le nom d'utilisateur s'il n'exite pas et l'enregistre dans le serveur
  createUsername(): void {
    this.username = localStorage.getItem("username");
    if (this.username == '') {
      this.username = 'Captain' + Math.floor(Math.random() * 10000);
      localStorage.setItem("username", this.username);
    }
    this.service.setUser(this.username);
  }

  //cette partie nous permet d'acheter un manager 
  achatManager(m: Pallier) {
    if (this.world.money >= m.seuil) {
      this.world.money = this.world.money - m.seuil;

      this.world.managers.pallier[this.world.managers.pallier.indexOf(m)].unlocked = true;

      this.world.products.product.forEach(element => {
        if (m.idcible == element.id) {
          this.world.products.product[this.world.products.product.indexOf(element)].managerUnlocked = true;
        }
      });
      this.service.putManager(m);

      this.notifyService.showSuccess("Achat de " + m.name + " effectué", "Manager")
    }
  }
  //ici on lance l'achat d'un upgrade en fonction de l'argent du joueur et du click sur le bouton d'achat
  achatUpgrade(p: Pallier) {
    if (this.world.money > p.seuil) {
      this.world.money = this.world.money - p.seuil;
      this.world.upgrades.pallier[this.world.upgrades.pallier.indexOf(p)].unlocked = true;
      //si l'idcible est de 0, on applique l'upgrade sur tous les produits, sinon on recherche le produit concerné
      if (p.idcible == 0) {
        this.productsComponent.forEach(prod => prod.calcUpgrade(p));
        this.notifyService.showSuccess("achat d'un upgrade de " + p.typeratio + " pour tous les produits", "Upgrade global");
      }
      else {
        this.productsComponent.forEach(prod => {
          if (p.idcible == prod.product.id) {
            prod.calcUpgrade(p);
            this.notifyService.showSuccess("achat d'un upgrade de " + p.typeratio + " pour " + prod.product.name, "Upgrade")
          }
        })
      }
      //signaler l'achat d'un upgrade au serveur 
      this.service.putUpgrade(p);
    }
  }

  //ici on va implémenter le code d'achat d'un bonus d'angels
  achatAngel(p: Pallier) {
    if (this.world.activeangels > p.seuil) {
      this.world.activeangels -= p.seuil;
      this.world.angelupgrades.pallier[this.world.angelupgrades.pallier.indexOf(p)].unlocked = true;
      if (p.typeratio == "ange") {
        this.world.money = this.world.money * p.ratio + this.world.money;
        this.world.score = this.world.score * p.ratio + this.world.score;
        this.notifyService.showSuccess("achat d'un upgrade de " + p.typeratio + " pour tous les produits", "Upgrade Angels")
      }
      //au cas ou c'est pas un upgrade de type ange
      else {
        //au cas ou c'est un upgrade global
        if (p.idcible = 0) {
          this.productsComponent.forEach(prod => prod.calcUpgrade(p));
          this.notifyService.showSuccess("achat d'un upgrade de " + p.typeratio + " pour tous les produits", "Upgrade Angels");
        }
        //au cas ou c'est ciblé pour un produit
        else {
          this.productsComponent.forEach(prod => {
            if (p.idcible == prod.product.id) {
              prod.calcUpgrade(p);
              this.notifyService.showSuccess("achat d'un upgrade de " + p.typeratio + " pour " + prod.product.name, "Upgrade Angels")
            }
          })

        }
      }
      this.service.putAngel(p);
    }
  }

  bonusAllunlock() {
    //on recherche la quantité minmal des produits
    let minQuantite = Math.min(
      ...this.productsComponent.map(p => p.product.quantite)
    )
    this.world.allunlocks.pallier.map(value => {
      //si la quantité minimal dépasse le seuil, on débloque le produit concerné
      if (!value.unlocked && minQuantite >= value.seuil) {
        this.world.allunlocks.pallier[this.world.allunlocks.pallier.indexOf(value)].unlocked = true;
        this.productsComponent.forEach(prod => prod.calcUpgrade(value))
        this.notifyService.showSuccess("Bonus de " + value.typeratio + " effectué sur tous les produits", "bonus global");
      }
    })
  }

  //recupération des angels gagnés
  claimAngel(): void {
    this.service.deleteWorld();
    this.service.getWorld().then(world => {
      this.world = world;
    });
  }


}
