"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pill, MessageCircle, User, LayoutGrid, Users, Plus } from "lucide-react";
import clsx from "classnames";
import { useAuth } from "@/context/AuthContext";

export default function NavTabs(){
  const pathname = usePathname();
  const { user } = useAuth();
  const parentTabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/parent/children", label: "Children", icon: Users },
    { href: "/parent/add-med", label: "Add Med", icon: Plus },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];
  const childTabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/meds", label: "Meds", icon: Pill },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];
  const tabs = user?.role === "parent" ? parentTabs : childTabs;

  return (
    <nav className="mb-6">
      <div className="flex gap-2">
        {tabs.map(t => {
          const Icon:any = t.icon;
          const active = pathname?.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={clsx(
              "flex-1 card card-pad flex items-center gap-2 justify-center",
              active ? "ring-2 ring-slate-300 bg-mint" : ""
            )}>
              <Icon size={18} />
              <span className="font-medium">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}