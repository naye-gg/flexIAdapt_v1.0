import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import StudentCard from "@/components/student-card";
import StudentForm from "@/components/student-form";
import { useStudents, useCreateStudent } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Students() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: students = [], isLoading } = useStudents();
  const createStudentMutation = useCreateStudent();

  const handleCreateStudent = async (studentData: any) => {
    try {
      await createStudentMutation.mutateAsync(studentData);
      setIsCreateOpen(false);
      toast({
        title: "Éxito",
        description: "Estudiante creado exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al crear estudiante: " + (error.message || error),
        variant: "destructive",
      });
    }
  };

  const filteredStudents = (students as any[]).filter((student: any) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.mainSubjects.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-student" className="ml-auto flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-student">
            <DialogHeader>
              <DialogTitle>Crear Perfil de Estudiante</DialogTitle>
            </DialogHeader>
            <StudentForm
              onSubmit={handleCreateStudent}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createStudentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6" data-testid="card-search-filters">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Buscar por nombre, grado o materias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-students"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card data-testid="card-students-list">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Estudiantes ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="flex space-x-2">
                      <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                      <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 bg-muted rounded w-8 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "No se encontraron estudiantes" : "No hay estudiantes registrados"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No hay estudiantes que coincidan con "${searchTerm}"`
                  : "Comienza creando el primer perfil de estudiante"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-student">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear primer estudiante
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student: any) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  showActions={true}
                  data-testid={`student-card-${student.id}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
