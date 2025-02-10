const { useState, useEffect, useRef } = React;

const room = new WebsimSocket();

// Update admin username
const ADMIN_USERNAME = 'Demosand';

const isAdmin = () => room.party.client.username === ADMIN_USERNAME;

const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video metadata'));
      };

      const url = URL.createObjectURL(file);
      video.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const bellRef = useRef(null);

  const likes = React.useSyncExternalStore(
    room.collection('like').subscribe,
    room.collection('like').getList
  );

  const comments = React.useSyncExternalStore(
    room.collection('comment').subscribe,
    room.collection('comment').getList
  );

  const videos = React.useSyncExternalStore(
    room.collection('video').subscribe,
    room.collection('video').getList
  );

  useEffect(() => {
    let newNotifications = [];
    const currentUsername = room.party.client.username;

    // Get notifications for likes on user's videos
    const userVideos = videos.filter(v => v.username === currentUsername);
    
    for (const video of userVideos) {
      const videoLikes = likes.filter(like => 
        like.video_id === video.id && 
        like.username !== currentUsername &&
        !notifications.some(n => n.id === `like_${like.id}`)
      );
      
      newNotifications.push(...videoLikes.map(like => ({
        id: `like_${like.id}`,
        type: 'like',
        username: like.username,
        timestamp: like.created_at,
        content: 'liked your video',
        read: false
      })));
    }

    // Get notifications for replies to user's comments
    const userComments = comments.filter(c => c.username === currentUsername);
    const replies = comments.filter(c => 
      userComments.some(uc => c.parent_id === uc.id) && 
      c.username !== currentUsername &&
      !notifications.some(n => n.id === `reply_${c.id}`)
    );

    newNotifications.push(...replies.map(reply => ({
      id: `reply_${reply.id}`,
      type: 'reply',
      username: reply.username,
      timestamp: reply.created_at,
      content: 'replied to your comment',
      read: false
    })));

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      setHasUnread(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 1000);

      // Shake bell periodically if there are unread notifications
      const shakeInterval = setInterval(() => {
        if (hasUnread) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 1000);
        }
      }, 10000);

      return () => clearInterval(shakeInterval);
    }
  }, [likes, comments]);

  const handleNotificationClick = (notification) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    if (!updatedNotifications.some(n => !n.read)) {
      setHasUnread(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // difference in seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleClose = () => {
    setShowNotifications(false);
    // Mark all notifications as read when closing
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setHasUnread(false);
  };

  return (
    <>
      <button 
        className={`notification-btn ${isShaking ? 'shake-bell' : ''}`}
        onClick={() => setShowNotifications(!showNotifications)}
        ref={bellRef}
      >
        <i className="fas fa-bell"></i>
        {hasUnread && <div className="notification-dot"></div>}
      </button>

      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button className="close-btn" onClick={handleClose}>
              &times;
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <i className="far fa-bell-slash"></i>
              <div>No notifications yet</div>
            </div>
          ) : (
            notifications.map(notification => {
              // Find related video based on notification type
              let relatedVideo;
              if (notification.type === 'like') {
                relatedVideo = videos.find(v => v.id === likes.find(l => 
                  `like_${l.id}` === notification.id
                )?.video_id);
              } else if (notification.type === 'reply') {
                const comment = comments.find(c => `reply_${c.id}` === notification.id);
                relatedVideo = videos.find(v => v.id === comment?.video_id);
              }

              return (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <img
                    className="notification-avatar"
                    src={`https://images.websim.ai/avatar/${notification.username}`}
                    alt={notification.username}
                  />
                  <div className="notification-content">
                    <div className="notification-text">
                      <span className="notification-username">@{notification.username}</span>
                      <span className="notification-action">{notification.content}</span>
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {relatedVideo && (
                    <div className="notification-video-container">
                      <video 
                        className="notification-video-preview"
                        src={relatedVideo.url}
                        muted 
                        loop
                        playsInline
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}

function ChatModal({ onClose, selectedUser }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  
  const messages = React.useSyncExternalStore(
    room.collection('message').subscribe,
    room.collection('message').getList
  );

  const blocks = React.useSyncExternalStore(
    room.collection('block').subscribe,
    room.collection('block').getList
  );

  useEffect(() => {
    // Group messages by chat participants
    const messagesByChat = messages.reduce((acc, msg) => {
      const chatId = [msg.from_username, msg.to_username].sort().join('-');
      if (!acc[chatId]) acc[chatId] = [];
      acc[chatId].push(msg);
      return acc;
    }, {});
    
    setChats(Object.entries(messagesByChat).map(([id, messages]) => ({
      id,
      participants: id.split('-'),
      lastMessage: messages[messages.length - 1]
    })));

    setBlockedUsers(blocks.map(block => block.blocked_username));
  }, [messages, blocks]);

  useEffect(() => {
    if (selectedUser) {
      const chatId = [selectedUser, room.party.client.username].sort().join('-');
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
      } else {
        setSelectedChat({
          id: chatId,
          participants: [selectedUser, room.party.client.username]
        });
      }
    }
  }, [selectedUser, chats]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const toUsername = selectedChat.participants.find(p => p !== room.party.client.username);
    
    await room.collection('message').create({
      to_username: toUsername,
      text: message,
    });
    
    setMessage('');
  };

  const handleBlock = async (username) => {
    if (blockedUsers.includes(username)) {
      const block = blocks.find(b => b.blocked_username === username);
      await room.collection('block').delete(block.id);
    } else {
      await room.collection('block').create({
        blocked_username: username
      });
    }
  };

  const handleMessage = async (e, text = null) => {
    e.preventDefault();
    if (!selectedChat) return;
    
    const messageText = text || message;
    if (!messageText.trim()) return;

    const toUsername = selectedChat.participants.find(
      p => p !== room.party.client.username
    );

    await room.collection('message').create({
      to_username: toUsername,
      text: messageText
    });

    setMessage('');
  };

  const chatMessages = messages.filter(msg => 
    (msg.from_username === room.party.client.username && msg.to_username === selectedChat?.participants.find(p => p !== room.party.client.username)) ||
    (msg.to_username === room.party.client.username && msg.from_username === selectedChat?.participants.find(p => p !== room.party.client.username))
  );

  const sortedMessages = [...chatMessages].sort((a, b) => 
    new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div className="chat-modal">
      <div className="chat-header">
        <h3>Messages</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      
      <div className="chat-content">
        {!selectedChat ? (
          <div className="chat-list">
            {chats.map(chat => (
              <div 
                key={chat.id} 
                className="chat-item"
                onClick={() => setSelectedChat(chat)}
              >
                <img 
                  src={`https://images.websim.ai/avatar/${chat.participants.find(p => p !== room.party.client.username)}`}
                  alt="User avatar"
                  className="chat-avatar"
                />
                <div className="chat-preview">
                  <div className="chat-username">
                    @{chat.participants.find(p => p !== room.party.client.username)}
                  </div>
                  <div className="chat-last-message">
                    {chat.lastMessage.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-messages">
            <div className="chat-messages-header">
              <button 
                className="back-btn"
                onClick={() => setSelectedChat(null)}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="chat-with">
                @{selectedChat.participants.find(p => p !== room.party.client.username)}
              </div>
              <button 
                className="block-btn"
                onClick={() => handleBlock(selectedChat.participants.find(p => p !== room.party.client.username))}
              >
                <i className={`fas fa-${blockedUsers.includes(selectedChat.participants.find(p => p !== room.party.client.username)) ? 'unlock' : 'user-lock'}`}></i>
              </button>
            </div>
            <div className="messages-container">
              {sortedMessages.map(msg => (
                <div 
                  key={msg.id}
                  className={`message ${msg.from_username === room.party.client.username ? 'sent' : 'received'}`}
                >
                  {msg.shared_video_id && (
                    <div className="shared-video">
                      <video 
                        src={msg.shared_video_url} 
                        controls 
                        width="200"
                      />
                    </div>
                  )}
                  <div className="message-text">{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="message-input-container">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={blockedUsers.includes(selectedChat.participants.find(p => p !== room.party.client.username))}
              />
              <button 
                type="submit"
                disabled={blockedUsers.includes(selectedChat.participants.find(p => p !== room.party.client.username))}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Settings({ onClose }) {
  const [betaEnabled, setBetaEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('updates');
  const [superOptimization, setSuperOptimization] = useState(false);

  const updates = [
    {
      date: '2023-07-21',
      changes: [
        'Added video download functionality',
        'Improved video loading optimization',
        'Added Super Optimization mode in Beta',
        'Fixed photo audio playback issues'
      ]
    },
    {
      date: '2023-07-20',
      changes: [
        'Added comment count display',
        'Added follow/unfollow functionality',
        'Added user profiles',
        'Added comment likes',
        'Added chat system with blocking feature',
        'Added video sharing in chats',
        'Added settings page with update history'
      ]
    }
  ];

  const betaFeatures = [
    {
      title: 'Super Optimization',
      description: 'Enhanced video loading and playback optimization for smoother scrolling.',
      status: 'Available',
      toggle: true,
      onToggle: () => {
        setSuperOptimization(!superOptimization);
        localStorage.setItem('superOptimization', (!superOptimization).toString());
        if (!superOptimization) {
          // Show optimization animation
          const optimizeOverlay = document.createElement('div');
          optimizeOverlay.className = 'optimize-overlay';
          optimizeOverlay.innerHTML = `
            <div class="optimize-content">
              <i class="fas fa-bolt"></i>
              <span>Super Optimization Enabled!</span>
            </div>
          `;
          document.body.appendChild(optimizeOverlay);
          setTimeout(() => {
            optimizeOverlay.remove();
          }, 2000);
        }
      },
      enabled: superOptimization
    },
    {
      title: 'Photo Posts with Audio',
      description: 'Upload photos with background audio extracted from videos.',
      status: 'Available'
    }
  ];

  const handleBetaToggle = () => {
    setBetaEnabled(!betaEnabled);
    localStorage.setItem('betaEnabled', (!betaEnabled).toString());
  };

  useEffect(() => {
    const storedBetaState = localStorage.getItem('betaEnabled') === 'true';
    const storedSuperOpt = localStorage.getItem('superOptimization') === 'true';
    setBetaEnabled(storedBetaState);
    setSuperOptimization(storedSuperOpt);
  }, []);

  return (
    <div className="settings-modal">
      <div className="settings-header">
        <h3>Settings</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Updates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'beta' ? 'active' : ''}`}
          onClick={() => setActiveTab('beta')}
        >
          Beta
        </button>
        <button 
          className={`tab-btn pulse-tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Rules
        </button>
      </div>
      <div className="settings-content">
        {activeTab === 'updates' ? (
          <div className="updates-section">
            <h4>Update History</h4>
            {updates.map((update, index) => (
              <div key={index} className="update-item">
                <div className="update-date">{update.date}</div>
                <ul className="update-changes">
                  {update.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : activeTab === 'beta' ? (
          <div className="beta-section">
            <div className="beta-toggle">
              <span>Enable Beta Features</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={betaEnabled}
                  onChange={handleBetaToggle}
                />
                <span className="slider round"></span>
              </label>
            </div>
            {betaEnabled && (
              <div className="beta-features">
                <h4>Available Beta Features</h4>
                {betaFeatures.map((feature, index) => (
                  <div key={index} className="beta-feature-item">
                    <div className="feature-header">
                      <h5>{feature.title}</h5>
                      <span className="feature-status">{feature.status}</span>
                    </div>
                    <p>{feature.description}</p>
                    {feature.toggle && (
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={feature.enabled}
                          onChange={feature.onToggle}
                        />
                        <span className="slider round"></span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rules-section">
            <h4>Community Guidelines</h4>
            <div className="rules-list">
              <div className="rule-item">
                <i className="fas fa-heart-broken"></i>
                <h5>No Like Manipulation</h5>
                <p>Artificially inflating like counts is prohibited. Videos with suspicious like patterns will be removed.</p>
              </div>
              <div className="rule-item">
                <i className="fas fa-ban"></i>
                <h5>Content Restrictions</h5>
                <p>The following content is strictly prohibited:</p>
                <ul>
                  <li>Violence or gore</li>
                  <li>Bullying or harassment</li>
                  <li>Hate speech</li>
                  <li>Dangerous activities</li>
                </ul>
              </div>
              <div className="rules-footer">
                <p className="rules-message">
                  Please do not break the rules, I will be soft on moderation and will not delete everything like the original tiktok
                </p>
                <div className="heartbeat-container">
                  <i className="fas fa-heart beating-heart"></i>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({ username, onClose, onOpenChat, onOpenSettings }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  const videos = React.useSyncExternalStore(
    room.collection('video').filter({ username }).subscribe,
    room.collection('video').filter({ username }).getList
  );
  
  const followers = React.useSyncExternalStore(
    room.collection('follow').filter({ following_username: username }).subscribe,
    room.collection('follow').filter({ following_username: username }).getList
  );

  const following = React.useSyncExternalStore(
    room.collection('follow').filter({ username }).subscribe,
    room.collection('follow').filter({ username }).getList
  );

  useEffect(() => {
    const isCurrentlyFollowing = followers.some(
      f => f.username === room.party.client.username
    );
    setIsFollowing(isCurrentlyFollowing);
  }, [followers]);

  const handleFollow = async () => {
    if (username === room.party.client.username) return;
    
    try {
      const existingFollow = followers.find(
        f => f.username === room.party.client.username
      );
      
      if (existingFollow) {
        await room.collection('follow').delete(existingFollow.id);
      } else {
        await room.collection('follow').create({
          following_username: username
        });
      }
    } catch (error) {
      console.error('Error handling follow:', error);
    }
  };

  return (
    <div className="profile-modal">
      <div className="profile-header">
        <button className="profile-back-btn" onClick={onClose}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>@{username}</h2>
        <div className="profile-actions">
          {username === room.party.client.username ? (
            <button className="settings-btn" onClick={onOpenSettings}>
              <i className="fas fa-cog"></i>
            </button>
          ) : isFollowing && (
            <button className="message-btn" onClick={() => onOpenChat(username)}>
              <i className="fas fa-paper-plane"></i>
            </button>
          )}
        </div>
      </div>
      
      <div className="profile-info">
        <div className="profile-avatar-wrapper">
          <img
            className="profile-avatar"
            src={`https://images.websim.ai/avatar/${username}`}
            alt={username}
          />
          {username === ADMIN_USERNAME && (
            <i className="fas fa-crown admin-crown"></i>
          )}
        </div>
        
        <div className="profile-username">
          @{username}
          {username === ADMIN_USERNAME && (
            <span className="admin-badge">Owner</span>
          )}
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-number">{videos.length}</div>
            <div className="stat-label">Videos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{followers.length}</div>
            <div className="stat-label">Followers</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{following.length}</div>
            <div className="stat-label">Following</div>
          </div>
        </div>
        
        {username !== room.party.client.username && (
          <button 
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      
      <div className="profile-videos">
        {videos.map(video => (
          <div 
            key={video.id} 
            className="profile-video-item"
            onClick={() => setSelectedVideo(video)}
          >
            <video
              src={video.url}
              muted
              loop
              playsInline
              onMouseOver={e => e.target.play()}
              onMouseOut={e => {
                e.target.pause();
                e.target.currentTime = 0;
              }}
            />
            <div className="profile-video-overlay">
              <i className="fas fa-heart"></i>
              {video.likes?.length || 0}
              <i className="fas fa-comment"></i>
              {video.comments?.length || 0}
            </div>
          </div>
        ))}
      </div>
      
      {selectedVideo && (
        <div className="modal" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <VideoItem
              video={selectedVideo}
              onClose={() => setSelectedVideo(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ShareModal({ onClose, video }) {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isSending, setIsSending] = useState(false);

  const messages = React.useSyncExternalStore(
    room.collection('message').subscribe,
    room.collection('message').getList
  );

  const contacts = React.useMemo(() => {
    const uniqueContacts = new Set();
    messages.forEach(msg => {
      if (msg.from_username === room.party.client.username) {
        uniqueContacts.add(msg.to_username);
      } else if (msg.to_username === room.party.client.username) {
        uniqueContacts.add(msg.from_username);
      }
    });
    return Array.from(uniqueContacts).filter(username => username !== room.party.client.username);
  }, [messages]);

  const handleUserSelect = (username) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const handleSend = async () => {
    if (selectedUsers.size === 0 || isSending) return;
    
    setIsSending(true);
    try {
      const promises = Array.from(selectedUsers).map(username =>
        room.collection('message').create({
          to_username: username,
          text: `Shared a video`,
          shared_video_id: video.id,
          shared_video_url: video.url
        })
      );
      
      await Promise.all(promises);
      onClose();
    } catch (error) {
      console.error('Error sharing video:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Error downloading video');
    }
  };

  return (
    <div className="share-modal">
      <div className="share-header">
        <h3>Share with</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="share-users">
        {/* Download button */}
        <div 
          className="share-user-item"
          onClick={handleDownload}
        >
          <div className="share-user-avatar-wrapper download-avatar">
            <i className="fas fa-download"></i>
          </div>
          <span className="share-username">Download</span>
        </div>

        {contacts.length > 0 ? contacts.map(username => (
          <div 
            key={username}
            className={`share-user-item ${selectedUsers.has(username) ? 'selected' : ''}`}
            onClick={() => handleUserSelect(username)}
          >
            <div className="share-user-avatar-wrapper">
              <img 
                src={`https://images.websim.ai/avatar/${username}`}
                alt={username} 
                className="share-user-avatar"
              />
              {selectedUsers.has(username) && (
                <div className="share-checkmark">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>
            <span className="share-username">@{username}</span>
          </div>
        )) : (
          <div className="share-empty-state">
            <i className="fas fa-users-slash"></i>
            <p>No contacts yet</p>
          </div>
        )}
      </div>
      <button 
        className={`share-send-btn ${selectedUsers.size > 0 ? 'active' : ''}`}
        onClick={handleSend}
        disabled={selectedUsers.size === 0 || isSending}
      >
        {isSending ? (
          <>
            <div className="spinner-small"></div>
            Sending...
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i>
            Send
          </>
        )}
      </button>
    </div>
  );
}

function VideoItem({ video, onCommentClick, onDelete, onProfileClick, onClose, onShare }) {
  const videoRef = useRef(null);
  const observer = useRef(null);
  const [likes, setLikes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [videoSource, setVideoSource] = useState(null);
  const isSuperOptimized = localStorage.getItem('superOptimization') === 'true';
  const [showShareModal, setShowShareModal] = useState(false);

  const likesList = React.useSyncExternalStore(
    room.collection('like').filter({ video_id: video.id }).subscribe,
    room.collection('like').filter({ video_id: video.id }).getList
  );

  useEffect(() => {
    setLikes(likesList);
  }, [likesList]);

  useEffect(() => {
    if (video.is_photo && video.audio_url) {
      audioRef.current = new Audio(video.audio_url);
      audioRef.current.loop = true;
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current = null;
        }
      };
    }
  }, [video.is_photo, video.audio_url]);

  useEffect(() => {
    // Handle audio playing based on visibility
    if (video.is_photo && video.audio_url && audioRef.current) {
      if (isInView) {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isInView, video.is_photo, video.audio_url]);

  useEffect(() => {
    if (!video.is_photo) {
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsInView(entry.isIntersecting);
            if (entry.isIntersecting) {
              setVideoSource(video.url);
              if (videoRef.current) {
                if (isSuperOptimized) {
                  // Super optimization: load video at lower quality first
                  videoRef.current.setAttribute('preload', 'metadata');
                  videoRef.current.playbackRate = 1.0;
                }
                videoRef.current.load();
                videoRef.current.play()
                  .then(() => setIsPlaying(true))
                  .catch(err => console.error('Error playing video:', err));
              }
            } else {
              setVideoSource(null);
              setIsPlaying(false);
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
              }
              // Also stop audio if this is a photo post
              if (video.is_photo && audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            }
          });
        },
        { 
          threshold: 0.5,
          rootMargin: isSuperOptimized ? '50px 0px' : '100px 0px'
        }
      );

      if (videoRef.current) {
        observer.current.observe(videoRef.current);
      }

      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        }
      };
    } else {
      // For photo posts, use the same observer to handle visibility
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setIsInView(entry.isIntersecting);
          });
        },
        { threshold: 0.5 }
      );

      const element = document.querySelector(`[data-photo-id="${video.id}"]`);
      if (element) {
        observer.current.observe(element);
      }

      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    }
  }, [video.is_photo, video.url, isSuperOptimized, video.id]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsVideoLoaded(false);
    setHasError(true);
    console.error('Error loading media:', video.url);
  };

  const handleLike = async () => {
    try {
      const existingLike = likes.find(like => like.username === room.party.client.username);
      if (existingLike) {
        await room.collection('like').delete(existingLike.id);
      } else {
        await room.collection('like').create({
          video_id: video.id
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const togglePlay = () => {
    if (video.is_photo || !videoRef.current) return;
    
    try {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Error playing video:', err));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error toggling video playback:', error);
    }
  };

  const isLiked = likes.some(like => like.username === room.party.client.username);

  const comments = React.useSyncExternalStore(
    room.collection('comment').filter({ video_id: video.id }).subscribe,
    room.collection('comment').filter({ video_id: video.id }).getList
  );

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  return (
    <div className="video-item">
      <div 
        className="video-wrapper"
        data-photo-id={video.id}
      >
        {!isVideoLoaded && !hasError && (
          <div className="video-loader">
            <div className="spinner"></div>
          </div>
        )}
        {hasError && (
          <div className="video-error">
            <i className="fas fa-exclamation-circle"></i>
            <span>Error loading {video.is_photo ? 'image' : 'video'}</span>
          </div>
        )}
        {video.is_photo ? (
          <img
            src={video.url}
            alt="Post"
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={videoSource}
            loop
            playsInline
            onClick={togglePlay}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            preload="metadata"
            poster={video.thumbnail || ''}
            muted={!isPlaying}
          />
        )}
      </div>
      <div className="video-actions">
        <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
          <div className="action-btn-wrapper">
            <i className="fas fa-heart"></i>
            <span>{likes.length}</span>
          </div>
        </button>
        <button className="action-btn" onClick={onCommentClick}>
          <div className="action-btn-wrapper">
            <i className="fas fa-comment"></i>
            <span>{comments.length}</span>
          </div>
        </button>
        <button className="action-btn" onClick={handleShareClick}>
          <div className="action-btn-wrapper">
            <i className="fas fa-share"></i>
          </div>
        </button>
      </div>
      <div className="video-info">
        <div 
          className="user-info"
          onClick={() => onProfileClick && onProfileClick(video.username)}
          style={{ cursor: 'pointer' }}
        >
          {video.is_photo && (
            <div className="post-type-badge">
              <i className="fas fa-image"></i>
              <span>Image</span>
            </div>
          )}
          <div className={video.username === ADMIN_USERNAME ? 'admin-avatar' : ''}>
            <img
              className="user-avatar"
              src={`https://images.websim.ai/avatar/${video.username}`}
              alt={video.username}
            />
            {video.username === ADMIN_USERNAME && (
              <i className="fas fa-crown admin-crown"></i>
            )}
          </div>
          <div className="user-details">
            <div className="username">
              @{video.username}
              {video.username === ADMIN_USERNAME && (
                <span className="admin-badge">Owner</span>
              )}
            </div>
            <div className="description">{video.description}</div>
          </div>
        </div>
        
        {(video.username === room.party.client.username || isAdmin()) && (
          <button className="delete-btn" onClick={onDelete}>
            <i className="fas fa-trash"></i> Delete
          </button>
        )}
      </div>
      {!video.is_photo && (
        <div className="play-pause-overlay" onClick={togglePlay}>
          {!isPlaying && <i className="fas fa-play"></i>}
        </div>
      )}
      
      {showShareModal && (
        <ShareModal 
          onClose={() => setShowShareModal(false)}
          video={video}
        />
      )}
    </div>
  );
}

function UploadModal({ onClose, onSubmit }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const formRef = useRef(null);
  const videoPreviewRef = useRef(null);

  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  useEffect(() => {
    const betaEnabled = localStorage.getItem('betaEnabled') === 'true';
    if (betaEnabled) {
      // Show photo upload option
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const duration = await getVideoDuration(file);
      if (duration > 600) {
        setError('Video must be shorter than 10 minutes');
        return;
      }
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      setError(null);
    } catch (error) {
      console.error('Error processing audio source:', error);
      setError('Error processing video. Please try again.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const duration = await getVideoDuration(file);
      if (duration > 600) {
        setError('Video must be shorter than 10 minutes');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      setError(null);
    } catch (error) {
      console.error('Error checking video duration:', error);
      setError('Error processing video. Please try again.');
      e.target.value = '';
    }
  };

  const isSubmitDisabled = () => {
    if (isUploading) return true;
    if (isPhotoMode) {
      return !photoFile || !audioFile || !formRef.current?.description?.value;
    }
    return !selectedFile || !formRef.current?.description?.value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading || !formRef.current) return;

    const description = formRef.current.description.value;

    if (isPhotoMode) {
      if (!photoFile || !audioFile || !description) {
        setError('Please select a photo, audio source, and add a description');
        return;
      }

      try {
        setIsUploading(true);
        setError(null);
        setUploadProgress(10);
        
        // Upload photo and get URL
        const photoUrl = await websim.upload(photoFile);
        setUploadProgress(40);

        // Upload audio and get URL
        const audioUrl = await websim.upload(audioFile);
        setUploadProgress(70);

        await room.collection('video').create({
          url: photoUrl,
          audio_url: audioUrl,
          description,
          is_photo: true
        });

        setUploadProgress(100);
        setTimeout(() => {
          if (formRef.current) formRef.current.reset();
          setPhotoPreview(null);
          setAudioPreview(null);
          setPhotoFile(null);
          setAudioFile(null);
          onClose();
        }, 500);
      } catch (error) {
        console.error('Error uploading files:', error);
        setError('Error uploading files. Please try again.');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const file = selectedFile;
    if (!file || !description) {
      setError('Please select a video and add a description');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);
      
      const url = await websim.upload(file);
      setUploadProgress(70);

      await room.collection('video').create({
        url,
        description
      });

      setUploadProgress(100);
      setTimeout(() => {
        if (formRef.current) formRef.current.reset();
        setVideoPreview(null);
        setSelectedFile(null);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Error uploading video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    };
  }, [videoPreview, photoPreview, audioPreview]);

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Upload {isPhotoMode ? 'Photo' : 'Video'}</h2>
          <button 
            className="toggle-mode-btn"
            onClick={() => {
              setIsPhotoMode(!isPhotoMode);
              setError(null);
              setPhotoFile(null);
              setAudioFile(null);
              setPhotoPreview(null);
              setAudioPreview(null);
              setSelectedFile(null);
              setVideoPreview(null);
              if (formRef.current) formRef.current.reset();
            }}
          >
            Switch to {isPhotoMode ? 'Video' : 'Photo'} Mode
          </button>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="upload-form">
          {isPhotoMode ? (
            <>
              {!photoPreview ? (
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                  />
                  <i className="fas fa-image"></i>
                  <span>Choose a photo</span>
                </div>
              ) : (
                <div className="preview-wrapper">
                  <img src={photoPreview} className="photo-preview" />
                  <button 
                    type="button" 
                    className="change-file-btn"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                  >
                    Change photo
                  </button>
                </div>
              )}
              {photoPreview && !audioPreview && (
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleAudioChange}
                    disabled={isUploading}
                  />
                  <i className="fas fa-music"></i>
                  <span>Choose audio source (video)</span>
                </div>
              )}
              {audioPreview && (
                <div className="audio-preview">
                  <audio controls src={audioPreview} />
                  <button 
                    type="button"
                    onClick={() => {
                      setAudioPreview(null);
                      setAudioFile(null);
                    }}
                  >
                    Change audio
                  </button>
                </div>
              )}
            </>
          ) : (
            // Original video upload UI
            <>
              {!videoPreview ? (
                <div className="file-input-wrapper">
                  <input 
                    type="file" 
                    name="video" 
                    accept="video/*" 
                    required 
                    disabled={isUploading}
                    onChange={handleFileChange}
                  />
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Choose a video</span>
                </div>
              ) : (
                <div className="video-preview-wrapper">
                  <video
                    src={videoPreview}
                    controls
                    className="upload-preview"
                  />
                  <button 
                    type="button" 
                    className="change-video-btn"
                    onClick={() => {
                      setVideoPreview(null);
                      setSelectedFile(null);
                      formRef.current.reset();
                    }}
                  >
                    <i className="fas fa-redo"></i> Change video
                  </button>
                </div>
              )}
            </>
          )}
          <textarea
            name="description"
            placeholder="Add a description..."
            required
            disabled={isUploading}
          ></textarea>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitDisabled()}
          >
            {isUploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>Uploading... {uploadProgress}%</span>
              </div>
            ) : (
              <>
                <i className="fas fa-upload"></i>
                Upload
              </>
            )}
          </button>
          {error && (
            <div className="error-message">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}

function CommentItem({ comment, onDelete, setReplyTo, onLike, likes }) {
  const isLiked = likes.some(like => like.username === room.party.client.username);
  
  return (
    <div className="comment-item">
      <div className={comment.username === ADMIN_USERNAME ? 'admin-avatar' : ''}>
        <img
          className="comment-avatar"
          src={`https://images.websim.ai/avatar/${comment.username}`}
          alt={comment.username}
        />
        {comment.username === ADMIN_USERNAME && (
          <i className="fas fa-crown admin-crown"></i>
        )}
      </div>
      <div className="comment-content">
        <div className="comment-username">
          @{comment.username}
          {comment.username === ADMIN_USERNAME && (
            <span className="admin-badge">Owner</span>
          )}
        </div>
        {comment.reply_to && (
          <div className="reply-to">
            Replying to @{comment.reply_to}
          </div>
        )}
        <div className="comment-text">{comment.text}</div>
        <div className="comment-actions">
          <button 
            className={`comment-like-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onLike(comment.id)}
          >
            <i className="fas fa-heart"></i>
            <span>{likes.length}</span>
          </button>
          <button 
            className="reply-btn"
            onClick={() => setReplyTo({ id: comment.id, username: comment.username })}
          >
            Reply
          </button>
          {(comment.username === room.party.client.username || isAdmin()) && (
            <button 
              className="delete-btn"
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentsModal({ comments, onClose, onSubmit, comment, setComment, onDeleteComment, replyTo, setReplyTo }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentLikes = React.useSyncExternalStore(
    room.collection('comment_like').subscribe,
    room.collection('comment_like').getList
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !comment.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    const existingLike = commentLikes.find(
      like => like.comment_id === commentId && 
      like.username === room.party.client.username
    );

    try {
      if (existingLike) {
        await room.collection('comment_like').delete(existingLike.id);
      } else {
        await room.collection('comment_like').create({
          comment_id: commentId
        });
      }
    } catch (error) {
      console.error('Error handling comment like:', error);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    // Get likes for each comment
    const aLikes = commentLikes.filter(like => like.comment_id === a.id).length;
    const bLikes = commentLikes.filter(like => like.comment_id === b.id).length;
    
    // Sort by likes count first, then by parent comments, then by date
    if (aLikes !== bLikes) return bLikes - aLikes;
    if (!a.parent_id && b.parent_id) return -1;
    if (a.parent_id && !b.parent_id) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="comments-container">
      <div className="comments-header">
        <h3>Comments</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="comment-list">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={onDeleteComment}
            setReplyTo={setReplyTo}
            onLike={handleCommentLike}
            likes={commentLikes.filter(like => like.comment_id === comment.id)}
          />
        ))}
      </div>
      <form onSubmit={handleSubmit} className="comment-input-container">
        {replyTo && (
          <div className="reply-banner">
            Replying to @{replyTo.username}
            <button onClick={() => setReplyTo(null)}>&times;</button>
          </div>
        )}
        <input
          type="text"
          className="comment-input"
          placeholder={replyTo ? `Reply to @${replyTo.username}...` : "Add a comment..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" className="send-comment-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="send-comment-spinner"></div>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  );
}

function App() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  
  const videos = React.useSyncExternalStore(
    room.collection('video').subscribe,
    room.collection('video').getList
  );

  const comments = React.useSyncExternalStore(
    room.collection('comment').filter({ video_id: currentVideoId }).subscribe,
    room.collection('comment').filter({ video_id: currentVideoId }).getList
  );

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    const file = e.target.video.files[0];
    const description = e.target.description.value;

    if (!file || !description) {
      alert('Please select a video and add a description');
      return;
    }

    if (file.type.indexOf('video/') !== 0) {
      alert('Please upload a video file');
      return;
    }

    const duration = await getVideoDuration(file);
    if (duration > 600) { // 10 minutes in seconds
      alert('Video must be shorter than 10 minutes');
      return;
    }

    try {
      const url = await websim.upload(file);
      await room.collection('video').create({
        url,
        description
      });
      setShowUploadModal(false);
      e.target.reset();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video. Please try again.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    await room.collection('comment').create({
      video_id: currentVideoId,
      text: comment,
      parent_id: replyTo ? replyTo.id : null,
      reply_to: replyTo ? replyTo.username : null
    });
    setComment('');
    setReplyTo(null);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await room.collection('comment').delete(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error deleting comment');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await room.collection('video').delete(videoId);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };

  const handleShareVideo = async (video) => {
    if (!selectedChatUser) {
      setShowChat(true);
      setSelectedChatUser(video.username);
      return;
    }

    try {
      await room.collection('message').create({
        to_username: selectedChatUser,
        text: `Shared a video`,
        shared_video_id: video.id,
        shared_video_url: video.url
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  return (
    <div className="app-container">
      <NotificationBell />
      <div className="top-bar">
        <button 
          className="profile-btn"
          onClick={() => setSelectedProfile(room.party.client.username)}
        >
          <img
            src={`https://images.websim.ai/avatar/${room.party.client.username}`}
            alt="Profile"
          />
        </button>
        
        <button 
          className="chat-btn"
          onClick={() => setShowChat(true)}
        >
          <i className="fas fa-comments"></i>
        </button>
      </div>

      {selectedProfile && (
        <Profile
          username={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onOpenChat={setSelectedChatUser}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      
      {videos.length === 0 ? (
        <div className="loading-container">
          <div>
            <div className="spinner"></div>
            <div>Waiting for videos...</div>
          </div>
        </div>
      ) : (
        <div className="video-container">
          {videos.map((video) => (
            <VideoItem 
              key={video.id}
              video={video}
              onCommentClick={() => {
                setCurrentVideoId(video.id);
                setShowComments(true);
              }}
              onDelete={() => handleDeleteVideo(video.id)}
              onProfileClick={setSelectedProfile}
              onShare={handleShareVideo}
            />
          ))}
        </div>
      )}

      <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
        <i className="fas fa-plus"></i> Upload
      </button>

      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleVideoUpload}
        />
      )}

      {showComments && (
        <CommentsModal
          comments={comments}
          onClose={() => {
            setShowComments(false);
            setReplyTo(null);
          }}
          onSubmit={handleComment}
          comment={comment}
          setComment={setComment}
          onDeleteComment={handleDeleteComment}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
      )}

      {showChat && (
        <ChatModal 
          onClose={() => {
            setShowChat(false);
            setSelectedChatUser(null);
          }}
          selectedUser={selectedChatUser}
        />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
