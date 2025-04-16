import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sun, Moon, Menu, UserCircle } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface NavItem {
  label: string;
  path: string;
}

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Home", path: "/" },
    { label: "Technology", path: "/category/technology" },
    { label: "Sports", path: "/category/sports" },
    { label: "General", path: "/category/general" },
    { label: "My Interests", path: "/interests" },
  ];

  return (
    <header className="bg-white dark:bg-neutral-800 sticky top-0 z-50 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">
                NewsFlow
              </span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <nav className="flex space-x-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      location === item.path
                        ? "bg-primary text-white"
                        : "text-neutral-600 hover:text-primary dark:text-neutral-300"
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span className="font-medium">{user.username}</span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span>{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="text-red-600 dark:text-red-400"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?tab=register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>NewsFlow</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <a
                          className={`px-3 py-2 text-base font-medium rounded-md ${
                            location === item.path
                              ? "bg-primary text-white"
                              : "text-neutral-600 hover:text-primary dark:text-neutral-300"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-6">
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                            <span>{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-base font-medium text-neutral-800 dark:text-neutral-200">
                              {user.username}
                            </p>
                          </div>
                        </div>
                        <Link href="/profile">
                          <a
                            className="block px-3 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-md"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Profile Settings
                          </a>
                        </Link>
                        <button
                          onClick={() => {
                            logoutMutation.mutate();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-neutral-100 dark:text-red-400 dark:hover:bg-neutral-700 rounded-md"
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => setMobileMenuOpen(false)}
                          variant="outline"
                          asChild
                        >
                          <Link href="/auth">Login</Link>
                        </Button>
                        <Button
                          onClick={() => setMobileMenuOpen(false)}
                          asChild
                        >
                          <Link href="/auth?tab=register">Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


