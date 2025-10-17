function UserPanel({ users, currentUserId }) {
    const usersList = Object.entries(users).map(([id, user]) => ({
        id,
        ...user,
        isMe: id === currentUserId,
    }));

    return (
        <div className="bg-white/20 rounded-xl p-4 min-w-[200px]">
            <h3 className="text-white font-semibold mb-3 text-sm">
                👥 Учасники ({usersList.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
                {usersList.map((user) => (
                    <div
                        key={user.id}
                        className={`flex justify-between items-center text-sm ${user.isMe ? 'text-yellow-300 font-bold' : 'text-white/80'
                            }`}
                    >
                        <span>
                            {user.isAdmin && '👑 '}
                            {user.name}
                            {user.isMe && ' (ви)'}
                        </span>
                        <span>{user.bottles} 🍺</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UserPanel;
