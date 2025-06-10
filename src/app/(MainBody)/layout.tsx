"use client";

import ThemeCustomizer from "@/Layout/ThemeCustomizer";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import Store from "@/Redux/Store";
import { Provider } from "react-redux";
import "../../../src/index.scss";
import { Header } from "@/Layout/Header/Header";
import TapTop from "@/Layout/TapTop";
import { useEffect, useState } from "react";
import { setToggleSidebar } from "@/Redux/Reducers/LayoutSlice";
import { setLayout } from "@/Redux/Reducers/ThemeCustomizerSlice";
import { SideBar } from "@/Layout/Sidebar/Sidebar";
import { getUserRole, dbClient } from "@/DbClient";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/Layout/Footer/Footer";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import { useRouter } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  //const userRole = localStorage.getItem("userRole");
  const router = useRouter();
  const dispatch = useAppDispatch();
  //const [isOpen, setIsOpen] = useState(false);
  // const [isHovered, setIsHovered] = useState(false);
  // const handleMouseEnter = () => setIsHovered(true);
  // const handleMouseLeave = () => setIsHovered(false);

  // const toggle = () => setIsOpen(!isOpen);

  const LogOutUser = async () => {
    router.push("/sign-out");
    localStorage.removeItem("userRole");
    localStorage.clear();
  };

  const compactSidebar = () => {
    let windowWidth = window.innerWidth;
    if (layout === "compact-wrapper") {
      if (windowWidth < 1200) {
        dispatch(setToggleSidebar(true));
      } else {
        dispatch(setToggleSidebar(false));
      }
    } else if (layout === "horizontal-wrapper") {
      if (windowWidth < 992) {
        dispatch(setToggleSidebar(true));
        dispatch(setLayout("compact-wrapper"));
      } else {
        dispatch(setToggleSidebar(false));
        dispatch(setLayout(localStorage.getItem("layout")));
      }
    }
  };

  useEffect(() => {
    compactSidebar();
    window.addEventListener("resize", () => {
      compactSidebar();
    });
  }, [layout]);

  return (
    <Provider store={Store}>
      <div className={`page-wrapper ${layout}`} id="pageWrapper">
        <Header />
        <div className="page-body-wrapper">
          <SideBar />
          <div className="page-body">
            <div className="container-fluid">
              <div className="row">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <ThemeCustomizer />
      <TapTop />
      {/* {userRole === "admin" ? (
        <>
          <div className={`page-wrapper ${layout}`} id="pageWrapper">
            <Header />
            <div className="page-body-wrapper">
              <SideBar />
              <div className="page-body">
                <div className="container-fluid">
                  <div className="row">{children}</div>
                </div>
              </div>
            </div>
          </div>
          <ThemeCustomizer />
          <TapTop />
        </>
      ) : (
        <>

          <div className={`page-wrapper ${layout}`} id="pageWrapper">
            <div className="page-body-wrapper">
              <Navbar
                style={{
                  borderBottom: "2px solid #2a6198",
                }}
                expand="md"
              >
                <NavbarBrand href="/">
                  <div>
                    <img
                      style={{
                        verticalAlign: "top",
                        paddingTop: "3px",
                        backgroundColor: "#2a6198",
                      }}
                      className="img-fluid"
                      src={`/assets/images/logo/logoWhite.png`}
                      alt=""
                    />
                    <span
                      className="textSetup"
                      style={{
                        fontWeight: 500,
                        fontSize: `26px`,
                        marginLeft: "5px",
                      }}
                    >
                      RBP Club
                    </span>
                  </div>
                </NavbarBrand>
                <NavbarToggler  onClick={toggle} />
                <Collapse
                  className="flex flex-row-reverse"
                  isOpen={isOpen}
                  navbar
                >
                  <Nav style={{ marginRight: "15px" }} navbar>
                    <NavItem>
                      <NavLink
                        style={{
                          color: "#2a6198",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                        //href={"/pages/dashboard"}
                        className={""}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/pages/dashboard");
                        }}
                      >
                        {"Dashboard"}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{
                          color: "#2a6198",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                        className={""}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/user/deals");
                        }}
                      >
                        {"Deals"}
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        style={{
                          color: "#2a6198",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                        href={"#"}
                        className={""}
                      >
                        {"Rewards"}
                      </NavLink>
                    </NavItem>
                    <UncontrolledDropdown nav inNavbar>
                      <DropdownToggle
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          marginRight: "5px",
                        }}
                        nav
                        caret
                      >
                        {"HVAC Filter"}
                      </DropdownToggle>
                      <DropdownMenu right>
                        <DropdownItem
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/HVAC/filters");
                          }}
                        >
                          {"Filters"}
                        </DropdownItem>
                        <DropdownItem
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/HVAC/filter_orders");
                          }}
                        >
                          {"Orders"}
                        </DropdownItem>
                        <DropdownItem
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/HVAC/filter_subscription");
                          }}
                        >
                          {"Subscription"}
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                    <div
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className="relative inline-block"
                    >
                      <NavItem>
                        <Link
                          href="#"
                          className="btn btn-outline-primary rounded-4 p-2 rounded-5 d-flex align-items-center gap-2"
                        >
                          <span className="text-[#2a6198] hover:text-white">
                            Hello User!
                          </span>
                          <div
                            className="d-flex justify-content-center align-items-center bg-primary text-white rounded-circle"
                            style={{ width: "25px", height: "25px" }}
                          >
                            <Image
                              height={30}
                              width={30}
                              className="img-30"
                              src={`/assets/images/dashboard/profile.png`}
                              alt="User Profile"
                            />
                          </div>
                        </Link>
                      </NavItem>
                      {isHovered && (
                        <ul
                          style={{
                            width: "160px",
                            float: "right",
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            zIndex: 1000,
                            marginTop: "-9px",
                          }}
                          className="profile-dropdown absolute left-1/2 transform -translate-x-1/2 top-[-100px] bg-white shadow-lg rounded-lg w-48 p-0 z-20"
                        >
                          <li className="px-4 py-2 hover:bg-gray-100">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                router.push("/user/profile");
                              }}
                              style={{ display: "flex", alignItems: "center" }}
                              className=""
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                              >
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginLeft:"5px"
                                }}
                                className="flex items-center"
                              >
                                Account
                              </span>
                            </a>
                          </li>
                          <li
                            className="px-4 py-2 hover:bg-gray-100"
                            onClick={LogOutUser}
                          >
                            <a
                              href="#javascript"
                              style={{ display: "flex", alignItems: "center" }}
                              className="flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2"
                              >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                              </svg>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginLeft:"5px"
                                }}
                              >
                                Log out
                              </span>
                            </a>
                          </li>
                        </ul>
                      )}
                    </div>
                  </Nav>
                </Collapse>
              </Navbar>
              <div
                style={{ marginTop: "4rem", marginLeft: "auto" }}
                className="container page-body"
              >
                {children}
              </div>
              <Footer />
            </div>
          </div>
        </>
      )} */}
    </Provider>
  );
}
