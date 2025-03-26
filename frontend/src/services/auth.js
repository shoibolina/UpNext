const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const login = (token, username) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
};

const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

const getUsername = () => {
    return localStorage.getItem(USER_KEY);
};

const isAuthenticated = () => {
    return !getToken();
};

export default {
    login,
    logout,
    getToken,
    getUsername,
    isAuthenticated
};