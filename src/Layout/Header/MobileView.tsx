import { ImagePath } from "@/Constant";
import { useAppSelector } from "@/Redux/Hooks";
import Link from "next/link";
import { Col } from "reactstrap";

export const MobileView = () => {
  

  return (
    <Col className="header-logo-wrapper col-auto">
      <div className="logo-wrapper">
        <Link href={`/dashboard/default_dashboard`}>
          <img className="img-fluid for-light" src={`${ImagePath}/logo/logo.png`} alt="" />
          <img className="img-fluid for-dark" src={`${ImagePath}/logo/logo_light.png`} alt="" />
        </Link>
      </div>
    </Col>
  );
};
