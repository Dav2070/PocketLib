import { NgModule } from "@angular/core"
import { Routes, RouterModule } from "@angular/router"
import { LibraryPageComponent } from "./pages/library-page/library-page.component"
import { BookPageComponent } from "./pages/book-page/book-page.component"
import { SettingsPageComponent } from "./pages/settings-page/settings-page.component"
import { SearchPageComponent } from "./pages/search-page/search-page.component"
import { UserPageComponent } from "./pages/user-page/user-page.component"
import { PublisherPageComponent } from "./pages/publisher-page/publisher-page.component"
import { AuthorPageComponent } from "./pages/author-page/author-page.component"
import { AuthorCollectionPageComponent } from "./pages/author-collection-page/author-collection-page.component"
import { AuthorSeriesPageComponent } from "./pages/author-series-page/author-series-page.component"
import { NewSeriesPageComponent } from "./pages/new-series-page/new-series-page.component"
import { AuthorBookDashboardPageComponent } from "./pages/author-book-dashboard-page/author-book-dashboard-page.component"
import { AuthorBookPageComponent } from "./pages/author-book-page/author-book-page.component"
import { NewBookPageComponent } from "./pages/new-book-page/new-book-page.component"
import { AuthorReleasesPageComponent } from "./pages/author-releases-page/author-releases-page.component"
import { LoadingPageComponent } from "./pages/loading-page/loading-page.component"
import { StoreStartPageComponent } from "./pages/store-start-page/store-start-page.component"
import { StoreCategoriesPageComponent } from "./pages/store-categories-page/store-categories-page.component"
import { StorePublisherPageComponent } from "./pages/store-publisher-page/store-publisher-page.component"
import { StoreAuthorPageComponent } from "./pages/store-author-page/store-author-page.component"
import { StoreBookPageComponent } from "./pages/store-book-page/store-book-page.component"
import { StoreBooksPageComponent } from "./pages/store-books-page/store-books-page.component"
import { StoreSeriesPageComponent } from "./pages/store-series-page/store-series-page.component"
import { OrderConfirmationPageComponent } from "./pages/order-confirmation-page/order-confirmation-page.component"

const routes: Routes = [
	{ path: "", component: LibraryPageComponent },
	{ path: "book", component: BookPageComponent },
	{ path: "user", component: UserPageComponent },
	{ path: "settings", component: SettingsPageComponent },
	{ path: "search", component: SearchPageComponent },
	{ path: "publisher/:uuid", component: PublisherPageComponent },
	{ path: "author", component: AuthorPageComponent },
	{ path: "author/:uuid", component: AuthorPageComponent },
	{
		path: "author/collection/:collection_uuid",
		component: AuthorCollectionPageComponent
	},
	{
		path: "author/:author_uuid/collection/:collection_uuid",
		component: AuthorCollectionPageComponent
	},
	{ path: "author/series/new", component: NewSeriesPageComponent },
	{
		path: "author/:author_uuid/series/new",
		component: NewSeriesPageComponent
	},
	{ path: "author/series/:series_uuid", component: AuthorSeriesPageComponent },
	{
		path: "author/:author_uuid/series/:series_uuid",
		component: AuthorSeriesPageComponent
	},
	{ path: "author/book/new", component: NewBookPageComponent },
	{ path: "author/:uuid/book/new", component: NewBookPageComponent },
	{
		path: "author/book/:book_uuid",
		component: AuthorBookDashboardPageComponent
	},
	{
		path: "author/:author_uuid/book/:book_uuid",
		component: AuthorBookDashboardPageComponent
	},
	{
		path: "author/book/:book_uuid/details",
		component: AuthorBookPageComponent
	},
	{
		path: "author/:author_uuid/book/:book_uuid/details",
		component: AuthorBookPageComponent
	},
	{
		path: "author/book/:book_uuid/releases",
		component: AuthorReleasesPageComponent
	},
	{
		path: "author/:author_uuid/book/:book_uuid/releases",
		component: AuthorReleasesPageComponent
	},
	{
		path: "author/:author_uuid/book/:book_uuid/releases/:release_uuid",
		component: AuthorBookPageComponent
	},
	{ path: "loading", component: LoadingPageComponent },
	{ path: "store", component: StoreStartPageComponent },
	{ path: "store/categories", component: StoreCategoriesPageComponent },
	{ path: "store/publisher/:slug", component: StorePublisherPageComponent },
	{ path: "store/author/:slug", component: StoreAuthorPageComponent },
	{ path: "store/book/:slug", component: StoreBookPageComponent },
	{ path: "store/category/:key", component: StoreBooksPageComponent },
	{ path: "store/series/:slug", component: StoreSeriesPageComponent },
	{
		path: "store/book/:slug/confirmation",
		component: OrderConfirmationPageComponent
	}
]

@NgModule({
	imports: [RouterModule.forRoot(routes, {})],
	exports: [RouterModule]
})
export class AppRoutingModule {}
