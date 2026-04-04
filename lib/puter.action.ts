import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";
import {PUTER_WORKER_URL} from "./constants";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch {
        return null;
    }
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if(!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return null;
    }
    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ?
        await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source', }) : null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: 'rendered', }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage)
        ? item.sourceImage
        : ''
    );

    if(!resolvedSource) {
        console.warn('Failed to host source image, skipping save.')
        return null;
    }

    const resolvedRender = hostedRender?.url
        ? hostedRender?.url
        : item.renderedImage && isHostedUrl(item.renderedImage)
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: 'POST',
            body: JSON.stringify({
                project: payload,
                visibility
            })
        });

        if(!response.ok) {
            console.error('failed to save the project', await response.text());
            return null;
        }

        const data = (await response.json()) as { project?: DesignItem | null }

        return data?.project ?? null;
    } catch (e) {
        console.log('Failed to save project', e)
        return null;
    }
}

const PROJECT_KV_PREFIX = 'roomify_project_';

export const getProjects = async (): Promise<DesignItem[]> => {
    try {
        const entries = await puter.kv.list(PROJECT_KV_PREFIX, true) as { key: string; value: DesignItem }[];
        if (!Array.isArray(entries)) return [];
        return entries
            .map(({ value }) => value)
            .filter(Boolean)
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    try {
        const key = `${PROJECT_KV_PREFIX}${id}`;
        const project = await puter.kv.get(key);
        return (project as DesignItem) ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};

export const getCommunityProjects = async (): Promise<DesignItem[]> => {
    if (!PUTER_WORKER_URL) return [];
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/community/projects`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        if (!response.ok) {
            console.error('Community projects fetch failed:', response.status, await response.text());
            return [];
        }
        const data = await response.json() as { projects?: DesignItem[] };
        return data?.projects ?? [];
    } catch (e) {
        console.error('Failed to get community projects', e);
        return [];
    }
};

export const getCommunityProjectById = async ({ id }: { id: string }): Promise<DesignItem | null> => {
    if (!PUTER_WORKER_URL) return null;
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/community/project`, {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        if (!response.ok) return null;
        const data = await response.json() as { project?: DesignItem };
        return data?.project ?? null;
    } catch (e) {
        console.error('Failed to get community project by id', e);
        return null;
    }
};

export const shareProjectToCommunity = async ({ project, ownerName }: { project: DesignItem; ownerName: string }): Promise<boolean> => {
    if (!PUTER_WORKER_URL) return false;
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/community/share`, {
            method: 'POST',
            body: JSON.stringify({ project, ownerName })
        });
        return response.ok;
    } catch (e) {
        console.error('Failed to share project to community', e);
        return false;
    }
};

export const unshareProjectFromCommunity = async ({ id }: { id: string }): Promise<boolean> => {
    if (!PUTER_WORKER_URL) return false;
    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/community/unshare`, {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        return response.ok;
    } catch (e) {
        console.error('Failed to unshare project from community', e);
        return false;
    }
};

export const deleteProject = async ({ id }: { id: string }): Promise<boolean> => {
    try {
        if (PUTER_WORKER_URL) {
            const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/delete?id=${id}`, {
                method: 'DELETE'
            });
            return response.ok;
        }
        // Fallback: delete directly from user's KV if no worker
        await puter.kv.del(`${PROJECT_KV_PREFIX}${id}`);
        return true;
    } catch (e) {
        console.error('Failed to delete project', e);
        return false;
    }
};