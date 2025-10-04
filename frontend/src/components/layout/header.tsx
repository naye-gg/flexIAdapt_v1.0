import { Button } from "@/components/ui/button";
import { UserPlus, Upload, Bell, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";

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

interface HeaderProps {
  teacher: Teacher;
  onLogout: () => void;
}

export default function Header({ teacher, onLogout }: HeaderProps) {
  const [location] = useLocation();

  const getPageTitle = () => {
    switch (location) {
      case "/students": return "Gestión de Estudiantes";
      case "/evidence": return "Gestión de Evidencias";
      case "/analysis": return "Análisis y Reportes";
      default: return "Panel Principal";
    }
  };

  const getPageDescription = () => {
    switch (location) {
      case "/students": return "Administra los perfiles y perspectivas de tus estudiantes";
      case "/evidence": return "Administra y analiza las evidencias de aprendizaje";
      case "/analysis": return "Visualiza el progreso y rendimiento de tus estudiantes";
      default: return "Gestiona y evalúa el progreso de tus estudiantes";
    }
  };

  return (
    <header className="bg-card border-b border-border p-6" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{getPageTitle()}</h2>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          {location === "/" || location === "/dashboard" ? (
            <>
              <Button variant="default" asChild data-testid="button-header-new-student">
                <a href="/students">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Estudiante
                </a>
              </Button>
              <Button variant="secondary" asChild data-testid="button-header-upload-evidence">
                <a href="/evidence">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Evidencia
                </a>
              </Button>
            </>
          ) : null}
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2" data-testid="button-notifications">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
          </Button>

        </div>
      </div>
    </header>
  );
}
