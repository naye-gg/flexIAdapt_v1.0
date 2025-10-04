import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Play, Eye, BrainCircuit, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EvidenceUpload from "@/components/evidence-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { evidenceApi } from "@/lib/api-auth";
import { useToast } from "@/hooks/use-toast";

// Función para exportar el análisis a PDF
async function exportAnalysisReportToPDF(analysisData: any) {
  try {
    // Importación dinámica de jsPDF para evitar problemas de SSR
    const jsPDF = (await import('jspdf')).default;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 20;
    const marginRight = 20;
    const lineHeight = 10;
    let yPosition = 20;

    // Función auxiliar para agregar texto con saltos de línea automáticos
    const addText = (text: string, fontSize = 12, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      const maxWidth = pageWidth - marginLeft - marginRight;
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > 280) { // Nueva página si se queda sin espacio
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, marginLeft, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5; // Espacio extra después del párrafo
    };

    // Encabezado
    doc.setFillColor(37, 99, 235); // Azul
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FlexiAdapt - Reporte de Análisis IA', marginLeft, 20);
    
    // Resetear color de texto
    doc.setTextColor(0, 0, 0);
    yPosition = 45;

    // Información general
    addText('INFORMACIÓN GENERAL', 16, true);
    addText(`Fecha: ${new Date().toLocaleDateString()}`);
    addText(`Hora: ${new Date().toLocaleTimeString()}`);
    yPosition += 10;

    // Resultados del análisis
    addText('RESULTADOS DEL ANÁLISIS', 16, true);
    addText(`Puntuación Adaptada: ${analysisData.adaptedScore}/100`, 14, true);
    addText(`Nivel de Competencia: ${analysisData.competencyLevel}`, 14, true);
    addText(`Estilo de Aprendizaje: ${analysisData.learningStyle || 'No especificado'}`, 14, true);
    yPosition += 5;

    addText('FORTALEZAS IDENTIFICADAS:', 14, true);
    addText(analysisData.identifiedStrengths || 'No especificado');
    
    addText('ÁREAS DE MEJORA:', 14, true);
    addText(analysisData.improvementAreas || 'No especificado');
    
    addText('MODALIDADES DE APRENDIZAJE EXITOSAS:', 14, true);
    addText(analysisData.successfulModalities || 'No especificado');
    
    addText('ESTRATEGIAS DE ENSEÑANZA RECOMENDADAS:', 14, true);
    addText(analysisData.teachingStrategies || 'No especificado');
    
    addText('ACTIVIDADES RECOMENDADAS:', 14, true);
    addText(analysisData.recommendedActivities || 'No especificado');
    
    addText('ADAPTACIONES PARA EVALUACIONES:', 14, true);
    addText(analysisData.assessmentAdaptations || 'No especificado');
    
    addText('RECURSOS NECESARIOS:', 14, true);
    addText(analysisData.resourcesNeeded || 'No especificado');
    
    addText('MODIFICACIONES DEL AULA:', 14, true);
    addText(analysisData.classroomModifications || 'No especificado');
    
    addText('RESUMEN DE RECOMENDACIONES PEDAGÓGICAS:', 14, true);
    addText(analysisData.pedagogicalRecommendations || 'No especificado');
    
    addText('ADAPTACIONES CURRICULARES SUGERIDAS:', 14, true);
    addText(analysisData.suggestedAdaptations || 'No especificado');
    
    addText('JUSTIFICACIÓN DE LA EVALUACIÓN:', 14, true);
    addText(analysisData.evaluationJustification || 'No especificado');
    
    addText(`NIVEL DE CONFIANZA DEL ANÁLISIS: ${Math.round(analysisData.confidence * 100)}%`, 14, true);

    // Footer
    yPosition = 280;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generado por FlexiAdapt IA - ${new Date().toLocaleString()}`, marginLeft, yPosition);

    // Descargar el PDF
    const fileName = `FlexiAdapt_Analisis_${new Date().toISOString().slice(0, 10)}_${Date.now()}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor, intenta de nuevo.');
  }
}

