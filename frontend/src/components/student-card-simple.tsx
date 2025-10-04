import React from "react";

interface StudentCardProps {
  student: any;
  showActions?: boolean;
  className?: string;
}

export default function StudentCard({ student, showActions = false, className = "" }: StudentCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h3 className="font-semibold">{student.name}</h3>
      <p className="text-sm text-muted-foreground">Grado: {student.grade}</p>
      <p className="text-sm">Test básico - evidencias se cargarán pronto</p>
    </div>
  );
}
