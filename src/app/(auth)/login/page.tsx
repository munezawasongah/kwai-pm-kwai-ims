import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = {
  title: "Staff Login · kwai pm kwai",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-brand">kwai pm kwai</h1>
        <p className="mb-1 text-sm text-gray-500">Internal Management System</p>
        <p className="mb-6 text-xs text-gray-400">
          Staff access only. If you're planning a trip with us, visit our{" "}
          <Link href="/" className="text-brand hover:underline">
            website
          </Link>
          .
        </p>
        <LoginForm />
        <p className="mt-6 border-t pt-4 text-center text-xs text-gray-400">
          Forgotten your password? Contact your system administrator.
        </p>
      </div>
    </main>
  );
}
