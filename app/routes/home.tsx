import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import {ArrowRight, ArrowUpRight, Clock, Layers, X} from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {createProject, getCommunityProjects, getProjects} from "../../lib/puter.action";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<DesignItem[]>([]);
    const [communityProjects, setCommunityProjects] = useState<DesignItem[]>([]);
    const [showDemo, setShowDemo] = useState(false);
    const isCreatingProjectRef = useRef(false);

    const PAGE_SIZE = 9;
    const [myPage, setMyPage] = useState(1);
    const [communityPage, setCommunityPage] = useState(1);

    const myTotalPages = Math.ceil(projects.length / PAGE_SIZE);
    const communityTotalPages = Math.ceil(communityProjects.length / PAGE_SIZE);

    const myPagedProjects = projects.slice((myPage - 1) * PAGE_SIZE, myPage * PAGE_SIZE);
    const communityPagedProjects = communityProjects.slice((communityPage - 1) * PAGE_SIZE, communityPage * PAGE_SIZE);

    const handleUploadComplete = async (base64Image: string) => {
        try {

            if(isCreatingProjectRef.current) return false;
            isCreatingProjectRef.current = true;
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const newItem = {
                id: newId, name, sourceImage: base64Image,
                renderedImage: undefined,
                timestamp: Date.now()
            }

            const saved = await createProject({ item: newItem, visibility: 'private' });

            if(!saved) {
                console.error("Failed to create project");
                return false;
            }

            setProjects((prev) => [saved, ...prev]);

            navigate(`/visualizer/${newId}`, {
                state: {
                    initialImage: saved.sourceImage,
                    initialRendered: saved.renderedImage || null,
                    name
                }
            });

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const [items, community] = await Promise.all([
                getProjects(),
                getCommunityProjects(),
            ]);
            setProjects(items);
            setCommunityProjects(community);
        };

        fetchProjects();
    }, []);

  return (
      <div className="home">
          <Navbar />

          <section className="hero">
              <div className="announce">
                  <div className="dot">
                      <div className="pulse"></div>
                  </div>

                  <p>Introducing Roomify 2.0</p>
              </div>

              <h1>Build beautiful spaces at the speed of thought with Roomify</h1>

              <p className="subtitle">
                  Roomify is an AI-first design environment that helps you visualize, render, and ship architectural projects faster  than ever.
              </p>

              <div className="actions">
                  <a href="#upload" className="cta">
                      Start Building <ArrowRight className="icon" />
                  </a>

                  <Button variant="outline" size="lg" className="demo" onClick={() => setShowDemo(true)}>
                      Watch Demo
                  </Button>
              </div>

              <div id="upload" className="upload-shell">
                <div className="grid-overlay" />

                  <div className="upload-card">
                      <div className="upload-head">
                          <div className="upload-icon">
                              <Layers className="icon" />
                          </div>

                          <h3>Upload your floor plan</h3>
                          <p>Supports JPG, PNG, formats up to 10MB</p>
                      </div>

                      <Upload onComplete={handleUploadComplete} />
                  </div>
              </div>
          </section>

          <section className="projects">
              <div className="section-inner">
                  <div className="section-head">
                      <div className="copy">
                          <h2>Projects</h2>
                          <p>Your latest work and shared community projects, all in one place.</p>
                      </div>
                  </div>

                  {/* My Projects — shared ones get a "Shared" badge */}
                  {projects.length > 0 ? (
                      <>
                          <h2 className="projects-sub-heading">My Projects</h2>
                          <div className="projects-grid">
                              {myPagedProjects.map(({id, name, renderedImage, sourceImage, timestamp, isPublic}) => (
                                  <div key={id} className="project-card group" onClick={() => navigate(`/visualizer/${id}`)}>
                                      <div className="preview">
                                          <img src={renderedImage || sourceImage} alt="Project" />
                                          <div className={`badge ${isPublic ? 'shared' : 'private'}`}>
                                              <span>{isPublic ? 'Shared' : 'Private'}</span>
                                          </div>
                                      </div>
                                      <div className="card-body">
                                          <div>
                                              <h3>{name}</h3>
                                              <div className="meta">
                                                  <Clock size={12} />
                                                  <span>{new Date(timestamp).toLocaleDateString()}</span>
                                                  <span>By You</span>
                                              </div>
                                          </div>
                                          <div className="arrow"><ArrowUpRight size={18} /></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          {myTotalPages > 1 && (
                              <div className="pagination">
                                  <button className="page-btn" onClick={() => setMyPage(p => Math.max(1, p - 1))} disabled={myPage === 1}>
                                      &larr; Prev
                                  </button>
                                  <span className="page-info">Page {myPage} of {myTotalPages}</span>
                                  <button className="page-btn" onClick={() => setMyPage(p => Math.min(myTotalPages, p + 1))} disabled={myPage === myTotalPages}>
                                      Next &rarr;
                                  </button>
                              </div>
                          )}
                      </>
                  ) : (
                      <p className="no-projects">No projects yet. Upload a floor plan to get started.</p>
                  )}

                  {/* Community — shared projects */}
                  {communityProjects.length > 0 && (
                      <>
                          <h2 className="projects-sub-heading">Community</h2>
                          <div className="projects-grid">
                              {communityPagedProjects.map(({id, name, renderedImage, sourceImage, timestamp, sharedBy}) => (
                                  <div key={`community-${id}`} className="project-card group" onClick={() => navigate(`/visualizer/${id}`, { state: { initialImage: sourceImage, initialRendered: renderedImage, name } })}>
                                      <div className="preview">
                                          <img src={renderedImage || sourceImage} alt="Project" />
                                          <div className="badge shared">
                                              <span>Community</span>
                                          </div>
                                      </div>
                                      <div className="card-body">
                                          <div>
                                              <h3>{name}</h3>
                                              <div className="meta">
                                                  <Clock size={12} />
                                                  <span>{new Date(timestamp).toLocaleDateString()}</span>
                                                  <span>By {sharedBy || 'Community'}</span>
                                              </div>
                                          </div>
                                          <div className="arrow"><ArrowUpRight size={18} /></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                          {communityTotalPages > 1 && (
                              <div className="pagination">
                                  <button className="page-btn" onClick={() => setCommunityPage(p => Math.max(1, p - 1))} disabled={communityPage === 1}>
                                      &larr; Prev
                                  </button>
                                  <span className="page-info">Page {communityPage} of {communityTotalPages}</span>
                                  <button className="page-btn" onClick={() => setCommunityPage(p => Math.min(communityTotalPages, p + 1))} disabled={communityPage === communityTotalPages}>
                                      Next &rarr;
                                  </button>
                              </div>
                          )}
                      </>
                  )}
              </div>
          </section>

      {showDemo && (
          <div className="demo-modal" onClick={() => setShowDemo(false)}>
              <div className="demo-modal-panel" onClick={e => e.stopPropagation()}>
                  <button className="demo-modal-close" onClick={() => setShowDemo(false)} aria-label="Close">
                      <X size={20} />
                  </button>
                  <video
                      src="/demo.mp4"
                      controls
                      autoPlay
                      className="demo-video"
                  />
              </div>
          </div>
      )}
      </div>
  )
}