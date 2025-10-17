import { useLanguage } from '../contexts/LanguageContext';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, description }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {description}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

