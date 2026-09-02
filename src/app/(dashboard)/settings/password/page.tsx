import ChangePasswordForm from "./change-password-form";

export default function PasswordPage() {
  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-brand">My Password</h1>
      <p className="mb-6 max-w-lg text-sm text-gray-500">
        Change your own password. If you have forgotten it, an administrator can set a new one
        from Staff Accounts — passwords are stored only as irreversible hashes and cannot be
        looked up.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
