import {
	Component,
	HostListener,
	ViewChild,
	ElementRef,
	ChangeDetectorRef
} from "@angular/core"
import { Router } from "@angular/router"
import { ReadFile } from "ngx-file-helpers"
import {
	faAddressCard as faAddressCardLight,
	faArrowLeft as faArrowLeftLight,
	faArrowRight as faArrowRightLight,
	faBagShopping as faBagShoppingLight,
	faCircleUser as faCircleUserLight,
	faFile as faFileLight,
	faFileExport as faFileExportLight,
	faPen as faPenLight,
	faTrash as faTrashLight
} from "@fortawesome/pro-light-svg-icons"
import { Dav } from "dav-js"
import { BottomSheet, ContextMenu, Textfield } from "dav-ui-components"
import { DataService } from "src/app/services/data-service"
import { Book } from "src/app/models/Book"
import { EpubBook } from "src/app/models/EpubBook"
import { PdfBook } from "src/app/models/PdfBook"
import { UpdateBookOrder } from "src/app/models/BookOrder"
import { environment } from "src/environments/environment"
import { GetDualScreenSettings } from "src/app/misc/utils"
import { enUS } from "src/locales/locales"

const pdfType = "application/pdf"

@Component({
	templateUrl: "./library-page.component.html",
	styleUrls: ["./library-page.component.scss"]
})
export class LibraryPageComponent {
	locale = enUS.libraryPage
	faAddressCardLight = faAddressCardLight
	faArrowLeftLight = faArrowLeftLight
	faArrowRightLight = faArrowRightLight
	faBagShoppingLight = faBagShoppingLight
	faCircleUserLight = faCircleUserLight
	faFileLight = faFileLight
	faFileExportLight = faFileExportLight
	faPenLight = faPenLight
	faTrashLight = faTrashLight
	@ViewChild("leftContentContainer")
	leftContentContainer: ElementRef<HTMLDivElement>
	@ViewChild("rightContentContainer")
	rightContentContainer: ElementRef<HTMLDivElement>
	@ViewChild("bottomSheet")
	bottomSheet: ElementRef<BottomSheet>
	@ViewChild("searchTextfield")
	searchTextfield: ElementRef<Textfield>
	@ViewChild("contextMenu")
	contextMenu: ElementRef<ContextMenu>
	contextMenuVisible: boolean = false
	contextMenuPositionX: number = 0
	contextMenuPositionY: number = 0
	height: number = 0
	smallBookList: boolean = false
	smallBookListWidth: number = 200
	largeBookCoverWidth: number = 300
	smallBookCoverWidth: number = 150
	selectedBook: Book
	dualScreenLayout: boolean = false
	dualScreenFoldMargin: number = 0
	showRenameBookOption: boolean = false // If the option in the context menu to rename the book is visible. Only for PdfBook
	showExportBookOption: boolean = false // If the option in the context menu to export the book is visible
	renameBookDialogVisible: boolean = false
	renameBookDialogTitle: string = ""
	renameBookDialogError: string = ""
	removeBookDialogVisible: boolean = false
	loginToAccessBookDialogVisible: boolean = false
	addBookErrorDialogVisible: boolean = false
	loadingScreenVisible: boolean = true
	allBooksVisible: boolean = false
	allBooks: Book[] = []

	constructor(
		public dataService: DataService,
		private router: Router,
		private cd: ChangeDetectorRef
	) {
		this.locale = this.dataService.GetLocale().libraryPage
		this.dataService.navbarVisible = true
		this.dataService.bookPageVisible = false

		// Check if this is a dual-screen device with a vertical fold
		let dualScreenSettings = GetDualScreenSettings()
		this.dualScreenLayout = dualScreenSettings.dualScreenLayout
		this.dualScreenFoldMargin = dualScreenSettings.dualScreenFoldMargin
	}

	async ngOnInit() {
		await this.dataService.allBooksInitialLoadPromiseHolder.AwaitResult()
		this.loadingScreenVisible = false

		this.setSize()
	}

	ngAfterViewInit() {
		this.setSize()
		this.cd.detectChanges()
	}

