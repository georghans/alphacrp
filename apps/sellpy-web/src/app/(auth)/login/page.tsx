import { login } from "../../actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const hasError = Boolean(searchParams?.error)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 border-2 border-foreground bg-card p-8">
        <form className="space-y-6" action={login}>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-foreground">
              PASSWORD
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="border-2 border-foreground bg-input font-mono text-sm"
            />
          </div>

          {hasError && (
            <div className="border-2 border-destructive bg-destructive/10 p-3 font-mono text-[10px] uppercase tracking-wider text-destructive">
              INVALID CREDENTIALS
            </div>
          )}

          <Button className="w-full border-2 border-foreground bg-foreground font-mono text-xs uppercase tracking-wider text-background hover:border-accent hover:bg-accent hover:text-accent-foreground">
            LOGIN
          </Button>
        </form>
      </div>
    </main>
  )
}
