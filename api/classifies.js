import axios from "./apiConfig"

const classifiesApi = {
    getAllByUserId: () => axios.get("/api/classifies"),
    addClassify: (data) => axios.post("/api/classifies", data),
    updateClassify: (data, id) => axios.put(`/api/classifies/${id}`, data),
    deleteClassify: (id) => axios.delete(`/api/classifies/${id}`),
};

export default classifiesApi;
