import * as websocket from '../websocket';
import * as axios from 'axios';

export const sockets = {
	setStoreBookFile
}

export async function setStoreBookFile(message: {
	jwt: string,
	uuid: string,
	type: string,
	file: string
}){
	var result: {status: number, headers: any, data: any} = {status: -1, headers: {}, data: {}};

	try{
		var response = await axios.default({
			method: 'put',
			url: `${process.env.POCKETLIB_API_URL}/store/book/${message.uuid}/file`,
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

	websocket.emit(setStoreBookFile.name, result);
}