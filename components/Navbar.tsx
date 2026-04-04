import { Box, Settings } from "lucide-react"
import Button from "./ui/Button";
import { useNavigate, useOutletContext } from "react-router";

const Navbar = () => {
    const { isSignedIn, userName, signIn, signOut } = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const handleAuthClick = async () => {
        if (isSignedIn) {
            try{
                await signOut();
            } catch (e) {
                console.error("Puter sign out failed:", `${e}`);
            }
            return;
        } 

        try {
            await signIn();
        } catch (e) {
            console.error("Puter sign in failed:", `${e}`);
        }
    };

  return (
    <header className="navbar">
        <nav className="inner">
            <div className="left">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">
                        Roomify
                    </span>
                </div>

                <ul className="links">
                    <a>
                        <button className="nav-settings" onClick={() => navigate('/settings')}>
                            Settings
                        </button>
                    </a>
                </ul>
            </div>

            <div className="actions">
                {isSignedIn ? (
                    <>
                        <span className="greeting">
                            {userName ? `Hi, ${userName}` : "Signed in!"}
                        </span>

                        <Button size="sm" onClick={handleAuthClick} className="btn">
                            Log out
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={handleAuthClick} size="sm" variant="ghost">
                            Log in
                        </Button>
                        <a href="#upload" className="cta">Get Started</a>
                    </>
                )}



            </div>
        </nav>
    </header>
  )
}

export default Navbar