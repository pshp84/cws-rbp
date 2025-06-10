import SVG from "@/CommonComponent/SVG";
import { ImagePath } from "@/Constant";
import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import { handleResponsiveToggle, setToggleSidebar } from "@/Redux/Reducers/LayoutSlice";
import Link from "next/link";

export const LogoWrapper = () => {
  const dispatch = useAppDispatch();
  
  const { sidebarIconType } = useAppSelector((state) => state.themeCustomizer);
  const { toggleSidebar } = useAppSelector((state) => state.layout);

  return (
    <>
      <div className="logo-wrapper">
        <Link href={`/pages/dashboard`} >
          <img style={{verticalAlign:"top", paddingTop:"3px"}} className="img-fluid" src={`${ImagePath}/logo/logoWhite.png`} alt="" />
          <span className="textSetup" style={{
   fontWeight:500,
    fontSize: `26px`
  }}>RBP Club</span>
        </Link>
        <div className="back-btn" onClick={() => dispatch(handleResponsiveToggle())}>
          <i className="fa fa-angle-left"></i>
        </div>
        <div className="toggle-sidebar" onClick={()=>dispatch(setToggleSidebar(!toggleSidebar))} defaultChecked>
          <SVG className={`${sidebarIconType}-icon sidebar-toggle status_toggle middle`} iconId={`${sidebarIconType === "fill" ? "fill-" : "" }toggle-icon`} />
        </div>
      </div>
      <div className="logo-icon-wrapper">
        <Link href={`/pages/dashboard`}>
          <img className="img-fluid" src={`${ImagePath}/logo/logoWhite.png`} alt="" />
        </Link>
      </div>
    </>
  );
};
