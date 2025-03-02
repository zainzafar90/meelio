import { Link } from "react-router-dom";

import { UserAuthForm } from "@repo/shared";
import { Logo } from "@repo/shared";
import { AuthLayout } from "@/layouts/auth-layout";

const Login = () => {
  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
        <div className="flex flex-col justify-center items-center gap-y-8">
          <Link aria-label="Home" to="/">
            <Logo className="w-16 flex-none" />
          </Link>
          <div className="mx-auto flex w-full flex-col justify-center space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="font-heading text-2xl font-semibold">
                Welcome back
              </h1>
              <p className="text-sm text-foreground">
                Sign in to your Meelio Account
              </p>
            </div>
            <UserAuthForm userName="" onGuestContinue={() => {}} />

            <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <Link
                to="/register"
                className="hover:text-brand underline underline-offset-4"
              >
                Don&apos;t have an account? Sign Up
              </Link>
              <Link
                to="/guest"
                className="hover:text-brand underline underline-offset-4"
              >
                Continue as Guest
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;