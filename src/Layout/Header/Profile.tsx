import { Href, ImagePath, Logout } from "@/Constant";
import { UserProfileData } from "@/Data/Layout";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogOut } from "react-feather";
import { dbClient, getUserById } from "@/DbClient/index";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import { Spinner } from "reactstrap";

export const Profile = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>();
  const getUserId = localStorage.getItem("userId");

  const LogOutUser = async () => {
    router.push("/sign-out");
    localStorage.removeItem("userRole");
    localStorage.clear();
  };

  const fetchUser = async () => {
    try {
      const data = await getUserById(getUserId as string);
      setUser(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [getUserId]);

  // if (!user) {
  //   return (
  //     <div
  //       className="d-flex justify-content-center align-items-center"
  //       style={{ height: "100vh" }}
  //     >
  //       <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
  //     </div>
  //   );
  // }

  return (
    <li className="profile-nav onhover-dropdown px-0 py-0">
      <div className="d-flex profile-media">
        <Image
          height={30}
          width={30}
          className="img-30"
          src={session?.user?.image || `${ImagePath}/dashboard/profile.png`}
          alt=""
        />
        <div className="flex-grow-1">
          <span>{(user && user.first_name) + " " + (user && user.last_name)}</span>
          <i className="fa fa-angle-down"></i>
          
        </div>
      </div>
      <ul className="profile-dropdown onhover-show-div">
        {UserProfileData.map((item, index) => (
          <li key={index}>
            <Link href={`/${item.link}`}>
              {item.icon}
              <span>{item.title} </span>
            </Link>
          </li>
        ))}
        <li onClick={LogOutUser}>
          <Link href={Href} scroll={false}>
            <LogOut />
            <span>{Logout} </span>
          </Link>
        </li>
      </ul>
    </li>
  );
};
