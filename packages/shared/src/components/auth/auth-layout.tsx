interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-black/90 backdrop-blur-sm relative flex min-h-full justify-center md:px-12 lg:px-0 mx-4 overflow-hidden rounded-lg">
      <main className="relative z-10 flex flex-col justify-center flex-1 px-4 py-10 shadow-2xl overflow-auto">
        {children}
      </main>
    </div>
  );
}
