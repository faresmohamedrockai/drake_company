import axiosInterceptor from "../../axiosInterceptor/axiosInterceptor";
import { Project } from "../components/inventory/ProjectsTab";
import { Contract, Developer, Lead, Log, Meeting, Property, User, Zone } from "../types";

export const getDevelopers = async () => {
    const response = await axiosInterceptor.get('/developers');

    return response.data.developers as Developer[];
}

export const getZones = async () => {
    console.log("getZones");
    const response = await axiosInterceptor.get('/zones');
    console.log("response", response);
    return response.data.zones as Zone[];
}

export const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');
    return response.data.leads as Lead[];
}

export const getUsers = async () => {
    const response = await axiosInterceptor.get('/auth/users');
    return response.data as User[];
}

export const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    console.log("responseaasdads", response.data.properties);
    return response.data.properties as Property[];
}

export const getMeetings = async () => {
    const response = await axiosInterceptor.get('/meetings');
    return response.data.meetings as Meeting[];
}

export const getContracts = async () => {
    const response = await axiosInterceptor.get('/contracts');
    return response.data.data as Contract[];
}

export const addContract = async (contract: Contract) => {
    const response = await axiosInterceptor.post('/contracts', contract);
    return response.data.data as Contract[];
}

export const updateContract = async (editId: string, contract: Contract) => {
    const response = await axiosInterceptor.patch(`/contracts/${contract.id}`, contract);
    return response.data.data as Contract[];
}

export const deleteContract = async (id: string) => {
    const response = await axiosInterceptor.delete(`/contracts/${id}`);
    return response.data;
}

export const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.projects as Project[];
}

export const getLogs = async () => {
    const response = await axiosInterceptor.get('/logs');
    return response.data as Log[];
}
