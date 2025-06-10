"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaBars, FaArrowLeft } from "react-icons/fa";

const menuItems = [{
  title: "Dashboard",
  type: "link",
  path: "/property-manager/dashboard",
},
{
  title: "Referral Management",
  type: "link",
  path: "/property-manager/referral-management",
},
{
  title: "Reward Points",
  type: "link",
  path: "/property-manager/reward-points",
}];

const PropertyManagerHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLUListElement>(null);

  const [dropdownMenuStatus, setDropdownMenuStatus] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownMenuToggle = () => setDropdownMenuStatus(!dropdownMenuStatus);

  const logMeOut = async () => {
    router.push("/sign-out");
    localStorage.removeItem("userRole");
    localStorage.clear();
    return;
  }

  useEffect(() => {
    if (!displayName) {
      const userDisplayName = localStorage.getItem("userDisplayName");
      if (userDisplayName) {
        setDisplayName(userDisplayName);
      }
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownMenuStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="user-header bg-primary py-4">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <Link
            href={`/property-manager/dashboard`}
            className="logo text-white d-flex gap-2 align-items-center"
          >
            <img
              src={`/assets/images/logo/logoWhite.png`}
              alt="RBP Club Logo"
            />
            <span>RBP Club</span>
          </Link>

          <div className="d-block d-md-none ms-auto">
            <FaBars
              className="text-white"
              size={30}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>

          {/* Sidebar for Mobile Menu */}
          {isMobileMenuOpen && (
            <div
              className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "250px",
                backgroundColor: "white",
                color: "black",
                zIndex: 999,
                transition: "transform 0.3s ease",
                transform: isMobileMenuOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
              }}
            >
              <div className="sidebar-content" style={{ padding: "20px" }}>
                {/* Left Arrow Icon to Close Sidebar */}
                <div className="d-flex align-items-center justify-content-start p-2">
                  <div
                    className="close-btn"
                    style={{ cursor: "pointer", textAlign: "left" }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaArrowLeft fill="#808080" size={16} />
                  </div>
                  <div className="text-black mx-auto ff-sora-medium">Menu</div>
                </div>
                <ul className="nav flex-column ff-sora-medium mobile-menu">
                  {menuItems.map((menuItem, menuItemsIndex) => {
                    return <li className="nav-item" key={`property-manager-menu-item-${menuItemsIndex}`}>
                      {menuItem.type === "link" &&
                        <Link href={menuItem.path} className={`nav-link text-black ${pathname.startsWith(menuItem.path) ? `active` : ``}`} style={{ letterSpacing: "normal" }}>
                          {menuItem.title}
                        </Link>
                      }
                    </li>
                  })}
                  <li className="nav-item">
                    <Link
                      href={"/property-manager/profile"}
                      className="nav-link text-black"
                    >
                      My Profile
                    </Link>
                  </li>
                </ul>

                <div className="w-100 mt-3 ff-sora">
                  <button
                    className="btn w-100 text-white"
                    style={{
                      backgroundColor: "#2280FF",
                      border: "none",
                      padding: "12px",
                      fontSize: "16px",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      logMeOut();
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay (optional) */}
          {isMobileMenuOpen && (
            <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 998,
              }}
            />
          )}

          <ul className="nav gap-2 m-0 justify-content-end d-none d-md-flex">
            {menuItems.map((menuItem, menuItemsIndex) => {
              return <li className="nav-item" key={`property-manager-menu-item-${menuItemsIndex}`}>
                {menuItem.type === "link" &&
                  <Link href={menuItem.path} className={`nav-link ${pathname.startsWith(menuItem.path) ? `active` : ``}`} style={{ letterSpacing: "normal" }}>
                    {menuItem.title}
                  </Link>
                }
              </li>
            })}
            <li className="nav-item nav-item-separator"></li>
            <li className="nav-item">
              <Link href={`#`} className="nav-link pe-0 nav-notifications-link">
                <i className="fa fa-bell-o m-0"></i>
              </Link>
            </li>
            <li className="nav-item position-relative">
              <Link href={`#`} className="nav-link dropdown-toggle pe-0 nav-profile-link" onClick={(e) => {
                e.preventDefault();
                dropdownMenuToggle();
              }}>
                {displayName}
              </Link>
              <ul ref={dropdownRef} className={`dropdown-menu dropdown-menu-end end-0 overflow-hidden ${dropdownMenuStatus ? `show` : ``}`}>
                <li className="dropdown-item p-0">
                  <Link href={`/property-manager/profile`} className="d-block py-2 px-3 text-primary" onClick={(e) => setDropdownMenuStatus(false)}
                  >
                    Profile
                  </Link>
                </li>
                <li className="dropdown-item p-0" onClick={(e) => setDropdownMenuStatus(false)}>
                  <Link href={`#`} onClick={(e) => {
                    e.preventDefault();
                    logMeOut();
                  }} className="d-block py-2 px-3">
                    Logout
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default PropertyManagerHeader;
