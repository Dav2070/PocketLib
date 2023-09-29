import { Component, Input, SimpleChanges } from "@angular/core"
import { isSuccessStatusCode } from "dav-js"
import { DataService } from "src/app/services/data-service"
import { ApiService } from "src/app/services/api-service"
import {
	BookListItem,
	ApiResponse,
	StoreBookResource
} from "src/app/misc/types"
import { AdaptCoverWidthHeightToAspectRatio } from "src/app/misc/utils"
import { enUS } from "src/locales/locales"

const maxVisibleStoreBooks = 7
type HorizontalBookListType = "latest" | "categories" | "series"

@Component({
	selector: "pocketlib-horizontal-book-list",
	templateUrl: "./horizontal-book-list.component.html",
	styleUrls: ["./horizontal-book-list.component.scss"]
})
export class HorizontalBookListComponent {
	@Input() type: HorizontalBookListType = "latest"
	@Input() currentBookUuid: string = ""
	@Input() categories: string[] = []
	@Input() series: string = ""
	locale = enUS.horizontalBookList
	header: string = ""
	books: BookListItem[] = []
	loading: boolean = true

	constructor(
		public dataService: DataService,
		private apiService: ApiService
	) {
		this.locale = this.dataService.GetLocale().horizontalBookList
	}

	async ngOnInit() {
		this.SetHeader()

		if (this.type == "latest") {
			await this.LoadLatestStoreBooks()
		} else if (this.type == "categories" && this.categories.length > 0) {
			await this.LoadStoreBooksByCategories()
		} else if (this.type == "series") {
			await this.LoadStoreBooksBySeries()
		}
	}

	async ngOnChanges(changes: SimpleChanges) {
		if (
			changes.categories == null ||
			changes.categories.currentValue.length == 0
		) {
			return
		}

		this.SetHeader()
		await this.LoadStoreBooksByCategories()
	}

	SetHeader() {
		if (this.type == "latest") {
			this.header = this.locale.recentlyPublished
		} else if (this.type == "categories") {
			this.header =
				this.categories.length == 1
					? this.locale.moreBooksInCategory
					: this.locale.moreBooksInCategories
		}
	}

	async LoadLatestStoreBooks() {
		// Get the latest store books
		let response = await this.apiService.listStoreBooks(
			`
				items {
					uuid
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				languages: await this.dataService.GetStoreLanguages(),
				limit: maxVisibleStoreBooks
			}
		)
		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		this.ShowBooks(responseData.items)
	}

	async LoadStoreBooksByCategories() {
		// Get the store books with the given categories
		let categories = this.categories.filter(c => c != null)
		if (categories.length == 0) return

		let response = await this.apiService.listStoreBooks(
			`
				items {
					uuid
					title
					cover {
						url
						blurhash
					}
				}
			`,
			{
				categories,
				languages: await this.dataService.GetStoreLanguages()
			}
		)

		let responseData = response.data.listStoreBooks
		if (responseData == null) return

		let books = []

		for (let book of responseData.items) {
			if (book.uuid != this.currentBookUuid) {
				books.push(book)
			}
		}

		this.ShowBooks(books)
	}

	async LoadStoreBooksBySeries() {
		if (this.series.length == 0) return

		// Get the series
		let response = await this.apiService.retrieveStoreBookSeries(
			`
				name
				storeBooks {
					items {
						uuid
						title
						cover {
							url
							blurhash
						}
					}
				}
			`,
			{
				uuid: this.series,
				languages: await this.dataService.GetStoreLanguages()
			}
		)
		let responseData = response.data.retrieveStoreBookSeries
		if (responseData == null) return

		this.header = this.locale.moreOfSeries.replace("{0}", responseData.name)

		this.ShowBooks(responseData.storeBooks.items)
	}

	ShowBooks(books: StoreBookResource[]) {
		this.books = []

		for (let storeBook of books) {
			if (storeBook.cover == null) continue

			let height = 209
			let width = AdaptCoverWidthHeightToAspectRatio(
				135,
				height,
				storeBook.cover.aspectRatio
			)

			let bookItem: BookListItem = {
				uuid: storeBook.uuid,
				title: storeBook.title,
				coverContent: null,
				coverBlurhash: storeBook.cover.blurhash,
				coverWidth: width,
				coverHeight: height
			}

			this.apiService
				.downloadFile(storeBook.cover.url)
				.then((fileResponse: ApiResponse<string>) => {
					if (isSuccessStatusCode(fileResponse.status)) {
						bookItem.coverContent = (
							fileResponse as ApiResponse<string>
						).data
					}
				})

			this.books.push(bookItem)
		}

		this.loading = false
	}
}
