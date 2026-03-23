export default function VisitorProfile() {
  // TODO: load visitor profile from backend once endpoint exists; PRD requires profile/settings.
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Your profile and settings.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">
          Profile details will be shown here (name, mobile, age range, email).
        </p>
      </div>
    </div>
  );
}

