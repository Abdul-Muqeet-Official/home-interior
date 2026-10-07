import { SITE } from "@/lib/site.config";

const message = "Hello HOME INTERIOR, I would like to discuss an interior or materials consultation.";

export default function WhatsAppFloat() {
  const href = SITE.whatsappUrlWithText(message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with HOME INTERIOR on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex min-h-12 items-center gap-3 rounded-full border border-charcoal bg-charcoal px-4 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-champagne hover:text-charcoal focus-visible:outline-none sm:bottom-7 sm:right-7 lg:bottom-auto lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:rounded-r-none lg:rounded-l-full lg:py-4 lg:[writing-mode:vertical-rl]"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 18.5 5 21l3.2-1.1A8.5 8.5 0 1 0 6.5 18.5Z" />
        <path strokeLinecap="round" strokeWidth={1.5} d="M9.2 8.8c.3-.4.6-.4.9-.1l1 1.1c.2.2.2.5 0 .8l-.4.5c.6 1 1.4 1.8 2.4 2.4l.5-.4c.3-.2.6-.2.8 0l1.1 1c.3.3.3.6-.1.9-.5.5-1.2.7-1.8.5-2.8-.8-5-3-5.8-5.8-.2-.7 0-1.4.5-1.9Z" />
      </svg>
      <span>Chat with us</span>
    </a>
  );
}
