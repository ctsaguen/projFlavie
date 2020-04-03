import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }

  showSuccess(message, title) {
    this.toastr.success(message, title, {
      progressBar: true,
      progressAnimation:'increasing',
      closeButton: true
    })
  }
  showError(message, title){
    this.toastr.error(message, title,{
      progressBar: true,
      progressAnimation:'increasing',
      closeButton: true
    })
  }
}
