import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data-service';
import { EpubBook } from 'src/app/models/EpubBook';

const toolbarHeight = 40;				// The height of the toolbar on the top of the page
const secondPageMinWidth = 1050;		// Show two pages on the window if the window width is greater than this

@Component({
	selector: 'pocketlib-book-content',
	templateUrl: './book-content.component.html',
	styleUrls: [
      './book-content.component.scss'
   ]
})
export class BookContentComponent{
	book = new EpubBook();
	chapters: BookChapter[] = [];

	viewerLeft: HTMLIFrameElement;
	viewerRight: HTMLIFrameElement;
	bottomCurtainLeft: HTMLDivElement;
	bottomCurtainRight: HTMLDivElement;
	width: number = 500;
	height: number = 500;			// The height of the entire page
	contentHeight: number = 500;	// The height of the iframe (height - toolbarHeight - 7 - paddingTop)
   paddingX: number = 0;
	paddingTop: number = 60;
	paddingBottom: number = 60;
	bottomCurtainLeftHeight: number = 0;
	bottomCurtainRightHeight: number = 0;
	viewerLeftWidth: number = 500;
	viewerRightWidth: number = 500;

	currentChapter: number = 0;
	currentPage: number = 0;

	//#region Variables for finding the chapter page positions
	pageHeight: number = 500;
	pagePositions: number[] = [];
	//#endregion

	//#region Variables for ShowPage
	renderedChapter: number = 0;		// The currently rendered chapter, for determining if the chapter html should be rendered
	//#endregion

	constructor(
		private dataService: DataService,
		private router: Router
	){
		this.dataService.navbarVisible = false;
	}

	async ngOnInit(){
		this.viewerLeft = document.getElementById("viewer-left") as HTMLIFrameElement;
		this.viewerRight = document.getElementById("viewer-right") as HTMLIFrameElement;
		this.bottomCurtainLeft = document.getElementById("bottom-curtain-left") as HTMLDivElement;
		this.bottomCurtainRight = document.getElementById("bottom-curtain-right") as HTMLDivElement;
		this.setSize();

		if(this.dataService.currentBook){
			// Load the ebook
			await this.book.ReadEpubFile(this.dataService.currentBook.file);

			// Create a chapter for each chapter of the book
			this.chapters = [];
			for(let i = 0; i < this.book.chapters.length; i++){
				this.chapters.push(new BookChapter());
			}
			
			await this.ShowPage();
		}
	}

	@HostListener('window:resize')
	onResize(){
		this.setSize();
	}

	async setSize(){
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.contentHeight = this.height - toolbarHeight - this.paddingTop;
		this.pageHeight = this.contentHeight - this.paddingBottom;
		this.paddingX = Math.round(this.width * 0.1);
      
      if(this.width > secondPageMinWidth){
         // Show both pages
			this.viewerLeftWidth = this.width / 2;
			this.viewerRightWidth = this.width / 2;
      }else{
         // Hide the second page
			this.viewerLeftWidth = this.width;
			this.viewerRightWidth = 0;
      }

		await this.ShowPage();
	}

	async PrevPage(){
		let lastPage = false;

		if((this.width > secondPageMinWidth && this.currentPage <= 1)
			|| (this.width <= secondPageMinWidth && this.currentPage <= 0)){
			// Show the previous chapter
			if(this.currentChapter <= 0) return;
			this.currentChapter--;
			lastPage = true;
			let chapter = this.chapters[this.currentChapter];
			
			if(this.width > secondPageMinWidth && chapter.pagePositions.length >= 2){
				this.currentPage = chapter.pagePositions.length - 2;
			}else{
				this.currentPage = chapter.pagePositions.length - 1;
			}
		}else if(this.width > secondPageMinWidth){
			// Go to the second previous page
			this.currentPage -= 2;
		}else{
			// Show the previous page
			this.currentPage--;
		}

		await this.ShowPage(lastPage);
	}

