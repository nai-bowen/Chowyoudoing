/*eslint-disable*/

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faStar, faPencilAlt, faMapMarkerAlt, faCog, faSignOutAlt, faCaretUp, faSearch } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

interface NavButtonProps {
  icon: IconDefinition;
  label: string;
  index: number;
  onMouseEnter: (index: number) => void;
  href?: string;
  onClick?: () => void;
}

interface ProfileData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  interests: string[];
}

export default function Navbar(): JSX.Element {
  const [navOpen, setNavOpen] = useState<boolean>(true);
  const [footerOpen, setFooterOpen] = useState<boolean>(false);
  const [highlightPosition, setHighlightPosition] = useState<number>(-70); // Start position of hover effect
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  // Fetch profile data when session is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const fetchProfileData = async (): Promise<void> => {
        setProfileLoading(true);
        setProfileError(null);
        
        try {
          const response = await fetch('/api/profile');
          
          if (!response.ok) {
            throw new Error('Failed to fetch profile data');
          }
          
          const data = await response.json();
          setProfileData(data.profile);
          console.log("Profile data loaded:", data.profile);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfileError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          setProfileLoading(false);
        }
      };
      
      fetchProfileData();
    }
  }, [status, session]);

  // Get user info with fallbacks
  const userName: string = profileData?.name || session?.user?.name || "Guest";
  const userBio: string = profileData?.bio || "";
  const userEmail: string = profileData?.email || session?.user?.email || "";
  const profileImage: string | null = profileData?.profileImage || null;

  // Handle sign out
  const handleSignOut = async (): Promise<void> => {
    await signOut({ callbackUrl: "/login" });
  };

  // Truncate bio if it's too long
  const truncateBio = (bio: string, maxLength: number = 30): string => {
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  };

  const NavButton = ({ icon, label, index, onMouseEnter, href, onClick }: NavButtonProps): JSX.Element => {
    const handleClick = (): void => {
      if (onClick) {
        onClick();
      } else if (href) {
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
        <NavButton 
          icon={faSignOutAlt} 
          label="Logout" 
          index={5} 
          onMouseEnter={handleHover} 
          onClick={handleSignOut}
        />
        
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
            {profileImage ? (
              <Image 
                src={profileImage}
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <Image 
                src="/assets/default-profile.png"
                alt="Default Avatar"
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
          </div>
          <div id="nav-footer-titlebox" className={footerOpen ? "expanded" : "collapsed"}>
            <a 
              id="nav-footer-title" 
              href={status === "authenticated" && session?.user?.email 
                ? `/profile/${encodeURIComponent(session.user.email)}` 
                : "/login"} 
              rel="noopener noreferrer"
            >
              {userName}
            </a>
          </div>
          <label htmlFor="nav-footer-toggle">
            <FontAwesomeIcon icon={faCaretUp} onClick={() => setFooterOpen(!footerOpen)} />
          </label>
        </div>
        <div id="nav-footer-content" className={footerOpen ? "expanded" : "collapsed"}>
          {status === "authenticated" ? (
            profileLoading ? (
              <p>Loading profile data...</p>
            ) : profileError ? (
              <p>Error loading profile: {profileError}</p>
            ) : (
              <>
                <p>Logged in as {userEmail}</p>
                {userBio && footerOpen && (
                  <div className="bio-section">
                    <p className="bio-title">Bio:</p>
                    <p className="bio-content">{userBio}</p>
                  </div>
                )}
              </>
            )
          ) : status === "loading" ? (
            <p>Loading user data...</p>
          ) : (
            <p>Please log in to see profile details</p>
          )}
        </div>
      </div>
    </div>
  );
}