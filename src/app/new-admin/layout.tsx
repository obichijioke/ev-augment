"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Users,
  Settings,
  BarChart3,
  FileText,
  MessageSquare,
  CheckCircle2,
  ListChecks,
  LayoutDashboard,
  Car,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuthStore } from "@/store/authStore";

export default function NewAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, isModeratorOrAdmin, isAdmin, isLoading } = useUserRole();

  const hasAccess = isModeratorOrAdmin;

  // While determining role, show a spinner
  if (isLoading || role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-8 h-8 border border-gray-200 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions…</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Access restricted</h1>
          <p className="text-gray-600">
            You need moderator or admin privileges to access the new admin
            dashboard.
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const NavLink = ({
    href,
    label,
    icon: Icon,
    adminOnly = false,
  }: {
    href: string;
    label: string;
    icon: any;
    adminOnly?: boolean;
  }) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    if (adminOnly && !isAdmin) return null;
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
          active
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-gray-200 bg-white p-4 hidden md:block">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">New Admin</h2>
          <p className="text-xs text-gray-500">Advanced controls</p>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink href="/new-admin" label="Overview" icon={LayoutDashboard} />
          <NavLink href="/new-admin/users" label="Users" icon={Users} />
          <NavLink
            href="/new-admin/moderation"
            label="Moderation"
            icon={CheckCircle2}
          />
          <NavLink href="/new-admin/blog" label="Blog" icon={FileText} />
          <NavLink href="/new-admin/forum" label="Forum" icon={MessageSquare} />
          <NavLink href="/new-admin/ev-listings" label="Vehicles" icon={Car} />
          <NavLink href="/new-admin/reports" label="Reports" icon={FileText} />
          <NavLink
            href="/new-admin/analytics"
            label="Analytics"
            icon={BarChart3}
            adminOnly
          />
          <NavLink
            href="/new-admin/settings"
            label="Settings"
            icon={Settings}
            adminOnly
          />
          <NavLink
            href="/new-admin/logs"
            label="Logs"
            icon={ListChecks}
            adminOnly
          />
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