	async NextPage(){
		// Return if this is the last chapter
		if(this.currentChapter >= this.chapters.length - 1) return;

		let chapter = this.chapters[this.currentChapter];

		if((this.width > secondPageMinWidth && this.currentPage >= chapter.pagePositions.length - 2)
			|| (this.width <= secondPageMinWidth && this.currentPage >= chapter.pagePositions.length - 1)){
			// Show the next chapter
			this.currentChapter++;
			this.currentPage = 0;
		}else if(this.width > secondPageMinWidth){
			// Go to the second next page
			this.currentPage += 2;
		}else{
			// Show the next page
			this.currentPage++;
		}

		await this.ShowPage();
	}

	async ShowPage(lastPage: boolean = false){
		let chapter = this.chapters[this.currentChapter];
		if(!chapter) return;

		if(chapter.windowWidth != window.innerWidth || chapter.windowHeight != window.innerHeight){
			let chapterHtml: HTMLHtmlElement;
			if(chapter.IsInitialized()){
				chapterHtml = chapter.GetHtml();
			}else{
				chapterHtml = await this.book.chapters[this.currentChapter].GetChapterHtml();
			}

			let chapterBody = chapterHtml.getElementsByTagName("body")[0] as HTMLBodyElement;
			chapterBody.setAttribute("style", `padding: 0px ${this.paddingX}px; margin-bottom: 3000px`);
			
			await chapter.Init(chapterHtml, window.innerWidth, window.innerHeight);

			let viewerLeftLoadPromise: Promise<any> = new Promise((resolve) => {
            this.viewerLeft.onload = resolve;
			});

			this.viewerLeft.srcdoc = chapter.GetHtml().outerHTML;
			await viewerLeftLoadPromise;
			
			this.CreateCurrentChapterPages();
			for(let position of this.pagePositions){
				chapter.pagePositions.push(position);
			}

			if(this.width > secondPageMinWidth && this.currentPage < chapter.pagePositions.length - 1){
				// Render the chapter on the second page
				let viewerRightLoadPromise: Promise<any> = new Promise((resolve) => {
					this.viewerRight.onload = resolve;
				});

				this.viewerRight.srcdoc = chapter.GetHtml().outerHTML;
				await viewerRightLoadPromise;
			}else if(this.width > secondPageMinWidth){
				// Clear the second page
				this.viewerRight.srcdoc = "";
			}

			this.renderedChapter = this.currentChapter;
		}else if(this.renderedChapter != this.currentChapter){
			// Render the chapter
			let viewerLeftLoadPromise: Promise<any> = new Promise((resolve) => {
				this.viewerLeft.onload = resolve;
			});

			this.viewerLeft.srcdoc = chapter.GetHtml().outerHTML;
			await viewerLeftLoadPromise;

			if(this.width > secondPageMinWidth && this.currentPage < chapter.pagePositions.length - 1){
				let viewerRightLoadPromise: Promise<any> = new Promise((resolve) => {
					this.viewerRight.onload = resolve;
				});

				this.viewerRight.srcdoc = chapter.GetHtml().outerHTML;
				await viewerRightLoadPromise;
			}else if(this.width > secondPageMinWidth){
				// Clear the second page
				this.viewerRight.srcdoc = "";
			}

			this.renderedChapter = this.currentChapter;
		}

		if(lastPage && this.width > secondPageMinWidth){
			// If the chapter pages length is odd, show the last page on the left page
			if(chapter.pagePositions.length % 2 == 0){
				this.currentPage = chapter.pagePositions.length - 2;
			}else{
				this.currentPage = chapter.pagePositions.length - 1;
			}
		}else if(lastPage && this.width <= secondPageMinWidth){
			this.currentPage = chapter.pagePositions.length - 1;
		}

		// Load the current page
		this.viewerLeft.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage]);
		if(this.width > secondPageMinWidth && chapter.pagePositions[this.currentPage + 1]){
			this.viewerRight.contentWindow.scrollTo(0, chapter.pagePositions[this.currentPage + 1]);
		}

		// Correct currentPage to the last page if it is too high
		if(this.currentPage > chapter.pagePositions.length - 1){
			this.currentPage = chapter.pagePositions.length - 1;
		}

		// Update the height of the curtains
		// height of curtain = height - difference between the position of the next page and the position of the current page
		let newBottomCurtainLeftHeight = this.contentHeight - (chapter.pagePositions[this.currentPage + 1] - chapter.pagePositions[this.currentPage]);
		this.bottomCurtainLeftHeight = newBottomCurtainLeftHeight < 0 ? 0 : newBottomCurtainLeftHeight;

		if(this.width > secondPageMinWidth){

			if(this.currentPage == chapter.pagePositions.length - 1){
				// The last page is shown on the left page
				// Hide the right page
				this.bottomCurtainRightHeight = this.contentHeight;
			}else if(this.currentPage == chapter.pagePositions.length - 2){
				// Ths last page is shown on the right page
				// Show the entire right page
				this.bottomCurtainRightHeight = 0;
			}else{
				let newBottomCurtainRightHeight = this.contentHeight - (chapter.pagePositions[this.currentPage + 2] - chapter.pagePositions[this.currentPage + 1]);
				this.bottomCurtainRightHeight = newBottomCurtainRightHeight < 0 ? 0 : newBottomCurtainRightHeight;
			}
		}
	}

	CreateCurrentChapterPages(){
		Utils.positions = [];
		Utils.FindPositions(this.viewerLeft.contentDocument.getElementsByTagName("body")[0] as HTMLBodyElement);
		this.pagePositions = Utils.FindOptimalPagePositions(Utils.positions, this.pageHeight);
	}

	GoBack(){
		this.router.navigate(["/"])
	}
}

