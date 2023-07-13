import { Component, HostListener } from "@angular/core"
import { Router, ActivatedRoute, ParamMap } from "@angular/router"
import {
	ApiResponse,
	ApiErrorResponse,
	CheckoutSessionsController,
	CreateCheckoutSessionResponseData,
	DownloadTableObject,
	isSuccessStatusCode
} from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import { GraphQLService } from "src/app/services/graphql-service"
import { CachingService } from "src/app/services/caching-service"
import { RoutingService } from "src/app/services/routing-service"
import { EpubBook } from "src/app/models/EpubBook"
import { PdfBook } from "src/app/models/PdfBook"
import { UpdateBookOrder } from "src/app/models/BookOrder"
import { GetBook } from "src/app/models/BookManager"
import {
	GetDualScreenSettings,
	GetStoreBookStatusByString
} from "src/app/misc/utils"
import {
	PublisherResource,
	PublisherField,
	AuthorResource,
	AuthorField,
	BookResource,
	BookField,
	StoreBookStatus,
	StoreBookCollectionResource,
	StoreBookCollectionField
} from "src/app/misc/types"
import { enUS } from "src/locales/locales"

@Component({
	selector: "pocketlib-store-book-page",
	templateUrl: "./store-book-page.component.html",
	styleUrls: ["./store-book-page.component.scss"]
})
export class StoreBookPageComponent {
	locale = enUS.storeBookPage
	width: number = 500
	showMobileLayout: boolean = false
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	uuid: string
	book: {
		collection: string
		title: string
		description: string
		price: number
		status: StoreBookStatus
		coverBlurhash: string
		categories: {
			key: string
			name: string
		}[]
		inLibrary: boolean
		purchased: boolean
		series: string[]
	} = {
		collection: "",
		title: "",
		description: "",
		price: 0,
		status: StoreBookStatus.Unpublished,
		coverBlurhash: null,
		categories: [],
		inLibrary: false,
		purchased: false,
		series: []
	}
	categoryKeys: string[] = []
	price: string = ""
	bookStatus: string = ""
	author: AuthorResource = {
		uuid: "",
		publisher: "",
		firstName: "",
		lastName: "",
		bio: null,
		websiteUrl: null,
		facebookUsername: null,
		instagramUsername: null,
		twitterUsername: null,
		profileImage: null
	}
	coverContent: string
	coverUrl: string = ""
	coverAlt: string = ""
	authorProfileImageContent: string = this.dataService.defaultProfileImageUrl
	authorProfileImageAlt: string = ""
	publisher: {
		uuid: string
		name: string
		logoBlurhash: string
		logoContent: string
		logoAlt: string
	} = null
	loginRequiredDialogVisible: boolean = false
	noAccessDialogVisible: boolean = false
	buyBookDialogVisible: boolean = false
	buyBookDialogLoginRequired: boolean = false
	errorDialogVisible: boolean = false
	loadingScreenVisible: boolean = false
	publishLoading: boolean = false

