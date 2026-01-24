import { Navigation } from "@/components/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Mail, MessageCircle, FileText } from "lucide-react"

const faqs = [
  {
    question: "WHAT IS ALPHASCRAPE?",
    answer: "ALPHASCRAPE is an AI-powered search automation platform designed for fashion resale. Configure automated searches to find specific items across multiple platforms using visual and text-based queries."
  },
  {
    question: "HOW DO I CREATE A NEW SEARCH?",
    answer: "Navigate to SEARCHES and click NEW SEARCH. Enter a title, describe what you want to find in the prompt field, and optionally upload 1-5 reference images. Toggle the status to ACTIVE and save."
  },
  {
    question: "WHAT ARE REFERENCE IMAGES USED FOR?",
    answer: "Reference images help the AI understand the visual context of items you're searching for. They act as visual anchors to find similar pieces across resale platforms."
  },
  {
    question: "CAN I PAUSE A SEARCH?",
    answer: "Yes. Toggle any search between ACTIVE and PAUSED states. Paused searches retain all configuration for when you're ready to resume."
  },
  {
    question: "HOW MANY SEARCHES CAN I CREATE?",
    answer: "Free accounts: 5 searches. Premium accounts: unlimited. Contact us for enterprise pricing with custom limits."
  },
  {
    question: "HOW DO I EDIT OR DELETE A SEARCH?",
    answer: "Click any search card to access the detail page where you can modify all fields or delete the search. Use the action menu on each card for quick access."
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">DOCUMENTATION</p>
            <h1 className="font-mono text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl">HELP</h1>
          </div>

          {/* Contact Options */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground transition-all group-hover:border-accent-foreground group-hover:bg-accent-foreground">
                <Mail className="h-6 w-6 text-background transition-all group-hover:text-accent" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">EMAIL</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                SUPPORT VIA EMAIL
              </p>
              <Button variant="outline" size="sm" className="mt-4 border-2 border-foreground bg-transparent font-mono text-[10px] uppercase tracking-wider transition-all group-hover:border-accent-foreground group-hover:text-accent-foreground group-hover:hover:bg-accent-foreground group-hover:hover:text-accent">
                CONTACT
              </Button>
            </div>

            <div className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground transition-all group-hover:border-accent-foreground">
                <MessageCircle className="h-6 w-6 text-foreground transition-all group-hover:text-accent-foreground" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">LIVE CHAT</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                REAL-TIME SUPPORT
              </p>
              <Button variant="outline" size="sm" className="mt-4 border-2 border-foreground bg-transparent font-mono text-[10px] uppercase tracking-wider transition-all group-hover:border-accent-foreground group-hover:text-accent-foreground group-hover:hover:bg-accent-foreground group-hover:hover:text-accent">
                START CHAT
              </Button>
            </div>

            <div className="group border-2 border-foreground bg-card p-6 transition-all duration-150 hover:border-accent hover:bg-accent">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground transition-all group-hover:border-accent-foreground">
                <FileText className="h-6 w-6 text-foreground transition-all group-hover:text-accent-foreground" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-foreground transition-all group-hover:text-accent-foreground">DOCS</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all group-hover:text-accent-foreground/70">
                TECHNICAL DOCUMENTATION
              </p>
              <Button variant="outline" size="sm" className="mt-4 border-2 border-foreground bg-transparent font-mono text-[10px] uppercase tracking-wider transition-all group-hover:border-accent-foreground group-hover:text-accent-foreground group-hover:hover:bg-accent-foreground group-hover:hover:text-accent">
                VIEW DOCS
              </Button>
            </div>
          </div>

          {/* FAQ */}
          <div className="border-2 border-foreground bg-card">
            <div className="border-b-2 border-foreground px-6 py-4">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">FAQ</h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">FREQUENTLY ASKED QUESTIONS</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b-2 border-border last:border-b-0">
                  <AccordionTrigger className="px-6 py-4 font-mono text-xs font-bold uppercase tracking-wider text-foreground hover:text-accent hover:no-underline [&[data-state=open]]:bg-muted [&[data-state=open]]:text-accent">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 font-sans text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  )
}