class Utils{
	static positions: number[] = [];

	// Go through each element and save the position
	static FindPositions(currentElement: Element){
		if(currentElement.children.length > 0){
			// Call GetPagePositions for each child
			for(let i = 0; i < currentElement.children.length; i++){
				let child = currentElement.children.item(i);
				this.FindPositions(child);

				let childPosition = child.getBoundingClientRect();
				let yPos = childPosition.height + childPosition.top;

				if(this.positions.length == 0 || (this.positions.length > 0 && this.positions[this.positions.length - 1] != yPos)){
					this.positions.push(yPos);
				}
			}
		}
	}

	// Finds the nearest values below the page heights
	static FindOptimalPagePositions(positions: number[], pageHeight: number) : number[]{
		if(positions.length == 0) return;
		let pagePositions: number[] = [];

		for(let i = 0; i < positions.length; i++){
			let lastPosition = pagePositions.length > 0 ? pagePositions[pagePositions.length - 1] : 0;
			if(positions[i + 1] && positions[i + 1] > lastPosition + pageHeight){
				// Add the current position to the page positions
				pagePositions.push(positions[i]);
			}
		}

		return pagePositions;
	}
}

export class BookChapter{
	private html: HTMLHtmlElement;				// The html of the entire chapter
	private initialized: boolean = false;		// If true, the html was added, the elements were count and the pageTemplateHtml was created
	public pagePositions: number[] = [0];		// The positions for showing the pages
	public windowWidth: number = 0;				// The window width at the time of initializing this chapter
	public windowHeight: number = 0;				// The window height at the time of initializing this chapter

	Init(html: HTMLHtmlElement, windowWidth: number, windowHeight: number){
      this.html = html;
		this.initialized = true;
		this.pagePositions = [0];
		this.windowWidth = windowWidth;
		this.windowHeight = windowHeight;
	}

	IsInitialized() : boolean{
		return this.initialized;
	}

	GetHtml() : HTMLHtmlElement{
		return this.html.cloneNode(true) as HTMLHtmlElement;
	}
}