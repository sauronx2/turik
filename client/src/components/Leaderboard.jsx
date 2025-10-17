import { useLanguage } from '../contexts/LanguageContext';

function Leaderboard({ usersList, currentUsername }) {
    const { t } = useLanguage();
    const sortedUsers = [...usersList].sort((a, b) => b.bottles - a.bottles);

    return (
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-200 dark:border-dark-border p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-medium text-gray-900 dark:text-dark-text mb-3 lg:mb-4">{t('leaderboard')}</h2>

            <div className="space-y-2">
                {sortedUsers.map((user, index) => (
                    <div
                        key={user.username}
                        className={`flex items-center justify-between p-3 rounded-md ${user.username === currentUsername
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`text-sm font-medium ${index === 0 ? 'text-yellow-600 dark:text-yellow-500' :
                                index === 1 ? 'text-gray-500 dark:text-gray-400' :
                                    index === 2 ? 'text-orange-600 dark:text-orange-500' :
                                        'text-gray-400 dark:text-gray-500'
                                }`}>
                                #{index + 1}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {user.username}
                                    {user.username === currentUsername && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">{t('you')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`inline-block w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                        }`} />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.isOnline ? t('online') : t('offline')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {user.bottles}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">🍺</div>
                        </div>
                    </div>
                ))}

                {sortedUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        {t('noParticipants')}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Leaderboard;
