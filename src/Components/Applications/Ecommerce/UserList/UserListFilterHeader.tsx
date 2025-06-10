import Link from "next/link";

export const UserListFilterHeader = () => {
  ///admin/users/add_user
  return (
    <>
      <Link className="btn btn-primary" href={`/admin/users/add_user`}>
        <i className="fa fa-plus" />
        {"Add User"}
      </Link>
    </>
  );
};
