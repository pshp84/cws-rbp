import { getUserRole } from "@/DbClient";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home } from "react-feather";
import { Breadcrumb, BreadcrumbItem, Col } from "reactstrap";

export const BreadCrumbs = () => {
  const pathname = usePathname();
  const userId = localStorage.getItem("userId");
  const [role, setRole] = useState("");

  const symbolRegex = /[!@#\$%\^&\*\(\)_\+\{\}\[\]:;"'<>,.?/\\|`~\-=]/g;
  const [firstPart, secondPart, thirdPart] = pathname
    .split("/")
    .slice(1)
    .map((item) => item.replace(symbolRegex, " "));

  const fetchUserRole = async () => {
    try {
      const result = await getUserRole(userId as string);

      setRole(result);
    } catch (error) {}
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  return (
    <Col xs="4" xl="4" className="page-title">
      <h4 className="f-w-700 text-capitalize">
        {thirdPart ? thirdPart : secondPart}
      </h4>
      <nav>
        <Breadcrumb className="justify-content-sm-start align-items-center">
          <BreadcrumbItem>
            <Link
              href={`${
                role === "admin" ? `/admin/admin_dashboard` : `/pages/dashboard`
              }`}
            >
              <Home />
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem className={`f-w-400 text-capitalize`}>
            {firstPart}
          </BreadcrumbItem>
          <BreadcrumbItem className={`f-w-400 ${!thirdPart ? "active" : ""}`}>
            {secondPart}
          </BreadcrumbItem>
          {thirdPart && (
            <BreadcrumbItem className={`f-w-400 active`}>
              {thirdPart}
            </BreadcrumbItem>
          )}
        </Breadcrumb>
      </nav>
    </Col>
  );
};
