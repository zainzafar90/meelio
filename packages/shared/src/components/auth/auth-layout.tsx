interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="dark isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
      <main className="w-full max-w-md p-6 md:p-12 mx-4 rounded-lg bg-black/90 backdrop-blur-sm ring-1 shadow-md ring-black/5">
        {children}
      </main>
    </div>
  );
}
