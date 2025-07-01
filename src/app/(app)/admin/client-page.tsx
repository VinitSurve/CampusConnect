"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { EventProposal, Club } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface AdminClientPageProps {
  initialProposals: EventProposal[];
  initialClubs: Club[];
}

export default function AdminClientPage({ initialProposals, initialClubs }: AdminClientPageProps) {
  const { toast } = useToast()
  const [proposals, setProposals] = useState<EventProposal[]>(initialProposals)

  const handleProposalAction = (proposalId: string, status: 'approved' | 'rejected') => {
    setProposals(prevProposals =>
      prevProposals.map(p => (p.id === proposalId ? { ...p, status } : p))
    )
    toast({
      title: `Event ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: `The proposal has been successfully ${status}.`,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Faculty Admin</h1>
        <p className="text-muted-foreground">
          Manage campus events, clubs, and academic schedules.
        </p>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Event Requests</TabsTrigger>
          <TabsTrigger value="clubs">Manage Clubs</TabsTrigger>
          <TabsTrigger value="calendar">Academic Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Pending Event Proposals</CardTitle>
              <CardDescription>Review and approve or reject new event proposals from students and groups.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Title</TableHead>
                    <TableHead>Proposer</TableHead>
                    <TableHead>Proposed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">{proposal.title}</TableCell>
                      <TableCell>{proposal.proposer}</TableCell>
                      <TableCell>{proposal.date}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn({
                            "bg-yellow-400 text-yellow-900 hover:bg-yellow-400/80": proposal.status === "pending",
                            "bg-green-500 text-white hover:bg-green-500/80": proposal.status === "approved",
                            "bg-red-500 text-white hover:bg-red-500/80": proposal.status === "rejected",
                          })}
                        >
                          {proposal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {proposal.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-300"
                              onClick={() => handleProposalAction(proposal.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-300"
                              onClick={() => handleProposalAction(proposal.id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="clubs">
          <Card>
            <CardHeader>
              <CardTitle>Club Directory Management</CardTitle>
              <CardDescription>Oversee all registered student clubs and groups on campus.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Faculty Advisor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialClubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>{club.members}</TableCell>
                      <TableCell>{club.facultyAdvisor}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Academic Calendar</CardTitle>
              <CardDescription>View and manage key academic dates and deadlines.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Full calendar feature coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
