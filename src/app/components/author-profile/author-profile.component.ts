import { Component, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IDropdownOption, DropdownMenuItemType, IButtonStyles } from 'office-ui-fabric-react';
import { ReadFile } from 'ngx-file-helpers';
import { DataService, ApiResponse, FindAppropriateLanguage, GetContentAsInlineSource, Author } from 'src/app/services/data-service';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-author-profile',
	templateUrl: './author-profile.component.html'
})
export class AuthorProfileComponent{
	locale = enUS.authorProfile;
	getAuthorSubscriptionKey: number;
	setBioOfAuthorOfUserSubscriptionKey: number;
	setBioOfAuthorSubscriptionKey: number;
	setProfileImageOfAuthorOfUserSubscriptionKey: number;
	getProfileImageOfAuthorOfUserSubscriptionKey: number;
	setProfileImageOfAuthorSubscriptionKey: number;
	getProfileImageOfAuthorSubscriptionKey: number;

	@Input() uuid: string;
	authorMode: AuthorMode = AuthorMode.Normal;
	author: Author = {uuid: "", firstName: "", lastName: "", bios: [], collections: [], profileImage: false};
	profileImageWidth: number = 200;
	bioLanguageDropdownSelectedIndex: number = 0;
	bioLanguageDropdownOptions: IDropdownOption[] = [];
	bioMode: BioMode = BioMode.None;
	newBio: string = "";
	newBioError: string = "";
	collections: {uuid: string, name: string}[] = [];
	profileImageContent: string = "https://davapps.blob.core.windows.net/avatars-dev/default.png";
	uploadedProfileImageContent: string;

