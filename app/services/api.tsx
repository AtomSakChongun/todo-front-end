import axios from "axios";
const api = axios.create({

    baseURL:"https://b317-2001-fb1-8f-cf9d-4ca8-aa9f-d97-2072.ngrok-free.app", 
    headers:{
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    }
})
export default api