	@HostListener("window:resize")
	setSize() {
		this.height = window.innerHeight
		this.smallBookList = window.innerWidth < 650

		if (this.smallBookList) {
			this.smallBookCoverWidth = this.largeBookCoverWidth / 2 - 9
		} else {
			this.smallBookCoverWidth = this.largeBookCoverWidth / 2 - 6
		}

		if (this.smallBookList) {
			this.smallBookListWidth = this.largeBookCoverWidth + 18
		} else if (this.dataService.books.length > 3) {
			this.smallBookListWidth = (this.largeBookCoverWidth / 2 + 16) * 2
		} else if (this.dataService.books.length == 1) {
			this.smallBookListWidth = 0
		} else {
			this.smallBookListWidth = this.largeBookCoverWidth / 2 + 16
		}
	}

	@HostListener("document:click", ["$event"])
	documentClick(event: MouseEvent) {
		if (!this.contextMenu.nativeElement.contains(event.target as Node)) {
			this.contextMenuVisible = false
		}
	}

	NavigateToStorePage() {
		this.router.navigate(["store"])
	}

	NavigateToAuthorPage() {
		this.router.navigate(["author"])
	}

	async AddBookFilePick(file: ReadFile) {
		this.loadingScreenVisible = true
		let uuid: string = ""

		// Create a new book
		if (file.type == pdfType) {
			uuid = await PdfBook.Create(
				file.underlyingFile,
				file.name.slice(0, file.name.lastIndexOf("."))
			)
		} else {
			uuid = await EpubBook.Create(file.underlyingFile)
		}

		if (uuid == null) {
			// Show error dialog
			this.loadingScreenVisible = false
			this.addBookErrorDialogVisible = true
			return
		}

		await this.dataService.LoadAllBooks()

		// Get the created book and show it
		let book = this.dataService.books.find(b => b.uuid == uuid)
		if (book != null) this.ShowBook(book)
	}

