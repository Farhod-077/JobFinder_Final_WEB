import { getCachedJobs } from './api.js';

export const state = {
    remoteJobs: getCachedJobs()?.jobs || [],
    refreshJobs: () => {},
    refreshPage: () => {}
};
