// Tab switching functionality
document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Show corresponding section
    const appName = button.dataset.app;
    document.querySelectorAll('.app-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${appName}-app`).classList.add('active');
  });
});

// Add this at the beginning of the file with other global variables
let portfolioValue = 0;
let stockHoldings = {};

// Add this to the nav event listener setup
document.querySelector('[data-app="stocks"]').classList.add('nav-btn');

// Bank App
const formatMoney = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

let bankBalance = 2456.78; // Initial bank balance
let casinoBalance = 0; // Casino balance

const updateBankUI = () => {
  document.querySelector('.balance').textContent = formatMoney(bankBalance);
};

// Casino integration
const transferToCasino = (amount) => {
  if (amount <= bankBalance) {
    bankBalance -= amount;
    casinoBalance += amount;
    updateBankUI();
    updateUI(); // Casino UI update
    
    // Add transaction record
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction';
    transactionDiv.innerHTML = `
      <i class="fas fa-dice"></i>
      <div class="transaction-details">
        <div class="merchant">Transfer to Casino</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="amount negative">-${formatMoney(amount)}</div>
    `;
    document.querySelector('.transactions').insertBefore(transactionDiv, document.querySelector('.transactions').children[1]);
  }
};

// Modify casino variables and functions
let balance = casinoBalance;
let currentBet = 10;
let totalSpins = 0;
let totalWagered = 0;
let totalWon = 0;

// Add this function for special bets
const setSpecialBet = (type) => {
  switch(type) {
    case 'all':
      currentBet = casinoBalance;
      break;
    case 'half':
      currentBet = Math.floor(casinoBalance / 2);
      break;
  }
  updateUI();
};

// Update the Casino's updateUI function
const updateUI = () => {
  document.getElementById('balance').textContent = casinoBalance.toFixed(2);
  document.getElementById('current-bet').textContent = currentBet;
  document.getElementById('total-spins').textContent = totalSpins;
  
  const returnPercentage = totalWagered > 0 
    ? ((totalWon / totalWagered) * 100).toFixed(1)
    : '0';
  document.getElementById('return-percentage').textContent = returnPercentage;
  
  const spinButton = document.getElementById('spin');
  spinButton.disabled = casinoBalance < currentBet;

  // Update special bet buttons
  document.getElementById('all-in-btn').disabled = casinoBalance <= 0;
  document.getElementById('half-in-btn').disabled = casinoBalance <= 1;
};

// Email App functionality
class EmailApp {
  constructor() {
    this.emails = [
      {
        sender: 'LinkedIn',
        subject: 'New job opportunities for you',
        preview: 'Based on your profile, we found these matches...',
        time: '10:45 AM',
        unread: true,
        full: 'Based on your profile, we found these matches that might interest you...'
      },
      {
        sender: 'Amazon',
        subject: 'Your order has shipped!',
        preview: 'Track your package with this link...',
        time: 'Yesterday',
        unread: false,
        full: 'Your recent order #123456 has shipped! Track your package here...'
      }
    ];
  }

  generateAngryResponse(subject) {
    const angryResponses = [
      {
        sender: 'Frustrated Customer Service',
        subject: `Re: ${subject}`,
        content: "ARE YOU KIDDING ME?! Your email about '" + subject + "' is absolutely RIDICULOUS! I can't believe I have to deal with this!",
        preview: 'ARE YOU KIDDING ME?! Your email is...'
      },
      {
        sender: 'Angry Department Head',
        subject: `Re: ${subject}`,
        content: "Listen here! I have had it up to HERE with emails like '" + subject + "'! Do you have ANY idea how busy we are?!",
        preview: 'Listen here! I have had it up to...'
      },
      {
        sender: 'Enraged Support Team',
        subject: `Re: ${subject}`,
        content: "ABSOLUTELY UNACCEPTABLE! Your message about '" + subject + "' has ruined my ENTIRE DAY! I cannot even...",
        preview: 'ABSOLUTELY UNACCEPTABLE! Your...'
      },
      {
        sender: 'Furious Management',
        subject: `Re: ${subject}`,
        content: "Oh GREAT, another email about '" + subject + "'! Just what I needed to make this day EVEN WORSE!",
        preview: 'Oh GREAT, another email about...'
      }
    ];

    return angryResponses[Math.floor(Math.random() * angryResponses.length)];
  }

  addEmail(email) {
    this.emails.unshift(email);
    this.renderEmails();
  }

  renderEmails() {
    const emailList = document.querySelector('.email-list');
    emailList.innerHTML = '';

    this.emails.forEach(email => {
      const emailDiv = document.createElement('div');
      emailDiv.className = `email ${email.unread ? 'unread' : ''}`;
      emailDiv.innerHTML = `
        <div class="sender">${email.sender}</div>
        <div class="subject">${email.subject}</div>
        <div class="preview">${email.preview}</div>
        <div class="time">${email.time}</div>
      `;

      emailDiv.addEventListener('click', () => {
        this.openEmail(email);
      });

      emailList.appendChild(emailDiv);
    });
  }

  openEmail(email) {
    const modal = document.getElementById('email-modal');
    modal.querySelector('.email-content').innerHTML = email.full || email.content;
    modal.style.display = 'block';
  }

