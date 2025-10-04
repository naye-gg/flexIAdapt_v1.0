import React, { useState, useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Evidence from "@/pages/evidence";
import Analysis from "@/pages/analysis";
import NotFound from "@/pages/not-found";
import { LoginPage } from "@/components/auth/login-page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/evidence" component={Evidence} />
      <Route path="/analysis" component={Analysis} />
      <Route component={NotFound} />
    </Switch>
  );
}

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

function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('teacherToken');
    const savedTeacher = localStorage.getItem('teacherData');
    
    if (savedToken && savedTeacher) {
      try {
        const teacherData = JSON.parse(savedTeacher);
        setTeacher(teacherData);
        setToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved teacher data:', error);
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherData');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (teacherData: Teacher, tokenData: string) => {
    setTeacher(teacherData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    setTeacher(null);
    setToken(null);
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!teacher || !token) {
    return (
      <TooltipProvider>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-muted/30">
        <Sidebar teacher={teacher} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header teacher={teacher} onLogout={handleLogout} />
          <div className="flex-1 overflow-auto">
            <Router />
          </div>
        </main>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
