export const keys = {
    jobs: 'jobfinder.customJobs.v1',
    favorites: 'jobfinder.favorites.v1',
    theme: 'jobfinder.theme.v1',
    searches: 'jobfinder.searches.v1',
    cache: 'jobfinder.apiCache.v1'
};

export function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}
