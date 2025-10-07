"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Users, UserPlus, CheckCircle, Clock, Award, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import type { ProgressShare, PeerConnection, Progress, Profile } from "@/lib/types"

interface ProgressSocialProps {
  userId: string
  moduleId?: string
}

export function ProgressSocial({ userId, moduleId }: ProgressSocialProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "peers">("feed")
  const [progressShares, setProgressShares] = useState<ProgressShare[]>([])
  const [peerConnections, setPeerConnections] = useState<PeerConnection[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadProgressShares()
    loadPeerConnections()
  }, [userId])

  const loadProgressShares = async () => {
    try {
      // Load public shares and shares from peers
      const { data: connections } = await supabase
        .from("peer_connections")
        .select("peer_id")
        .eq("user_id", userId)
        .eq("status", "accepted")

      const peerIds = connections?.map((c) => c.peer_id) || []

      const { data, error } = await supabase
        .from("progress_shares")
        .select(
          `
          *,
          profile:profiles!user_id(*),
          module:modules(*)
        `
        )
        .eq("is_active", true)
        .or(`share_type.eq.public,user_id.in.(${peerIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setProgressShares(data || [])
    } catch (error) {
      console.error("Failed to load progress shares:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPeerConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("peer_connections")
        .select(
          `
          *,
          peer_profile:profiles!peer_id(*)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPeerConnections(data || [])
    } catch (error) {
      console.error("Failed to load peer connections:", error)
    }
  }

  const sendPeerRequest = async (peerEmail: string) => {
    try {
      // Find peer by email
      const { data: peerData, error: peerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", peerEmail)
        .single()

      if (peerError || !peerData) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive",
        })
        return
      }

      // Create connection request
      const { error } = await supabase.from("peer_connections").insert({
        user_id: userId,
        peer_id: peerData.id,
        status: "pending",
      })

      if (error) throw error

      toast({
        title: "Request sent",
        description: "Peer connection request sent successfully",
      })

      loadPeerConnections()
    } catch (error) {
      console.error("Failed to send peer request:", error)
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      })
    }
  }

  const acceptPeerRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("peer_connections")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", connectionId)

      if (error) throw error

      toast({
        title: "Request accepted",
        description: "You are now connected with this peer",
      })

      loadPeerConnections()
    } catch (error) {
      console.error("Failed to accept peer request:", error)
      toast({
        title: "Error",
        description: "Failed to accept connection request",
        variant: "destructive",
      })
    }
  }

  const shareCurrentProgress = async () => {
    if (!moduleId) {
      toast({
        title: "No module selected",
        description: "Please select a module to share progress",
        variant: "destructive",
      })
      return
    }

    try {
      // Get current progress
      const { data: progressData } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .single()

      if (!progressData) {
        toast({
          title: "No progress to share",
          description: "Start learning to share your progress",
          variant: "destructive",
        })
        return
      }

      const message =
        progressData.status === "completed"
          ? `Completed module with ${progressData.score}% score! 🎉`
          : `Making progress: ${progressData.completion_percent}% complete`

      const { error } = await supabase.from("progress_shares").insert({
        user_id: userId,
        module_id: moduleId,
        share_type: "public",
        message: message,
      })

      if (error) throw error

      toast({
        title: "Progress shared!",
        description: "Your achievement has been shared with peers",
      })

      loadProgressShares()
    } catch (error) {
      console.error("Failed to share progress:", error)
      toast({
        title: "Error",
        description: "Failed to share progress",
        variant: "destructive",
      })
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const pendingRequests = peerConnections.filter((c) => c.status === "pending")
  const acceptedPeers = peerConnections.filter((c) => c.status === "accepted")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Learning Community</CardTitle>
              <CardDescription>Connect with peers and share your progress</CardDescription>
            </div>
            {moduleId && (
              <Button onClick={shareCurrentProgress}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Progress
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "feed" | "peers")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">
                <TrendingUp className="h-4 w-4 mr-2" />
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="peers">
                <Users className="h-4 w-4 mr-2" />
                My Peers ({acceptedPeers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : progressShares.length === 0 ? (
                <div className="text-center py-12">
                  <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No shared progress yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to share your learning achievements!
                  </p>
                </div>
              ) : (
                progressShares.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={share.profile?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(share.profile?.full_name || "User")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{share.profile?.full_name}</p>
                            <Badge variant="outline" className="text-xs">
                              {share.profile?.role?.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              • {formatTimeAgo(share.created_at)}
                            </span>
                          </div>
                          {share.message && (
                            <p className="text-sm">{share.message}</p>
                          )}
                          {share.module && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Award className="h-4 w-4" />
                              {share.module.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="peers" className="space-y-6 mt-6">
              {/* Pending requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Pending Requests</h3>
                  {pendingRequests.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={connection.peer_profile?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(connection.peer_profile?.full_name || "User")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{connection.peer_profile?.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {connection.peer_profile?.specialization}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => acceptPeerRequest(connection.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Connected peers */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Connected Peers</h3>
                {acceptedPeers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No connections yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Send connection requests to start building your learning network
                    </p>
                  </div>
                ) : (
                  acceptedPeers.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={connection.peer_profile?.avatar_url} />
                            <AvatarFallback>
                              {getInitials(connection.peer_profile?.full_name || "User")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{connection.peer_profile?.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{connection.peer_profile?.specialization}</span>
                              <span>•</span>
                              <span>{connection.peer_profile?.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {connection.accepted_at &&
                              formatTimeAgo(connection.accepted_at)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Add peer form */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          const formData = new FormData(e.currentTarget)
                          const email = formData.get("email") as string
                          if (email) {
                            sendPeerRequest(email)
                            e.currentTarget.reset()
                          }
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter peer's email address"
                          className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                          required
                        />
                        <Button type="submit" size="sm">
                          Send Request
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
