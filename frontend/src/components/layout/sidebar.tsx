import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, BarChart3, FileBarChart, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Teacher {
  id: string;
  email: string;
  name: string;
  lastName: string;
  school?: string;
  grade?: string;
  subject?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface SidebarProps {
  teacher: Teacher;
  onLogout: () => void;
}

export default function Sidebar({ teacher, onLogout }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Panel Principal", href: "/", icon: LayoutDashboard, current: location === "/" || location === "/dashboard" },
    { name: "Estudiantes", href: "/students", icon: Users, current: location === "/students" },
    { name: "Evidencias", href: "/evidence", icon: FileText, current: location === "/evidence" },
    { name: "Análisis", href: "/analysis", icon: BarChart3, current: location === "/analysis" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-sm" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.jpeg" 
              alt="FlexiAdapt Logo" 
              className="w-10 h-10 object-cover rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">FlexiAdapt</h1>
            <p className="text-sm text-muted-foreground">Empoderando la educación inclusiva</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                item.current
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
              }`}
              data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span className={item.current ? "font-medium" : ""}>{item.name}</span>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-border mt-4">
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
            data-testid="nav-link-settings"
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </Link>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">
              {teacher.name.charAt(0)}{teacher.lastName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {teacher.name} {teacher.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {teacher.subject && teacher.grade ? `${teacher.subject} - ${teacher.grade}` : teacher.email}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 hover:bg-muted" 
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
