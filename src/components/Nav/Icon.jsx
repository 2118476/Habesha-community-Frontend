// src/components/Nav/Icon.jsx
import React from "react";
import {
  Bell,
  MessageSquare,
  UserPlus,
  Users,
  ArrowLeftRight,
  Home,
  Plane,
  Wrench,
  Megaphone,
  Menu,
  Search,
  Store,
  Tag,
  HelpCircle,
} from "lucide-react";

const registry = {
  // core
  bell: Bell,
  message: MessageSquare,
  userplus: UserPlus,
  users: Users,
  menu: Menu,
  search: Search,
  help: HelpCircle,

  // sections
  swap: ArrowLeftRight,          // Home Swap
  home: Home,                    // Rentals / Home
  rentals: Home,
  plane: Plane,                  // Travel
  travel: Plane,
  wrench: Wrench,                // Services
  services: Wrench,

  // actions
  ads: Megaphone,
  store: Store,
  tag: Tag,
};

export default function Icon({ name, ...props }) {
  const Cmp = registry[name] || Bell;
  return <Cmp aria-hidden="true" {...props} />;
}
