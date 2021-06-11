import { Component, Input, Output, EventEmitter } from '@angular/core'
import { DataService } from 'src/app/services/data-service'
import { BookListItem } from 'src/app/misc/types'

@Component({
	selector: 'pocketlib-store-books-page-book-card',
	templateUrl: './store-books-page-book-card.component.html'
})
export class StoreBooksPageBookCardComponent {
	@Input() book: BookListItem
	@Output() click = new EventEmitter()
	hovered: boolean = false
	alt: string = ""

	constructor(
		public dataService: DataService
	) { }

	ngOnInit() {
		this.alt = this.dataService.GetLocale().misc.bookCoverAlt.replace('{0}', this.book.title)
	}

	Click() {
		this.click.emit()
	}
}