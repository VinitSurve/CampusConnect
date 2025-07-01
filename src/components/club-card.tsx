import Image from "next/image"
import { Users, Mail, UserCheck } from "lucide-react"

import type { Club } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "./ui/button"

interface ClubCardProps {
  club: Club;
}

export function ClubCard({ club }: ClubCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-start gap-4 p-4">
        <Image
          src={club.image}
          alt={club.name}
          width={84}
          height={84}
          className="w-20 h-20 rounded-lg object-cover border"
          data-ai-hint={`${club.tags.join(' ').toLowerCase()} club`}
        />
        <div className="flex-grow">
          <CardTitle className="text-xl mb-1">{club.name}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {club.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <CardDescription>{club.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 pt-0 text-sm text-muted-foreground">
        <div className="flex flex-col w-full gap-2">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4"/>
                <span>{club.members} members</span>
            </div>
            <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4"/>
                <span>Advised by {club.facultyAdvisor}</span>
            </div>
        </div>
        <div className="w-full flex justify-between items-center mt-2">
            <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${club.contactEmail}`}>
                    <Mail className="w-4 h-4 mr-2"/>
                    Contact
                </a>
            </Button>
            <Button size="sm" className="bg-accent hover:bg-accent/90">Join Club</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
