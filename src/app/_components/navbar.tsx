import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faStar, faPencilAlt, faMapMarkerAlt, faCog, faSignOutAlt, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Link from "next/link";

interface NavButtonProps {
  icon: IconDefinition;
  label: string;
  index: number;
  onMouseEnter: (index: number) => void;
}

export default function Navbar() {
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const [footerOpen, setFooterOpen] = useState<boolean>(false);
  const [highlightPosition, setHighlightPosition] = useState<number>(-70); // Start position of hover effect

  const handleHover = (index: number): void => {
    setHighlightPosition(index * 54 + 16); // Moves the highlight effect
  };

  const NavButton = ({ icon, label, index, onMouseEnter }: NavButtonProps) => (
    <div className="nav-button" onMouseEnter={() => onMouseEnter(index)}>
      <FontAwesomeIcon icon={icon} />
      <span>{label}</span>
    </div>
  );

  return (
    <div id="nav-bar" className={`${navOpen ? "expanded" : "collapsed"} ${footerOpen ? "footer-expanded" : "footer-collapsed"}`}>
      {/* Sidebar Toggle */}
      <input
        id="nav-toggle"
        type="checkbox"
        checked={navOpen}
        onChange={() => setNavOpen(!navOpen)}
        aria-label="Toggle navigation"
      />
      
      {/* Navbar Header */}
      <div id="nav-header">
        <Link id="nav-title" href="/" rel="noopener noreferrer">
          FoodFinder
        </Link>
        <label htmlFor="nav-toggle">
          <span id="nav-toggle-burger" onClick={() => setNavOpen(!navOpen)}></span>
        </label>
        <hr />
      </div>

      {/* Navigation Menu */}
      <div id="nav-content" className={navOpen ? "expanded" : "collapsed"}>
        <NavButton icon={faHome} label="Dashboard" index={0} onMouseEnter={handleHover} />
        <NavButton icon={faStar} label="Top Menus" index={1} onMouseEnter={handleHover} />
        <NavButton icon={faPencilAlt} label="My Reviews" index={2} onMouseEnter={handleHover} />
        <hr />
        <NavButton icon={faMapMarkerAlt} label="Explore" index={3} onMouseEnter={handleHover} />
        <NavButton icon={faCog} label="Settings" index={4} onMouseEnter={handleHover} />
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