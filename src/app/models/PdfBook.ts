import { environment } from 'src/environments/environment';
import { Book, Property } from './Book';

const pdfExt = "pdf";

export class PdfBook extends Book{
	public title: string;
   public page: number;
   public bookmarks: number[];

	constructor(
		file: Blob,
		title: string = "",
      page: number = 1,
      bookmarks: number[] = []
	){
		super(file);
		this.title = title;
      this.page = page;
      this.bookmarks = bookmarks;
	}

	public static async Create(file: Blob, title: string) : Promise<string>{
		let book = new PdfBook(file, title);
		await book.Save();
		return book.uuid;
	}

	public async SetPage(page: number){
		this.page = page;
		await this.Save();
	}

	public async AddBookmark(page: number){
		// Check if the bookmark already exists
		if(!this.bookmarks.includes(page)){
			// Add the page to the bookmarks array
			this.bookmarks.push(page);
		}

		// Sort the bookmarks array
		this.bookmarks.sort((a: number, b: number) => {
			if(a > b) return 1;
			else if(a < b) return -1;
			else return 0;
		});

		// Save the updated bookmarks array
		await this.Save();
   }

	public async RemoveBookmark(page: number){
		// Find the page in the bookmarks array
		let i = this.bookmarks.findIndex(p => p == page);

		if(i != -1){
			this.bookmarks.splice(i, 1);
			await this.Save();
		}
   }
   
   public async RemoveBookmarks(...pages: number[]){
		// Find the pages in the bookmarks array
		let bookmarkRemoved: boolean = false;
		for(let page of pages){
			let i = this.bookmarks.findIndex(p => p == page);

			if(i != -1){
				this.bookmarks.splice(i, 1);
				bookmarkRemoved = true;
			}
		}

		if(bookmarkRemoved) await this.Save();
   }

	protected async Save(){
		let properties: Property[] = [
			{ name: environment.pdfBookTableTitleKey, value: this.title },
			{ name: environment.pdfBookTablePageKey, value: this.page.toString() },
			{ name: environment.pdfBookTableBookmarksKey, value: this.bookmarks.join(',') }
      ]

		await super.Save(pdfExt, properties);
	}
}