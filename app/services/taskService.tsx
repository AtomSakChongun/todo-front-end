import { apiTokens } from "./api"

export const task = async () => {
  try {
    const res = await apiTokens.get("/tasks/user");
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
export const taskById = async (id: string) => {
  try {
    const res = await apiTokens.get("/tasks/" + id);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
export const createTask = async (payload: any) => {
  try {
    const res = await apiTokens.post("/tasks/create", payload);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
export const updateTask = async (payload: any, id: string) => {
  try {
    const res = await apiTokens.patch("/tasks/update/" + id, payload);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const deleteTask = async (id: string) => {
  try {
    const res = await apiTokens.delete("/tasks/delete/" + id);
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};