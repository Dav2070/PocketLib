import { Component } from "@angular/core";
import { DataService } from 'src/app/services/data-service';
import { Portal, ComponentPortal } from '@angular/cdk/portal';
import { BookContentComponent } from 'src/app/components/book-content/book-content.component';
import { PdfContentComponent } from 'src/app/components/pdf-content/pdf-content.component';

const epubType = "application/epub+zip";
const pdfType = "application/pdf";

@Component({
	selector: "pocketlib-book-page",
	templateUrl: "./book-page.component.html"
})
export class BookPageComponent{
   selectedPortal: Portal<any>;

   constructor(
		public dataService: DataService
	){
      this.dataService.navbarVisible = false;
   }

   ngOnInit(){
      // Disable scrolling
      document.body.setAttribute('style', 'overflow: hidden');

      // Select the correct rendering component, based on the mime type of the file
		if(this.dataService.currentBook.file.type == epubType){
			this.selectedPortal = new ComponentPortal(BookContentComponent)
		}else if(this.dataService.currentBook.file.type == pdfType){
			this.selectedPortal = new ComponentPortal(PdfContentComponent);
      }
   }
   
   ngOnDestroy(){
      document.body.removeAttribute('style');
   }
}