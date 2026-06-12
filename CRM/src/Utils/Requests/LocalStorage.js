export const getItemFromLocalStorage = key => {
	return localStorage.getItem(key);
};

export const setItemToLocalStorage = (key, value) => {
	localStorage.setItem(key, value);
};

export const removeItemFromLocalStorage = key => {
	localStorage.removeItem(key);
};