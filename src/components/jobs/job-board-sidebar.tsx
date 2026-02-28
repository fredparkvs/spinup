"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  User,
  SlidersHorizontal,
  Eye,
  Search,
  Heart,
  Building2,
  Send,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { JbRole } from "@/lib/jobs/types";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const APPLICANT_NAV: NavItem[] = [
  { label: "My Profile", href: "/jobs/profile", icon: User },
  { label: "Preferences", href: "/jobs/preferences", icon: SlidersHorizontal },
  { label: "Preview", href: "/jobs/my-profile", icon: Eye },
];

const COMPANY_NAV: NavItem[] = [
  { label: "Browse Applicants", href: "/jobs/applicants", icon: Search },
  { label: "Favourites", href: "/jobs/favourites", icon: Heart },
  { label: "Company Profile", href: "/jobs/company-profile", icon: Building2 },
  { label: "Outreach", href: "/jobs/outreach", icon: Send },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Admin", href: "/jobs/admin", icon: ShieldCheck },
];

interface JobBoardSidebarProps {
  jbRoles: JbRole[];
  platformRole: string;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  jbRoles,
  platformRole,
  onSignOut,
}: JobBoardSidebarProps & { onSignOut: () => void }) {
  const pathname = usePathname();
  const isApplicant = jbRoles.includes("applicant");
  const isCompany = jbRoles.includes("company_member");
  const isAdmin = platformRole === "admin";

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="text-base font-semibold">Job Board</h2>
        <p className="text-xs text-muted-foreground">
          {isApplicant && isCompany
            ? "Applicant & Company"
            : isApplicant
              ? "Applicant"
              : "Company"}
        </p>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {isApplicant && (
          <>
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              My Profile
            </p>
            {APPLICANT_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <Separator className="my-2" />
          </>
        )}

        {(isCompany || isAdmin) && (
          <>
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Company
            </p>
            {COMPANY_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <Separator className="my-2" />
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <Separator />

      <div className="p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span>Back to Apps</span>
        </Link>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export function JobBoardSidebar(props: JobBoardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center border-b bg-background px-4 py-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Job Board Navigation</SheetTitle>
            <SidebarContent {...props} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
        <span className="ml-3 text-sm font-semibold">Job Board</span>
      </div>

      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background">
        <SidebarContent {...props} onSignOut={handleSignOut} />
      </aside>
    </>
  );
}
