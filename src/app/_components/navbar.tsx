import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette, faImages, faThumbtack, faHeart, faChartLine, faFire, faMagic, faGem, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { faCodepen } from "@fortawesome/free-brands-svg-icons";
import "./navbar.css"; // Ensure this contains your styles
import "./navbar.sass"; // Ensure this contains your styles

export default function Navbar() {
  const [navOpen, setNavOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState(-70); // Start position of hover effect

  const handleHover = (index: number) => {
    setHighlightPosition(index * 54 + 16); // Moves the highlight effect
  };

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
        <a id="nav-title" href="https://codepen.io" target="_blank" rel="noopener noreferrer">
          C<FontAwesomeIcon icon={faCodepen} />DEPEN
        </a>
        <label htmlFor="nav-toggle">
          <span id="nav-toggle-burger" onClick={() => setNavOpen(!navOpen)}></span>
        </label>
        <hr />
      </div>

      {/* Navigation Menu */}
      <div id="nav-content" className={navOpen ? "expanded" : "collapsed"}>
        <div className="nav-button" onMouseEnter={() => handleHover(0)}>
          <FontAwesomeIcon icon={faPalette} />
          <span>Your Work</span>
        </div>
        <div className="nav-button" onMouseEnter={() => handleHover(1)}>
          <FontAwesomeIcon icon={faImages} />
          <span>Assets</span>
        </div>
        <div className="nav-button" onMouseEnter={() => handleHover(2)}>
          <FontAwesomeIcon icon={faThumbtack} />
          <span>Pinned Items</span>
        </div>
        <hr />
        <div className="nav-button" onMouseEnter={() => handleHover(3)}>
          <FontAwesomeIcon icon={faHeart} />
          <span>Following</span>
        </div>
        <div className="nav-button" onMouseEnter={() => handleHover(4)}>
          <FontAwesomeIcon icon={faChartLine} />
          <span>Trending</span>
        </div>
        <div className="nav-button" onMouseEnter={() => handleHover(5)}>
          <FontAwesomeIcon icon={faFire} />
          <span>Challenges</span>
        </div>
        <div className="nav-button" onMouseEnter={() => handleHover(6)}>
          <FontAwesomeIcon icon={faMagic} />
          <span>Spark</span>
        </div>
        <hr />
        <div className="nav-button" onMouseEnter={() => handleHover(7)}>
          <FontAwesomeIcon icon={faGem} />
          <span>Codepen Pro</span>
        </div>
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
              src="https://gravatar.com/avatar/4474ca42d303761c2901fa819c4f2547" 
              alt="User Avatar" 
            />
          </div>
          <div id="nav-footer-titlebox" className={footerOpen ? "expanded" : "collapsed"}>
            <a id="nav-footer-title" href="https://codepen.io/uahnbu/pens/public" target="_blank" rel="noopener noreferrer">uahnbu</a>
            <span id="nav-footer-subtitle">Admin</span>
          </div>
          <label htmlFor="nav-footer-toggle">
            <FontAwesomeIcon icon={faCaretUp} onClick={() => setFooterOpen(!footerOpen)} />
          </label>
        </div>
        <div id="nav-footer-content" className={footerOpen ? "expanded" : "collapsed"}>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>
      </div>
    </div>
  );
}
