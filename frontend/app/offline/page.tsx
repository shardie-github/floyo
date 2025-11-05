export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">You&apos;re offline</h1>
        <p className="text-muted-foreground mb-8">
          Please check your connection and try again.
        </p>
        <a href="/" className="inline-block px-6 py-3 bg-primary text-primary-fg rounded-xl hover:opacity-90">
          Go Home
        </a>
      </div>
    </div>
  );
}