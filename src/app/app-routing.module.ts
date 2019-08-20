import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LibraryPageComponent } from './pages/library-page/library-page.component';
import { BookPageComponent } from './pages/book-page/book-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { DeveloperPageComponent } from './pages/developer-page/developer-page.component';
import { AppPageComponent } from './pages/app-page/app-page.component';
import { NewAppPageComponent } from './pages/new-app-page/new-app-page.component';
import { AuthorPageComponent } from './pages/author-page/author-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';

const routes: Routes = [
   { path: "", component: LibraryPageComponent },
   { path: "book", component: BookPageComponent },
	{ path: "account", component: AccountPageComponent },
   { path: "settings", component: SettingsPageComponent },
   { path: "developer", component: DeveloperPageComponent },
   { path: "developer/apps", redirectTo: "/developer", pathMatch: "full" },
   { path: "developer/apps/new", component: NewAppPageComponent },
   { path: "developer/apps/:uuid", component: AppPageComponent },
   { path: "author", component: AuthorPageComponent },
   { path: "login", component: LoginPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