	bioTextfieldStyles = {
		root: {
			marginTop: "10px"
		}
	}
	cancelButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}

	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().authorProfile;
		this.getAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetAuthor, (response: ApiResponse) => this.GetAuthorResponse(response));
		this.setBioOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetBioOfAuthorOfUser, (response: ApiResponse) => this.SetBioOfAuthorOfUserResponse(response));
		this.setBioOfAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetBioOfAuthor, (response: ApiResponse) => this.SetBioOfAuthorResponse(response));
		this.setProfileImageOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetProfileImageOfAuthorOfUser, (response: ApiResponse) => this.SetProfileImageOfAuthorOfUserResponse(response));
		this.getProfileImageOfAuthorOfUserSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetProfileImageOfAuthorOfUser, (response: ApiResponse) => this.GetProfileImageOfAuthorOfUserResponse(response));
		this.setProfileImageOfAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.SetProfileImageOfAuthor, (response: ApiResponse) => this.SetProfileImageOfAuthorResponse(response));
		this.getProfileImageOfAuthorSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetProfileImageOfAuthor, (response: ApiResponse) => this.GetProfileImageOfAuthorResponse(response));
	}

	async ngOnInit(){
		this.setSize();
		await this.dataService.userAuthorPromise;

		// Find the correct author mode
		if(!this.uuid){
			this.authorMode = AuthorMode.AuthorOfUser;
		}else if(
			this.dataService.userIsAdmin && 
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.uuid) != -1)){
			this.authorMode = AuthorMode.AuthorOfAdmin;
		}

		if(this.authorMode == AuthorMode.AuthorOfAdmin){
			// Get the author from the admin authors
			this.author = this.dataService.adminAuthors.find(author => author.uuid == this.uuid);
			this.SelectDefaultBio();
		}else if(this.authorMode == AuthorMode.AuthorOfUser){
			this.author = this.dataService.userAuthor;
			this.SelectDefaultBio();
		}else{
			// Get the author from the server
			this.websocketService.Emit(WebsocketCallbackType.GetAuthor, {uuid: this.uuid});
		}

		// Get the appropriate language of each collection
		for(let collection of this.author.collections){
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), collection.names);
			if(i != -1) this.collections.push({uuid: collection.uuid, name: collection.names[i].name});
		}

		// Download the profile image
		if(this.author.profileImage){
			if(this.authorMode == AuthorMode.AuthorOfUser){
				this.websocketService.Emit(WebsocketCallbackType.GetProfileImageOfAuthorOfUser, {
					jwt: this.dataService.user.JWT
				});
			}else{
				this.websocketService.Emit(WebsocketCallbackType.GetProfileImageOfAuthor, {
					jwt: this.dataService.user.JWT,
					uuid: this.uuid
				});
			}
		}

		this.SetupBioLanguageDropdown();
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.setBioOfAuthorOfUserSubscriptionKey,
			this.setBioOfAuthorSubscriptionKey,
			this.setProfileImageOfAuthorOfUserSubscriptionKey,
			this.getProfileImageOfAuthorOfUserSubscriptionKey,
			this.setProfileImageOfAuthorSubscriptionKey,
			this.getProfileImageOfAuthorSubscriptionKey
		)
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}
	
	setSize(){
		if(window.innerWidth < 768){
			this.profileImageWidth = 110;
		}else if(window.innerWidth < 1200){
			this.profileImageWidth = 120;
		}else{
			this.profileImageWidth = 130;
		}
	}

	SelectDefaultBio(){
		this.bioLanguageDropdownSelectedIndex = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.author.bios);
	}

	ShowCollection(uuid: string){
		this.router.navigate(["author", "collection", uuid]);
	}

	SetupBioLanguageDropdown(){
		if(this.authorMode == AuthorMode.Normal) return;

		// Prepare the Bio language dropdown
		this.bioLanguageDropdownOptions = [];
		let i = 0;

		for(let lang of this.author.bios){
			this.bioLanguageDropdownOptions.push({
				key: i,
				text: this.dataService.GetFullLanguage(lang.language),
				data: {
					language: lang.language,
					added: true
				}
			});

			i++;
		}

		if(this.bioLanguageDropdownOptions.length == 0){
			this.bioMode = BioMode.None;

			// Add default item
			this.bioLanguageDropdownOptions.push({
				key: 0,
				text: this.locale.addYourBio
			});

			i++;

			// Add each supported language
			for(let supportedLanguage of this.dataService.supportedLanguages){
				this.bioLanguageDropdownOptions.push({
					key: i,
					text: supportedLanguage.fullLanguage,
					data: {
						language: supportedLanguage.language,
						added: false
					}
				});

				i++;
			}
		}else{
			// Add a divider and all possible languages to add
			let newOptions: IDropdownOption[] = [{
				key: "header",
				text: this.locale.additionalLanguages,
				itemType: DropdownMenuItemType.Header
			}];

			for(let supportedLanguage of this.dataService.supportedLanguages){
				// Check if there is a bio with the supported language
				let index = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == supportedLanguage.language);

				if(index == -1){
					// There is no bio in that language
					// Add an option to add that language
					newOptions.push({
						key: i,
						text: supportedLanguage.fullLanguage,
						data: {
							language: supportedLanguage.language,
							added: false
						}
					});

					i++;
				}
			}

			if(newOptions.length > 1){
				for(let option of newOptions){
					this.bioLanguageDropdownOptions.push(option);
				}
			}

			// Select and show the first language
			this.bioMode = BioMode.Normal;
		}
	}

	EditBio(){
		if(this.bioMode == BioMode.New || this.bioMode == BioMode.NormalEdit){
			this.newBioError = "";

			// Save the new bio on the server
			let selectedOption = this.bioLanguageDropdownOptions[this.bioLanguageDropdownSelectedIndex + (this.bioMode == BioMode.New && this.author.bios.length > 0 ? 1 : 0)];

			if(this.authorMode == AuthorMode.AuthorOfUser){
				this.websocketService.Emit(WebsocketCallbackType.SetBioOfAuthorOfUser, {
					jwt: this.dataService.user.JWT,
					language: selectedOption.data.language,
					bio: this.newBio
				});
			}else{
				this.websocketService.Emit(WebsocketCallbackType.SetBioOfAuthor, {
					jwt: this.dataService.user.JWT,
					uuid: this.uuid,
					language: selectedOption.data.language,
					bio: this.newBio
				});
			}
		}else{
			this.newBio = this.author.bios[this.bioLanguageDropdownSelectedIndex].bio;
			this.newBioError = "";
			this.bioMode = BioMode.NormalEdit;
		}
	}

	CancelEditBio(){
		this.bioMode = 2;
		this.newBio = "";
		this.newBioError = "";
	}

	BioLanguageDropdownChange(e: {event: MouseEvent, option: {key: number, text: string, data: any}, index: number}){
		this.bioLanguageDropdownSelectedIndex = e.option.key;
		this.newBioError = "";

		if(!e.option.data){
			this.bioMode = BioMode.None;
		}else{
			this.bioMode = e.option.data.added ? BioMode.Normal : BioMode.New;
		}
	}

	async UploadProfileImage(file: ReadFile){
		// Get the content of the image file
		let reader = new FileReader();

		let readPromise: Promise<string> = new Promise((resolve) => {
			reader.addEventListener('loadend', (e) => {
				resolve(e.srcElement["result"]);
			});
		});

		reader.readAsBinaryString(new Blob([file.underlyingFile]));
		let imageContent = await readPromise;

		// Upload the image
		if(this.authorMode == AuthorMode.AuthorOfUser){
			this.websocketService.Emit(WebsocketCallbackType.SetProfileImageOfAuthorOfUser, {
				jwt: this.dataService.user.JWT,
				type: file.type,
				file: imageContent
			});
		}else{
			this.websocketService.Emit(WebsocketCallbackType.SetProfileImageOfAuthor, {
				jwt: this.dataService.user.JWT,
				uuid: this.uuid,
				type: file.type,
				file: imageContent
			});
		}

		this.uploadedProfileImageContent = GetContentAsInlineSource(imageContent, file.type);
	}

	ProcessSetBioResponse(response: ApiResponse){
		if(response.status == 200){
			if(this.bioMode == BioMode.New){
				// Add the new bio to the bios
				this.author.bios.push(response.data);

				// Update the dropdown
				this.bioMode = BioMode.Normal;
				this.newBio = "";
				this.newBioError = "";
				this.SetupBioLanguageDropdown();

				// Show the bio in the language that was just added
				let i = this.bioLanguageDropdownOptions.findIndex(option => option.data.language == response.data.language);
				if(i != -1){
					this.bioLanguageDropdownSelectedIndex = this.bioLanguageDropdownOptions[i].key as number;
				}
			}else{
				// Find and update the edited bio
				let i = this.author.bios.findIndex(bio => bio.language == response.data.language);
				if(i != -1){
					this.author.bios[i].bio = response.data.bio;
				}

				this.newBio = "";
				this.newBioError = "";
				this.bioMode = BioMode.Normal;
			}
		}else{
			let errorCode = response.data.errors[0].code;

			switch(errorCode){
				case 2303:
					// Field too short: bio
					this.newBioError = this.locale.errors.bioTooShort;
					break;
				case 2403:
					// Field too long: bio
					this.newBioError = this.locale.errors.bioTooLong;
					break;
				default:
					// Unexpected error
					this.newBioError = this.locale.errors.unexpectedError;
					break;
			}
		}
	}

	GetAuthorResponse(response: ApiResponse){
		if(response.status == 200){
			this.author = {
				uuid: response.data.uuid,
				firstName: response.data.first_name,
				lastName: response.data.last_name,
				bios: response.data.bios,
				collections: response.data.collections,
				profileImage: response.data.profile_image
			}

			this.bioMode = BioMode.Normal;
			this.SelectDefaultBio();
		}
	}

	SetBioOfAuthorOfUserResponse(response: ApiResponse){
		this.ProcessSetBioResponse(response);
	}

	SetBioOfAuthorResponse(response: ApiResponse){
		this.ProcessSetBioResponse(response);
	}

	SetProfileImageOfAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the uploaded profile image
			this.profileImageContent = this.uploadedProfileImageContent;
			this.uploadedProfileImageContent = null;
			this.author.profileImage = true;
		}
	}

	GetProfileImageOfAuthorOfUserResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the profile image
			this.profileImageContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}

	SetProfileImageOfAuthorResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the uploaded profile image
			this.profileImageContent = this.uploadedProfileImageContent;
			this.uploadedProfileImageContent = null;
			this.author.profileImage = true;
		}
	}

	GetProfileImageOfAuthorResponse(response: ApiResponse){
		if(response.status == 200){
			// Show the profile image
			this.profileImageContent = GetContentAsInlineSource(response.data, response.headers['content-type']);
		}
	}
}

enum BioMode{
	None = 0,		// If the author has no bios and has not selected to add a bio, show nothing
	New = 1,			// If the author has selected a language to add, show the input for creating a bio
	Normal = 2,		// If the author has one or more bios, show the selected bio
	NormalEdit = 3	// If the author has one or more bios and the user is editing the bio of the selected language
}

enum AuthorMode{
	Normal = 0,			// If the user is not an author and not an admin or an admin but author does not belong to admin
	AuthorOfUser = 1,	// If the author belongs to the user
	AuthorOfAdmin = 2	// If the user is an admin and the author belongs to the admin
}