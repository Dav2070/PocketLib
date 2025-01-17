import {
	Component,
	Input,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"
import { isClient } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-publish-changes-dialog",
	templateUrl: "./publish-changes-dialog.component.html",
	standalone: false
})
export class PublishChangesDialogComponent {
	locale = this.localizationService.locale.dialogs.publishChangesDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Input() loading: boolean = false
	@Input() releaseNameError: string = ""
	@Input() releaseNotesError: string = ""
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false
	releaseName: string = ""
	releaseNotes: string = ""

	constructor(private localizationService: LocalizationService) {}

	ngAfterViewInit() {
		if (isClient()) {
			document.body.appendChild(this.dialog.nativeElement)
		}
	}

	ngOnDestroy() {
		if (isClient()) {
			document.body.removeChild(this.dialog.nativeElement)
		}
	}

	show() {
		this.releaseName = ""
		this.releaseNotes = ""
		this.visible = true
	}

	hide() {
		this.visible = false
	}

	clearErrors() {
		this.releaseNameError = ""
		this.releaseNotesError = ""
	}

	submit() {
		this.primaryButtonClick.emit({
			releaseName: this.releaseName,
			releaseNotes: this.releaseNotes
		})

		this.releaseName = ""
		this.releaseNotes = ""
	}
}
