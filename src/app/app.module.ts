import { NgModule } from '@angular/core';
import { environment } from '../environments/environment';

// Modules
import { AngularReactBrowserModule } from '@angular-react/core';
import { AppRoutingModule } from './app-routing.module';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PortalModule } from '@angular/cdk/portal';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { 
   FabTextFieldModule, 
   FabButtonModule, 
   FabMessageBarModule,
   FabIconModule,
   FabPanelModule,
   FabCalloutModule,
   FabSliderModule,
	FabToggleModule,
	FabSpinnerModule
} from '@angular-react/fabric';
import { ServiceWorkerModule } from '@angular/service-worker';

// Services
import { DataService } from './services/data-service';
import { WebsocketService } from './services/websocket-service';

// Components
import { AppComponent } from './app.component';
import { EpubContentComponent } from './components/epub-content/epub-content.component';
import { PdfContentComponent } from './components/pdf-content/pdf-content.component';
import { ChaptersTreeComponent } from './components/chapters-tree/chapters-tree.component';
import { RenameBookModalComponent } from './components/rename-book-modal/rename-book-modal.component';
import { DeleteBookModalComponent } from './components/delete-book-modal/delete-book-modal.component';
import { LogoutModalComponent } from './components/logout-modal/logout-modal.component';

// Pages
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppPageComponent } from './pages/app-page/app-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';
import { AuthorSetupPageComponent } from './pages/author-setup-page/author-setup-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { LoadingPageComponent } from './pages/loading-page/loading-page.component';

@NgModule({
   declarations: [
		// Components
		AppComponent,
		EpubContentComponent,
		PdfContentComponent,
		ChaptersTreeComponent,
		RenameBookModalComponent,
		DeleteBookModalComponent,
		LogoutModalComponent,
		// Pages
      LibraryPageComponent,
      BookPageComponent,
      AccountPageComponent,
      SettingsPageComponent,
      DeveloperPageComponent,
      AppPageComponent,
      NewAppPageComponent,
		AuthorPageComponent,
		AuthorSetupPageComponent,
      LoginPageComponent,
      LoadingPageComponent
  	],
  	imports: [
   	AngularReactBrowserModule,
      AppRoutingModule,
      NgxFileHelpersModule,
      BrowserAnimationsModule,
      MatToolbarModule,
      MatButtonModule,
      MatRadioModule,
      MatInputModule,
      MatFormFieldModule,
      MatTreeModule,
      MatProgressSpinnerModule,
      PortalModule,
		NgbModule,
		PdfViewerModule,
      FabTextFieldModule,
      FabButtonModule,
      FabMessageBarModule,
      FabIconModule,
      FabPanelModule,
      FabCalloutModule,
		FabSliderModule,
		FabToggleModule,
		FabSpinnerModule,
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  	],
  	providers: [
		DataService,
		WebsocketService
   ],
   bootstrap: [AppComponent],
   entryComponents: [
      EpubContentComponent,
      PdfContentComponent
   ]
})
export class AppModule { }