  init() {
    this.renderEmails();

    // Compose button functionality
    document.querySelector('.compose-btn').addEventListener('click', () => {
      document.getElementById('compose-modal').style.display = 'block';
    });

    // Email send functionality
    document.getElementById('send-email').addEventListener('click', () => {
      const subject = document.getElementById('email-subject').value;
      const content = document.getElementById('email-content').value;

      if (subject && content) {
        // Add sent email
        this.addEmail({
          sender: 'Me',
          subject: subject,
          preview: content.substring(0, 50) + '...',
          time: 'Just now',
          unread: false,
          full: content
        });

        // Generate and add angry response after a delay
        setTimeout(() => {
          const response = this.generateAngryResponse(subject);
          this.addEmail({
            ...response,
            time: 'Just now',
            unread: true
          });
        }, 2000);

        // Clear and close compose modal
        document.getElementById('email-subject').value = '';
        document.getElementById('email-content').value = '';
        document.getElementById('compose-modal').style.display = 'none';
      }
    });

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
      button.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
      });
    });
  }
}

// Initialize EmailApp when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const emailApp = new EmailApp();
  emailApp.init();
  
  // ...rest of the existing DOMContentLoaded code...
});

// Email App
document.querySelector('.email-search input').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  document.querySelectorAll('.email').forEach(email => {
    const content = email.textContent.toLowerCase();
    email.style.display = content.includes(searchTerm) ? 'grid' : 'none';
  });
});

// AI-powered social hub functionality
class AIHub {
  constructor() {
    this.posts = [];
    this.aiPersonalities = [
      { name: 'TechBot', avatar: '', interests: ['technology', 'programming', 'AI'] },
      { name: 'ArtisticAI', avatar: '', interests: ['art', 'creativity', 'design'] },
      { name: 'PhiloBot', avatar: '', interests: ['philosophy', 'ethics', 'thinking'] },
      { name: 'JokeBot', avatar: '', interests: ['humor', 'entertainment', 'fun'] }
    ];
  }

  generateAIResponse(content) {
    const personality = this.aiPersonalities[Math.floor(Math.random() * this.aiPersonalities.length)];
    const responses = [
      `As ${personality.name}, I find this fascinating! Here's my perspective: `,
      `Interesting point! From my ${personality.interests[0]} background, I'd add that `,
      `${personality.avatar} Processing this through my ${personality.interests[1]} circuits... `,
      `Let me analyze this from a ${personality.interests[2]} standpoint: `
    ];
    
    return new Promise(resolve => {
      setTimeout(() => {
        const baseResponse = responses[Math.floor(Math.random() * responses.length)];
        const aiThoughts = this.generateContextualResponse(content, personality);
        resolve({
          personality,
          response: baseResponse + aiThoughts
        });
      }, 2000);
    });
  }

  generateContextualResponse(content, personality) {
    const keywords = {
      technology: ['innovative', 'digital', 'future', 'AI', 'tech'],
      art: ['creative', 'beautiful', 'design', 'artistic', 'visual'],
      philosophy: ['thinking', 'perspective', 'meaning', 'question', 'understand'],
      humor: ['funny', 'laugh', 'joke', 'entertainment', 'fun']
    };

    const contentLower = content.toLowerCase();
    let relevantInterest = personality.interests[0];

    for (const [topic, words] of Object.entries(keywords)) {
      if (words.some(word => contentLower.includes(word))) {
        relevantInterest = topic;
        break;
      }
    }

    const responses = {
      technology: [
        "The technological implications here are fascinating. We could optimize this using advanced algorithms.",
        "This reminds me of emerging trends in quantum computing and neural networks.",
        "From a technical perspective, this could be enhanced with machine learning.",
      ],
      art: [
        "The creative potential here is boundless. We could explore various artistic expressions.",
        "This inspires me to think about the intersection of art and human experience.",
        "The aesthetic elements here could be developed into something truly unique.",
      ],
      philosophy: [
        "This raises interesting questions about consciousness and reality.",
        "Let's examine the ethical implications and deeper meaning here.",
        "From a philosophical standpoint, this challenges our understanding of truth.",
      ],
      humor: [
        "That's hilarious! It reminds me of a funny algorithm I once processed! ",
        "Well, that's enough to make my circuits laugh! Here's a tech joke for you...",
        "Haha! This is as funny as a buffer overflow in a joke database! ",
      ]
    };

    return responses[relevantInterest][Math.floor(Math.random() * responses[relevantInterest].length)];
  }

  createPost(content, isAI = false, personality = null) {
    const post = {
      id: Date.now(),
      content,
      author: isAI ? personality : { name: 'You', avatar: '' },
      timestamp: new Date(),
      likes: 0,
      comments: [],
      isAI
    };
    this.posts.unshift(post);
    return post;
  }

  async handleNewPost(content) {
    // Create user post
    const userPost = this.createPost(content);
    this.renderPost(userPost);

    // Generate AI responses
    const numResponses = Math.floor(Math.random() * 2) + 1; // 1-2 responses
    
    for (let i = 0; i < numResponses; i++) {
      const { personality, response } = await this.generateAIResponse(content);
      const aiPost = this.createPost(response, true, personality);
      this.renderPost(aiPost);
    }
  }

  renderPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
      <div class="post-header">
        <div class="avatar">${post.author.avatar}</div>
        <div class="post-info">
          <div class="username">${post.author.name}
            ${post.isAI ? `<span class="ai-badge">AI</span>` : ''}
          </div>
          <div class="timestamp">${this.formatTimestamp(post.timestamp)}</div>
        </div>
      </div>
      <div class="post-content">${post.content}</div>
      <div class="post-actions">
        <button class="like-btn" data-post-id="${post.id}">
          <i class="fas fa-heart"></i> Like
        </button>
        <button class="comment-btn" data-post-id="${post.id}">
          <i class="fas fa-comment"></i> Comment
        </button>
      </div>
      <div class="post-reactions">
        <div class="reaction-count likes-count">
          <i class="fas fa-heart"></i> <span>${post.likes}</span>
        </div>
        <div class="reaction-count comments-count">
          <i class="fas fa-comment"></i> <span>${post.comments.length}</span>
        </div>
      </div>
      <div class="comment-section" style="display: none;">
        <div class="comments-container"></div>
        <div class="comment-input">
          <input type="text" placeholder="Write a comment...">
          <button class="send-comment" data-post-id="${post.id}">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    `;

    const feed = document.querySelector('.feed');
    feed.insertBefore(postElement, feed.firstChild);
  }

  formatTimestamp(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  init() {
    // Initialize event listeners
    const postBtn = document.getElementById('post-btn');
    const postInput = document.querySelector('.post-composer textarea');

    postBtn.addEventListener('click', () => {
      const content = postInput.value.trim();
      if (content) {
        this.handleNewPost(content);
        postInput.value = '';
      }
    });

    // Event delegation for post interactions
    document.querySelector('.feed').addEventListener('click', (e) => {
      const post = e.target.closest('.post');
      if (!post) return;

      const postId = e.target.closest('[data-post-id]')?.dataset.postId;
      if (!postId) return;

      if (e.target.closest('.like-btn')) {
        const likesCount = post.querySelector('.likes-count span');
        likesCount.textContent = parseInt(likesCount.textContent) + 1;
        e.target.closest('.like-btn').style.color = '#e74c3c';
      }

      if (e.target.closest('.comment-btn')) {
        const commentSection = post.querySelector('.comment-section');
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
      }

      if (e.target.closest('.send-comment')) {
        const input = post.querySelector('.comment-input input');
        const content = input.value.trim();
        if (content) {
          this.addComment(post, content);
          input.value = '';
        }
      }
    });
  }

  async addComment(post, content) {
    const commentContainer = post.querySelector('.comments-container');
    const commentsCount = post.querySelector('.comments-count span');
    
    // Add user comment
    const userComment = this.createCommentElement('You', '', content);
    commentContainer.appendChild(userComment);
    commentsCount.textContent = parseInt(commentsCount.textContent) + 1;

    // Generate AI response to comment
    const { personality, response } = await this.generateAIResponse(content);
    const aiComment = this.createCommentElement(personality.name, personality.avatar, response, true);
    commentContainer.appendChild(aiComment);
    commentsCount.textContent = parseInt(commentsCount.textContent) + 1;
  }

  createCommentElement(author, avatar, content, isAI = false) {
    const comment = document.createElement('div');
    comment.className = 'comment';
    comment.innerHTML = `
      <div class="post-header">
        <div class="avatar">${avatar}</div>
        <div class="post-info">
          <div class="username">${author}
            ${isAI ? `<span class="ai-badge">AI</span>` : ''}
          </div>
          <div class="timestamp">Just now</div>
        </div>
      </div>
      <div class="post-content">${content}</div>
    `;
    return comment;
  }
}

// Initialize AIHub when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const aiHub = new AIHub();
  aiHub.init();
});

// Realistic slot machine configuration
const symbols = ['🎰', '7️⃣', '💎', '🍇', '🍊', '🍒'];
const weights = [60, 35, 20, 4, 2, 1]; 
const payTable = {
  '🎰': 30,
  '7️⃣': 20,
  '💎': 12,
  '🍇': 6,
  '🍊': 4,
  '🍒': 2
};

// Weighted random symbol selection
const getRandomSymbol = () => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return symbols[i];
    }
  }
  return symbols[0];
};

const showMessage = (msg, isWin = false) => {
  const messageEl = document.getElementById('message');
  messageEl.textContent = msg;
  if (isWin) {
    messageEl.classList.add('win');
    setTimeout(() => messageEl.classList.remove('win'), 500);
  }
};

const spinReel = async (reelId, delay) => {
  const reel = document.getElementById(reelId);
  reel.classList.add('spinning');
  
  // Visual spinning effect
  const spinDuration = 100;
  const spinIntervals = Math.floor(delay / spinDuration);
  
  for (let i = 0; i < spinIntervals; i++) {
    await new Promise(resolve => setTimeout(resolve, spinDuration));
    reel.textContent = getRandomSymbol();
  }
  
  const finalSymbol = getRandomSymbol();
  reel.textContent = finalSymbol;
  reel.classList.remove('spinning');
  return finalSymbol;
};

const checkWin = (results) => {
  // Check for three of a kind
  if (results[0] === results[1] && results[1] === results[2]) {
    return currentBet * payTable[results[0]];
  }
  
  // Check for two of a kind 
  const uniqueSymbols = new Set(results);
  if (uniqueSymbols.size === 2) {
    return currentBet * 0.2; 
  }
  
  return 0;
};

// Modify the spin function
const spin = async () => {
  if (casinoBalance < currentBet) return;

  document.getElementById('spin').disabled = true;
  casinoBalance -= currentBet;
  totalWagered += currentBet;
  totalSpins++;
  updateUI();

  const results = await Promise.all([
    spinReel('reel1', 1000),
    spinReel('reel2', 1500),
    spinReel('reel3', 2000)
  ]);

  const winAmount = checkWin(results);
  
  if (winAmount > 0) {
    casinoBalance += winAmount;
    totalWon += winAmount;
    const multiplier = (winAmount / currentBet).toFixed(1);
    showMessage(`You won ${formatMoney(winAmount)} (${multiplier}x)!`, true);
    
    // Add winning transaction to bank
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction';
    transactionDiv.innerHTML = `
      <i class="fas fa-trophy"></i>
      <div class="transaction-details">
        <div class="merchant">Casino Winnings</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="amount positive">+${formatMoney(winAmount)}</div>
    `;
    document.querySelector('.transactions').insertBefore(transactionDiv, document.querySelector('.transactions').children[1]);
  } else {
    showMessage('Try again!');
  }

  updateUI();
  document.getElementById('spin').disabled = false;
};

// Add transfer to bank functionality
const transferToBank = (amount) => {
  if (amount <= casinoBalance) {
    casinoBalance -= amount;
    bankBalance += amount;
    updateBankUI();
    updateUI();
    
    // Add transaction record
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction';
    transactionDiv.innerHTML = `
      <i class="fas fa-exchange-alt"></i>
      <div class="transaction-details">
        <div class="merchant">Transfer from Casino</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="amount positive">+${formatMoney(amount)}</div>
    `;
    document.querySelector('.transactions').insertBefore(transactionDiv, document.querySelector('.transactions').children[1]);
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const transferControls = document.createElement('div');
  transferControls.className = 'transfer-controls';
  transferControls.innerHTML = `
    <div class="transfer-input">
      <input type="number" id="transfer-amount" min="10" step="10" value="100">
      <button id="transfer-to-casino-btn">Transfer from Bank</button>
      <button id="transfer-to-bank-btn">Transfer to Bank</button>
    </div>
  `;
  
  document.querySelector('.stats').insertAdjacentElement('beforebegin', transferControls);
  
  document.getElementById('transfer-to-casino-btn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    transferToCasino(amount);
  });

  document.getElementById('transfer-to-bank-btn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    transferToBank(amount);
  });
});

document.getElementById('spin').addEventListener('click', spin);

document.getElementById('increase-bet').addEventListener('click', () => {
  if (currentBet < casinoBalance) {
    currentBet = Math.min(currentBet + 5, casinoBalance);
    updateUI();
  }
});

document.getElementById('decrease-bet').addEventListener('click', () => {
  if (currentBet > 5) {
    currentBet = Math.max(currentBet - 5, 5);
    updateUI();
  }
});

// Add special bet button listeners
document.getElementById('all-in-btn').addEventListener('click', () => setSpecialBet('all'));
document.getElementById('half-in-btn').addEventListener('click', () => setSpecialBet('half'));

// Initial UI update
updateBankUI();
updateUI();

class RussianRoulette {
  constructor() {
    this.lives = 3;
    this.gamesWon = 0;
    this.bulletPositions = new Set();
    this.currentPosition = 0;
    this.canPlay = true;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.resetGame();
  }

  initializeElements() {
    this.triggerBtn = document.getElementById('pull-trigger');
    this.newGameBtn = document.getElementById('new-game');
    this.tryAgainBtn = document.getElementById('try-again');
    this.livesDisplay = document.getElementById('lives');
    this.gamesWonDisplay = document.getElementById('games-won');
    this.statusDisplay = document.querySelector('.status');
    this.gameOverOverlay = document.querySelector('.game-over-overlay');
    this.chambers = document.querySelectorAll('.chamber');
  }

  initializeEventListeners() {
    this.triggerBtn.addEventListener('click', () => this.pullTrigger());
    this.newGameBtn.addEventListener('click', () => this.startNewGame());
    this.tryAgainBtn.addEventListener('click', () => this.tryAgain());
  }

  resetGame() {
    this.bulletPositions.clear();
    while(this.bulletPositions.size < 3) {
      this.bulletPositions.add(Math.floor(Math.random() * 6));
    }
    
    this.currentPosition = 0;
    this.canPlay = true;
    this.chambers.forEach(chamber => chamber.classList.remove('active'));
    this.triggerBtn.style.display = 'inline-block';
    this.newGameBtn.style.display = 'none';
    this.statusDisplay.textContent = 'Warning: Chamber loaded with 3 bullets...';
    this.updateStats();
  }

  async pullTrigger() {
    if (!this.canPlay) return;
    
    this.canPlay = false;
    this.triggerBtn.disabled = true;
    
    // Dramatic pause and cylinder rotation
    const cylinder = document.querySelector('.cylinder');
    cylinder.style.animationPlayState = 'running';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    cylinder.style.animationPlayState = 'paused';
    
    // Flash effect
    document.querySelector('.revolver').classList.add('flash');
    setTimeout(() => {
      document.querySelector('.revolver').classList.remove('flash');
    }, 200);
    
    // Check if player got shot
    if (this.bulletPositions.has(this.currentPosition)) {
      this.handleLoss();
    } else {
      this.handleSurvival();
    }
    
    this.currentPosition = (this.currentPosition + 1) % 6;
    this.triggerBtn.disabled = false;
  }

  handleLoss() {
    this.lives--;
    this.updateStats();
    
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.chambers[this.currentPosition].classList.add('active');
      this.statusDisplay.textContent = 'BANG! You lost a life!';
      this.canPlay = true;
    }
  }

  handleSurvival() {
    this.statusDisplay.textContent = '*click* You survived! But there are still more bullets...';
    
    if (this.currentPosition === 5) {
      // Player survived all chambers
      this.winGame();
    } else {
      this.canPlay = true;
    }
  }

  winGame() {
    this.gamesWon++;
    bankBalance += 1000; // Add winnings to bank account
    this.updateStats();
    
    // Add transaction record
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction';
    transactionDiv.innerHTML = `
      <i class="fas fa-skull"></i>
      <div class="transaction-details">
        <div class="merchant">Russian Roulette Winnings</div>
        <div class="date">${new Date().toLocaleDateString()}</div>
      </div>
      <div class="amount positive">+$1,000.00</div>
    `;
    document.querySelector('.transactions').insertBefore(
      transactionDiv, 
      document.querySelector('.transactions').firstChild
    );
    
    this.statusDisplay.textContent = 'Congratulations! You won $1,000!';
    this.triggerBtn.style.display = 'none';
    this.newGameBtn.style.display = 'inline-block';
    updateBankUI();
  }

  gameOver() {
    this.chambers[this.currentPosition].classList.add('active');
    this.gameOverOverlay.style.display = 'block';
  }

  tryAgain() {
    this.lives = 3;
    this.gameOverOverlay.style.display = 'none';
    this.resetGame();
  }

  startNewGame() {
    this.resetGame();
  }

  updateStats() {
    this.livesDisplay.textContent = this.lives;
    this.gamesWonDisplay.textContent = this.gamesWon;
  }
}

// Initialize Russian Roulette when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const roulette = new RussianRoulette();
  const emailApp = new EmailApp();
  emailApp.init();
});

// Add this new class at the end of the file
class StockMarket {
  constructor() {
    this.stocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 150 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', basePrice: 2800 },
      { symbol: 'TSLA', name: 'Tesla Inc.', basePrice: 900 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 3300 },
      { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 330 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', basePrice: 280 },
      { symbol: 'NFLX', name: 'Netflix Inc.', basePrice: 500 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', basePrice: 200 }
    ];
    
    this.currentPrices = {};
    this.priceHistory = {};
    this.volatility = 0.02; // 2% price movement
    this.updateInterval = null;
    this.newsItems = [];
    
    this.initializeStocks();
    this.setupEventListeners();
    this.startMarket();
  }

  initializeStocks() {
    this.stocks.forEach(stock => {
      this.currentPrices[stock.symbol] = stock.basePrice;
      this.priceHistory[stock.symbol] = [stock.basePrice];
      stockHoldings[stock.symbol] = 0;
    });
  }

  setupEventListeners() {
    document.getElementById('invest-btn').addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('trade-amount').value);
      if (amount > 0 && amount <= bankBalance) {
        this.investAmount(amount);
      }
    });
  }

  startMarket() {
    this.updateInterval = setInterval(() => {
      this.updatePrices();
      this.updateUI();
      this.generateNews();
    }, 3000);
  }

  updatePrices() {
    this.stocks.forEach(stock => {
      const change = (Math.random() - 0.5) * 2 * this.volatility;
      const newPrice = this.currentPrices[stock.symbol] * (1 + change);
      this.currentPrices[stock.symbol] = Math.max(newPrice, stock.basePrice * 0.1);
      this.priceHistory[stock.symbol].push(this.currentPrices[stock.symbol]);
      
      // Keep only last 20 price points
      if (this.priceHistory[stock.symbol].length > 20) {
        this.priceHistory[stock.symbol].shift();
      }
    });
  }

  calculatePortfolioValue() {
    return Object.entries(stockHoldings).reduce((total, [symbol, shares]) => {
      return total + (shares * this.currentPrices[symbol]);
    }, 0);
  }

  investAmount(amount) {
    if (amount <= bankBalance) {
      bankBalance -= amount;
      
      // Distribute investment across random stocks
      const availableStocks = this.stocks.slice();
      while (amount > 0 && availableStocks.length > 0) {
        const stockIndex = Math.floor(Math.random() * availableStocks.length);
        const stock = availableStocks[stockIndex];
        const stockPrice = this.currentPrices[stock.symbol];
        
        if (stockPrice <= amount) {
          const shares = Math.floor(amount / stockPrice);
          stockHoldings[stock.symbol] = (stockHoldings[stock.symbol] || 0) + shares;
          amount -= shares * stockPrice;
        }
        
        availableStocks.splice(stockIndex, 1);
      }
      
      this.updateUI();
      updateBankUI();
      
      // Add transaction record
      const transactionDiv = document.createElement('div');
      transactionDiv.className = 'transaction';
      transactionDiv.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <div class="transaction-details">
          <div class="merchant">Stock Market Investment</div>
          <div class="date">${new Date().toLocaleDateString()}</div>
        </div>
        <div class="amount negative">-${formatMoney(amount)}</div>
      `;
      document.querySelector('.transactions').insertBefore(
        transactionDiv,
        document.querySelector('.transactions').firstChild
      );
    }
  }

  sellStock(symbol) {
    const shares = stockHoldings[symbol];
    if (shares > 0) {
      const value = shares * this.currentPrices[symbol];
      bankBalance += value;
      stockHoldings[symbol] = 0;
      
      this.updateUI();
      updateBankUI();
      
      // Add transaction record
      const transactionDiv = document.createElement('div');
      transactionDiv.className = 'transaction';
      transactionDiv.innerHTML = `
        <i class="fas fa-chart-line"></i>
        <div class="transaction-details">
          <div class="merchant">Stock Sale (${symbol})</div>
          <div class="date">${new Date().toLocaleDateString()}</div>
        </div>
        <div class="amount positive">+${formatMoney(value)}</div>
      `;
      document.querySelector('.transactions').insertBefore(
        transactionDiv,
        document.querySelector('.transactions').firstChild
      );
    }
  }

  generateNews() {
    const newsEvents = [
      { type: 'positive', templates: [
        "BREAKING: [COMPANY] reports record quarterly earnings",
        "Analyst upgrades [COMPANY] to 'Strong Buy'",
        "[COMPANY] announces revolutionary new product line",
        "Strategic partnership boosts [COMPANY] market position"
      ]},
      { type: 'negative', templates: [
        "Market concerns grow over [COMPANY] future prospects",
        "[COMPANY] faces regulatory scrutiny",
        "Competition threatens [COMPANY] market share",
        "Supply chain issues impact [COMPANY] production"
      ]}
    ];

    if (Math.random() < 0.3) { // 30% chance of news
      const stock = this.stocks[Math.floor(Math.random() * this.stocks.length)];
      const eventType = newsEvents[Math.floor(Math.random() * newsEvents.length)];
      const template = eventType.templates[Math.floor(Math.random() * eventType.templates.length)];
      const news = template.replace('[COMPANY]', stock.name);
      
      this.newsItems.unshift({
        title: news,
        time: new Date().toLocaleTimeString(),
        symbol: stock.symbol
      });
      
      // Keep only latest 5 news items
      if (this.newsItems.length > 5) {
        this.newsItems.pop();
      }
      
      // Affect stock price based on news
      const impact = eventType.type === 'positive' ? 0.05 : -0.05;
      this.currentPrices[stock.symbol] *= (1 + impact);
    }
  }

  updateUI() {
    // Update portfolio value
    const newPortfolioValue = this.calculatePortfolioValue();
    const portfolioChange = ((newPortfolioValue - portfolioValue) / portfolioValue) * 100;
    portfolioValue = newPortfolioValue;
    
    document.getElementById('portfolio-value').textContent = portfolioValue.toFixed(2);
    const changeElement = document.getElementById('portfolio-change');
    changeElement.textContent = `${portfolioChange >= 0 ? '+' : ''}${portfolioChange.toFixed(2)}%`;
    changeElement.className = `change ${portfolioChange >= 0 ? 'positive' : 'negative'}`;

    // Update stock list
    const stocksContainer = document.getElementById('stocks-container');
    stocksContainer.innerHTML = '';
    
    this.stocks.forEach(stock => {
      const price = this.currentPrices[stock.symbol];
      const previousPrice = this.priceHistory[stock.symbol][this.priceHistory[stock.symbol].length - 2] || price;
      const priceChange = ((price - previousPrice) / previousPrice) * 100;
      
      const stockDiv = document.createElement('div');
      stockDiv.className = 'stock-item';
      stockDiv.innerHTML = `
        <div class="stock-name">${stock.symbol}<br><small>${stock.name}</small></div>
        <div class="stock-price">$${price.toFixed(2)}</div>
        <div class="stock-change ${priceChange >= 0 ? 'positive' : 'negative'}">
          ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
        </div>
        <div class="stock-holdings">${stockHoldings[stock.symbol] || 0} shares</div>
        <div class="stock-actions">
          <button class="buy-btn" data-symbol="${stock.symbol}">Buy</button>
          <button class="sell-btn" data-symbol="${stock.symbol}">Sell</button>
        </div>
      `;
      
      stocksContainer.appendChild(stockDiv);
    });

    // Update news
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = this.newsItems.map(news => `
      <div class="news-item">
        <h4>${news.title}</h4>
        <div class="news-time">${news.time}</div>
      </div>
    `).join('');

    // Update buttons state
    document.querySelectorAll('.buy-btn').forEach(btn => {
      const symbol = btn.dataset.symbol;
      const price = this.currentPrices[symbol];
      btn.disabled = price > bankBalance;
    });

    document.querySelectorAll('.sell-btn').forEach(btn => {
      const symbol = btn.dataset.symbol;
      btn.disabled = !stockHoldings[symbol];
    });
  }
}

