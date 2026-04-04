import { useNavigate, useOutletContext, useParams, useLocation} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, Globe, RefreshCcw, Share2, Trash2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, deleteProject, getCommunityProjectById, getProjectById, shareProjectToCommunity, unshareProjectFromCommunity} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userName, userId } = useOutletContext<AuthContext>()
    const navState = location.state as { initialImage?: string; initialRendered?: string | null; name?: string } | null;

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [isOwner, setIsOwner] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [deleteConfirming, setDeleteConfirming] = useState(false);

    const handleBack = () => navigate('/');

    const handleExport = async () => {
        if (!currentImage) return;

        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `roomify-${id || 'design'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        } catch {
            // Fallback: direct link (may not trigger save dialog on all browsers)
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = `roomify-${id || 'design'}.png`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleShare = async () => {
        if (!project || isSharing) return;

        try {
            setIsSharing(true);
            const newIsPublic = !isPublic;

            if (newIsPublic) {
                // Move project from user's private KV → public community KV (with metadata)
                const ok = await shareProjectToCommunity({ project, ownerName: userName || 'Unknown' });
                if (!ok) throw new Error('Failed to share project');
            } else {
                // Move project back from community KV → user's private KV
                const ok = await unshareProjectFromCommunity({ id: project.id });
                if (!ok) throw new Error('Failed to unshare project');
            }

            const updatedItem: DesignItem = { ...project, isPublic: newIsPublic };
            setProject(updatedItem);
            setIsPublic(newIsPublic);
            setShareStatus('success');
            setTimeout(() => setShareStatus('idle'), 2500);
        } catch (error) {
            console.error('Share failed:', error);
            setShareStatus('error');
            setTimeout(() => setShareStatus('idle'), 2500);
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirming) {
            setDeleteConfirming(true);
            setTimeout(() => setDeleteConfirming(false), 3000);
            return;
        }
        if (!id) return;
        try {
            await deleteProject({ id });
            navigate('/');
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const runGeneration = async (item: DesignItem) => {
        if(!id || !item.sourceImage) return;

        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: item.sourceImage });

            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({ item: updatedItem, visibility: "private" })

                if(saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error)
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            let fetchedProject = await getProjectById({ id });
            let fromCommunity = false;

            if (!fetchedProject) {
                // Not in user's private KV — may have been shared (moved to community KV)
                fetchedProject = await getCommunityProjectById({ id });
                fromCommunity = !!fetchedProject;
            }

            if (!isMounted) return;

            if (fetchedProject) {
                setProject(fetchedProject);
                setCurrentImage(fetchedProject.renderedImage || null);
                setIsPublic(fetchedProject.isPublic ?? false);
                const owner = !fromCommunity || (!!userId && fetchedProject.ownerId === userId);
                setIsOwner(owner);
            } else if (navState?.initialImage) {
                // Fallback: community view — project not in user's own KV
                setProject({
                    id: id!,
                    name: navState.name || `Residence ${id}`,
                    sourceImage: navState.initialImage,
                    renderedImage: navState.initialRendered || undefined,
                    timestamp: Date.now(),
                    isPublic: true,
                } as DesignItem);
                setCurrentImage(navState.initialRendered || null);
                setIsPublic(true);
                setIsOwner(false);
            }

            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />

                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by {userName}</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            {isOwner && (
                                <Button
                                    size="sm"
                                    onClick={handleShare}
                                    className={`share ${isPublic ? 'shared' : ''}`}
                                    disabled={isSharing || !project}
                                >
                                    {isPublic
                                        ? <><Globe className="w-4 h-4 mr-2" /> Unshare</>
                                        : <><Share2 className="w-4 h-4 mr-2" /> Share</>
                                    }
                                </Button>
                            )}
                            {shareStatus === 'success' && (
                                <span className="share-status success">
                                    {isPublic ? '✓ Shared to community' : '✓ Removed from community'}
                                </span>
                            )}
                            {shareStatus === 'error' && (
                                <span className="share-status error">✗ Share failed</span>
                            )}
                            {isOwner && !isPublic && (
                                <Button
                                    size="sm"
                                    onClick={handleDelete}
                                    className={`delete ${deleteConfirming ? 'confirming' : ''}`}
                                    disabled={isSharing || !project}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {deleteConfirming ? 'Confirm Delete' : 'Delete'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing': ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {project?.sourceImage && currentImage ? (
                            <ReactCompareSlider
                                defaultValue={50}
                                style={{ width: '100%', height: 'auto' }}
                                itemOne={
                                    <ReactCompareSliderImage src={project?.sourceImage} alt="before" className="compare-img" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={currentImage || project?.renderedImage || ''} alt="after" className="compare-img" />
                                }
                            />
                        ) : (
                            <div className="compare-fallback">
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt="Before" className="compare-img" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

        </div>
    )
}
export default VisualizerId