import { Component, HostListener } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { IButtonStyles, IDialogContentProps } from 'office-ui-fabric-react';
import { DataService, ApiResponse } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

const navbarHeight: number = 64;

@Component({
	selector: "pocketlib-author-page",
   templateUrl: "./author-page.component.html",
   styleUrls: [
      './author-page.component.scss'
   ]
})
export class AuthorPageComponent{
	locale = enUS.authorPage;
	createAuthorSubscriptionKey: number;

   header1Height: number = 600;
	header1TextMarginTop: number = 200;
	uuid: string;
	createAuthorDialogVisible: boolean = false;
	createAuthorDialogFirstName: string = "";
	createAuthorDialogLastName: string = "";
	createAuthorDialogFirstNameError: string = "";
	createAuthorDialogLastNameError: string = "";

	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createAuthorDialogContentProps: IDialogContentProps = {
		title: this.locale.createAuthorDialog.title
	}

   constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router,
		private activatedRoute: ActivatedRoute
   ){
		this.locale = this.dataService.GetLocale().authorPage;
		this.createAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateAuthor, (response: ApiResponse) => this.CreateAuthorResponse(response));

		// Get the uuid from the url
		this.uuid = this.activatedRoute.snapshot.paramMap.get('uuid');
   }
   
   ngOnInit(){
		this.setSize();
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(this.createAuthorSubscriptionKey);
	}

   @HostListener('window:resize')
	onResize(){
		this.setSize();
   }
   
   setSize(){
		this.header1Height = window.innerHeight - navbarHeight;
		this.header1TextMarginTop = this.header1Height * 0.36;
	}

   createProfileButtonClick(){
		if(this.dataService.user.IsLoggedIn){
			// Redirect to the Author setup page
			this.router.navigate(['author', 'setup']);
      }else{
			// Redirect to the Account page
			this.router.navigate(["account"]);
		}
	}

	ShowAuthor(uuid: string){
		this.router.navigate(['author', uuid]);
	}

	ShowCreateAuthorDialog(){
		this.createAuthorDialogFirstName = "";
		this.createAuthorDialogFirstNameError = "";
		this.createAuthorDialogLastName = "";
		this.createAuthorDialogLastNameError = "";

		this.createAuthorDialogContentProps.title = this.locale.createAuthorDialog.title;
		this.createAuthorDialogVisible = true;
	}

	CreateAuthor(){
		this.createAuthorDialogFirstNameError = "";
		this.createAuthorDialogLastNameError = "";

		this.websocketService.Emit(WebsocketCallbackType.CreateAuthor, {
			jwt: this.dataService.user.JWT,
			firstName: this.createAuthorDialogFirstName,
			lastName: this.createAuthorDialogLastName
		});
	}

	CreateAuthorResponse(response: ApiResponse){
		if(response.status == 201){
			// Add the author to the admin authors in DataService
			this.dataService.adminAuthors.push({
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: response.data.bios,
				collections: response.data.collections,
				profileImage: response.data.profile_image
			});

			this.createAuthorDialogVisible = false;

			// Redirect to the author page of the new author
			this.router.navigate(['author', response.data.uuid]);
		}else{
			let errors = response.data.errors;

			for(let error of errors){
				switch(error.code){
					case 2301:	// First name too short
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooShort;
						break;
					case 2302:	// Last name too short
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooShort;
						break;
					case 2401:	// First name too long
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.firstNameTooLong;
						break;
					case 2402:	// Last name too long
						this.createAuthorDialogLastNameError = this.locale.createAuthorDialog.errors.lastNameTooLong;
						break;
					default:		// Unexpected error
						this.createAuthorDialogFirstNameError = this.locale.createAuthorDialog.errors.unexpectedError;
						break;
				}
			}
		}
	}
}