import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Edit, 
  Save, 
  Brain, 
  ArrowLeft,
  Sparkles,
  Eye,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

// Schema para edición del perfil
const profileSchema = z.object({
  dominantLearningPattern: z.string().min(1, "Requerido"),
  detectedSpecialAbilities: z.string().optional(),
  identifiedNeeds: z.string().optional(),
  recommendedTeachingStrategies: z.string().optional(),
  suggestedEvaluationInstruments: z.string().optional(),
  personalizedDidacticMaterials: z.string().optional(),
  curricularAdaptationPlan: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener información del estudiante
    const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: [`/api/student/${studentId}`],
    queryFn: () => studentsApi.getById(studentId),
  });

  // Query para obtener el perfil de aprendizaje
  const { data: learningProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/student-operations/${studentId}/learning-profile`],
    enabled: !!studentId,
  });

  // Query para obtener perspectiva del docente
  const { data: teacherPerspective, isLoading: perspectiveLoading } = useQuery({
    queryKey: [`/api/student-operations/${studentId}/perspective`],
    enabled: !!studentId,
  });

  // Query para obtener evidencias
  const { data: evidences = [], isLoading: evidencesLoading } = useQuery({
    queryKey: [`/api/student-operations/${studentId}/evidence`],
    enabled: !!studentId,
  });

  // Form para editar perfil
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dominantLearningPattern: learningProfile?.dominantLearningPattern || "",
      detectedSpecialAbilities: learningProfile?.detectedSpecialAbilities || "",
      identifiedNeeds: learningProfile?.identifiedNeeds || "",
      recommendedTeachingStrategies: learningProfile?.recommendedTeachingStrategies || "",
      suggestedEvaluationInstruments: learningProfile?.suggestedEvaluationInstruments || "",
      personalizedDidacticMaterials: learningProfile?.personalizedDidacticMaterials || "",
      curricularAdaptationPlan: learningProfile?.curricularAdaptationPlan || "",
    },
  });

  // Actualizar form cuando se carga el perfil
  React.useEffect(() => {
    if (learningProfile) {
      form.reset({
        dominantLearningPattern: learningProfile.dominantLearningPattern || "",
        detectedSpecialAbilities: learningProfile.detectedSpecialAbilities || "",
        identifiedNeeds: learningProfile.identifiedNeeds || "",
        recommendedTeachingStrategies: learningProfile.recommendedTeachingStrategies || "",
        suggestedEvaluationInstruments: learningProfile.suggestedEvaluationInstruments || "",
        personalizedDidacticMaterials: learningProfile.personalizedDidacticMaterials || "",
        curricularAdaptationPlan: learningProfile.curricularAdaptationPlan || "",
      });
    }
  }, [learningProfile, form]);

  // Mutación para generar perfil con IA
  const generateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/students/${studentId}/generate-ai-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error generating profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil generado",
        description: "El perfil de aprendizaje se ha generado exitosamente con IA",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/learning-profile`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el perfil",
        variant: "destructive",
      });
    }
  });

  // Mutación para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch(`/api/students/${studentId}/learning-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, studentId }),
      });
      if (!response.ok) throw new Error('Error updating profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}/learning-profile`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const analyzedEvidences = evidences.filter((e: any) => e.isAnalyzed);
  const canGenerateProfile = analyzedEvidences.length > 0;

  if (studentLoading || profileLoading || perspectiveLoading || evidencesLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/students')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{student?.name}</h1>
            <p className="text-muted-foreground">
              {student?.grade} • {student?.age} años
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {learningProfile ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Perfil Generado
            </Badge>
          ) : (
            <Badge variant="secondary">
              Sin Perfil IA
            </Badge>
          )}
          
          <Button
            onClick={() => generateProfileMutation.mutate()}
            disabled={!canGenerateProfile || generateProfileMutation.isPending}
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generateProfileMutation.isPending ? "Generando..." : "Generar Perfil IA"}
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Información Básica */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="font-medium">{student?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Edad</label>
              <p>{student?.age} años</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Grado</label>
              <p>{student?.grade}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Materias Principales</label>
              <p className="text-sm">{student?.mainSubjects}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Necesidades Especiales</label>
              <p className="text-sm">{student?.specialNeeds || "No reportadas"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Evidencias</label>
              <p className="text-sm">{evidences.length} total • {analyzedEvidences.length} analizadas</p>
            </div>
          </CardContent>
        </Card>

        {/* Perfil de Aprendizaje */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Perfil de Aprendizaje
              </CardTitle>
              
              {learningProfile && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil de Aprendizaje</DialogTitle>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="dominantLearningPattern"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Patrón Dominante de Aprendizaje</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar modalidad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Visual">Visual</SelectItem>
                                  <SelectItem value="Auditivo">Auditivo</SelectItem>
                                  <SelectItem value="Kinestésico">Kinestésico</SelectItem>
                                  <SelectItem value="Lectoescritor">Lectoescritor</SelectItem>
                                  <SelectItem value="Multimodal">Multimodal</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="detectedSpecialAbilities"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Habilidades Especiales Detectadas</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="identifiedNeeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Necesidades Identificadas</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="recommendedTeachingStrategies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estrategias de Enseñanza Recomendadas</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={4} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="suggestedEvaluationInstruments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instrumentos de Evaluación Sugeridos</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="personalizedDidacticMaterials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Materiales Didácticos Personalizados</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="curricularAdaptationPlan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plan de Adaptaciones Curriculares</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={4} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {learningProfile ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">PATRÓN DOMINANTE</h3>
                  <Badge variant="outline" className="text-lg">
                    {learningProfile.dominantLearningPattern}
                  </Badge>
                </div>

                {learningProfile.detectedSpecialAbilities && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">🌟 HABILIDADES ESPECIALES</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.detectedSpecialAbilities}</p>
                  </div>
                )}

                {learningProfile.identifiedNeeds && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">📋 NECESIDADES IDENTIFICADAS</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.identifiedNeeds}</p>
                  </div>
                )}

                {learningProfile.recommendedTeachingStrategies && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">🎓 ESTRATEGIAS DE ENSEÑANZA</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.recommendedTeachingStrategies}</p>
                  </div>
                )}

                {learningProfile.suggestedEvaluationInstruments && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">📊 INSTRUMENTOS DE EVALUACIÓN</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.suggestedEvaluationInstruments}</p>
                  </div>
                )}

                {learningProfile.personalizedDidacticMaterials && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">📚 MATERIALES DIDÁCTICOS</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.personalizedDidacticMaterials}</p>
                  </div>
                )}

                {learningProfile.curricularAdaptationPlan && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">⚙️ ADAPTACIONES CURRICULARES</h3>
                    <p className="text-sm whitespace-pre-wrap">{learningProfile.curricularAdaptationPlan}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin Perfil de Aprendizaje</h3>
                <p className="text-muted-foreground mb-4">
                  {canGenerateProfile 
                    ? "Tienes evidencias analizadas. Genera el perfil con IA."
                    : "Necesitas al menos 1 evidencia analizada para generar el perfil."
                  }
                </p>
                {canGenerateProfile && (
                  <Button 
                    onClick={() => generateProfileMutation.mutate()}
                    disabled={generateProfileMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateProfileMutation.isPending ? "Generando..." : "Generar con IA"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Perspectiva del Docente */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Perspectiva del Docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherPerspective ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">ATENCIÓN</h3>
                  <p className="text-sm">{teacherPerspective.attentionLevel}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">PARTICIPACIÓN</h3>
                  <p className="text-sm">{teacherPerspective.verbalParticipation}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">MODALIDAD PREFERIDA</h3>
                  <p className="text-sm">{teacherPerspective.preferredModality}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">FORTALEZAS</h3>
                  <p className="text-sm">{teacherPerspective.observedStrengths}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">DIFICULTADES</h3>
                  <p className="text-sm">{teacherPerspective.mainDifficulties}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">MOTIVADORES</h3>
                  <p className="text-sm">{teacherPerspective.mainMotivators}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No hay perspectiva docente registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
