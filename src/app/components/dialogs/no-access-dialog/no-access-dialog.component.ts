import {
	Component,
	Output,
	EventEmitter,
	ElementRef,
	ViewChild
} from "@angular/core"
import { Dialog } from "dav-ui-components"
import { LocalizationService } from "src/app/services/localization-service"
import { isClient } from "src/app/misc/utils"

@Component({
	selector: "pocketlib-no-access-dialog",
	templateUrl: "./no-access-dialog.component.html",
	standalone: false
})
export class NoAccessDialogComponent {
	locale = this.localizationService.locale.dialogs.noAccessDialog
	@ViewChild("dialog") dialog: ElementRef<Dialog>
	@Output() primaryButtonClick = new EventEmitter()
	visible: boolean = false

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
		this.visible = true
	}

	hide() {
		this.visible = false
	}
}