	constructor(
		public dataService: DataService,
		private apiService: ApiService,
		private graphqlService: GraphQLService,
		private cachingService: CachingService,
		private routingService: RoutingService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {
		this.locale = this.dataService.GetLocale().storeBookPage

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		this.setSize()
		await this.dataService.userPromiseHolder.AwaitResult()

		// Get the uuid from the params
		this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
			let uuid = paramMap.get("uuid")

			if (this.uuid != uuid) {
				this.uuid = uuid
				this.Init()
			}
		})
	}

	ngAfterViewInit() {
		this.setSize()
	}

	@HostListener("window:resize")
	setSize() {
		this.width = window.innerWidth
		this.showMobileLayout = window.innerWidth < 768 && !this.dualScreenLayout
	}

	async Init() {
		// Get StoreBook, StoreBookCollection and Author
		await this.GetData()
	}

	BackButtonClick() {
		this.routingService.NavigateBack("/store")
	}

	async GetData() {
		// Get the StoreBook
		let collectionUuid = await this.LoadStoreBook()
		setTimeout(() => this.setSize(), 1)
		if (!collectionUuid) return

		// Get the StoreBookCollection
		let authorUuid = await this.LoadStoreBookCollection(collectionUuid)
		if (!authorUuid) return

		// Get the Author
		await this.LoadAuthor(authorUuid)

		if (this.author.publisher != null) {
			await this.LoadPublisher()
		}
	}

	async LoadStoreBook(): Promise<string> {
		let response = await this.graphqlService.retrieveStoreBook(this.uuid)
		let responseData = response.data.retrieveStoreBook

		this.book.collection = responseData.collection?.uuid
		this.book.title = responseData.title
		this.book.description = responseData.description
		this.book.price = responseData.price
		this.book.status = GetStoreBookStatusByString(responseData.status)
		this.book.coverBlurhash = responseData.cover?.blurhash
		this.book.inLibrary = responseData.inLibrary
		this.book.purchased = responseData.purchased

		for (let category of responseData.categories) {
			this.categoryKeys.push(category.key)
		}

		this.coverAlt = this.dataService
			.GetLocale()
			.misc.bookCoverAlt.replace("{0}", this.book.title)

		// Load the cover
		if (responseData.cover?.url != null) {
			this.coverUrl = responseData.cover?.url

			this.apiService
				.GetFile({ url: responseData.cover.url })
				.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						this.coverContent = (fileResponse as ApiResponse<string>).data
					}
				})
		}

		// Load the price
		if (this.book.price == 0) {
			this.price = this.locale.free
		} else {
			this.price = (this.book.price / 100).toFixed(2) + " €"

			if (this.dataService.supportedLocale == "de") {
				this.price = this.price.replace(".", ",")
			}
		}

		// Load the status
		switch (this.book.status) {
			case StoreBookStatus.Unpublished:
				this.bookStatus = this.locale.unpublished
				break
			case StoreBookStatus.Review:
				this.bookStatus = this.locale.review
				break
			case StoreBookStatus.Hidden:
				this.bookStatus = this.locale.hidden
				break
		}

		// Load the categories
		this.book.categories = []
		await this.dataService.categoriesPromiseHolder.AwaitResult()

		for (let key of this.categoryKeys) {
			// Find the category with the key
			let category = this.dataService.categories.find(c => c.key == key)

			if (category) {
				this.book.categories.push({
					key: category.key,
					name: category.name
				})
			}
		}

		// Get the series of the book
		if (responseData.series.length > 0) {
			this.book.series.push(responseData.series[0].uuid)
		}

		return responseData.collection?.uuid
	}

	async LoadStoreBookCollection(uuid: string): Promise<string> {
		let response = await this.apiService.RetrieveStoreBookCollection({
			uuid,
			fields: [StoreBookCollectionField.author]
		})

		if (isSuccessStatusCode(response.status)) {
			return (response as ApiResponse<StoreBookCollectionResource>).data
				.author
		}

		return null
	}

	async LoadAuthor(uuid: string) {
		let response = await this.apiService.RetrieveAuthor({
			uuid,
			fields: [
				AuthorField.uuid,
				AuthorField.publisher,
				AuthorField.firstName,
				AuthorField.lastName,
				AuthorField.profileImage
			]
		})

		if (isSuccessStatusCode(response.status)) {
			this.author = (response as ApiResponse<AuthorResource>).data
			this.authorProfileImageAlt = this.dataService
				.GetLocale()
				.misc.authorProfileImageAlt.replace(
					"{0}",
					`${this.author.firstName} ${this.author.lastName}`
				)

			if (this.author.profileImage?.url != null) {
				this.apiService
					.GetFile({ url: this.author.profileImage.url })
					.then((fileResponse: ApiResponse<string> | ApiErrorResponse) => {
						if (isSuccessStatusCode(fileResponse.status)) {
							this.authorProfileImageContent = (
								fileResponse as ApiResponse<string>
							).data
						}
					})
			}
		}
	}

	async LoadPublisher() {
		// Get the publisher
		let publisherResponse = await this.apiService.RetrievePublisher({
			uuid: this.author.publisher,
			fields: [PublisherField.name, PublisherField.logo]
		})

		if (isSuccessStatusCode(publisherResponse.status)) {
			let responseData = (
				publisherResponse as ApiResponse<PublisherResource>
			).data

			this.publisher = {
				uuid: this.author.publisher,
				name: responseData.name,
				logoBlurhash: responseData.logo?.blurhash,
				logoContent: this.dataService.defaultProfileImageUrl,
				logoAlt: this.dataService
					.GetLocale()
					.misc.publisherLogoAlt.replace("{0}", responseData.name)
			}

			if (responseData.logo?.url != null) {
				this.apiService
					.GetFile({ url: responseData.logo.url })
					.then((response: ApiResponse<string> | ApiErrorResponse) => {
						if (isSuccessStatusCode(response.status))
							this.publisher.logoContent = (
								response as ApiResponse<string>
							).data
					})
			}
		}
	}

	async Read() {
		/*
		- is not logged in:
			- Show login dialog
		- is logged in:
			- is in library:
				- open book
			- is not in library:
				- purchased:
					- add to library
					- open book
				- not purchased:
					- free:
						- create purchase for book
						- add to library
						- open book
					- not free:
						- can access:
							- add to library
							- open book
						- can not access
							- show dav Plus dialog

		*/

		// Check if the user is logged in
		if (!this.dataService.dav.isLoggedIn) {
			this.loginRequiredDialogVisible = true
			return
		}

		// Check if the book is in the library of the user
		if (this.book.inLibrary) {
			// TODO: Check if the book is already downloaded, and if not, wait for download
			await this.OpenBook()
		} else {
			this.loadingScreenVisible = true

			// Check if the user has purchased the book
			if (this.book.purchased) {
				if (!(await this.AddBookToLibrary())) {
					// Show error
					this.loadingScreenVisible = false
					this.errorDialogVisible = true
					return
				}

				await this.OpenBook()
			} else {
				// Check if the book is free
				if (this.book.price == 0) {
					if (!(await this.CreatePurchaseForBook())) {
						// Show error
						this.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					if (!(await this.AddBookToLibrary())) {
						// Show error
						this.loadingScreenVisible = false
						this.errorDialogVisible = true
						return
					}

					await this.OpenBook()
				} else {
					// Check if the user can access the book
					let isAuthorOfBook = false
					if (this.dataService.userAuthor) {
						// Try to find the book in the books of the author
						isAuthorOfBook =
							(
								await this.dataService.userAuthor.GetCollections()
							).findIndex(
								collection => collection.uuid == this.book.collection
							) != -1
					}

					if (
						!this.dataService.userIsAdmin &&
						!isAuthorOfBook &&
						this.book.price > 0 &&
						this.dataService.dav.user.Plan != 2
					) {
						// Show dav Pro dialog
						this.loadingScreenVisible = false
						this.noAccessDialogVisible = true
						return
					}

					await this.AddBookToLibrary()
					await this.OpenBook()
				}
			}
		}
	}

	private async CreatePurchaseForBook(): Promise<boolean> {
		// Purchase this book directly
		let currentUrl = window.location.origin + this.router.url

		let response = await CheckoutSessionsController.CreateCheckoutSession({
			mode: "payment",
			currency: "eur",
			productName: this.book.title,
			productImage: this.coverUrl,
			tableObjects: [this.uuid],
			successUrl: currentUrl,
			cancelUrl: currentUrl
		})

		if (isSuccessStatusCode(response.status)) {
			this.book.purchased = true

			// Clear the ApiCache for GetStoreBook
			this.cachingService.ClearApiRequestCache(
				this.apiService.RetrieveStoreBook.name
			)

			return true
		}

		return false
	}

	private async AddBookToLibrary(): Promise<boolean> {
		// Add the StoreBook to the library of the user
		let response = await this.apiService.CreateBook({
			storeBook: this.uuid,
			fields: [BookField.uuid, BookField.file]
		})

		if (isSuccessStatusCode(response.status)) {
			let responseData = (response as ApiResponse<BookResource>).data

			// Download the table objects
			await DownloadTableObject(responseData.uuid)
			await DownloadTableObject(responseData.file)

			let book = await GetBook(responseData.uuid)

			if (book != null) {
				// Add the new book to the first position of the books
				this.dataService.books.unshift(book)

				// Update the order of the books
				await UpdateBookOrder(
					this.dataService.bookOrder,
					this.dataService.books
				)
			}

			// Clear the ApiCache for GetStoreBook
			this.cachingService.ClearApiRequestCache(
				this.apiService.RetrieveStoreBook.name
			)

			return true
		} else {
			let error = (response as ApiErrorResponse).errors[0]

			if (error.code == 3005) {
				// StoreBook is already in library
				return true
			}
		}

		return false
	}

	private async OpenBook() {
		// Load the book
		let book = this.dataService.books.find(b => b.storeBook == this.uuid)

		if (book == null) {
			// Show error
			this.loadingScreenVisible = false
			this.errorDialogVisible = true
			return
		}

		this.dataService.currentBook = book

		// Update the settings with the position of the current book
		if (book instanceof EpubBook) {
			await this.dataService.settings.SetBook(
				book.uuid,
				book.chapter,
				book.progress
			)
		} else if (book instanceof PdfBook) {
			await this.dataService.settings.SetBook(book.uuid, null, book.page)
		}

		this.router.navigate(["book"])
	}

	async BuyBook() {
		if (this.dataService.dav.isLoggedIn) {
			// Show dialog for buying the book
			this.ShowBuyBookDialog(false)
		} else {
			// Show the Buy book dialog with login required
			this.ShowBuyBookDialog(true)
		}
	}

	ShowBuyBookDialog(loginRequired: boolean) {
		this.buyBookDialogLoginRequired = loginRequired
		this.buyBookDialogVisible = true
	}

	NavigateToAccountPage() {
		this.router.navigate(["account"], {
			queryParams: { redirect: `store/book/${this.uuid}` }
		})
	}

	async NavigateToPurchasePage() {
		let currentUrl = window.location.origin + this.router.url

		let response = await CheckoutSessionsController.CreateCheckoutSession({
			mode: "payment",
			currency: "eur",
			productName: this.book.title,
			productImage: this.coverUrl,
			tableObjects: [this.uuid],
			successUrl: currentUrl,
			cancelUrl: currentUrl
		})

		if (isSuccessStatusCode(response.status)) {
			// Navigate to the checkout session url
			let responseData = (
				response as ApiResponse<CreateCheckoutSessionResponseData>
			).data
			window.location.href = responseData.sessionUrl
		} else {
			// Show error
			this.buyBookDialogVisible = false
			this.errorDialogVisible = true
		}
	}

	async PublishStoreBook() {
		this.publishLoading = true

		let response = await this.apiService.UpdateStoreBook({
			uuid: this.uuid,
			status: "published"
		})

		if (isSuccessStatusCode(response.status)) {
			this.book.status = StoreBookStatus.Published

			// Find the author and clear the collections
			if (this.dataService.userIsAdmin) {
				let author = this.dataService.adminAuthors.find(
					a => a.uuid == this.author.uuid
				)

				if (author != null) {
					author.ClearCollections()
				}
			} else if (this.dataService.userAuthor?.uuid == this.author.uuid) {
				this.dataService.userAuthor.ClearCollections()
			}
		}

		// Clear the ApiCache for GetStoreBook and GetStoreBooksInReview
		this.cachingService.ClearApiRequestCache(
			this.apiService.RetrieveStoreBook.name
		)
		this.cachingService.ClearApiRequestCache(
			this.apiService.ListStoreBooks.name
		)

		this.publishLoading = false
	}
}
