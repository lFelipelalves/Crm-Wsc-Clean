"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, Trash2, Loader2 } from "lucide-react"

interface AudioUploadProps {
  onUploadComplete: (url: string) => void
  maxSize?: number // em MB
}

export function AudioUpload({ onUploadComplete, maxSize = 25 }: AudioUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo
    if (!selectedFile.type.startsWith("audio/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de áudio",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho
    const maxBytes = maxSize * 1024 * 1024
    if (selectedFile.size > maxBytes) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo não pode exceder ${maxSize}MB`,
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setProgress(0)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 30, 90))
      }, 200)

      const response = await fetch("/api/cobranca-ponto/upload-audio", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao fazer upload")
      }

      const data = await response.json()
      setUploadedUrl(data.url)
      onUploadComplete(data.url)

      toast({
        title: "Upload realizado com sucesso!",
        description: `Arquivo: ${file.name}`,
      })
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      })
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setUploadedUrl(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onUploadComplete("")
  }

  return (
    <div className="space-y-4">
      <Label>Arquivo de Áudio</Label>

      {!uploadedUrl ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="flex-1"
            />
            <Button onClick={handleUpload} disabled={!file || uploading} type="button">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>

          {file && (
            <div className="text-sm text-muted-foreground">
              Arquivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </div>
          )}

          {uploading && <Progress value={progress} className="h-2" />}
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border p-4 bg-green-50 dark:bg-green-950">
          <audio src={uploadedUrl} controls className="flex-1" />
          <Button variant="ghost" size="sm" onClick={handleRemove} type="button">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Formatos aceitos: MP3, WAV, M4A, OGG (máximo {maxSize}MB)</div>
    </div>
  )
}
