"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Download,
  FileText,
  Loader2,
  CheckCircle,
  Activity,
  Zap,
  Plus,
  X,
  MapPin,
  Route,
  TrendingUp,
  Clock,
  Mountain,
  Navigation,
  Settings,
  Coffee,
  Heart,
  Star,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TrackPoint {
  lat: number
  lon: number
  time?: string
  elevation?: number
}

interface ParsedFile {
  id: string
  name: string
  content: string
  trackPoints: number
  color: string
  type: "GPX" | "TCX"
  points: TrackPoint[]
}

type FileFormat = "GPX" | "TCX"

const FILE_COLORS = [
  "from-orange-500 to-red-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-yellow-500 to-orange-500",
  "from-indigo-500 to-purple-500",
]

const FILE_ICONS = [
  <Route className="h-6 w-6" key="route" />,
  <MapPin className="h-6 w-6" key="mappin" />,
  <TrendingUp className="h-6 w-6" key="trending" />,
  <Activity className="h-6 w-6" key="activity" />,
  <Zap className="h-6 w-6" key="zap" />,
  <Navigation className="h-6 w-6" key="navigation" />,
]

export default function GPXMergerOnline() {
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("GPX")
  const [files, setFiles] = useState<ParsedFile[]>([])
  const [mergedFile, setMergedFile] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)

  const parseGPXFile = (content: string): { points: TrackPoint[]; count: number } => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, "text/xml")
      const trackPoints = Array.from(xmlDoc.getElementsByTagName("trkpt"))

      const points: TrackPoint[] = trackPoints.map((point) => {
        const lat = Number.parseFloat(point.getAttribute("lat") || "0")
        const lon = Number.parseFloat(point.getAttribute("lon") || "0")
        const timeElement = point.getElementsByTagName("time")[0]
        const eleElement = point.getElementsByTagName("ele")[0]

        return {
          lat,
          lon,
          time: timeElement?.textContent || undefined,
          elevation: eleElement ? Number.parseFloat(eleElement.textContent || "0") : undefined,
        }
      })

      return { points, count: points.length }
    } catch (error) {
      console.error("Error parsing GPX file:", error)
      return { points: [], count: 0 }
    }
  }

  const parseTCXFile = (content: string): { points: TrackPoint[]; count: number } => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(content, "text/xml")
      const trackPoints = Array.from(xmlDoc.getElementsByTagName("Trackpoint"))

      const points: TrackPoint[] = trackPoints.map((point) => {
        const positionElement = point.getElementsByTagName("Position")[0]
        const latElement = positionElement?.getElementsByTagName("LatitudeDegrees")[0]
        const lonElement = positionElement?.getElementsByTagName("LongitudeDegrees")[0]
        const timeElement = point.getElementsByTagName("Time")[0]
        const altElement = point.getElementsByTagName("AltitudeMeters")[0]

        return {
          lat: latElement ? Number.parseFloat(latElement.textContent || "0") : 0,
          lon: lonElement ? Number.parseFloat(lonElement.textContent || "0") : 0,
          time: timeElement?.textContent || undefined,
          elevation: altElement ? Number.parseFloat(altElement.textContent || "0") : undefined,
        }
      })

      return { points, count: points.length }
    } catch (error) {
      console.error("Error parsing TCX file:", error)
      return { points: [], count: 0 }
    }
  }

  const handleFileUpload = useCallback(
    async (file: File, slotIndex: number) => {
      const fileName = file.name.toLowerCase()
      const isGPX = fileName.endsWith(".gpx")
      const isTCX = fileName.endsWith(".tcx")

      // Validate file type matches selected format for GPS file combining
      if (selectedFormat === "GPX" && !isGPX) {
        alert(`Only GPX files are allowed. You have selected ${selectedFormat} format for GPS track merging.`)
        return
      }

      if (selectedFormat === "TCX" && !isTCX) {
        alert(`Only TCX files are allowed. You have selected ${selectedFormat} format for GPS file combining.`)
        return
      }

      if (!isGPX && !isTCX) {
        alert("Please select a valid GPX or TCX file for GPS track combining")
        return
      }

      try {
        const content = await file.text()
        const parseResult = selectedFormat === "GPX" ? parseGPXFile(content) : parseTCXFile(content)

        const parsedFile: ParsedFile = {
          id: `file-${Date.now()}-${slotIndex}`,
          name: file.name,
          content,
          trackPoints: parseResult.count,
          color: FILE_COLORS[slotIndex],
          type: selectedFormat,
          points: parseResult.points,
        }

        setFiles((prev) => {
          const newFiles = [...prev]
          const existingIndex = newFiles.findIndex((f) => f.id.endsWith(`-${slotIndex}`))
          if (existingIndex >= 0) {
            newFiles[existingIndex] = parsedFile
          } else {
            newFiles.push(parsedFile)
          }
          return newFiles.sort((a, b) => {
            const aIndex = Number.parseInt(a.id.split("-").pop() || "0")
            const bIndex = Number.parseInt(b.id.split("-").pop() || "0")
            return aIndex - bIndex
          })
        })
      } catch (error) {
        console.error("Error reading GPS file:", error)
        alert("Error reading GPS file. Please try again with a valid track file.")
      }
    },
    [selectedFormat],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault()
      setDragOver(null)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        handleFileUpload(droppedFiles[0], slotIndex)
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    setDragOver(slotIndex)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }, [])

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleFormatChange = (format: FileFormat) => {
    if (files.length > 0) {
      const confirmChange = window.confirm(
        `Changing the GPS file format will remove all uploaded tracks. Continue with ${format} format selection?`,
      )
      if (!confirmChange) return
      setFiles([])
      setMergedFile(null)
    }
    setSelectedFormat(format)
  }

  const generateGPXFromPoints = (allPoints: TrackPoint[], fileName: string): string => {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPX Merger Online - Free GPS File Combiner" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${fileName}</name>
    <desc>Merged GPS track from ${files.length} ${selectedFormat} files using GPX Merger Online - Professional GPS track combiner</desc>
    <keywords>GPX merger, TCX combiner, GPS file merger, combined GPS tracks, merged running routes</keywords>
  </metadata>
  <trk>
    <name>Combined ${selectedFormat} GPS Track</name>
    <trkseg>`

    const trackPoints = allPoints
      .map((point) => {
        let trkpt = `      <trkpt lat="${point.lat}" lon="${point.lon}">`
        if (point.elevation !== undefined) {
          trkpt += `\n        <ele>${point.elevation}</ele>`
        }
        if (point.time) {
          trkpt += `\n        <time>${point.time}</time>`
        }
        trkpt += "\n      </trkpt>"
        return trkpt
      })
      .join("\n")

    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`

    return gpxHeader + "\n" + trackPoints + gpxFooter
  }

  const combineGPSTracks = async () => {
    if (files.length < 2) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Simulate GPS file combining with progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 300)

      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Combine all GPS track points from all files for comprehensive route merging
      const allPoints: TrackPoint[] = []
      files.forEach((file) => {
        allPoints.push(...file.points)
      })

      // Generate combined GPX file with professional GPS file merger
      const fileName = `combined_${files.length}_${selectedFormat.toLowerCase()}_gps_tracks_${Date.now()}`
      const mergedContent = generateGPXFromPoints(allPoints, fileName)

      setProgress(100)
      setTimeout(() => {
        setMergedFile(mergedContent)
        setIsProcessing(false)
        setProgress(0)
      }, 500)
    } catch (error) {
      console.error("Error during GPS track combining:", error)
      alert("Error combining GPS tracks. Please verify all files are valid GPS data files.")
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const downloadCombinedGPSFile = () => {
    if (!mergedFile || files.length === 0) return

    const blob = new Blob([mergedFile], { type: "application/gpx+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `combined_${files.length}_${selectedFormat.toLowerCase()}_gps_tracks.gpx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetGPSFiles = () => {
    setFiles([])
    setMergedFile(null)
    setProgress(0)
  }

  const totalTrackPoints = files.reduce((sum, file) => sum + file.trackPoints, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* SEO Optimized Header for GPX Merger Online */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
              <Activity className="h-12 w-12 text-white animate-pulse" alt="GPX Merger Online Logo" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">GPX Merger Online</h1>
              <p className="text-orange-100 text-xl">
                Free GPS File Combiner - Merge up to 6 GPX & TCX files into one powerful GPS track
              </p>
            </div>
          </div>

          {/* GPS File Combiner Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{files.length}</div>
              <div className="text-orange-100">GPS Files Loaded</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{totalTrackPoints.toLocaleString()}</div>
              <div className="text-orange-100">Total Track Points</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className={cn("text-3xl font-bold", selectedFormat === "GPX" ? "text-green-300" : "text-blue-300")}>
                {selectedFormat}
              </div>
              <div className="text-orange-100">Selected GPS Format</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* GPS File Format Selector for Track Combining */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-2xl">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Settings className="h-6 w-6 text-orange-400" />
              </div>
              Select GPS File Format - GPX or TCX Merger
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Choose your GPS data format for file combining. Only files of the same type can be merged for optimal GPS
              track analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div
                className={cn(
                  "flex-1 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105",
                  selectedFormat === "GPX"
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                    : "border-slate-600 bg-slate-700/30 hover:border-green-500/50",
                )}
                onClick={() => handleFormatChange("GPX")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      selectedFormat === "GPX" ? "border-green-500 bg-green-500" : "border-slate-500",
                    )}
                  >
                    {selectedFormat === "GPX" && <div className="w-3 h-3 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText
                      className={cn("h-8 w-8", selectedFormat === "GPX" ? "text-green-400" : "text-slate-400")}
                    />
                    <div>
                      <h3
                        className={cn(
                          "text-xl font-bold",
                          selectedFormat === "GPX" ? "text-green-300" : "text-slate-300",
                        )}
                      >
                        GPX File Merger
                      </h3>
                      <p className="text-slate-400 text-sm">
                        GPS Exchange Format - Universal standard for GPS track combining and route merging
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex-1 p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105",
                  selectedFormat === "TCX"
                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                    : "border-slate-600 bg-slate-700/30 hover:border-blue-500/50",
                )}
                onClick={() => handleFormatChange("TCX")}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                      selectedFormat === "TCX" ? "border-blue-500 bg-blue-500" : "border-slate-500",
                    )}
                  >
                    {selectedFormat === "TCX" && <div className="w-3 h-3 bg-white rounded-full"></div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className={cn("h-8 w-8", selectedFormat === "TCX" ? "text-blue-400" : "text-slate-400")} />
                    <div>
                      <h3
                        className={cn(
                          "text-xl font-bold",
                          selectedFormat === "TCX" ? "text-blue-300" : "text-slate-300",
                        )}
                      >
                        TCX File Combiner
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Training Center XML - Advanced GPS file merger with heart rate and performance data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Format Information Banner */}
            <div
              className={cn(
                "mt-6 p-4 rounded-lg border",
                selectedFormat === "GPX"
                  ? "bg-green-500/10 border-green-500/30 text-green-200"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-200",
              )}
            >
              <div className="flex items-center gap-3">
                {selectedFormat === "GPX" ? (
                  <FileText className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-400" />
                )}
                <div>
                  <p className="font-semibold">
                    {selectedFormat} format selected - Only .{selectedFormat.toLowerCase()} files accepted for GPS track
                    combining
                  </p>
                  <p className="text-sm opacity-80">
                    {selectedFormat === "GPX"
                      ? "Compatible with most GPS devices and fitness apps for comprehensive track merging"
                      : "Includes advanced training data like heart rate, cadence, and power for detailed GPS file combining"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS File Upload Grid for Track Combining */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Upload Your {selectedFormat} GPS Files - Free Online GPS File Combiner
            </h2>
            <div className="flex items-center justify-center gap-4 text-lg">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  selectedFormat === "GPX" ? "bg-green-500/20 text-green-300" : "bg-blue-500/20 text-blue-300",
                )}
              >
                {selectedFormat === "GPX" ? <FileText className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                <span className="font-semibold">Only .{selectedFormat.toLowerCase()} GPS files</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, index) => {
              const file = files.find((f) => f.id.endsWith(`-${index}`))
              const isActive = dragOver === index

              return (
                <Card
                  key={index}
                  className={cn(
                    "relative overflow-hidden transition-all duration-500 transform hover:scale-105",
                    file
                      ? "bg-gradient-to-br border-2 shadow-2xl"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70",
                    file && `bg-gradient-to-br ${file.color} border-white/20`,
                    isActive && "scale-105 shadow-2xl shadow-orange-500/50 border-orange-400",
                  )}
                >
                  {file && (
                    <>
                      <Button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-red-500 text-white rounded-full"
                        variant="ghost"
                        aria-label="Remove GPS file from combiner"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div
                        className={cn(
                          "absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold",
                          selectedFormat === "GPX" ? "bg-green-500/80 text-white" : "bg-blue-500/80 text-white",
                        )}
                      >
                        {selectedFormat}
                      </div>
                    </>
                  )}

                  <CardContent className="p-0">
                    <div
                      className={cn(
                        "h-48 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                        file ? "text-white" : "text-slate-400 hover:text-orange-400",
                      )}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = selectedFormat === "GPX" ? ".gpx" : ".tcx"
                        input.onchange = (e) => {
                          const selectedFile = (e.target as HTMLInputElement).files?.[0]
                          if (selectedFile) handleFileUpload(selectedFile, index)
                        }
                        input.click()
                      }}
                    >
                      {file ? (
                        <div className="text-center space-y-3 p-4">
                          <div className="p-3 bg-white/20 rounded-full w-fit mx-auto backdrop-blur-sm">
                            {FILE_ICONS[index]}
                          </div>
                          <div>
                            <p className="font-bold text-lg truncate max-w-[200px]" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              <Zap className="h-4 w-4" />
                              <span className="font-semibold">{file.trackPoints.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 p-4">
                          <div
                            className={cn(
                              "p-4 rounded-full w-fit mx-auto transition-all duration-300",
                              isActive ? "bg-orange-500/30 scale-110" : "bg-slate-700/50",
                            )}
                          >
                            <Plus className="h-8 w-8" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">GPS Slot {index + 1}</p>
                            <p className="text-sm opacity-75">Drop .{selectedFormat.toLowerCase()} here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* GPS Track Combining Summary */}
        {files.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <Activity className="h-6 w-6 text-orange-400" />
                GPS File Combiner Summary - {selectedFormat} Files Ready to Merge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                    <div className={cn("w-4 h-4 rounded-full bg-gradient-to-r", file.color)}></div>
                    <div
                      className={cn(
                        "px-3 py-1 rounded text-xs font-bold",
                        selectedFormat === "GPX" ? "bg-green-500/20 text-green-300" : "bg-blue-500/20 text-blue-300",
                      )}
                    >
                      {selectedFormat}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{file.name}</p>
                      <p className="text-slate-400 text-sm">{file.trackPoints.toLocaleString()} GPS track points</p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-bold">#{index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Professional GPS File Combining Section */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white text-3xl">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Route className="h-8 w-8 text-orange-400" />
              </div>
              Combine GPS Tracks - {selectedFormat} File Merger Online
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Professional GPS file combiner: Merge all your {selectedFormat} files into one comprehensive GPX track for
              advanced route analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GPS Combining Progress Bar */}
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Combining {files.length} {selectedFormat} GPS files using GPX Merger Online...
                  </span>
                  <span className="text-orange-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 h-4 rounded-full transition-all duration-500 shadow-lg relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={combineGPSTracks}
                disabled={files.length < 2 || isProcessing}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    <span>
                      Combining {files.length} {selectedFormat} GPS Files...
                    </span>
                  </>
                ) : (
                  <>
                    <Activity className="h-6 w-6 mr-3" />
                    <span>
                      Combine {files.length} {selectedFormat} GPS Files
                    </span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={resetGPSFiles}
                disabled={isProcessing}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors bg-transparent px-8 py-4 text-lg"
                size="lg"
              >
                Clear All GPS Files
              </Button>
            </div>

            {/* GPS File Combining Success State */}
            {mergedFile && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/5 border border-green-500/30 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-green-500/20 rounded-2xl">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-2xl mb-2">
                        GPS Files Successfully Combined! - {selectedFormat} Merger Complete
                      </h3>
                      <p className="text-green-200 mb-3 text-lg">
                        Your comprehensive GPS route is ready for advanced track analysis and navigation
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-green-300">
                          {selectedFormat === "GPX" ? <FileText className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          <span>
                            {files.length} {selectedFormat} files combined
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-green-300">
                          <Zap className="h-4 w-4" />
                          <span>{totalTrackPoints.toLocaleString()} total GPS points</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-300">
                          <Mountain className="h-4 w-4" />
                          <span>Universal GPX output format</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-300">
                          <CheckCircle className="h-4 w-4" />
                          <span>Ready for GPS analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={downloadCombinedGPSFile}
                    className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-4 rounded-xl shadow-2xl hover:shadow-xl transition-all duration-300 text-lg"
                    size="lg"
                  >
                    <Download className="h-6 w-6 mr-3" />
                    Download Combined GPS Track
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support GPX Merger Online - Refined Warm Gradient Design */}
        <Card className="bg-gradient-to-br from-amber-900/30 via-orange-900/25 to-red-900/20 border-amber-500/50 backdrop-blur-sm shadow-2xl shadow-amber-500/20 relative overflow-hidden">
          {/* Enhanced animated background elements with warm tones */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/8 via-orange-500/5 to-red-600/8"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/15 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-400/15 to-red-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-4 text-white text-2xl">
              <div className="p-3 bg-gradient-to-br from-amber-500/40 via-orange-500/30 to-red-500/20 rounded-xl backdrop-blur-sm shadow-lg border border-amber-400/30">
                <Coffee className="h-7 w-7 text-amber-200" />
              </div>
              <div className="flex items-center gap-2">
                <span>Support GPX Merger Online Development</span>
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              </div>
            </CardTitle>
            <CardDescription className="text-amber-100 text-lg">
              Help keep this free GPS file combiner running and support new features for the GPS community
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-4 text-amber-100 p-3 bg-amber-900/20 rounded-lg border border-amber-500/20">
                  <div className="p-2 bg-gradient-to-br from-red-500/30 to-pink-500/20 rounded-full">
                    <Heart className="h-5 w-5 text-red-300" />
                  </div>
                  <span className="font-medium">This GPS file merger is completely free to use</span>
                </div>
                <div className="flex items-center gap-4 text-amber-100 p-3 bg-amber-900/20 rounded-lg border border-amber-500/20">
                  <div className="p-2 bg-gradient-to-br from-yellow-500/30 to-amber-500/20 rounded-full">
                    <Star className="h-5 w-5 text-yellow-300" />
                  </div>
                  <span className="font-medium">No registration required for GPS file combining</span>
                </div>
                <div className="flex items-center gap-4 text-amber-100 p-3 bg-amber-900/20 rounded-lg border border-amber-500/20">
                  <div className="p-2 bg-gradient-to-br from-orange-500/30 to-red-500/20 rounded-full">
                    <Zap className="h-5 w-5 text-orange-300" />
                  </div>
                  <span className="font-medium">Regular updates and new GPS combiner features</span>
                </div>

                <div className="bg-gradient-to-r from-amber-800/40 via-orange-800/30 to-red-800/20 border border-amber-500/40 rounded-xl p-5 mt-6 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <Coffee className="h-5 w-5 text-amber-300 mt-0.5 flex-shrink-0" />
                    <p className="text-amber-100 text-sm leading-relaxed">
                      Your support helps maintain server costs, add new GPS formats, and develop advanced track
                      combining features for athletes and GPS enthusiasts worldwide. Every contribution makes a
                      difference! ☕
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 min-w-[200px]">
                <Button
                  onClick={() =>
                    window.open(
                      "https://www.paypal.com/donate/?business=YOUR_PAYPAL_EMAIL&no_recurring=0&currency_code=USD",
                      "_blank",
                    )
                  }
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 border border-blue-500/30"
                  size="lg"
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  Donate via PayPal
                </Button>
                <Button
                  onClick={() => window.open("https://www.buymeacoffee.com/gpxmergeronline", "_blank")}
                  className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-700 hover:via-orange-700 hover:to-red-700 text-white font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 transform hover:scale-105 border border-amber-500/30"
                  size="lg"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Buy Me a Coffee
                </Button>

                {/* Enhanced call-to-action badge */}
                <div className="text-center mt-3">
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/30 to-orange-500/20 text-amber-200 px-4 py-2 rounded-full text-sm font-medium border border-amber-400/30 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    Show your support
                    <Star className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Footer with GPS File Combiner Keywords */}
        <div className="text-center py-8 space-y-4">
          <h3 className="text-2xl font-bold text-white">Professional GPS File Combiner & Track Merger Online</h3>
          <p className="text-slate-400 text-lg mb-4">
            🚀 Advanced GPS file merger supporting GPX and TCX formats - Perfect for athletes, cyclists, runners, and
            GPS enthusiasts
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">GPX merger online</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">TCX file combiner</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">GPS track merger</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">Combine GPS files</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">GPS file combiner</span>
            <span className="bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">Merge running tracks</span>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Free online GPS file merger • No registration required • Professional GPS track combining • Compatible with
            all GPS devices and fitness apps
          </p>
        </div>
      </div>
    </div>
  )
}
