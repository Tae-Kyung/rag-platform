import { BotForm } from '@/features/dashboard/BotForm';

export default function NewBotPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Create New Bot</h2>
      <p className="mt-1 text-sm text-gray-500">
        Set up your AI bot. You can update these settings later.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <BotForm mode="create" />
      </div>
    </div>
  );
}
