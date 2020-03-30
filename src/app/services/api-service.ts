import { Injectable } from "@angular/core";
import * as axios from 'axios';
import { ApiResponse } from 'dav-npm';
import { environment } from 'src/environments/environment';

@Injectable()
export class ApiService{
	//#region Author functions
	async CreateAuthor(
		jwt: string,
		firstName: string,
		lastName: string
	) : Promise<ApiResponse<any>>{
		var result: ApiResponse<any> = {status: -1, data: {}};

		try{
			let data = {};
			if(firstName) data["first_name"]	= firstName;
			if(lastName) data["last_name"] = lastName;

			var response = await axios.default({
				method: 'post',
				url: `${environment.pocketlibApiBaseUrl}/author`,
				headers: {
					Authorization: jwt,
					'Content-Type': 'application/json'
				},
				data
			});
	
			result.status = response.status;
			result.data = response.data;
		}catch(error){
			if(error.response){
				// Api error
				result.status = error.response.status;
				result.data = error.response.data;
			}else{
				// Javascript error
				result.status = -1;
				result.data = {};
			}
		}

		return result;
	}
	//#endregion
}