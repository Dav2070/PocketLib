export const environment = {
   production: true,
   apiKey: "gHgHKRbIjdguCM4cv5481hdiF5hZGWZ4x12Ur-7v",
   baseUrl: "https://pocketlib.dav-apps.tech",
   version: "0.4",
   appId: 6,
   bookTableId: 14,
   bookFileTableId: 15,
   appTableId: 16,
   epubBookmarkTableId: 17,
   settingsTableId: 18,
   // Shared keys for book table
   bookTableFileUuidKey: "file_uuid",
	// Keys for EpubBook
	epubBookTableChapterKey: "chapter",
   epubBookTableProgressKey: "progress",
   epubBookTableBookmarksKey: "bookmarks",
	// Keys for PdfBook
	pdfBookTableTitleKey: "title",
   pdfBookTablePageKey: "page",
   pdfBookTableBookmarksKey: "bookmarks",
   pdfBookTableZoomKey: "zoom",
   // Keys for App table
   appTableNameKey: "name",
   appTableUrlKey: "url",
   // Keys for EpubBookmark table
   epubBookmarkTableBookKey: "book",
	epubBookmarkTableNameKey: "name",
	epubBookmarkTableChapterKey: "chapter",
   epubBookmarkTableProgressKey: "progress",
   // Keys for Settings table
   settingsTableCurrentBookKey: "current_book",
   // Settings keys
   settingsThemeKey: "settings-theme",
   // Settings default
   settingsThemeDefault: "system",
   // Other keys
   themeKey: "theme",
   lightThemeKey: "light",
	darkThemeKey: "dark",
	systemThemeKey: "system"
};
