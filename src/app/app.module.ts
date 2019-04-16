import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxFileHelpersModule } from 'ngx-file-helpers';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { DataService } from './services/data-service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

@NgModule({
   declarations: [
		AppComponent,
      LibraryPageComponent,
      BookPageComponent,
      AccountPageComponent,
      SettingsPageComponent
  	],
  	imports: [
   	BrowserModule,
      AppRoutingModule,
      NgxFileHelpersModule,
      BrowserAnimationsModule,
      MatToolbarModule,
      MatButtonModule,
      MatCardModule
  	],
  	providers: [
      DataService
   ],
  	bootstrap: [AppComponent]
})
export class AppModule { }
