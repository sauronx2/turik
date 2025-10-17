function Leaderboard({ usersList, currentUsername }) {
    const sortedUsers = [...usersList].sort((a, b) => b.bottles - a.bottles);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Лідерборд</h2>

            <div className="space-y-2">
                {sortedUsers.map((user, index) => (
                    <div
                        key={user.username}
                        className={`flex items-center justify-between p-3 rounded-md ${user.username === currentUsername
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`text-sm font-medium ${index === 0 ? 'text-yellow-600' :
                                    index === 1 ? 'text-gray-500' :
                                        index === 2 ? 'text-orange-600' :
                                            'text-gray-400'
                                }`}>
                                #{index + 1}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    {user.username}
                                    {user.username === currentUsername && (
                                        <span className="text-xs text-blue-600 ml-2">(ви)</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className={`inline-block w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                        }`} />
                                    <span className="text-xs text-gray-500">
                                        {user.isOnline ? 'онлайн' : 'офлайн'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                                {user.bottles}
                            </div>
                            <div className="text-xs text-gray-500">🍺</div>
                        </div>
                    </div>
                ))}

                {sortedUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Ще немає учасників
                    </div>
                )}
            </div>
        </div>
    );
}

export default Leaderboard;
