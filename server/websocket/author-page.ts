import * as websocket from '../websocket';
import * as axios from 'axios';

export const setProfileImageOfAuthorOfUserKey = "setProfileImageOfAuthorOfUser";
export const getProfileImageOfAuthorOfUserKey = "getProfileImageOfAuthorOfUser";
export const setBioOfAuthorOfUserKey = "setBioOfAuthorOfUser";

export async function setProfileImageOfAuthorOfUser(message: {
	jwt: string,
	type: string,
	file: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/author/profile_image`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': message.type
			},
			data: message.file
		});

		result.status = response.status;
		result.headers = response.headers;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.headers = error.response.headers;
			result.data = error.response.data;
		}
	}

	websocket.emit(setProfileImageOfAuthorOfUserKey, result);
}

export async function getProfileImageOfAuthorOfUser(message: {jwt: string}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'get',
			url: `${process.env.POCKETLIB_API_URL}/author/profile_image`,
			headers: {
				Authorization: message.jwt
			}
		});

		result.status = response.status;
		result.headers = response.headers;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.headers = error.response.headers;
			result.data = error.response.data;
		}
	}

	websocket.emit(getProfileImageOfAuthorOfUserKey, result);
}

export async function setBioOfAuthorOfUser(message: {
	jwt: string,
	language: string,
	bio: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/author/bio/${message.language}`,
			headers: {
				Authorization: message.jwt,
				'Content-Type': 'application/json'
			},
			data: {
				bio: message.bio
			}
		});

		result.status = response.status;
		result.headers = response.headers;
		result.data = response.data;
	}catch(error){
		if(error.response){
			// Api error
			result.status = error.response.status;
			result.headers = error.response.headers;
			result.data = error.response.data;
		}
	}

	websocket.emit(setBioOfAuthorOfUserKey, result);
}