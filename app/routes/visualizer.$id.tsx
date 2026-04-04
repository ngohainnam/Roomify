import Button from "components/ui/Button";
import { generate3DView } from "lib/ai.action";
import { createProject, getProjectById } from "lib/puter.action";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router";

const VisualizerId = () => {
  const { id } = useParams();
  const { userId } = useOutletContext<AuthContext>();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation state passed from home page on fresh upload
  const locationState = location.state as {
    initialImage?: string;
    initialRendered?: string | null;
    name?: string;
  } | null;

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  // Seed with navigation state immediately so image shows before worker fetch
  const [currentImage, setCurrentImage] = useState<string | null>(
    locationState?.initialRendered ?? locationState?.initialImage ?? null
  );

  const handleBack = () => navigate("/");

  const handleExport = () => {
    if (!currentImage) return;

    const filename = `${project?.name ?? `residence-${id}`}.png`
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (currentImage.startsWith("data:")) {
      // data URL — create link directly
      const a = document.createElement("a");
      a.href = currentImage;
      a.download = filename;
      a.click();
    } else {
      // remote URL — fetch as blob to force download instead of navigation
      fetch(currentImage)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch((e) => console.error("Export failed:", e));
    }
  };

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;

    try {
      setIsProcessing(true);
      const result = await generate3DView({ sourceImage: item.sourceImage });
      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);

        //upload the project with the rendered image
        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        }

        const saved = await createProject({ item: updatedItem, visibility: "private" });

        if (saved) {
          setProject(saved);
          setCurrentImage(saved.renderedImage || result.renderedImage);
        }
      }
    } catch (e) {
      console.error("Failed to generate 3D view:", e);
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

      // If worker doesn't have it yet, build a local stub from navigation state
      if (!fetchedProject && locationState?.initialImage) {
        fetchedProject = {
          id: id!,
          name: locationState.name ?? `Residence ${id}`,
          sourceImage: locationState.initialImage,
          renderedImage: locationState.initialRendered ?? undefined,
          timestamp: Date.now(),
        } as DesignItem;
      }

      if (!isMounted) return;

      setProject(fetchedProject);
      if (fetchedProject?.renderedImage) {
        setCurrentImage(fetchedProject.renderedImage);
      } else if (!currentImage && fetchedProject?.sourceImage) {
        setCurrentImage(null); // let generation useEffect handle it
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
    <div className ="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />
          <span className= "name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack}
        className="exit">
          <X className="icon" /> Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className ="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Projects</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by you</p>
            </div>

            <div className="panel-actions">
              <Button 
              size="sm"
              onClick={handleExport}
              className= "export"
              disabled={!currentImage}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>

              <Button 
              size="sm"
              onClick={() =>{}}
              className= "share">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className={`render-area ${isProcessing ? 'processing' : ''}`}>
            {currentImage? (
              <img src={currentImage} alt="AI Render" className="rendered-img" />
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img src={project.sourceImage} alt="Original" className="render-fallback" />
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className ="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className ="title"> Rendering...</span>
                  <span className ="subtitle"> Please wait while we generate your 3D view.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className= "panel-compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Original vs AI Render</h3>
              <div className="hint">Drag to compare</div>
            </div>
          </div>

          <div className ="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider 
              defaultValue={50}
              style ={{ width: '100%', height: 'auto' }}
              itemOne= {<ReactCompareSliderImage src={project.sourceImage} alt="Before" className="compare-img" />}
              itemTwo= {<ReactCompareSliderImage src={currentImage ?? project?.renderedImage ?? undefined} alt="After" className="compare-img" />}
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