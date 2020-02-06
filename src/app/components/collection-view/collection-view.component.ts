import { Component, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IIconStyles, IDialogContentProps, IButtonStyles } from 'office-ui-fabric-react';
import { EditCollectionNamesComponent } from 'src/app/components/edit-collection-names/edit-collection-names.component';
import { WebsocketService, WebsocketCallbackType } from 'src/app/services/websocket-service';
import {
	DataService,
	ApiResponse,
	FindAppropriateLanguage,
	GetContentAsInlineSource,
	AuthorMode
} from 'src/app/services/data-service';
import { enUS } from 'src/locales/locales';

@Component({
	selector: 'pocketlib-collection-view',
	templateUrl: './collection-view.component.html'
})
export class CollectionViewComponent{
	locale = enUS.collectionView;
	getStoreBookCollectionSubscriptionKey: number;
	getStoreBookCoverSubscriptionKey: number;
	createStoreBookSubscriptionKey: number;

	@ViewChild(EditCollectionNamesComponent, {static: true})
	private editCollectionNamesComponent: EditCollectionNamesComponent;
	@Input() uuid: string;
	authorMode: AuthorMode = AuthorMode.Normal;
	collectionName: {name: string, language: string} = {name: "", language: ""};
	collection: {
		uuid: string,
		author: string,
		names: {name: string, language: string}[],
		books: {
			uuid: string,
			title: string,
			description: string,
			language: string,
			status: string,
			cover: boolean,
			file: boolean,
			coverContent: string
		}[]
	} = {uuid: "", author: "", names: [], books: []};
	coverDownloadPromiseResolve: Function;
	createBookDialogVisible: boolean = false;
	createBookDialogTitle: string = "";
	createBookDialogTitleError: string = "";
	collectionNamesDialogVisible: boolean = false;
	collectionNames: {name: string, language: string, fullLanguage: string, edit: boolean}[] = [];
	showAddLanguageButton: boolean = false;
	getCollectionPromise: Promise<null> = new Promise((resolve) => this.getCollectionPromiseResolve = resolve);
	getCollectionPromiseResolve: Function;

	backButtonIconStyles: IIconStyles = {
		root: {
         fontSize: 18
		}
	}
	dialogPrimaryButtonStyles: IButtonStyles = {
		root: {
			marginLeft: 10
		}
	}
	createBookDialogContentProps: IDialogContentProps = {
		title: this.locale.createBookDialog.title
	}
	collectionNamesDialogContentProps: IDialogContentProps = {
		title: this.locale.collectionNamesDialog.title
	}

