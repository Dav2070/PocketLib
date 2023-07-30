import { Injectable } from "@angular/core"
import axios from "axios"
import {
	Dav,
	ApiResponse,
	ApiErrorResponse,
	HandleApiError,
	PrepareRequestParams
} from "dav-js"
import { environment } from "src/environments/environment"
import { StoreBookCoverField, StoreBookFileField } from "src/app/misc/types"
import {
	ResponseDataToStoreBookCoverResource,
	ResponseDataToStoreBookFileResource
} from "src/app/misc/utils"

@Injectable()
export class ApiService {
	//#region StoreBookCover
	async UploadStoreBookCover(params: {
		uuid: string
		type: string
		file: any
		fields?: StoreBookCoverField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/cover`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookCoverResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadStoreBookCover(params)
		}
	}
	//#endregion

	//#region StoreBookFile
	async UploadStoreBookFile(params: {
		uuid: string
		type: string
		name: string
		file: any
		fields?: StoreBookFileField[]
	}): Promise<ApiResponse<any> | ApiErrorResponse> {
		try {
			let response = await axios({
				method: "put",
				url: `${environment.pocketlibApiBaseUrl}/store_books/${params.uuid}/file`,
				headers: PrepareRequestParams({
					Authorization: Dav.accessToken,
					"Content-Type": params.type,
					"Content-Disposition": `attachment; filename="${encodeURIComponent(
						params.name
					)}"`
				}),
				params: PrepareRequestParams(
					{
						fields: params.fields
					},
					true
				),
				data: params.file
			})

			return {
				status: response.status,
				data: ResponseDataToStoreBookFileResource(response.data)
			}
		} catch (error) {
			let renewSessionError = await HandleApiError(error)
			if (renewSessionError != null) return renewSessionError

			return await this.UploadStoreBookFile(params)
		}
	}
	//#endregion
}
