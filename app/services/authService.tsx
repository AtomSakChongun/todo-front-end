import api from "./api"

export const register = async (payload: any) => {
  try {
    const res = await api.post("/users/register", payload);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const login = async (payload: any) => {
  try {
    const res = await api.post("/users/login", payload);
    const token = res.data?.token ?? res.data?.access_token;
    if (token) localStorage.setItem("token", token);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};