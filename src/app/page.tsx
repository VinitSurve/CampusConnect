import { login } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { allUsers } from "@/lib/mock-data"
import { Icons } from "@/components/icons"

export default function AuthenticationPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <div className="flex flex-col items-center text-center mb-12">
        <Icons.logo className="h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold mt-4 font-headline">Welcome to CampusConnect</h1>
        <p className="text-xl text-muted-foreground mt-2">Choose your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {allUsers.map((user) => (
          <Card key={user.id} className="w-full max-w-sm text-center">
            <CardHeader>
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="capitalize">{user.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={login}>
                <input type="hidden" name="userId" value={user.id} />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                  Login as {user.role}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
