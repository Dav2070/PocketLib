import { Component, ViewChild, Input } from '@angular/core'
import { Router, NavigationExtras } from '@angular/router'
import { IIconStyles, IDialogContentProps } from 'office-ui-fabric-react'
import { ApiResponse } from 'dav-js'
import { EditCollectionNamesComponent } from 'src/app/components/edit-collection-names/edit-collection-names.component'
import {
	DataService,
	FindAppropriateLanguage,
	AuthorMode
} from 'src/app/services/data-service'
import { ApiService } from 'src/app/services/api-service'
import { GetDualScreenSettings, UpdateDialogForDualScreenLayout } from 'src/app/misc/utils'
import { BookListItem } from 'src/app/misc/types'
import { enUS } from 'src/locales/locales'

@Component({
	selector: 'pocketlib-collection-view',
	templateUrl: './collection-view.component.html'
})
export class CollectionViewComponent {
	locale = enUS.collectionView
	@ViewChild(EditCollectionNamesComponent, { static: true }) editCollectionNamesComponent: EditCollectionNamesComponent
	@Input() uuid: string
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	authorMode: AuthorMode = AuthorMode.Normal
	collectionName: { name: string, language: string } = { name: "", language: "" }
	collection: {
		uuid: string,
		author: string,
		names: { name: string, language: string }[],
		books: BookListItem[],
		leftScreenBooks: BookListItem[],
		rightScreenBooks: BookListItem[]
	} = { uuid: "", author: "", names: [], books: [], leftScreenBooks: [], rightScreenBooks: [] }
	collectionNamesDialogVisible: boolean = false
	collectionNames: { name: string, language: string, fullLanguage: string, edit: boolean }[] = []
	showAddLanguageButton: boolean = false
	newBookPageLink: {
		path: string,
		params: any
	} = { path: "/author/book/new", params: {} }

	backButtonIconStyles: IIconStyles = {
		root: {
			fontSize: 18
		}
	}
	collectionNamesDialogContentProps: IDialogContentProps = {
		title: this.locale.collectionNamesDialog.title
	}

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private router: Router
	) {
		this.locale = this.dataService.GetLocale().collectionView

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		// Wait for the user to be loaded
		await this.dataService.userPromiseHolder.AwaitResult()
		await this.dataService.userAuthorPromiseHolder.AwaitResult()
		await this.dataService.adminAuthorsPromiseHolder.AwaitResult()

		// Get the collection
		let getCollectionResponse: ApiResponse<any> = await this.apiService.GetStoreBookCollection({
			uuid: this.uuid
		})

		if (getCollectionResponse.status == 200) {
			this.collection = {
				uuid: getCollectionResponse.data.uuid,
				author: getCollectionResponse.data.author,
				names: getCollectionResponse.data.names,
				books: [],
				leftScreenBooks: [],
				rightScreenBooks: []
			}

			// Get the appropriate collection name
			let i = FindAppropriateLanguage(this.dataService.supportedLocale, this.collection.names)
			if (i != -1) this.collectionName = this.collection.names[i]

			let j = 0
			for (let responseBook of getCollectionResponse.data.books) {
				let bookItem: BookListItem = {
					uuid: responseBook.uuid,
					title: responseBook.title,
					cover: responseBook.cover,
					coverContent: null,
					coverBlurhash: null
				}

				if (bookItem.cover) {
					bookItem.coverBlurhash = responseBook.cover_blurhash

					this.apiService.GetStoreBookCover({ uuid: bookItem.uuid }).then((result: ApiResponse<string>) => {
						bookItem.coverContent = result.data
					})
				}

				if (this.dualScreenLayout) {
					// Evenly distribute the books on the left and right screens
					if (j % 2 == 0) {
						this.collection.leftScreenBooks.push(bookItem)
					} else {
						this.collection.rightScreenBooks.push(bookItem)
					}

					j++
				} else {
					this.collection.books.push(bookItem)
				}
			}
		} else {
			// Redirect back to the author page
			this.router.navigate(["author"])
			return
		}

		// Determine the author mode
		if (
			this.dataService.userIsAdmin &&
			(this.dataService.adminAuthors.findIndex(author => author.uuid == this.collection.author) != -1)
		) {
			this.authorMode = AuthorMode.AuthorOfAdmin
		} else if (
			this.dataService.userAuthor &&
			this.collection.author == this.dataService.userAuthor.uuid
		) {
			this.authorMode = AuthorMode.AuthorOfUser
		}

		// Set the links
		this.newBookPageLink.params["collection"] = this.uuid
		if(this.dataService.userIsAdmin) this.newBookPageLink.params["author"] = this.collection.author
	}

	GoBack() {
		if (this.dataService.userIsAdmin) {
			this.router.navigate(["author", this.collection.author])
		} else {
			this.router.navigate(["author"])
		}
	}

	NavigateToBook(uuid: string) {
		this.router.navigate(["author", "book", uuid])
	}

	ShowCollectionNamesDialog() {
		// Update the collection names for the EditCollectionNames component
		this.collectionNames = []
		let languages = this.dataService.GetLocale().misc.languages

		for (let collectionName of this.collection.names) {
			this.collectionNames.push({
				name: collectionName.name,
				language: collectionName.language,
				fullLanguage: collectionName.language == "de" ? languages.de : languages.en,
				edit: false
			})
		}

		this.collectionNamesDialogContentProps.title = this.locale.collectionNamesDialog.title
		this.collectionNamesDialogVisible = true

		if (this.dualScreenLayout) {
			UpdateDialogForDualScreenLayout()
		}

		setTimeout(() => {
			this.editCollectionNamesComponent.Init()
		}, 1)
	}

	UpdateCollectionName(collectionName: { name: string, language: string }) {
		if (this.collectionName.language == collectionName.language) {
			// Update the title
			this.collectionName.name = collectionName.name
		} else {
			let i = this.collection.names.findIndex(name => name.language == collectionName.language)
			if (i == -1) {
				// Add the name to the collection
				this.collection.names.push(collectionName)

				// Set the title of the name for the current language was just added
				let j = FindAppropriateLanguage(this.dataService.supportedLocale, this.collection.names)
				if (j != -1) this.collectionName = this.collection.names[j]
			} else {
				// Update the name in the collection
				this.collection.names[i].name = collectionName.name
			}
		}
	}

	AddLanguage() {
		this.editCollectionNamesComponent.AddLanguage()
	}
}