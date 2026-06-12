import axios from 'axios';
import { checkIfTokenExpired } from '../helpers';
import { isAuthenticated } from './Auth';

export const getAvailableBusesOfOwner = () =>{
    // checkIfTokenExpired(isAuthenticated().token);
    return axios.get('/bus/owner-bus-available');
} 
export const getAllAvailableBuses = () => axios.get('/bus/all-bus-available');

export const getUnavailableBusesOfOwner = () => axios.get('/bus/owner-bus-unavailable');
export const getAllUnavailableBuses = () => axios.get('/bus/all-bus-unavailable');

export const addNewBus = body => axios.post('/bus', body);

export const getBusBySlug = slug => axios.get('/bus/' + slug);

export const removeBus = slug => axios.delete('/bus/' + slug);

export const removeAllBuses = () => axios.delete('/bus');

export const updateBus = (slug, body) => axios.put('/bus/' + slug, body);

export const resetBusSeats = slug => axios.post('/bus/' + slug + '/reset-seats');


// axios.post('/bus', body, { onUploadProgress: progressEvent => console.log(progressEvent.loaded) });
