const PROJECT_PREFIX = 'roomify_project_';
const COMMUNITY_PREFIX = 'roomify_community_';

const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({  error: message, ...extra }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, puter-auth',
        }
    })
}

const jsonOk = (data) => {
    return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, puter-auth',
        }
    })
}

// Handle CORS preflight for all routes
router.options('/*path', () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, puter-auth',
        }
    })
})

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    } catch {
        return null;
    }
}

router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter;

        if(!userPuter) return jsonError(401, 'Authentication failed');

        const body = await request.json();
        const project = body?.project;

        if(!project?.id || !project?.sourceImage) return jsonError(400, 'Project ID and source image are required');

        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, 'Authentication failed');

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload }
    } catch (e) {
        return jsonError(500, 'Failed to save project', { message: e.message || 'Unknown error' });
    }
})

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({value}) => ({ ...value, isPublic: true }))

        return { projects };
    } catch (e) {
        return jsonError(500, 'Failed to list projects', { message: e.message || 'Unknown error' });
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, 'Project ID is required');

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, 'Project not found');

        return { project };
    } catch (e) {
        return jsonError(500, 'Failed to get project', { message: e.message || 'Unknown error' });
    }
})

// Share a project to the community registry (stored in deployer's KV, shared across all users)
router.post('/api/community/share', async ({ request, user }) => {
    try {
        if (!user?.puter) return jsonError(401, 'Authentication required');

        const body = await request.json();
        const { project, ownerName } = body;

        if (!project?.id) return jsonError(400, 'Project ID required');

        const entry = {
            id: project.id,
            name: project.name,
            sourceImage: project.sourceImage,
            renderedImage: project.renderedImage,
            timestamp: project.timestamp ?? Date.now(),
            ownerId: project.ownerId,
            sharedBy: ownerName || 'Unknown',
            sharedAt: Date.now(),
            isPublic: true,
        };

        // Write individual entry
        await me.puter.kv.set(`${COMMUNITY_PREFIX}${project.id}`, entry);

        // Maintain a manifest of all community IDs for listing (avoids kv.list)
        const manifest = (await me.puter.kv.get('roomify_community_manifest')) || [];
        if (!manifest.includes(project.id)) {
            manifest.push(project.id);
            await me.puter.kv.set('roomify_community_manifest', manifest);
        }

        // Remove from user's private KV — the project now lives in the public namespace
        try {
            await user.puter.kv.del(`${PROJECT_PREFIX}${project.id}`);
        } catch (e) {
            console.warn('Failed to remove project from private KV after sharing', e);
        }

        return jsonOk({ shared: true, id: project.id });
    } catch (e) {
        return jsonError(500, 'Failed to share project', { message: e.message || 'Unknown error' });
    }
})

// Remove a project from the community registry
router.post('/api/community/unshare', async ({ request, user }) => {
    try {
        if (!user?.puter) return jsonError(401, 'Authentication required');

        const body = await request.json();
        const { id } = body;

        if (!id) return jsonError(400, 'Project ID required');

        // Read the community entry first so we can restore it to the owner's private KV
        const communityEntry = await me.puter.kv.get(`${COMMUNITY_PREFIX}${id}`);

        await me.puter.kv.del(`${COMMUNITY_PREFIX}${id}`);

        const manifest = (await me.puter.kv.get('roomify_community_manifest')) || [];
        const updated = manifest.filter(mid => mid !== id);
        await me.puter.kv.set('roomify_community_manifest', updated);

        // Restore project to user's private KV, clearing public metadata
        if (communityEntry) {
            await user.puter.kv.set(`${PROJECT_PREFIX}${id}`, {
                ...communityEntry,
                isPublic: false,
                sharedBy: null,
                sharedAt: null,
            });
        }

        return jsonOk({ unshared: true, id });
    } catch (e) {
        return jsonError(500, 'Failed to unshare project', { message: e.message || 'Unknown error' });
    }
})

// Get a single community project by ID
router.post('/api/community/project', async ({ request }) => {
    try {
        const body = await request.json();
        const id = body?.id;
        if (!id) return jsonError(400, 'Project ID required');

        const project = await me.puter.kv.get(`${COMMUNITY_PREFIX}${id}`);
        if (!project) return jsonError(404, 'Community project not found');

        return jsonOk({ project });
    } catch (e) {
        return jsonError(500, 'Failed to get community project', { message: e.message || 'Unknown error' });
    }
})

// Get all community projects
router.post('/api/community/projects', async () => {
    try {
        const manifest = (await me.puter.kv.get('roomify_community_manifest')) || [];
        if (manifest.length === 0) return jsonOk({ projects: [] });

        const entries = await Promise.all(
            manifest.map(id => me.puter.kv.get(`${COMMUNITY_PREFIX}${id}`))
        );

        const projects = entries
            .filter(Boolean)
            .sort((a, b) => (b.sharedAt ?? b.timestamp ?? 0) - (a.sharedAt ?? a.timestamp ?? 0));

        return jsonOk({ projects });
    } catch (e) {
        return jsonError(500, 'Failed to get community projects', { message: e.message || 'Unknown error' });
    }
})

// Delete a project (removes from user's KV and community registry)
router.delete('/api/projects/delete', async ({ request, user }) => {
    try {
        if (!user?.puter) return jsonError(401, 'Authentication required');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, 'Project ID required');

        await user.puter.kv.del(`${PROJECT_PREFIX}${id}`);

        // Also clean up community registry if the project was shared
        try { await me.puter.kv.del(`${COMMUNITY_PREFIX}${id}`); } catch {}

        // Remove from manifest
        try {
            const manifest = (await me.puter.kv.get('roomify_community_manifest')) || [];
            const updated = manifest.filter(mid => mid !== id);
            await me.puter.kv.set('roomify_community_manifest', updated);
        } catch {}

        return jsonOk({ deleted: true, id });
    } catch (e) {
        return jsonError(500, 'Failed to delete project', { message: e.message || 'Unknown error' });
    }
})