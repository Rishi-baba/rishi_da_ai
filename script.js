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
  this.style.height = Math.min(this.scrollHeight, 80) + 'px';
});

// Handle Enter key submission
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

// Cube physics system
class CubePhysics {
  constructor() {
    this.cubes = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseMoving = false;
    this.mouseTimeout = null;
    this.init();
  }

  init() {
    // Initialize cube data with random motion
    const cubeElements = document.querySelectorAll('.floating-cube');
    cubeElements.forEach((cube, index) => {
      this.cubes.push({
        element: cube,
        x: Math.random() * (window.innerWidth - 60),
        y: Math.random() * (window.innerHeight - 60),
        vx: (Math.random() - 0.5) * 2, // Random velocity X
        vy: (Math.random() - 0.5) * 2, // Random velocity Y
        size: 60,
        id: index,
        type: 'cube',
        originalX: 0, // Store original position for return
        originalY: 0,
        randomMotionTimer: 0,
        randomMotionInterval: Math.random() * 3000 + 2000 // Random interval between direction changes
      });
      
      // Store original positions
      this.cubes[index].originalX = this.cubes[index].x;
      this.cubes[index].originalY = this.cubes[index].y;
    });

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.isMouseMoving = true;
      
      clearTimeout(this.mouseTimeout);
      this.mouseTimeout = setTimeout(() => {
        this.isMouseMoving = false;
      }, 100);
    });

    // Start animation loop
    this.animate();
  }

  updateCubePosition(cube) {
    // Random motion timer
    cube.randomMotionTimer += 16; // Assuming 60fps (16ms per frame)
    
    // Change direction randomly
    if (cube.randomMotionTimer > cube.randomMotionInterval) {
      cube.vx = (Math.random() - 0.5) * 3; // Random velocity X
      cube.vy = (Math.random() - 0.5) * 3; // Random velocity Y
      cube.randomMotionTimer = 0;
      cube.randomMotionInterval = Math.random() * 3000 + 2000; // New random interval
    }

    // Update position based on velocity
    cube.x += cube.vx;
    cube.y += cube.vy;

    // Bounce off walls
    if (cube.x <= 0 || cube.x >= window.innerWidth - cube.size) {
      cube.vx = -cube.vx * 0.8; // Bounce with energy loss
      cube.x = Math.max(0, Math.min(cube.x, window.innerWidth - cube.size));
      this.changeCubeColor(cube, '#ff6b35'); // Orange on wall collision
    }

    if (cube.y <= 0 || cube.y >= window.innerHeight - cube.size) {
      cube.vy = -cube.vy * 0.8; // Bounce with energy loss
      cube.y = Math.max(0, Math.min(cube.y, window.innerHeight - cube.size));
      this.changeCubeColor(cube, '#ff6b35'); // Orange on wall collision
    }

    // Enhanced mouse repulsion
    const distanceX = this.mouseX - (cube.x + cube.size / 2);
    const distanceY = this.mouseY - (cube.y + cube.size / 2);
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const avoidRadius = 150; // Repulsion radius

    if (distance < avoidRadius && this.isMouseMoving) {
      const angle = Math.atan2(distanceY, distanceX);
      const avoidDistance = avoidRadius - distance;
      const avoidStrength = 0.15; // Strong repulsion
      
      // Move cube away from cursor
      cube.x += Math.cos(angle) * avoidDistance * avoidStrength;
      cube.y += Math.sin(angle) * avoidDistance * avoidStrength;
      
      // Change color when being repelled
      this.changeCubeColor(cube, '#00ff88'); // Green when avoiding
    }

    // Apply position to DOM
    cube.element.style.left = cube.x + 'px';
    cube.element.style.top = cube.y + 'px';
  }



  changeCubeColor(cube, color) {
    const faces = cube.element.querySelectorAll('.face');
    faces.forEach(face => {
      face.style.background = `linear-gradient(45deg, ${color}, ${this.lightenColor(color, 20)})`;
    });
    
    // Reset color after 1 second
    setTimeout(() => {
      faces.forEach(face => {
        face.style.background = 'linear-gradient(45deg, #808080, #a0a0a0)';
      });
    }, 1000);
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  animate() {
    // Update all cube positions
    this.cubes.forEach(cube => {
      this.updateCubePosition(cube);
    });

    // Continue animation
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize cube physics
const cubePhysics = new CubePhysics(); 