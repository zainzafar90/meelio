import { Link } from "react-router-dom";

import { UserAuthForm } from "@/components/auth/user-auth-form";
import { Logo } from "@/components/logo";
import { AuthLayout } from "@/layouts/auth-layout";

const Register = () => {
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
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Provide email to create your account
              </p>
            </div>

            <UserAuthForm />

            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                to="/login"
                className="hover:text-brand underline underline-offset-4"
              >
                Already have an account? Sign In
              </Link>
            </p>

            <p className="px-2 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                to="/privacy-policy"
                className="hover:text-brand underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;