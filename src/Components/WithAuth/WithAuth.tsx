import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

type WithAuthProps = {};

const withAuth = <T extends WithAuthProps>(
  WrappedComponent: React.ComponentType<T>
) => {
  const WithAuth = (props: T) => {
    const isAuthenticated = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isAuthenticated === false) {
        router.push("/auth/login");
      }
    }, [isAuthenticated, router]);

    if (isAuthenticated === null) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };

  return WithAuth;
};

export default withAuth;