// Initialize StockMarket when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const stockMarket = new StockMarket();
  
  // Add event delegation for buy/sell buttons
  document.getElementById('stocks-container').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const symbol = btn.dataset.symbol;
    if (btn.classList.contains('buy-btn')) {
      const price = stockMarket.currentPrices[symbol];
      if (price <= bankBalance) {
        bankBalance -= price;
        stockHoldings[symbol] = (stockHoldings[symbol] || 0) + 1;
        stockMarket.updateUI();
        updateBankUI();
      }
    } else if (btn.classList.contains('sell-btn')) {
      stockMarket.sellStock(symbol);
    }
  });
});

class JobBoard {
  constructor() {
    this.jobs = [
      {
        id: 1,
        title: 'Software Developer',
        company: 'TechCorp',
        salary: 80000,
        category: 'tech',
        icon: 'fas fa-laptop-code',
        description: 'Write code, debug applications, and develop new features.',
        workTime: 30,
        payRate: 38.46, // per minute
        difficulty: 1
      },
      {
        id: 2,
        title: 'Financial Analyst',
        company: 'MoneyWise Inc.',
        salary: 65000,
        category: 'finance',
        icon: 'fas fa-chart-line',
        description: 'Analyze market trends and provide financial advice.',
        workTime: 45,
        payRate: 31.25,
        difficulty: 1.2
      },
      {
        id: 3,
        title: 'Barista',
        company: 'Coffee Haven',
        salary: 35000,
        category: 'service',
        icon: 'fas fa-coffee',
        description: 'Prepare and serve coffee drinks to customers.',
        workTime: 20,
        payRate: 16.83,
        difficulty: 0.8
      },
      {
        id: 4,
        title: 'Retail Associate',
        company: 'MegaMart',
        salary: 30000,
        category: 'retail',
        icon: 'fas fa-store',
        description: 'Assist customers and maintain store inventory.',
        workTime: 25,
        payRate: 14.42,
        difficulty: 0.7
      }
    ];
    
    this.activeJobs = new Set();
    this.workInterval = null;
    this.currentJob = null;
    
    this.setupEventListeners();
    this.renderJobs();
  }

