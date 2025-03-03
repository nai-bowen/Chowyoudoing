import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faStar, faPencilAlt, faMapMarkerAlt, faCog, faSignOutAlt, faCaretUp, faSearch } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavButtonProps {
  icon: IconDefinition;
  label: string;
  index: number;
  onMouseEnter: (index: number) => void;
  href?: string;
}

export default function Navbar(): JSX.Element {
  const [navOpen, setNavOpen] = useState<boolean>(true);
  const [footerOpen, setFooterOpen] = useState<boolean>(false);
  const [highlightPosition, setHighlightPosition] = useState<number>(-70); // Start position of hover effect

  const handleHover = (index: number): void => {
    setHighlightPosition(index * 54 + 16); // Moves the highlight effect
  };

  // Set a class on the specified container when nav collapses
  useEffect(() => {
    // Find the closest container with class 'with-navbar'
    const navbarContainer = document.querySelector('.with-navbar');
    if (navbarContainer) {
      navbarContainer.classList.toggle('nav-collapsed', !navOpen);
    }
    
    // Also toggle the collapsed class on the navbar itself
    const navbar = document.getElementById('nav-bar');
    if (navbar) {
      navbar.classList.toggle('collapsed', !navOpen);
    }
  }, [navOpen]);

  const router = useRouter();

  const NavButton = ({ icon, label, index, onMouseEnter, href }: NavButtonProps): JSX.Element => {
    const handleClick = (): void => {
      if (href) {
        router.push(href);
      }
    };

    return (
      <div 
        className="nav-button" 
        onMouseEnter={() => onMouseEnter(index)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <FontAwesomeIcon icon={icon} />
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div 
      id="nav-bar" 
      className={`${navOpen ? "expanded" : "collapsed"} ${footerOpen ? "footer-expanded" : "footer-collapsed"}`}
    >
      {/* Sidebar Toggle */}
      <input
        id="nav-toggle"
        type="checkbox"
        checked={!navOpen}
        onChange={() => setNavOpen(!navOpen)}
        aria-label="Toggle navigation"
      />
      
      {/* Navbar Header */}
      <div id="nav-header">
        <Link id="nav-title" href="/" rel="noopener noreferrer">
          Chow You Doing?
        </Link>
        <label htmlFor="nav-toggle">
          <span id="nav-toggle-burger" onClick={() => setNavOpen(!navOpen)}></span>
        </label>
        <hr />
      </div>

      {/* Navigation Menu */}
      <div id="nav-content" className={navOpen ? "expanded" : "collapsed"}>
        <NavButton icon={faHome} label="Dashboard" index={0} onMouseEnter={handleHover} href="/patron-dashboard" />
        <NavButton icon={faSearch} label="Search" index={1} onMouseEnter={handleHover} href="/patron-search" />
        <NavButton icon={faPencilAlt} label="My Reviews" index={2} onMouseEnter={handleHover} href="/review" />
        <hr />
        <NavButton icon={faMapMarkerAlt} label="Explore" index={3} onMouseEnter={handleHover} href="/explore" />
        <NavButton icon={faCog} label="Settings" index={4} onMouseEnter={handleHover} href="/settings" />
        <NavButton icon={faSignOutAlt} label="Logout" index={5} onMouseEnter={handleHover} />
        
        <div 
          id="nav-content-highlight" 
          style={{ top: `${highlightPosition}px` }} 
        ></div>
      </div>

      {/* Footer Toggle */}
      <input
        id="nav-footer-toggle"
        type="checkbox"
        checked={footerOpen}
        onChange={() => setFooterOpen(!footerOpen)}
        aria-label="Toggle footer"
      />
      
      {/* Footer */}
      <div id="nav-footer" className={footerOpen ? "expanded" : "collapsed"}>
        <div id="nav-footer-heading">
          <div id="nav-footer-avatar">
            <img 
              src="/avatar-placeholder.jpg" 
              alt="User Avatar" 
            />
          </div>
          <div id="nav-footer-titlebox" className={footerOpen ? "expanded" : "collapsed"}>
            <a id="nav-footer-title" href="/profile" rel="noopener noreferrer">John Doe</a>
            <span id="nav-footer-subtitle">Foodie</span>
          </div>
          <label htmlFor="nav-footer-toggle">
            <FontAwesomeIcon icon={faCaretUp} onClick={() => setFooterOpen(!footerOpen)} />
          </label>
        </div>
        <div id="nav-footer-content" className={footerOpen ? "expanded" : "collapsed"}>
          <p>Active since January 2024. Reviewed 15 restaurants.</p>
        </div>
      </div>
    </div>
  );
}