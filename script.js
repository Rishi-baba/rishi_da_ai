const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

function appendMessage(text, sender = 'user') {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = sender === 'user' ? 'U' : 'R';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  
  // Handle different content types
  if (sender === 'bot' && typeof text === 'string') {
    // Always treat as plain text - preserve line breaks and detect links
    content.innerHTML = text
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  } else {
    content.textContent = text;
  }
  
  msg.appendChild(avatar);
  msg.appendChild(content);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  
  const submitBtn = chatForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳';
  
  appendMessage(text, 'user');
  chatInput.value = '';

  // Send to webhook
  try {
    const response = await fetch('https://rishibaba.app.n8n.cloud/webhook/mychat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    
    let botReply = '';
    if (response.ok) {
      const data = await response.json().catch(() => null);
      console.log('N8N Response:', data); // Debug log
      
      // Handle different response formats from n8n
      if (data) {
        if (data.reply) {
          botReply = data.reply;
        } else if (data.message) {
          botReply = data.message;
        } else if (data.response) {
          botReply = data.response;
        } else if (data.text) {
          botReply = data.text;
        } else if (typeof data === 'string') {
          botReply = data;
        } else {
          // If it's an object but no known field, extract all values as plain text
          const values = Object.values(data).filter(val => val !== null && val !== undefined);
          botReply = values.join(' ');
        }
      } else {
        botReply = 'I received your message but got an empty response.';
      }
    } else {
      console.error('N8N Error:', response.status, response.statusText);
      botReply = `Sorry, I encountered an error (${response.status}). Please try again.`;
    }
    
    if (!botReply) {
      botReply = 'I received your message but got an empty response.';
    }
    
    setTimeout(() => appendMessage(botReply, 'bot'), 600);
  } catch (err) {
    console.error('Network Error:', err);
    setTimeout(() => appendMessage('Network error. Please check your connection.', 'bot'), 600);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '➤';
  }
});

// Auto-resize textarea
chatInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Mouse tracking for cube avoidance
let mouseX = 0;
let mouseY = 0;
let isMouseMoving = false;
let mouseTimeout;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  isMouseMoving = true;
  
  clearTimeout(mouseTimeout);
  mouseTimeout = setTimeout(() => {
    isMouseMoving = false;
  }, 100);
});

// Function to make cubes avoid cursor
function makeCubesAvoidCursor() {
  const cubes = document.querySelectorAll('.floating-cube');
  
  cubes.forEach((cube, index) => {
    const rect = cube.getBoundingClientRect();
    const cubeCenterX = rect.left + rect.width / 2;
    const cubeCenterY = rect.top + rect.height / 2;
    
    const distanceX = mouseX - cubeCenterX;
    const distanceY = mouseY - cubeCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // Avoidance radius
    const avoidRadius = 150;
    
    if (distance < avoidRadius && isMouseMoving) {
      // Calculate avoidance direction
      const angle = Math.atan2(distanceY, distanceX);
      const avoidDistance = avoidRadius - distance;
      
      // Move cube away from cursor
      const moveX = Math.cos(angle) * avoidDistance * 0.5;
      const moveY = Math.sin(angle) * avoidDistance * 0.5;
      
      cube.style.transform = `translate(${moveX}px, ${moveY}px)`;
      cube.style.transition = 'transform 0.3s ease-out';
    } else {
      // Return to original position
      cube.style.transform = 'translate(0px, 0px)';
      cube.style.transition = 'transform 0.5s ease-out';
    }
  });
}

// Run avoidance check every frame
function animateCubes() {
  makeCubesAvoidCursor();
  requestAnimationFrame(animateCubes);
}

// Start the animation loop
animateCubes(); 