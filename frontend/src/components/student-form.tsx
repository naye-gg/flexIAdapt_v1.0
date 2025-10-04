import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const studentFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  age: z.number().min(3).max(18),
  grade: z.string().min(1, "Selecciona un grado"),
  mainSubjects: z.string().min(1, "Especifica las materias principales"),
  specialNeeds: z.string().optional(),
  teacherPerspective: z.object({
    attentionLevel: z.string().optional(),
    verbalParticipation: z.string().optional(),
    socialInteraction: z.string().optional(),
    preferredModality: z.string().optional(),
    concentrationTime: z.number().optional(),
    instructionNeeds: z.string().optional(),
    observedStrengths: z.string().optional(),
    successfulActivities: z.string().optional(),
    effectiveStrategies: z.string().optional(),
    mainDifficulties: z.string().optional(),
    conflictiveSituations: z.string().optional(),
    previousAdaptations: z.string().optional(),
    preferredExpression: z.string().optional(),
    selfEsteemLevel: z.number().optional(),
    mainMotivators: z.string().optional(),
    additionalComments: z.string().optional(),
    suspectedSpecialNeeds: z.string().optional(),
    currentSupports: z.string().optional(),
  }).optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<StudentFormData>;
}

export default function StudentForm({ onSubmit, onCancel, isLoading = false, initialData }: StudentFormProps) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      age: 6,
      grade: "",
      mainSubjects: "",
      specialNeeds: "",
      teacherPerspective: {
        attentionLevel: "",
        verbalParticipation: "",
        socialInteraction: "",
        preferredModality: "",
        concentrationTime: 25,
        instructionNeeds: "",
        observedStrengths: "",
        successfulActivities: "",
        effectiveStrategies: "",
        mainDifficulties: "",
        conflictiveSituations: "",
        previousAdaptations: "",
        preferredExpression: "",
        selfEsteemLevel: 7,
        mainMotivators: "",
        additionalComments: "",
        suspectedSpecialNeeds: "",
        currentSupports: "",
      },
      ...initialData,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="student-form">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: María González López" {...field} data-testid="input-student-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-student-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-student-grade">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar grado..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1ro Primaria">1° Primaria</SelectItem>
                        <SelectItem value="2do Primaria">2° Primaria</SelectItem>
                        <SelectItem value="3ro Primaria">3° Primaria</SelectItem>
                        <SelectItem value="4to Primaria">4° Primaria</SelectItem>
                        <SelectItem value="5to Primaria">5° Primaria</SelectItem>
                        <SelectItem value="6to Primaria">6° Primaria</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mainSubjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materias Principales</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Matemáticas, Lenguaje, Ciencias" {...field} data-testid="input-student-subjects" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specialNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Necesidades Especiales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las necesidades especiales identificadas..."
                      rows={3}
                      {...field}
                      data-testid="textarea-special-needs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Teacher Perspective */}
        <Card>
          <CardHeader>
            <CardTitle>Perspectiva del Docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="teacherPerspective.attentionLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nivel de Atención en Clase</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-attention-level">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nivel..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Baja">Baja</SelectItem>
                        <SelectItem value="Variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.verbalParticipation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participación Verbal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-verbal-participation">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Activa">Activa</SelectItem>
                        <SelectItem value="Moderada">Moderada</SelectItem>
                        <SelectItem value="Limitada">Limitada</SelectItem>
                        <SelectItem value="No verbal">No verbal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.socialInteraction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interacción Social</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-social-interaction">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sociable">Sociable</SelectItem>
                        <SelectItem value="Selectivo">Selectivo</SelectItem>
                        <SelectItem value="Reservado">Reservado</SelectItem>
                        <SelectItem value="Evita">Evita</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.preferredModality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad de Aprendizaje Preferida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-preferred-modality">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar modalidad..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Visual">Visual</SelectItem>
                        <SelectItem value="Auditiva">Auditiva</SelectItem>
                        <SelectItem value="Kinestésica">Kinestésica</SelectItem>
                        <SelectItem value="Lecto-escritura">Lecto-escritura</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.concentrationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Concentración (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="5"
                        max="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-concentration-time"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.instructionNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Necesita Instrucciones</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-instruction-needs">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Una vez">Una vez</SelectItem>
                        <SelectItem value="Repetidas">Repetidas</SelectItem>
                        <SelectItem value="Escritas">Escritas</SelectItem>
                        <SelectItem value="Visuales">Visuales</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="teacherPerspective.observedStrengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fortalezas Observadas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las fortalezas que has observado..."
                        rows={2}
                        {...field}
                        data-testid="textarea-observed-strengths"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.effectiveStrategies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estrategias Efectivas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="¿Qué estrategias han funcionado bien?"
                        rows={2}
                        {...field}
                        data-testid="textarea-effective-strategies"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teacherPerspective.mainDifficulties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principales Dificultades</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las principales dificultades observadas..."
                        rows={2}
                        {...field}
                        data-testid="textarea-main-difficulties"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} data-testid="button-cancel-student">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit-student">
            {isLoading ? "Creando..." : "Crear Estudiante"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
