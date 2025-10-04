import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Image, Video, Music, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const evidenceFormSchema = z.object({
  studentId: z.string().min(1, "Selecciona un estudiante"),
  taskTitle: z.string().min(1, "El título de la tarea es requerido"),
  subject: z.string().min(1, "La materia es requerida"),
  standardRubric: z.string().min(1, "La rúbrica de evaluación es requerida"),
  evaluatedCompetencies: z.string().optional(),
  originalInstructions: z.string().optional(),
  timeSpent: z.number().optional(),
  reportedDifficulties: z.string().optional(),
});

type EvidenceFormData = z.infer<typeof evidenceFormSchema>;

interface EvidenceUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EvidenceUpload({ onSuccess, onCancel }: EvidenceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const { data: students = [] as any[] } = useQuery({
    queryKey: ["/api/students"],
  });

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceFormSchema),
    defaultValues: {
      studentId: "",
      taskTitle: "",
      subject: "",
      standardRubric: "",
      evaluatedCompetencies: "",
      originalInstructions: "",
      timeSpent: 30,
      reportedDifficulties: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: EvidenceFormData & { file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('taskTitle', data.taskTitle);
      formData.append('subject', data.subject);
      formData.append('standardRubric', data.standardRubric);
      if (data.evaluatedCompetencies) formData.append('evaluatedCompetencies', data.evaluatedCompetencies);
      if (data.originalInstructions) formData.append('originalInstructions', data.originalInstructions);
      if (data.timeSpent) formData.append('timeSpent', data.timeSpent.toString());
      if (data.reportedDifficulties) formData.append('reportedDifficulties', data.reportedDifficulties);

      const response = await fetch(apiEndpoint(`students/${data.studentId}/evidence`), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload evidence');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Evidencia subida",
        description: "La evidencia ha sido subida exitosamente y está lista para análisis.",
      });
      form.reset();
      setSelectedFile(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error al subir evidencia",
        description: "No se pudo subir la evidencia. Verifica el archivo e intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-8 h-8 text-green-500" />;
    if (file.type.startsWith('audio/')) return <Music className="w-8 h-8 text-purple-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = (data: EvidenceFormData) => {
    if (!selectedFile) {
      toast({
        title: "Archivo requerido",
        description: "Por favor selecciona un archivo de evidencia.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ ...data, file: selectedFile });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="evidence-upload-form">
        {/* Student and Task Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estudiante</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-student">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estudiante..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Materia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-subject">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                    <SelectItem value="Lenguaje">Lenguaje</SelectItem>
                    <SelectItem value="Ciencias">Ciencias</SelectItem>
                    <SelectItem value="Historia">Historia</SelectItem>
                    <SelectItem value="Arte">Arte</SelectItem>
                    <SelectItem value="Educación Física">Educación Física</SelectItem>
                    <SelectItem value="Música">Música</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="taskTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de la Tarea</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ensayo sobre el medio ambiente" {...field} data-testid="input-task-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Area */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-foreground">Archivo de Evidencia</label>
          
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="file-upload-area"
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Soporta: Imágenes (JPG, PNG), Videos (MP4, AVI), Audio (MP3, WAV), Documentos (PDF, DOC)
              </p>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.pdf,.doc,.docx,.txt"
                className="hidden"
                id="file-input"
                data-testid="file-input"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
                data-testid="button-select-file"
              >
                Seleccionar archivo
              </Button>
            </div>
          ) : (
            <Card className="p-4" data-testid="selected-file-display">
              <div className="flex items-center space-x-4">
                {getFileIcon(selectedFile)}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  data-testid="button-remove-file"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Rubric and Evaluation Details */}
        <FormField
          control={form.control}
          name="standardRubric"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rúbrica de Evaluación</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe los criterios de evaluación, competencias esperadas y niveles de desempeño..."
                  rows={3}
                  {...field}
                  data-testid="textarea-rubric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="evaluatedCompetencies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competencias Evaluadas</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Comprensión lectora, Pensamiento crítico"
                    {...field}
                    data-testid="input-competencies"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeSpent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo Dedicado (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="300"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-time-spent"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="originalInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instrucciones Originales de la Tarea</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe las instrucciones que se dieron al estudiante..."
                  rows={2}
                  {...field}
                  data-testid="textarea-instructions"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reportedDifficulties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dificultades Reportadas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe cualquier dificultad que el estudiante haya mencionado durante la tarea..."
                  rows={2}
                  {...field}
                  data-testid="textarea-difficulties"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploadMutation.isPending}
            data-testid="button-cancel-upload"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            data-testid="button-submit-upload"
          >
            {uploadMutation.isPending ? "Subiendo..." : "Subir y Analizar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
