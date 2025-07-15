
import { Users, UserCheck, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CredentialCard = ({ role, icon, email, password }: { role: string; icon: React.ReactNode, email: string; password: string }) => {
    return (
        <Card className="bg-white/5 border-white/10 text-white flex-1 min-w-[280px]">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{role}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <div>
                    <p className="text-white/60">Email:</p>
                    <p className="font-mono bg-black/20 p-1.5 rounded-md text-xs">{email}</p>
                </div>
                <div>
                    <p className="text-white/60">Password:</p>
                    <p className="font-mono bg-black/20 p-1.5 rounded-md text-xs">{password}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export function TestCredentials() {
    return (
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 w-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                 <div>
                    <h3 className="text-xl font-bold text-white">Test Accounts</h3>
                    <p className="text-white/70 text-sm">Use these accounts to explore all features.</p>
                 </div>
                 <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30 self-start sm:self-center">For Demo</Badge>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <CredentialCard role="Student" icon={<Users />} email="test@gmail.com" password="test@123" />
                <CredentialCard role="Club Lead" icon={<UserCheck />} email="valorantvinit@gmail.com" password="vin@123" />
                <CredentialCard role="Faculty" icon={<UserCog />} email="ujwala@gmail.com" password="ujwala@123" />
            </div>
        </div>
    )
}
