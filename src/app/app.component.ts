import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import * as Dav from 'dav-npm';
import { environment } from 'src/environments/environment';
import { DataService } from 'src/app/services/data-service';
import { GetSettings } from 'src/app/models/Settings';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
   constructor(
      public router: Router,
      public activatedRoute: ActivatedRoute,
      public dataService: DataService
   ){
      // Log the user in if there is a jwt in the url
      this.activatedRoute.queryParams.subscribe(async params => {
         if(params["jwt"]){
            // Login with the jwt
            if(await this.dataService.user.Login(params["jwt"])){
               window.location.href = "/";
            }
         }
		});
   }

	async ngOnInit(){
		this.dataService.ApplyTheme();
		this.SetTitleBarColor();
		initializeIcons();

		let notificationOptions = {
			icon: "",
			badge: ""
      }

		Dav.Initialize(environment.production ? Dav.DavEnvironment.Production : Dav.DavEnvironment.Development,
							environment.appId,
							[environment.settingsTableId, environment.bookFileTableId, environment.bookTableId, environment.epubBookmarkTableId, environment.appTableId],
                     [],
                     true,
							notificationOptions,
							{
								UpdateAllOfTable: (tableId: number) => {
									
								},
								UpdateTableObject: (tableObject: Dav.TableObject, fileDownloaded: boolean = false) => {
									if(tableObject.TableId == environment.bookTableId){
										// Reload the book
										this.dataService.ReloadBook(tableObject.Uuid);
									}else if(tableObject.TableId == environment.bookFileTableId && fileDownloaded){
										// Find the book with that file uuid and reload it
										this.dataService.ReloadBookByFile(tableObject.Uuid);
									}
								},
								DeleteTableObject: (tableObject: Dav.TableObject) => {
                           
								},
								SyncFinished: () => {
                           this.dataService.LoadAllBooks();
								}
							});
	
		// Get the settings and call the callbacks when the settings were loaded
		this.dataService.settings = await GetSettings();
		for(let callback of this.dataService.settingsLoadCallbacks) callback();
		this.dataService.settingsLoadCallbacks = [];

      if(await this.dataService.GetOpenLastReadBook() && this.router.url == "/"){
			this.router.navigate(['loading'], {skipLocationChange: true});
		}
		
		// Load the books
      this.dataService.LoadAllBooks();
   }
   
   SetTitleBarColor(){
		if(window["Windows"] && window["Windows"].UI.ViewManagement){
			// #007bff
			var themeColor = {
				r: 13,
				g: 71,
				b: 161,
				a: 255
         }

			let titleBar = window["Windows"].UI.ViewManagement.ApplicationView.getForCurrentView().titleBar;
			titleBar.foregroundColor = themeColor;
			titleBar.backgroundColor = themeColor;
			titleBar.buttonBackgroundColor = themeColor;
			titleBar.buttonInactiveBackgroundColor = themeColor;
			titleBar.inactiveForegroundColor = themeColor;
			titleBar.inactiveBackgroundColor = themeColor;
		}
	}
	
	ShowAccountPage(){
		this.router.navigate(["account"])
	}
   
   ShowSettingsPage(){
      this.router.navigate(["settings"])
   }
}
