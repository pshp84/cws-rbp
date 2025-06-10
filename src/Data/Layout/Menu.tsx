"use client";
import { MenuItem } from "@/Types/LayoutTypes";

const menuList: MenuItem[] = [
  {
    title: "Admin",
    lanClass: "lan-8",
    menucontent: "Admin",
    Items: [
      {
        title: "Dashboard",
        id: 1,
        icon: "home",
        type: "link",
        path: "/admin/admin_dashboard",
      },
      {
        path: "/admin/users",
        icon: "user",
        type: "link",
        title: "Users",
        id: 2,
      },
      // {
      //   path: "/admin/memberships",
      //   icon: "user",
      //   type: "link",
      //   title: "Membership Details",
      //   id: 3
      // },
      // {
      //   title: "HVAC",
      //   id: 4,
      //   icon: "ecommerce",
      //   type: "sub",
      //   active: false,
      //   children: [
      //     { path: "/admin/hvac/filters", title: "HVAC Filters", type: "link" },
      //     {
      //       path: "/admin/hvac/orders",
      //       title: "HVAC Orders",
      //       type: "link",
      //     },
      //     {
      //       path: "/admin/hvac/subscription",
      //       title: "HVAC Subscription",
      //       type: "link",
      //     },
      //   ],
      // },
      {
        title: "Deals",
        id: 5,
        icon: "ecommerce",
        type: "sub",
        active: false,
        children: [
          { path: "/admin/deals", title: "Deals", type: "link" },
          { path: "/admin/deals/add-new", title: "Add New Deal", type: "link" },
          {
            path: "/admin/deals/categories",
            title: "Deal Categories",
            type: "link",
          },
          {
            path: "/admin/deals/deals-banner",
            title: "Deals Banner",
            type: "link",
          }
        ],
      },
      {
        title: "Rewards",
        id: 6,
        icon: "ecommerce",
        type: "sub",
        active: false,
        children: [
          { path: "/admin/rewards", title: "Points Log", type: "link" },
          { path: "/admin/rewards/add-points", title: "Add Points", type: "link" },
          {
            path: "/admin/rewards/points-settings",
            title: "Points Settings",
            type: "link",
          },
          {
            path: "/admin/rewards/lease-information",
            title: "Lease Information",
            type: "link",
          }
        ],
      },
      {
        path: "/admin/utility-settings",
        icon: "ecommerce",
        type: "link",
        active: false,
        title: "Utility Settings",
        id: 7,
      },
      {
        path: "/admin/utm-campaigns",
        icon: "ecommerce",
        type: "link",
        active: false,
        title: "UTM Campaigns",
        id: 8,
      },
      {
        path: "/admin/free-memberships-request",
        icon: "ecommerce",
        type: "link",
        active: false,
        title: "Free Membership Request",
        id: 9,
      },
      {
        path: "/admin/affiliates",
        icon: "ecommerce",
        type: "link",
        active: false,
        title: "Affiliates",
        id: 10,
      }
    ],
  },
];

export const MenuList: MenuItem[] = menuList;
