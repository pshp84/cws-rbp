"use client"

import Link from "next/link";
import { BsTelephone } from "react-icons/bs"; 

const UserPortalFooter = () => {
    return <footer className="user-footer bg-primary overflow-hidden">
        <div className="user-footer-links py-5">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12 col-md-2 footer-logo mb-4 mb-md-0">
                        <Link href={`#`} className="logo text-white d-flex gap-2 align-items-center">
                            <img style={{width: 80, height : 80}} src={`/assets/images/logo/RBPLogoMain.png`} alt="RBP Club" />
                        </Link>
                    </div>
                    {/* Quick Links */}
                    <div className="col-6 col-sm-4 col-md-3 footer-quick-links mb-4 mb-md-0">
                        <h5 className="mb-2 mb-md-4 text-uppercase text-green">Quick Links</h5>
                        <ul className="list-unstyled m-0">
                            <li className="py-1">
                                <Link href={`https://www.rentersbp.com/`} className="text-white">Home</Link>
                            </li>
                          
                            <li className="py-1">
                                <Link href={`https://www.rentersbp.com/about`} className="text-white">About</Link>
                            </li>
                            <li className="py-1">
                                <Link href={`https://www.rentersbp.com/benefits`} className="text-white">Benefits</Link>
                            </li>
                            <li className="py-1">
                                <Link href={`https://www.rentersbp.com/about#Landlords`} className="text-white">Landlords</Link>
                            </li>
                            <li className="py-1">
                                <Link href={`https://www.rentersbp.com/contact`} className="text-white">Contact</Link>
                            </li>
                        </ul>
                    </div>
                    {/* EOF Quick Links */}

                    {/* About Us */}
                    <div className="col-6 col-sm-4 col-md-3 footer-about-us mb-4 mb-md-0">
                        <h5 className="mb-2 mb-md-4 text-uppercase text-green">About Us</h5>
                        <p className="mb-0">RBP provides renters with savings, support and opportunities—making life easier today and building a brighter future for tomorrow.</p>
                    </div>
                    {/* EOF About Us */}

                    {/* Contact */}
                    <div className="col-12 col-md-2 footer-contact offset-md-1 mb-4 mb-md-0">
                        <h5 className="mb-2 mb-md-4 text-uppercase text-green">Contact</h5>
                        <ul className="list-unstyled m-0">
                            <li className="py-1">
                                <Link href={`tel:+17272006252`} className="text-white d-flex align-items-center gap-2">
                                {/* <FaPhoneAlt className="text-green" outline/> */}
                                    {/* <i className="fa fa-phone text-green"></i> */}
                                    <BsTelephone className="text-green"/>
                                    <span>(727)200-6252</span>
                                </Link>
                            </li>
                            <li className="py-1">
                                <Link href={`mailto:customercare@rentersbp.com`} className="text-white d-flex align-items-center gap-2">
                                    <i className="fa fa-send-o text-green"></i>
                                    <span>customercare@rentersbp.com</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                    {/* EOF Contact */}

                </div>
            </div>
        </div>

        <div className="user-footer-copyright text-dark overflow-hidden">
            <div className="container bg-white py-4">
                <div className="px-4">
                <div className="row">
                    <div className="col-md-6 mb-3 mb-md-0">
                        <p className="m-0"><b>RBP</b> &copy; 2024. All rights reserved. Website by <Link href={`#`} target="_blank" className="text-dark text-decoration-underline">CWS</Link></p>
                    </div>
                    <div className="col-md-6 text-md-end">
                        <p className="m-0 text-primary">*Certain terms and conditions may apply</p>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </footer>
}

export default UserPortalFooter;