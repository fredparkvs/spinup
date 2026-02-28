export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">SpinUp</h1>
        <p className="text-sm text-muted-foreground">
          Tools for South African startup founders
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