	constructor(
		public dataService: DataService,
		private websocketService: WebsocketService,
		private router: Router
	){
		this.locale = this.dataService.GetLocale().collectionView;
		this.getStoreBookCollectionSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCollection, (response: ApiResponse) => this.GetStoreBookCollectionResponse(response));
		this.getStoreBookCoverSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.GetStoreBookCover, (response: ApiResponse) => this.GetStoreBookCoverResponse(response));
		this.createStoreBookSubscriptionKey = this.websocketService.Subscribe(WebsocketCallbackType.CreateStoreBook, (response: ApiResponse) => this.CreateStoreBookResponse(response));
	}

	async ngOnInit(){
		// Wait for the user to be loaded
		await this.dataService.userPromise;
		await this.dataService.userAuthorPromise;
		await this.dataService.adminAuthorsPromise;

		// Get the collection
		this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCollection, {
			jwt: this.dataService.user.JWT,
			uuid: this.uuid
		});

		await this.getCollectionPromise;

		// Determine the author mode
		if(
			this.dataService.userIsAdmin &&
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.collection.author) != -1)
		){
			this.authorMode = AuthorMode.AuthorOfAdmin;
		}else if(
			this.dataService.userAuthor &&
			this.collection.author == this.dataService.userAuthor.uuid
		){
			this.authorMode = AuthorMode.AuthorOfUser;
		}
	}

	ngOnDestroy(){
		this.websocketService.Unsubscribe(
			this.getStoreBookCollectionSubscriptionKey,
			this.getStoreBookCoverSubscriptionKey,
			this.createStoreBookSubscriptionKey
		)
	}

	GoBack(){
		if(this.dataService.userIsAdmin){
			this.router.navigate(["author", this.collection.author]);
		}else{
			this.router.navigate(["author"]);
		}
	}

	ShowBook(uuid: string){
		this.router.navigate(["author", "book", uuid]);
	}

	ShowCreateBookDialog(){
		this.createBookDialogTitle = "";
		this.createBookDialogTitleError = "";

		this.createBookDialogContentProps.title = this.locale.createBookDialog.title;
		this.createBookDialogVisible = true;
	}

	CreateBook(){
		this.createBookDialogTitleError = "";

		this.websocketService.Emit(WebsocketCallbackType.CreateStoreBook, {
			jwt: this.dataService.user.JWT,
			collection: this.uuid,
			title: this.createBookDialogTitle,
			language: this.dataService.locale.startsWith("de") ? "de" : "en"
		});
	}

	ShowCollectionNamesDialog(){
		// Update the collection names for the EditCollectionNames component
		this.collectionNames = [];
		let languages = this.dataService.GetLocale().misc.languages;

		for(let collectionName of this.collection.names){
			this.collectionNames.push({
				name: collectionName.name, 
				language: collectionName.language, 
				fullLanguage: collectionName.language == "de" ? languages.de : languages.en,
				edit: false
			});
		}

		this.collectionNamesDialogContentProps.title = this.locale.collectionNamesDialog.title;
		this.collectionNamesDialogVisible = true;

		setTimeout(() => {
			this.editCollectionNamesComponent.Init();
		}, 1);
	}

	UpdateCollectionName(collectionName: {name: string, language: string}){
		if(this.collectionName.language == collectionName.language){
			// Update the title
			this.collectionName.name = collectionName.name;
		}else{
			let i = this.collection.names.findIndex(name => name.language == collectionName.language);
			if(i == -1){
				// Add the name to the collection
				this.collection.names.push(collectionName);

				// Set the title of the name for the current language was just added
				let j = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
				if(j != -1) this.collectionName = this.collection.names[j];
			}else{
				// Update the name in the collection
				this.collection.names[i].name = collectionName.name;
			}
		}
	}

	AddLanguage(){
		this.editCollectionNamesComponent.AddLanguage();
	}

	async GetStoreBookCollectionResponse(response: ApiResponse){
		if(response.status == 200){
			this.collection = response.data;

			// Get the appropriate collection name
			let i = FindAppropriateLanguage(this.dataService.locale.slice(0, 2), this.collection.names);
			if(i != -1) this.collectionName = this.collection.names[i];
			let coverDownloads: string[] = [];

			for(let book of this.collection.books){
				// Set the default cover
				book.coverContent = this.dataService.darkTheme ? '/assets/images/placeholder-dark.png' : '/assets/images/placeholder.png';

				if(book.cover){
					// Add the cover to the downloads
					coverDownloads.push(book.uuid);
				}

				// Cut the description
				if(book.description && book.description.length > 170){
					book.description = book.description.slice(0, 169) + "...";
				}
			}

			// Download the covers
			for(let uuid of coverDownloads){
				let coverDownloadPromise: Promise<ApiResponse> = new Promise((resolve) => {
					this.coverDownloadPromiseResolve = resolve;
				});

				// Start the cover download
				this.websocketService.Emit(WebsocketCallbackType.GetStoreBookCover, {jwt: this.dataService.user.JWT, uuid});

				// Wait for the download to finish
				let coverResponse = await coverDownloadPromise;
				
				if(coverResponse.status == 200){
					// Find the book with the uuid
					let i = this.collection.books.findIndex(book => book.uuid == uuid);
					if(i != -1){
						this.collection.books[i].coverContent = GetContentAsInlineSource(coverResponse.data, coverResponse.headers['content-type']);
					}
				}
			}

			this.getCollectionPromiseResolve();
		}else{
			// Redirect back to the author page
			this.router.navigate(["author"]);
		}
	}

	GetStoreBookCoverResponse(response: ApiResponse){
		this.coverDownloadPromiseResolve(response);
	}

	CreateStoreBookResponse(response: ApiResponse){
		if(response.status == 201){
			this.createBookDialogVisible = false;

			// Redirect to AuthorAppPage
			this.router.navigate(["author", "book", response.data.uuid]);
		}else{
			let errors = response.data.errors;

			for(let error of errors){
				switch(error.code){
					case 2105:
						// Title missing
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleMissing;
					case 2304:
						// Title too short
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooShort;
						break;
					case 2404:
						// Title too long
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.titleTooLong;
						break;
					default:
						// Unexpected error
						this.createBookDialogTitleError = this.locale.createBookDialog.errors.unexpectedError;
						break;
				}
			}
		}
	}
}