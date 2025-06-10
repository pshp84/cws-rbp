"use client";

import { getOption } from "@/DbClient";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaBars, FaArrowLeft } from "react-icons/fa";

const UserPortalHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLUListElement>(null);
  const isAuthPage =
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/new-deals");
  const showLoginLink =
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password") ||
    pathname.startsWith("/new-deals");

  const [dropdownMenuStatus, setDropdownMenuStatus] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [utilitiesLink, setUtilitiesLink] = useState<string | undefined>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownMenuToggle = () => setDropdownMenuStatus(!dropdownMenuStatus);

  const getUtilitiesLink = async () => {
    const data = await getOption("utility_setup_url", true);
    if (!data) return;
    setUtilitiesLink(data);
  };

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
    if (!isAuthPage && !utilitiesLink) {
      getUtilitiesLink();
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
            href={isAuthPage?`https://www.rentersbp.com/`:`/dashboard`}
            target={isAuthPage?`_blank`:`_self`}
            className="logo text-white d-flex gap-2 align-items-center"
          >
            <img
              src={`/assets/images/logo/logoWhite.png`}
              alt="RBP Club Logo"
            />
            <span>RBP Club</span>
          </Link>
          

          {isAuthPage && (
            <>
             <ul className="nav gap-2 justify-content-end d-none d-md-flex ms-auto">
              <li className="nav-item">
                <Link
                  href={`https://www.rentersbp.com/`}
                  className={`nav-link ${
                    pathname.startsWith("/dashboard") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={`https://www.rentersbp.com/about`}
                  className={`nav-link ${
                    pathname.startsWith("/deals") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                 About                
                 </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={`https://www.rentersbp.com/benefits`}
                  className={`nav-link ${
                    pathname.startsWith("/reward-points") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                 Benefits
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={`https://www.rentersbp.com/about#Landlords`}
                  style={{ letterSpacing: "normal" }}
                  className="nav-link"
                  target="_blank"
                >
                 Landlords
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={`https://www.rentersbp.com/contact`}
                  style={{ letterSpacing: "normal" }}
                  className="nav-link"
                  target="_blank"
                >
                 Contact
                </Link>
              </li>
            </ul>
            <Link
              href={`${showLoginLink ? `/sign-in` : `/sign-up`}`}
              className="btn new-button ms-5"
            >{`${showLoginLink ? `Member Login` : `Signup`}`}</Link>
           
            </>
          )}

          {!isAuthPage && (
            <div className="d-block d-md-none ms-auto">
              <FaBars
                className="text-white"
                size={30}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          )}

          {/* Sidebar for Mobile Menu */}
          {isMobileMenuOpen && !isAuthPage && (
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
                  <li className="nav-item">
                    <Link href={`/dashboard`} className="nav-link text-black">
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href={`/deals`} className="nav-link text-black">
                      Deals
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      href={`/reward-points`}
                      className="nav-link text-black"
                    >
                      Reward Points
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      href={utilitiesLink || `#`}
                      className="nav-link text-black"
                      target="_blank"
                    >
                      Utilities
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href={`/pet-insurance`} className="nav-link text-black">
                      Pet Insurance
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      href={"/user_profile"}
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
                    onClick={(e)=>{
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
          {isMobileMenuOpen && !isAuthPage && (
            <div
              className="overlay"
              onClick={() => setIsMobileMenuOpen(false)}
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

          {!isAuthPage && (
            <ul className="nav gap-2 m-0 justify-content-end d-none d-md-flex">
              <li className="nav-item">
                <Link
                  href={`/dashboard`}
                  className={`nav-link ${
                    pathname.startsWith("/dashboard") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={`/deals`}
                  className={`nav-link ${
                    pathname.startsWith("/deals") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                  Deals
                </Link>
              </li>
              {/* <li className="nav-item">
                            <Link href={`#`} className="nav-link">HVAC Filter</Link>
                        </li> */}
              <li className="nav-item">
                <Link
                  href={`/reward-points`}
                  className={`nav-link ${
                    pathname.startsWith("/reward-points") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                  Reward Points
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href={utilitiesLink || `#`}
                  style={{ letterSpacing: "normal" }}
                  className="nav-link"
                  target="_blank"
                >
                  Utilities
                </Link>
              </li>
              <li className="nav-item">
                <Link href={`/pet-insurance`} 
                  className={`nav-link ${
                    pathname.startsWith("/pet-insurance") ? `active` : ``
                  }`}
                  style={{ letterSpacing: "normal" }}
                >
                  Pet Insurance
                </Link>
              </li>
              <li className="nav-item nav-item-separator"></li>
              <li className="nav-item">
                <Link
                  href={`#`}
                  className="nav-link pe-0 nav-notifications-link"
                >
                  <i className="fa fa-bell-o m-0"></i>
                </Link>
              </li>
              <li className="nav-item position-relative">
                <Link
                  href={`#`}
                  className="nav-link dropdown-toggle pe-0 nav-profile-link"
                  onClick={(e) => {
                    e.preventDefault();
                    dropdownMenuToggle();
                  }}
                >
                  {displayName}
                </Link>
                <ul
                  ref={dropdownRef}
                  className={`dropdown-menu dropdown-menu-end end-0 overflow-hidden ${
                    dropdownMenuStatus ? `show` : ``
                  }`}
                >
                  <li className="dropdown-item p-0">
                    <Link
                      href={`/user_profile`}
                      className="d-block py-2 px-3 text-primary"
                      onClick={(e) => setDropdownMenuStatus(false)}
                    >
                      Profile 
                    </Link>
                  </li>
                  <li
                    className="dropdown-item p-0"
                    onClick={(e) => setDropdownMenuStatus(false)}
                  >
                    <Link 
                    href={`#`} 
                    onClick={(e)=>{
                      e.preventDefault();
                      logMeOut();
                    }}
                    className="d-block py-2 px-3"
                    >
                      Logout
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserPortalHeader;