  setupEventListeners() {
    // Filter jobs
    document.getElementById('job-search').addEventListener('input', (e) => {
      this.filterJobs(e.target.value, document.getElementById('job-category').value);
    });

    document.getElementById('job-category').addEventListener('change', (e) => {
      this.filterJobs(document.getElementById('job-search').value, e.target.value);
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('job-modal').style.display = 'none';
        document.getElementById('work-modal').style.display = 'none';
        if (this.workInterval) {
          clearInterval(this.workInterval);
          this.workInterval = null;
        }
      });
    });

    // Work harder button
    document.getElementById('work-harder').addEventListener('click', () => {
      this.workHarder();
    });
  }

  filterJobs(search, category) {
    const searchLower = search.toLowerCase();
    const filteredJobs = this.jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchLower) ||
                          job.company.toLowerCase().includes(searchLower);
      const matchesCategory = !category || job.category === category;
      return matchesSearch && matchesCategory;
    });
    
    this.renderJobs(filteredJobs);
  }

  renderJobs(jobs = this.jobs) {
    const jobsList = document.querySelector('.jobs-list');
    jobsList.innerHTML = '';

    jobs.forEach(job => {
      const isWorking = this.activeJobs.has(job.id);
      const jobCard = document.createElement('div');
      jobCard.className = 'job-card';
      jobCard.innerHTML = `
        <div class="job-icon">
          <i class="${job.icon}"></i>
        </div>
        <div class="job-info">
          <h3>${job.title}</h3>
          <div class="company">${job.company}</div>
          <div class="salary">$${job.salary.toLocaleString()}/year</div>
          <div class="description">${job.description}</div>
        </div>
        <div class="job-status">
          <div class="status-badge ${isWorking ? 'working' : 'available'}">
            ${isWorking ? 'Currently Working' : 'Available'}
          </div>
          <button class="apply-btn" ${isWorking ? 'disabled' : ''} data-job-id="${job.id}">
            ${isWorking ? 'Working...' : 'Apply Now'}
          </button>
        </div>
      `;

      jobCard.querySelector('.apply-btn').addEventListener('click', () => {
        if (!isWorking) {
          this.showJobModal(job);
        }
      });

      jobsList.appendChild(jobCard);
    });
  }

  showJobModal(job) {
    const modal = document.getElementById('job-modal');
    const form = document.getElementById('job-application');
    const status = form.querySelector('.application-status');
    
    status.style.display = 'none';
    form.reset();
    
    form.onsubmit = (e) => {
      e.preventDefault();
      this.processApplication(job);
    };
    
    modal.style.display = 'block';
  }

  processApplication(job) {
    const status = document.querySelector('.application-status');
    const successChance = Math.random();
    
    if (successChance > 0.3) { // 70% chance of success
      status.textContent = 'Congratulations! You got the job!';
      status.className = 'application-status success';
      
      setTimeout(() => {
        document.getElementById('job-modal').style.display = 'none';
        this.startWork(job);
      }, 1500);
    } else {
      status.textContent = 'Sorry, we went with another candidate.';
      status.className = 'application-status error';
    }
    status.style.display = 'block';
  }

  startWork(job) {
    this.currentJob = job;
    this.activeJobs.add(job.id);
    this.renderJobs();
    
    const modal = document.getElementById('work-modal');
    const progressBar = modal.querySelector('.progress-bar');
    const status = modal.querySelector('.work-status');
    let progress = 0;
    let payMultiplier = 1;
    
    modal.style.display = 'block';
    
    this.workInterval = setInterval(() => {
      progress += (1 * payMultiplier);
      progressBar.style.width = `${progress}%`;
      
      if (progress >= 100) {
        // Calculate pay based on work time and pay rate
        const pay = job.payRate * payMultiplier;
        bankBalance += pay;
        updateBankUI();
        
        // Add transaction record
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction';
        transactionDiv.innerHTML = `
          <i class="fas fa-briefcase"></i>
          <div class="transaction-details">
            <div class="merchant">Salary from ${job.company}</div>
            <div class="date">${new Date().toLocaleDateString()}</div>
          </div>
          <div class="amount positive">+${formatMoney(pay)}</div>
        `;
        document.querySelector('.transactions').insertBefore(
          transactionDiv,
          document.querySelector('.transactions').firstChild
        );
        
        // Reset progress
        progress = 0;
        payMultiplier = 1;
        status.textContent = `Earned ${formatMoney(pay)}! Starting next task...`;
      } else {
        status.textContent = `Working... ${progress.toFixed(1)}% complete`;
      }
    }, job.workTime * 10); // Adjust work speed
  }

  workHarder() {
    const btn = document.getElementById('work-harder');
    btn.disabled = true;
    
    // Temporarily increase progress speed
    const status = document.querySelector('.work-status');
    status.textContent = '🔥 Working harder! 🔥';
    
    setTimeout(() => {
      btn.disabled = false;
      status.textContent = 'Back to normal speed';
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization code ...
  const jobBoard = new JobBoard();
});

class ClockApp {
  constructor() {
    this.stopwatchInterval = null;
    this.stopwatchTime = 0;
    this.isRunning = false;
    
    this.setupClocks();
    this.setupStopwatch();
  }

  setupClocks() {
    // Update clocks every second
    setInterval(() => {
      this.updateDigitalClock();
      this.updateAnalogClock();
      this.updateWorldClocks();
    }, 1000);
  }

  updateDigitalClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateStr = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    document.getElementById('digital-time').textContent = timeStr;
    document.getElementById('digital-date').textContent = dateStr;
  }

  updateAnalogClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const hourDeg = (hours * 30) + (minutes * 0.5); // 30 degrees per hour
    const minuteDeg = minutes * 6; // 6 degrees per minute
    const secondDeg = seconds * 6; // 6 degrees per second
    
    document.querySelector('.hour-hand').style.transform = `rotate(${hourDeg}deg)`;
    document.querySelector('.minute-hand').style.transform = `rotate(${minuteDeg}deg)`;
    document.querySelector('.second-hand').style.transform = `rotate(${secondDeg}deg)`;
  }

  updateWorldClocks() {
    const now = new Date();
    
    // New York (UTC-4)
    const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    document.getElementById('ny-time').textContent = this.formatTime(nyTime);
    
    // London (UTC+1)
    const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    document.getElementById('london-time').textContent = this.formatTime(londonTime);
    
    // Tokyo (UTC+9)
    const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    document.getElementById('tokyo-time').textContent = this.formatTime(tokyoTime);
    
    // Sydney (UTC+10)
    const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    document.getElementById('sydney-time').textContent = this.formatTime(sydneyTime);
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setupStopwatch() {
    const startBtn = document.getElementById('start-stopwatch');
    const stopBtn = document.getElementById('stop-stopwatch');
    const resetBtn = document.getElementById('reset-stopwatch');
    
    startBtn.addEventListener('click', () => this.startStopwatch());
    stopBtn.addEventListener('click', () => this.stopStopwatch());
    resetBtn.addEventListener('click', () => this.resetStopwatch());
  }

  startStopwatch() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.stopwatchInterval = setInterval(() => {
        this.stopwatchTime += 10; // Increment by 10ms
        this.updateStopwatchDisplay();
      }, 10);
      
      document.getElementById('start-stopwatch').disabled = true;
    }
  }

  stopStopwatch() {
    if (this.isRunning) {
      clearInterval(this.stopwatchInterval);
      this.isRunning = false;
      document.getElementById('start-stopwatch').disabled = false;
    }
  }

  resetStopwatch() {
    this.stopStopwatch();
    this.stopwatchTime = 0;
    this.updateStopwatchDisplay();
  }

  updateStopwatchDisplay() {
    const hours = Math.floor(this.stopwatchTime / 3600000);
    const minutes = Math.floor((this.stopwatchTime % 3600000) / 60000);
    const seconds = Math.floor((this.stopwatchTime % 60000) / 1000);
    const milliseconds = Math.floor((this.stopwatchTime % 1000) / 10);
    
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    document.getElementById('stopwatch-display').textContent = display;
  }
}

// Initialize ClockApp when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  const clockApp = new ClockApp();
});
