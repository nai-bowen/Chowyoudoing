"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faSearch,
  faChartLine,
  faDollarSign,
  faUsers,
  faEye,
  faMousePointer,
  faCog,
  faPlus,
  faTrash,
  faPauseCircle,
  faPlayCircle,
  faEdit,
  faBullhorn,
  faInfoCircle,
  faArrowLeft,
  faToggleOn,
  faToggleOff,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

// Define interfaces for the types of data we'll be working with
interface AdminData {
  name: string;
  email: string;
  id: string;
  role: string;
}

interface AdCampaign {
  id: string;
  name: string;
  status: "active" | "paused" | "scheduled";
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  startDate: string;
  endDate: string | null;
  targeting: string[];
  placements: string[];
  adType: "banner" | "sidebar" | "sponsored" | "interstitial";
  imageUrl?: string;
}

interface AdStats {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  totalRevenue: number;
  activeAds: number;
}

// Define a type for the color scheme
interface ColorScheme {
  card1: string;
  card2: string;
  card3: string;
  card4: string;
  accent: string;
}

// Ad Placement Preview Component
const AdPlacementPreview = ({ placement, type }: { placement: string, type: string }) => {
  const getAdHeight = () => {
    switch (type) {
      case "banner":
        return "h-20";
      case "sidebar":
        return "h-80";
      case "sponsored":
        return "h-48";
      case "interstitial":
        return "h-64";
      default:
        return "h-32";
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 ${getAdHeight()} flex items-center justify-center relative overflow-hidden border-2 border-dashed border-blue-300`}>
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
        {type}
      </div>
      <div className="text-center">
        <FontAwesomeIcon icon={faBullhorn} className="text-blue-500 text-2xl mb-2" />
        <p className="font-medium text-blue-800">Ad Placement: {placement}</p>
        <p className="text-sm text-blue-600">600 x 200 px</p>
      </div>
    </div>
  );
};

export default function AdminAdvertsDashboard(): JSX.Element {
  const router = useRouter();
  
  // State variables
  const [adminData, setAdminData] = useState<AdminData>({
    name: "Admin User",
    email: "admin@example.com",
    id: "admin-123",
    role: "Ad Manager"
  });
  
  const [activeTab, setActiveTab] = useState<string>("Ad Placements");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAdControls, setShowAdControls] = useState<boolean>(true);
  
  // Animation states
  const [animationComplete, setAnimationComplete] = useState<boolean>(false);
  const [sectionsLoaded, setSectionsLoaded] = useState<{
    profile: boolean;
    stats: boolean;
    tabs: boolean;
    content: boolean;
  }>({
    profile: false,
    stats: false,
    tabs: false,
    content: false
  });

  // Dummy data for ad campaigns
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([
    {
      id: "ad-1",
      name: "Summer Food Festival",
      status: "active",
      impressions: 12540,
      clicks: 423,
      ctr: 3.37,
      spend: 645.20,
      startDate: "2025-06-01",
      endDate: "2025-06-30",
      targeting: ["Foodies", "Restaurant Lovers", "18-35"],
      placements: ["Dashboard Feed", "Review Page", "Search Results"],
      adType: "banner",
      imageUrl: "/assets/food-banner.jpg"
    },
    {
      id: "ad-2",
      name: "Premium Restaurant Spotlight",
      status: "active",
      impressions: 8750,
      clicks: 312,
      ctr: 3.56,
      spend: 425.50,
      startDate: "2025-05-15",
      endDate: null,
      targeting: ["Fine Dining", "Premium Users", "25-45"],
      placements: ["Restaurant Profile", "Review Page"],
      adType: "sidebar",
      imageUrl: "/assets/restaurant-ad.jpg"
    },
    {
      id: "ad-3",
      name: "Food Delivery Promotion",
      status: "paused",
      impressions: 5230,
      clicks: 187,
      ctr: 3.58,
      spend: 215.75,
      startDate: "2025-04-10",
      endDate: "2025-05-10",
      targeting: ["Takeout Lovers", "Busy Professionals", "All Ages"],
      placements: ["Dashboard Feed", "Search Results"],
      adType: "sponsored",
      imageUrl: "/assets/delivery-ad.jpg"
    },
    {
      id: "ad-4",
      name: "New Restaurant Opening",
      status: "scheduled",
      impressions: 0,
      clicks: 0,
      ctr: 0,
      spend: 0,
      startDate: "2025-07-01",
      endDate: "2025-07-31",
      targeting: ["Local Users", "Foodies", "All Ages"],
      placements: ["Dashboard Feed", "Search Results", "Map View"],
      adType: "interstitial",
      imageUrl: "/assets/new-restaurant.jpg"
    }
  ]);

  // Dummy stats data
  const [adStats, setAdStats] = useState<AdStats>({
    totalImpressions: 26520,
    totalClicks: 922,
    averageCTR: 3.48,
    totalRevenue: 1286.45,
    activeAds: 2
  });

  // Color scheme for UI elements
  const colorScheme: ColorScheme = {
    card1: "#f0f9ff", // Light blue
    card2: "#fef2f6", // Light pink
    card3: "#f5f0fe", // Light purple
    card4: "#f0fdf4", // Light green
    accent: "#e0f2fe" // Light blue accent
  };

  // Staggered animation effect
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Start staggered animation sequence
      const profileTimer = setTimeout(() => setSectionsLoaded(prev => ({ ...prev, profile: true })), 100);
      const statsTimer = setTimeout(() => setSectionsLoaded(prev => ({ ...prev, stats: true })), 200);
      const tabsTimer = setTimeout(() => setSectionsLoaded(prev => ({ ...prev, tabs: true })), 300);
      const contentTimer = setTimeout(() => setSectionsLoaded(prev => ({ ...prev, content: true })), 400);
      
      // Set animation complete after all sections have loaded
      const completeTimer = setTimeout(() => setAnimationComplete(true), 900);
      
      return () => {
        clearTimeout(profileTimer);
        clearTimeout(statsTimer);
        clearTimeout(tabsTimer);
        clearTimeout(contentTimer);
        clearTimeout(completeTimer);
      };
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to format numbers
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Function to format currency
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  // Get the time-based greeting
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning,";
    if (hour < 18) return "Good Afternoon,";
    return "Good Evening,";
  };

  // Function to handle campaign status toggle
  const toggleCampaignStatus = (id: string): void => {
    setAdCampaigns(prevCampaigns =>
      prevCampaigns.map(campaign =>
        campaign.id === id
          ? {
              ...campaign,
              status: campaign.status === "active" ? "paused" : "active"
            }
          : campaign
      )
    );
  };

  // Filter campaigns based on search query
  const filteredCampaigns = adCampaigns.filter(campaign => {
    const searchText = searchQuery.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(searchText) ||
      campaign.status.toLowerCase().includes(searchText) ||
      campaign.adType.toLowerCase().includes(searchText)
    );
  });

  // Loading spinner component
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-700 ease-out ${animationComplete ? 'opacity-100' : 'opacity-0'}`}>
      <div>
        <main className="container mx-auto px-6 py-6 overflow-hidden">
          {/* Admin Profile Section with animation */}
          <div className={`transform transition-all duration-700 ease-out mb-8 ${
            sectionsLoaded.profile ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Admin Dashboard
                </Link>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{adminData.email}</span>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                  {adminData.role}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h1 className="text-3xl font-bold">
                {getTimeBasedGreeting()} {adminData.name.split(' ')[0]}
              </h1>
              <p className="text-gray-600 mt-1">
                Advertisement Management Dashboard - Patron Dashboard Preview
              </p>
            </div>
          </div>
          
          {/* Stats Cards with animation */}
          <div className={`transform transition-all duration-700 ease-out mb-10 ${
            sectionsLoaded.stats ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-[#f0f9ff] p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500">Impressions</h3>
                    <p className="text-2xl font-bold">{formatNumber(adStats.totalImpressions)}</p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-full">
                    <FontAwesomeIcon icon={faEye} className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#fef2f6] p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500">Clicks</h3>
                    <p className="text-2xl font-bold">{formatNumber(adStats.totalClicks)}</p>
                  </div>
                  <div className="bg-[#f472b6] p-3 rounded-full">
                    <FontAwesomeIcon icon={faMousePointer} className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#f5f0fe] p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500">CTR</h3>
                    <p className="text-2xl font-bold">{adStats.averageCTR}%</p>
                  </div>
                  <div className="bg-[#a78bfa] p-3 rounded-full">
                    <FontAwesomeIcon icon={faChartLine} className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#f0fdf4] p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500">Revenue</h3>
                    <p className="text-2xl font-bold">{formatCurrency(adStats.totalRevenue)}</p>
                  </div>
                  <div className="bg-[#4ade80] p-3 rounded-full">
                    <FontAwesomeIcon icon={faDollarSign} className="text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#f1f5f9] p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-500">Active Ads</h3>
                    <p className="text-2xl font-bold">{adStats.activeAds}</p>
                  </div>
                  <div className="bg-[#64748b] p-3 rounded-full">
                    <FontAwesomeIcon icon={faBullhorn} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs with animation */}
          <div className={`transform transition-all duration-700 ease-out mb-8 ${
            sectionsLoaded.tabs ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
          }`}>
            <div className="bg-white/20 backdrop-blur-md rounded-xl shadow-sm p-1">
              <div className="flex flex-wrap">
                <button 
                  className={`py-3 px-4 font-medium rounded-lg transition-all ${
                    activeTab === 'Ad Placements' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('Ad Placements')}
                >
                  Ad Placements
                </button>
                <button 
                  className={`py-3 px-4 font-medium rounded-lg transition-all ${
                    activeTab === 'Ad Campaigns' 
                    ? 'bg-pink-100 text-pink-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('Ad Campaigns')}
                >
                  Ad Campaigns
                </button>
                <button 
                  className={`py-3 px-4 font-medium rounded-lg transition-all ${
                    activeTab === 'Settings' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('Settings')}
                >
                  Settings
                </button>
                <div className="ml-auto flex items-center pr-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showAdControls} 
                      onChange={() => setShowAdControls(!showAdControls)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {showAdControls ? "Show Ad Controls" : "Hide Ad Controls"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
  
          {/* Search Bar for campaigns */}
          {activeTab === 'Ad Campaigns' && (
            <div className={`transform transition-all duration-700 ease-out mb-6 max-w-md relative ${
              sectionsLoaded.tabs ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
            }`}>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          )}
  
          {/* Content Area with animation */}
          <div className={`transform transition-all duration-700 ease-out relative z-10 ${
            sectionsLoaded.content ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
          }`}>
            {/* Ad Placements Tab Content */}
            {activeTab === 'Ad Placements' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Patron Dashboard with Ad Placements</h2>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    New Ad Placement
                  </button>
                </div>
                
                {/* Ad Placement Preview Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Patron Dashboard Preview</h3>
                    <div className="text-sm text-gray-500">
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                      This is how ads would appear on the patron dashboard
                    </div>
                  </div>
                  
                  {/* Mock Patron Dashboard with Ad Placements */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div>
                          <h4 className="font-bold">John Doe</h4>
                          <p className="text-sm text-gray-600">Food Explorer</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-gray-300 rounded-full text-gray-700">
                        Edit Profile
                      </button>
                    </div>
                    
                    {/* First Ad Placement - Banner */}
                    {showAdControls && (
                      <div className="mb-6 relative">
                        <AdPlacementPreview placement="Top Banner" type="banner" />
                        <div className="absolute top-0 right-0 bg-white rounded-lg shadow-lg p-2 m-2 flex gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800">
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-800">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-[#faf2e5] p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <h5 className="text-sm text-gray-500">Reviews</h5>
                            <p className="text-xl font-bold">23</p>
                          </div>
                          <div className="bg-[#f2d36e] p-2 rounded-full">
                            <FontAwesomeIcon icon={faUtensils} className="text-white" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#fdedf6] p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <h5 className="text-sm text-gray-500">Upvotes</h5>
                            <p className="text-xl font-bold">142</p>
                          </div>
                          <div className="bg-[#f9c3c9] p-2 rounded-full">
                            <FontAwesomeIcon icon={faUsers} className="text-white" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#fbe9fc] p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <h5 className="text-sm text-gray-500">Followers</h5>
                            <p className="text-xl font-bold">56</p>
                          </div>
                          <div className="bg-[#f5b7ee] p-2 rounded-full">
                            <FontAwesomeIcon icon={faUsers} className="text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Second Ad Placement - Sidebar/Stats Card */}
                      {showAdControls ? (
                        <div className="relative">
                          <AdPlacementPreview placement="Stats Card" type="sidebar" />
                          <div className="absolute top-0 right-0 bg-white rounded-lg shadow-lg p-2 m-2 flex gap-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#f1eafe] p-4 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h5 className="text-sm text-gray-500">Trending</h5>
                              <p className="text-xl font-bold">Italian</p>
                            </div>
                            <div className="bg-[#dab9f8] p-2 rounded-full">
                              <FontAwesomeIcon icon={faChartLine} className="text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-sm p-1 mb-6 max-w-md">
                      <div className="flex">
                        <button className="py-2 px-4 font-medium rounded-lg bg-[#faf2e8] text-black">
                          My Reviews
                        </button>
                        <button className="py-2 px-4 font-medium rounded-lg text-gray-600">
                          Favorites
                        </button>
                        <button className="py-2 px-4 font-medium rounded-lg text-gray-600">
                          Following
                        </button>
                      </div>
                    </div>
                    
                    {/* Review Cards with Ad Placement */}
                    <div className="space-y-4">
                      {/* Review Card 1 */}
                      <div className="bg-[#fdf9f5] rounded-xl shadow-sm p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold">Italian Bistro</h5>
                            <p className="text-sm text-gray-600">April 15, 2025</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-1 text-gray-600 hover:text-blue-600">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex text-yellow-400 mb-3">★★★★★</div>
                        
                        <p className="text-gray-700 mb-3">
                          Amazing pasta and great service! The ambiance was perfect for a romantic dinner.
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <span className="bg-white px-2 py-1 rounded-full text-gray-600 text-sm">
                            24 upvotes
                          </span>
                        </div>
                      </div>
                      
                      {/* Third Ad Placement - In-Feed Sponsored */}
                      {showAdControls && (
                        <div className="relative">
                          <AdPlacementPreview placement="In-Feed Sponsored" type="sponsored" />
                          <div className="absolute top-0 right-0 bg-white rounded-lg shadow-lg p-2 m-2 flex gap-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Review Card 2 */}
                      <div className="bg-[#fdedf6] rounded-xl shadow-sm p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold">Sushi Paradise</h5>
                            <p className="text-sm text-gray-600">April 10, 2025</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-1 text-gray-600 hover:text-blue-600">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex text-yellow-400 mb-3">★★★★☆</div>
                        
                        <p className="text-gray-700 mb-3">
                          Fresh sushi and creative rolls. Slightly pricey but worth it for the quality.
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <span className="bg-white px-2 py-1 rounded-full text-gray-600 text-sm">
                            18 upvotes
                          </span>
                        </div>
                      </div>
                      
                      {/* Fourth Ad Placement - Bottom Banner */}
                      {showAdControls && (
                        <div className="relative">
                          <AdPlacementPreview placement="Bottom Banner" type="banner" />
                          <div className="absolute top-0 right-0 bg-white rounded-lg shadow-lg p-2 m-2 flex gap-2">
                            <button className="p-1 text-blue-600 hover:text-blue-800">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Ad Formats Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
                  <h3 className="text-lg font-semibold mb-4">Available Ad Formats</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="font-semibold text-blue-800 mb-2">Banner Ads</div>
                      <p className="text-sm text-gray-600 mb-3">
                        Horizontal advertisements displayed at strategic locations in the user flow.
                      </p>
                      <p className="text-xs text-blue-600">Sizes: 600x200, 970x250</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="font-semibold text-blue-800 mb-2">Sidebar Ads</div>
                      <p className="text-sm text-gray-600 mb-3">
                        Vertical advertisements displayed alongside regular content.
                      </p>
                      <p className="text-xs text-blue-600">Sizes: 300x600, 160x600</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="font-semibold text-blue-800 mb-2">Sponsored Content</div>
                      <p className="text-sm text-gray-600 mb-3">
                        Native ads that blend with the regular content for a seamless experience.
                      </p>
                      <p className="text-xs text-blue-600">Appears like regular reviews</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <div className="font-semibold text-blue-800 mb-2">Interstitial Ads</div>
                      <p className="text-sm text-gray-600 mb-3">
                        Full-screen ads that appear between content transitions.
                      </p>
                      <p className="text-xs text-blue-600">Shown at key navigation points</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ad Campaigns Tab Content */}
            {activeTab === 'Ad Campaigns' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Ad Campaigns</h2>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    New Campaign
                  </button>
                </div>
                
                {filteredCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{campaign.name}</h3>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                campaign.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : campaign.status === 'paused'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                              </span>
                              <span className="ml-2 text-gray-500">|</span>
                              <span className="ml-2 text-gray-600 text-sm">{campaign.adType.charAt(0).toUpperCase() + campaign.adType.slice(1)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="p-2 text-gray-600 hover:text-blue-600"
                              onClick={() => toggleCampaignStatus(campaign.id)}
                            >
                              <FontAwesomeIcon icon={campaign.status === 'active' ? faPauseCircle : faPlayCircle} />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-blue-600">
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-red-500">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Impressions</div>
                            <div className="font-semibold">{formatNumber(campaign.impressions)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Clicks</div>
                            <div className="font-semibold">{formatNumber(campaign.clicks)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">CTR</div>
                            <div className="font-semibold">{campaign.ctr}%</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">Spend</div>
                            <div className="font-semibold">{formatCurrency(campaign.spend)}</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Start:</span> {new Date(campaign.startDate).toLocaleDateString()}
                          </div>
                          {campaign.endDate && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">End:</span> {new Date(campaign.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {campaign.targeting.map((target, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                              {target}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Placements:</span> {campaign.placements.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FontAwesomeIcon icon={faBullhorn} className="text-4xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No campaigns found</h3>
                    <p className="text-gray-500">Try adjusting your search or create a new campaign.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Settings Tab Content */}
            {activeTab === 'Settings' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Advertisement Settings</h2>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">Global Ad Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Enable Advertisements</h4>
                        <p className="text-sm text-gray-600">Turn on/off all advertisements across the platform</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Premium User Ad Reduction</h4>
                        <p className="text-sm text-gray-600">Show fewer ads to premium/paid users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Personalized Ads</h4>
                        <p className="text-sm text-gray-600">Show ads based on user preferences and behavior</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium">Location-Based Ads</h4>
                        <p className="text-sm text-gray-600">Show ads based on user location</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={true} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">Ad Frequency Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum ads per page
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>1</option>
                        <option>2</option>
                        <option selected>3</option>
                        <option>4</option>
                        <option>5</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum scroll depth before showing ads (%)
                      </label>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value="20" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>20%</span>
                        <span>40%</span>
                        <span>60%</span>
                        <span>80%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum time on page before showing ads (seconds)
                      </label>
                      <input 
                        type="number" 
                        min="0" 
                        value="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Ad Content Restrictions</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={true}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Block alcohol-related advertisements
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={true}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Block tobacco-related advertisements
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={false}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Block fast food advertisements
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={false}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Block competing food review platform advertisements
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom blocked keywords (comma separated)
                      </label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="e.g., gambling, adult content, etc."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer with animation */}
        <footer className={`transform transition-all duration-700 ease-out mt-16 py-8 bg-white/20 backdrop-blur-md border-t border-gray-100 ${
          animationComplete ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBullhorn} className="text-sm text-white" />
                </div>
                <p className="ml-2 text-sm">© 2025 Chow You Doing? Ad Management</p>
              </div>
              
              <div className="flex gap-6">
                <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600">Terms of Service</Link>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600">Privacy Policy</Link>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600">Contact Us</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}