export default function Evidence() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: evidence = [] as any[], isLoading } = useQuery({
    queryKey: ["/api/evidence"],
    queryFn: evidenceApi.getAll,
  }) as { data: any[], isLoading: boolean };

  const analyzeEvidenceMutation = useMutation({
    mutationFn: async (evidenceId: string) => {
      setAnalyzingId(evidenceId);
      const response = await apiRequest("POST", `/api/evidence/${evidenceId}/ai-analyze`);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalyzingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/evidence"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Análisis IA completado",
        description: `Puntuación: ${data.adaptedScore}/100 - Nivel: ${data.competencyLevel}`,
      });
      
      // Mostrar modal con el resultado completo del análisis
      if (window.confirm(`Análisis IA Completado:
      
📊 Puntuación Adaptada: ${data.adaptedScore}/100
🎯 Nivel de Competencia: ${data.competencyLevel}
🧠 Estilo de Aprendizaje: ${data.learningStyle || 'No especificado'}
💪 Fortalezas: ${data.identifiedStrengths}
📈 Áreas de Mejora: ${data.improvementAreas}
🎨 Modalidades Exitosas: ${data.successfulModalities}
🎯 Estrategias de Enseñanza: ${data.teachingStrategies || 'Ver reporte completo'}
📋 Actividades Recomendadas: ${data.recommendedActivities || 'Ver reporte completo'}
📚 Recursos Necesarios: ${data.resourcesNeeded || 'Ver reporte completo'}
� Adaptaciones del Aula: ${data.classroomModifications || 'Ver reporte completo'}
📝 Confianza del Análisis: ${Math.round(data.confidence * 100)}%

¿Deseas exportar el reporte completo en PDF con todas las estrategias pedagógicas?`)) {
        // Exportar reporte en PDF
        exportAnalysisReportToPDF(data);
      }
    },
    onError: (error: any) => {
      setAnalyzingId(null);
      toast({
        title: "Error en análisis",
        description: "No se pudo analizar la evidencia. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleViewAnalysis = (evidence: any) => {
    setSelectedAnalysis(evidence);
    setIsAnalysisModalOpen(true);
  };

  const filteredEvidence = evidence.filter((item: any) => {
    if (filterType !== "all" && item.evidenceType !== filterType) return false;
    if (filterStatus !== "all") {
      if (filterStatus === "analyzed" && !item.isAnalyzed) return false;
      if (filterStatus === "pending" && item.isAnalyzed) return false;
    }
    return true;
  });

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'imagen': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'imagen': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-green-100 text-green-800';
      case 'audio': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6"> 
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-evidence" className="ml-auto flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Subir Evidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="dialog-upload-evidence">
            <DialogHeader>
              <DialogTitle>Subir Nueva Evidencia</DialogTitle>
            </DialogHeader>
            <EvidenceUpload
              onSuccess={() => setIsUploadOpen(false)}
              onCancel={() => setIsUploadOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="card-evidence-filters">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground mb-2">Tipo de Evidencia</label>
              <Select value={filterType} onValueChange={setFilterType} data-testid="select-filter-type">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="imagen">Imagen</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="texto">Texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-foreground mb-2">Estado de Análisis</label>
              <Select value={filterStatus} onValueChange={setFilterStatus} data-testid="select-filter-status">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="analyzed">Analizados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      <Card data-testid="card-evidence-list">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Evidencias ({filteredEvidence.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="flex space-x-2">
                      <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                      <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {evidence.length === 0 ? "No hay evidencias registradas" : "No se encontraron evidencias"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {evidence.length === 0 
                  ? "Comienza subiendo la primera evidencia de aprendizaje"
                  : "No hay evidencias que coincidan con los filtros seleccionados"
                }
              </p>
              {evidence.length === 0 && (
                <Button onClick={() => setIsUploadOpen(true)} data-testid="button-upload-first-evidence">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir primera evidencia
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvidence.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`evidence-item-${item.id}`}
                >
                  <div className="w-12 h-12 bg-muted/50 rounded-lg flex items-center justify-center text-2xl">
                    {getEvidenceIcon(item.evidenceType)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground" data-testid={`evidence-title-${item.id}`}>
                      {item.taskTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.student?.name} • {item.subject}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getTypeColor(item.evidenceType)} data-testid={`evidence-type-${item.id}`}>
                        {item.evidenceType}
                      </Badge>
                      <Badge variant={item.isAnalyzed ? "default" : "secondary"} data-testid={`evidence-status-${item.id}`}>
                        {item.isAnalyzed ? "Analizado" : "Pendiente"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.analysisResult?.adaptedScore && (
                      <div className="mb-2">
                        <p className="text-lg font-bold text-accent" data-testid={`evidence-score-${item.id}`}>
                          {parseFloat(item.analysisResult.adaptedScore).toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.analysisResult.competencyLevel}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {!item.isAnalyzed ? (
                        <Button
                          size="sm"
                          onClick={() => analyzeEvidenceMutation.mutate(item.id)}
                          disabled={analyzingId === item.id}
                          data-testid={`button-analyze-${item.id}`}
                        >
                          <BrainCircuit className="w-4 h-4 mr-1" />
                          {analyzingId === item.id ? "Analizando..." : "Analizar"}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewAnalysis(item)}
                          data-testid={`button-view-analysis-${item.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Análisis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para mostrar análisis completo */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Análisis Completo - {selectedAnalysis?.taskTitle}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAnalysis?.analysisResult && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Puntuación Adaptada</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(selectedAnalysis.analysisResult.adaptedScore).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nivel de Competencia</p>
                  <Badge variant="secondary" className="text-sm">
                    {selectedAnalysis.analysisResult.competencyLevel}
                  </Badge>
                </div>
              </div>

              {/* Fortalezas identificadas */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-green-700">📚 Fortalezas Identificadas</h3>
                <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                  {selectedAnalysis.analysisResult.identifiedStrengths}
                </p>
              </div>

              {/* Áreas de mejora */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-amber-700">🎯 Áreas de Mejora</h3>
                <p className="text-gray-700 bg-amber-50 p-3 rounded-md">
                  {selectedAnalysis.analysisResult.improvementAreas}
                </p>
              </div>

              {/* Modalidades exitosas */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-blue-700">✨ Modalidades de Aprendizaje Exitosas</h3>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                  {selectedAnalysis.analysisResult.successfulModalities}
                </p>
              </div>

              {/* Recomendaciones pedagógicas */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-purple-700">📝 Cómo Enseñarle</h3>
                <p className="text-gray-700 bg-purple-50 p-3 rounded-md whitespace-pre-line">
                  {selectedAnalysis.analysisResult.pedagogicalRecommendations}
                </p>
              </div>

              {/* Adaptaciones sugeridas */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-indigo-700">🔧 Cómo Evaluarle</h3>
                <p className="text-gray-700 bg-indigo-50 p-3 rounded-md whitespace-pre-line">
                  {selectedAnalysis.analysisResult.suggestedAdaptations}
                </p>
              </div>

              {/* Justificación */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-700">💡 Justificación del Análisis</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                  {selectedAnalysis.analysisResult.evaluationJustification}
                </p>
              </div>

              {/* Información adicional de la evidencia */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">📄 Información de la Evidencia</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Asignatura:</span> {selectedAnalysis.subject}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {selectedAnalysis.evidenceType}
                  </div>
                  <div>
                    <span className="font-medium">Competencias:</span> {selectedAnalysis.evaluatedCompetencies}
                  </div>
                  <div>
                    <span className="font-medium">Tiempo:</span> {selectedAnalysis.timeSpent} min
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
