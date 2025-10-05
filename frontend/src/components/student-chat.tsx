import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StudentChatProps {
  student: any;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  studentContext?: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentChat({ student, onClose }: StudentChatProps) {
  const [message, setMessage] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch student chats
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/students", student.id, "chats"],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/students/${student.id}/chats`);
      const data = await response.json();
      return data.chats || [];
    }
  });

  // Fetch messages for current chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", currentChatId, "messages"],
    queryFn: async () => {
      if (!currentChatId) return [];
      const response = await authenticatedFetch(`/api/chats/${currentChatId}/messages`);
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!currentChatId
  });

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await authenticatedFetch(`/api/students/${student.id}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Chat - ${student.name}` })
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", student.id, "chats"] });
      setCurrentChatId(data.chat.id);
      toast({
        title: "Chat creado",
        description: "Se ha creado un nuevo chat para el estudiante.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el chat. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentChatId) throw new Error("No chat selected");
      const response = await authenticatedFetch(`/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", currentChatId, "messages"] });
      setMessage("");
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  });

  // Auto-create chat if none exists
  useEffect(() => {
    if (!chatsLoading && chats.length === 0 && !currentChatId) {
      createChatMutation.mutate();
    } else if (chats.length > 0 && !currentChatId) {
      setCurrentChatId(chats[0].id);
    }
  }, [chats, chatsLoading, currentChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentChatId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat con {student.name}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>{student.grade}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{student.mainSubjects}</span>
          {student.specialNeeds && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Badge variant="outline" className="text-xs">
                {student.specialNeeds}
              </Badge>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 h-0 min-h-0">
          <div className="px-6 py-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bot className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                ¡Hola! Soy tu asistente IA. Puedes preguntarme cualquier cosa sobre {student.name}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ejemplo: "¿Cuáles son las fortalezas de este estudiante?"
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 break-words overflow-wrap-anywhere ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Pregunta sobre ${student.name}...`}
              disabled={!currentChatId || sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !currentChatId || sendMessageMutation.isPending}
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Presiona Enter para enviar. Las respuestas están basadas en el contexto y análisis del estudiante.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