	async ShowBook(book: Book) {
		// Check if the user can access the book
		if (book.storeBook && !this.dataService.dav.isLoggedIn) {
			this.loginToAccessBookDialogVisible = true
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

		// Move the selected book to the top of the books list
		this.dataService.MoveBookToFirstPosition(book.uuid)

		// Update the order of the books
		await UpdateBookOrder(this.dataService.bookOrder, this.dataService.books)
	}

	async ShowAllBooks() {
		this.LoadAllBooksList()

		this.allBooksVisible = true
		let scrollTop = document.documentElement.scrollTop

		this.rightContentContainer.nativeElement.style.display = "block"
		this.rightContentContainer.nativeElement.style.height = `${window.innerHeight}px`
		document.body.style.overflow = "hidden"

		// Move the right content container to the Y position of the scroll position
		await this.rightContentContainer.nativeElement.animate(
			[
				{
					transform: `translate(${window.innerWidth}px, ${
						scrollTop - 76
					}px)`
				}
			],
			{
				fill: "forwards"
			}
		).finished

		// Animate the transition to the right content container
		let leftContentContainerTransitionAnimation =
			this.leftContentContainer.nativeElement.animate(
				[
					{
						transform: `translateX(${-window.innerWidth}px)`
					}
				],
				{
					duration: 300,
					easing: "ease-in-out",
					fill: "forwards"
				}
			)

		let rightContentContainerTransitionAnimation =
			this.rightContentContainer.nativeElement.animate(
				[
					{
						transform: `translate(0, ${scrollTop - 76}px)`
					}
				],
				{
					duration: 300,
					easing: "ease-in-out",
					fill: "forwards"
				}
			)

		await Promise.all([
			leftContentContainerTransitionAnimation.finished,
			rightContentContainerTransitionAnimation.finished
		])

		this.leftContentContainer.nativeElement.style.display = "none"
	}

	async HideAllBooks() {
		this.allBooksVisible = false
		let scrollTop = document.documentElement.scrollTop

		this.leftContentContainer.nativeElement.style.display = "flex"

		// Move the right content container back to the original position
		let rightContentContainerTransitionAnimation =
			this.rightContentContainer.nativeElement.animate(
				[
					{
						transform: `translate(${window.innerWidth}px, ${
							scrollTop - 76
						}px)`
					}
				],
				{
					duration: 300,
					easing: "ease-in-out",
					fill: "forwards"
				}
			)

		let leftContentContainerTransitionAnimation =
			this.leftContentContainer.nativeElement.animate(
				[
					{
						transform: `translateX(0)`
					}
				],
				{
					duration: 300,
					easing: "ease-in-out",
					fill: "forwards"
				}
			)

		await Promise.all([
			rightContentContainerTransitionAnimation.finished,
			leftContentContainerTransitionAnimation.finished
		])

		document.body.style.overflow = null
		this.rightContentContainer.nativeElement.style.display = "none"
	}

	LoadAllBooksList() {
		this.searchTextfield.nativeElement.value = ""

		// Copy the books
		this.allBooks = []

		for (let book of this.dataService.books) {
			this.allBooks.push(book)
		}

		// Sort the books by name
		this.SortAllBooksByName()
	}

	SortAllBooksByName() {
		this.allBooks.sort((a: EpubBook | PdfBook, b: EpubBook | PdfBook) => {
			let firstTitle = a.title.toLowerCase()
			let secondTitle = b.title.toLowerCase()

			if (firstTitle > secondTitle) {
				return 1
			} else if (firstTitle < secondTitle) {
				return -1
			} else {
				return 0
			}
		})
	}

	async BookContextMenu(event: MouseEvent, book: Book) {
		event.preventDefault()

		this.selectedBook = book
		this.showRenameBookOption = book instanceof PdfBook && !book.storeBook
		this.showExportBookOption = book.belongsToUser || book.purchase != null

		// Set the position of the context menu
		this.contextMenuPositionX = event.pageX
		this.contextMenuPositionY = event.pageY
		this.contextMenuVisible = true
	}

	async DownloadBook() {
		this.contextMenuVisible = false

		let link = document.createElement("a")
		link.download = (this.selectedBook as PdfBook | EpubBook).title
		link.href = URL.createObjectURL(this.selectedBook.file)
		link.click()
	}

	GoToLoginPage() {
		Dav.ShowLoginPage(environment.apiKey, window.location.origin)
	}

	discoverMoreCardClick(event: Event) {
		event.preventDefault()
		window.scrollTo(0, 0)
		this.router.navigate(["store"])
	}

	ShowRenameBookDialog() {
		this.contextMenuVisible = false
		this.renameBookDialogTitle = (this.selectedBook as PdfBook).title
		this.renameBookDialogError = ""
		this.renameBookDialogVisible = true
	}

	ShowRemoveBookDialog() {
		this.contextMenuVisible = false
		this.removeBookDialogVisible = true
	}

	async RenameBook() {
		this.renameBookDialogError = ""

		if (this.renameBookDialogTitle.length == 0) {
			this.renameBookDialogError =
				this.locale.renameBookDialog.errors.titleMissing
		} else if (this.renameBookDialogTitle.length < 2) {
			this.renameBookDialogError =
				this.locale.renameBookDialog.errors.titleTooShort
		} else if (this.renameBookDialogTitle.length > 50) {
			this.renameBookDialogError =
				this.locale.renameBookDialog.errors.titleTooLong
		} else {
			await (this.selectedBook as PdfBook).SetTitle(
				this.renameBookDialogTitle
			)
			this.renameBookDialogVisible = false
		}
	}

	async RemoveBook() {
		this.removeBookDialogVisible = false
		await this.selectedBook.Delete()

		// Remove the selected book from the lists
		let i = this.dataService.books.findIndex(
			b => b.uuid == this.selectedBook.uuid
		)
		if (i != -1) this.dataService.books.splice(i, 1)

		i = this.allBooks.findIndex(b => b.uuid == this.selectedBook.uuid)
		if (i != -1) this.allBooks.splice(i, 1)

		// Update the order of the books
		await UpdateBookOrder(this.dataService.bookOrder, this.dataService.books)
	}

	SearchTextChange(value: string) {
		if (value.length == 0) {
			// Show all books
			this.LoadAllBooksList()
		} else {
			this.allBooks = []

			// Find all books, which include the search value in the title
			for (let book of this.dataService.books) {
				if (
					(book as EpubBook | PdfBook).title
						.toLowerCase()
						.includes(value.toLowerCase().trim())
				) {
					this.allBooks.push(book)
				}
			}

			// Sort the books by name
			this.SortAllBooksByName()
		}
	}
}
