import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, BrainCircuit, MessageCircle, Sparkles, Save, User, Brain, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentChat from "./student-chat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch } from "@/hooks/useAuth";

interface StudentCardProps {
  student: any;
  showActions?: boolean;
  className?: string;
}

export default function StudentCard({ student, showActions = false, className = "" }: StudentCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    dominantLearningPattern: "",
    detectedSpecialAbilities: "",
    identifiedNeeds: "",
    recommendedTeachingStrategies: "",
    suggestedEvaluationInstruments: "",
    personalizedDidacticMaterials: "",
    curricularAdaptationPlan: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener el perfil de aprendizaje
  const { data: learningProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/students/${student.id}/learning-profile`],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/students/${student.id}/learning-profile`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: showProfile,
  });

  // Query para obtener evidencias
  const { data: evidences = [] } = useQuery({
    queryKey: [`/api/students/${student.id}/evidence`],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/students/${student.id}/evidence`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Mutación para generar perfil con IA
  const generateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(`/api/students/${student.id}/generate-ai-profile`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error generating profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil generado",
        description: "El perfil de aprendizaje se ha generado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${student.id}/learning-profile`] });
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
    mutationFn: async (data: any) => {
      const response = await authenticatedFetch(`/api/students/${student.id}/learning-profile`, {
        method: 'POST',
        body: JSON.stringify({ ...data, studentId: student.id }),
      });
      if (!response.ok) throw new Error('Error updating profile');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado exitosamente",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: [`/api/students/${student.id}/learning-profile`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  });

  // Actualizar profileData cuando se carga el perfil
  useState(() => {
    if (learningProfile) {
      setProfileData({
        dominantLearningPattern: (learningProfile as any).dominantLearningPattern || "",
        detectedSpecialAbilities: (learningProfile as any).detectedSpecialAbilities || "",
        identifiedNeeds: (learningProfile as any).identifiedNeeds || "",
        recommendedTeachingStrategies: (learningProfile as any).recommendedTeachingStrategies || "",
        suggestedEvaluationInstruments: (learningProfile as any).suggestedEvaluationInstruments || "",
        personalizedDidacticMaterials: (learningProfile as any).personalizedDidacticMaterials || "",
        curricularAdaptationPlan: (learningProfile as any).curricularAdaptationPlan || "",
      });
    }
  });

  const analyzedEvidences = Array.isArray(evidences) ? evidences.filter((e: any) => e.isAnalyzed) : [];
  const canGenerateProfile = analyzedEvidences.length > 0;
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-accent',
      'bg-chart-1', 
      'bg-chart-3',
      'bg-primary',
      'bg-chart-2'
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSpecialNeedsBadgeColor = (need: string) => {
    const lowerNeed = need.toLowerCase();
    if (lowerNeed.includes('autismo') || lowerNeed.includes('tea')) {
      return 'bg-primary/10 text-primary';
    }
    if (lowerNeed.includes('tdah')) {
      return 'bg-chart-2/10 text-chart-2';
    }
    if (lowerNeed.includes('dislexia')) {
      return 'bg-chart-5/10 text-chart-5';
    }
    return 'bg-muted text-muted-foreground';
  };

  const getModalityColor = (modality: string) => {
    switch (modality?.toLowerCase()) {
      case 'visual':
        return 'bg-accent/10 text-accent';
      case 'auditiva':
      case 'auditivo':
        return 'bg-chart-4/10 text-chart-4';
      case 'kinestésica':
      case 'kinestésico':
        return 'bg-chart-1/10 text-chart-1';
      case 'lecto-escritura':
      case 'lectora':
        return 'bg-chart-3/10 text-chart-3';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const calculateAverageScore = () => {
    const analyzedEvidence = Array.isArray(evidences) ? evidences.filter((e: any) => e.analysisResult?.adaptedScore) : [];
    if (analyzedEvidence.length === 0) return null;
    
    const total = analyzedEvidence.reduce((sum: number, e: any) => 
      sum + parseFloat(e.analysisResult.adaptedScore), 0
    );
    return (total / analyzedEvidence.length).toFixed(1);
  };

  const averageScore = calculateAverageScore();
  const evidenceCount = Array.isArray(evidences) ? evidences.length : 0;

  return (
    <div className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors ${className}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${getAvatarColor(student.id)} rounded-full flex items-center justify-center`}>
          <span className="text-white font-semibold text-sm">
            {getInitials(student.name)}
          </span>
        </div>
        
        <div>
          <h4 className="font-medium text-foreground" data-testid={`student-name-${student.id}`}>
            {student.name}
          </h4>
          <p className="text-sm text-muted-foreground">
            {student.grade} • {student.mainSubjects}
          </p>
          
          <div className="flex items-center space-x-2 mt-1">
            {student.specialNeeds && (
              <Badge 
                className={`text-xs ${getSpecialNeedsBadgeColor(student.specialNeeds)}`}
                data-testid={`special-needs-badge-${student.id}`}
              >
                {student.specialNeeds.split(' ')[0]}
              </Badge>
            )}
            
            {student.teacherPerspective?.preferredModality && (
              <Badge 
                className={`text-xs ${getModalityColor(student.teacherPerspective.preferredModality)}`}
                data-testid={`modality-badge-${student.id}`}
              >
                {student.teacherPerspective.preferredModality}
              </Badge>
            )}
            
            {student.learningProfile && (
              <Badge variant="secondary" className="text-xs" data-testid={`profile-badge-${student.id}`}>
                <BrainCircuit className="w-3 h-3 mr-1" />
                Perfil IA
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="text-center">
          {averageScore ? (
            <>
              <p className="text-sm font-medium text-foreground" data-testid={`average-score-${student.id}`}>
                {averageScore}
              </p>
              <p className="text-xs text-muted-foreground">Promedio</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">-</p>
              <p className="text-xs text-muted-foreground">Sin datos</p>
            </>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {evidenceCount} evidencia{evidenceCount !== 1 ? 's' : ''}
          </p>
        </div>

        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                data-testid={`student-actions-${student.id}`}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setShowChat(true)}
                data-testid={`button-chat-student-${student.id}`}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat con IA
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowProfile(true)}
                data-testid={`button-view-student-${student.id}`}
              >
                <User className="w-4 h-4 mr-2" />
                Ver perfil completo
              </DropdownMenuItem>
              <DropdownMenuItem data-testid={`button-edit-student-${student.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Editar información
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => generateProfileMutation.mutate()}
                disabled={!canGenerateProfile || generateProfileMutation.isPending}
                data-testid={`button-generate-profile-${student.id}`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateProfileMutation.isPending ? "Generando..." : "Generar perfil IA"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl w-full h-[80vh] max-h-[600px] p-0">
          <StudentChat 
            student={student} 
            onClose={() => setShowChat(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Perfil de {student.name}
              </div>
              <div className="flex items-center space-x-2">
                {learningProfile ? (
                  <Badge className="bg-green-100 text-green-800">
                    <BrainCircuit className="w-4 h-4 mr-1" />
                    Perfil IA Generado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sin Perfil IA</Badge>
                )}
                {!learningProfile && canGenerateProfile && (
                  <Button
                    size="sm"
                    onClick={() => generateProfileMutation.mutate()}
                    disabled={generateProfileMutation.isPending}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateProfileMutation.isPending ? "Generando..." : "Generar con IA"}
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="font-medium">{student.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Edad y Grado</label>
                <p>{student.age} años • {student.grade}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Materias Principales</label>
                <p className="text-sm">{student.mainSubjects}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Necesidades Especiales</label>
                <p className="text-sm">{student.specialNeeds || "No reportadas"}</p>
              </div>
            </div>

            {/* Perfil de Aprendizaje */}
            {learningProfile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Perfil de Aprendizaje (IA)
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditingProfile ? "Cancelar" : "Editar"}
                  </Button>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div>
                      <label className="text-sm font-medium">Patrón Dominante de Aprendizaje</label>
                      <Select
                        value={profileData.dominantLearningPattern}
                        onValueChange={(value) => setProfileData({...profileData, dominantLearningPattern: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Visual">Visual</SelectItem>
                          <SelectItem value="Auditivo">Auditivo</SelectItem>
                          <SelectItem value="Kinestésico">Kinestésico</SelectItem>
                          <SelectItem value="Lectoescritor">Lectoescritor</SelectItem>
                          <SelectItem value="Multimodal">Multimodal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Habilidades Especiales</label>
                      <Textarea
                        value={profileData.detectedSpecialAbilities}
                        onChange={(e) => setProfileData({...profileData, detectedSpecialAbilities: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Necesidades Identificadas</label>
                      <Textarea
                        value={profileData.identifiedNeeds}
                        onChange={(e) => setProfileData({...profileData, identifiedNeeds: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Estrategias de Enseñanza</label>
                      <Textarea
                        value={profileData.recommendedTeachingStrategies}
                        onChange={(e) => setProfileData({...profileData, recommendedTeachingStrategies: e.target.value})}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => updateProfileMutation.mutate(profileData)}
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">🧠 PATRÓN DOMINANTE</h4>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {(learningProfile as any).dominantLearningPattern || "No identificado"}
                      </Badge>
                    </div>

                    {(learningProfile as any).detectedSpecialAbilities && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">🌟 HABILIDADES ESPECIALES</h4>
                        <p className="text-sm whitespace-pre-wrap">{(learningProfile as any).detectedSpecialAbilities}</p>
                      </div>
                    )}

                    {(learningProfile as any).identifiedNeeds && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">📋 NECESIDADES IDENTIFICADAS</h4>
                        <p className="text-sm whitespace-pre-wrap">{(learningProfile as any).identifiedNeeds}</p>
                      </div>
                    )}

                    {(learningProfile as any).recommendedTeachingStrategies && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">🎓 ESTRATEGIAS DE ENSEÑANZA</h4>
                        <p className="text-sm whitespace-pre-wrap">{(learningProfile as any).recommendedTeachingStrategies}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin Perfil de Aprendizaje</h3>
                <p className="text-muted-foreground mb-4">
                  {canGenerateProfile 
                    ? `Tienes ${analyzedEvidences.length} evidencias analizadas. Genera el perfil con IA.`
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

            {/* Resumen de Evidencias */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Evidencias ({(evidences as any[]).length} total • {analyzedEvidences.length} analizadas)
              </h3>
              {(evidences as any[]).length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay evidencias registradas</p>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {analyzedEvidences.length > 0 ? (
                    <p>✅ {analyzedEvidences.length} evidencias listas para generar perfil</p>
                  ) : (
                    <p>⏳ {(evidences as any[]).length} evidencias pendientes de análisis</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
