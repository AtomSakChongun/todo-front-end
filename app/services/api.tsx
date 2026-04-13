import axios from "axios";
const api = axios.create({

    baseURL:"https://67ad-2001-fb1-8f-cf9d-b120-f232-dd56-6461.ngrok-free.app", 
    headers:{
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
    }
})
export default api