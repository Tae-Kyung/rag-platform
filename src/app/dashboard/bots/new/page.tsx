import { BotForm } from '@/features/dashboard/BotForm';

export default function NewBotPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Bot</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Set up your AI bot. You can update these settings later.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <BotForm mode="create" />
      </div>
    </div>
  );
}
