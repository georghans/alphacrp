import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">CONFIGURATION</p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl">SETTINGS</h1>
          </div>

          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">ACCOUNT</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">YOUR PROFILE INFORMATION</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-foreground">EMAIL</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  defaultValue="user@alphascrape.io"
                  className="border-2 border-foreground bg-input font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-foreground">DISPLAY NAME</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  defaultValue="ANONYMOUS USER"
                  className="border-2 border-foreground bg-input font-mono text-sm"
                />
              </div>
              <Button className="border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground">
                SAVE CHANGES
              </Button>
            </div>
          </div>

          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">NOTIFICATIONS</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">ALERT PREFERENCES</p>
            </div>
            <div className="divide-y-2 divide-border">
              <div className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <Label className="font-mono text-xs uppercase tracking-wider text-foreground">EMAIL NOTIFICATIONS</Label>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">RECEIVE UPDATES VIA EMAIL</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-accent" />
              </div>
              <div className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <Label className="font-mono text-xs uppercase tracking-wider text-foreground">SEARCH COMPLETED</Label>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">NOTIFY WHEN SEARCH FINISHES</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-accent" />
              </div>
              <div className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <Label className="font-mono text-xs uppercase tracking-wider text-foreground">WEEKLY DIGEST</Label>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">WEEKLY ACTIVITY SUMMARY</p>
                </div>
                <Switch className="data-[state=checked]:bg-accent" />
              </div>
            </div>
          </div>

          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">API ACCESS</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">INTEGRATION CREDENTIALS</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="api-key" className="font-mono text-xs uppercase tracking-wider text-foreground">API KEY</Label>
                <div className="flex gap-3">
                  <Input 
                    id="api-key" 
                    type="password" 
                    defaultValue="sk_live_xxxxxxxxxxxxx" 
                    readOnly
                    className="border-2 border-foreground bg-input font-mono text-sm"
                  />
                  <Button variant="outline" className="border-2 border-foreground bg-transparent font-mono text-xs uppercase tracking-wider hover:border-accent hover:bg-accent hover:text-accent-foreground">
                    COPY
                  </Button>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  KEEP YOUR API KEY SECRET. NEVER SHARE PUBLICLY.
                </p>
              </div>
              <Button variant="outline" className="border-2 border-foreground bg-transparent font-mono text-xs uppercase tracking-wider hover:border-accent hover:bg-accent hover:text-accent-foreground">
                REGENERATE KEY
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
