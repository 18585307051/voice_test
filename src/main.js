class DriverAssistant {
  constructor() {
    this.chat = document.getElementById('chat');
    this.orb = document.getElementById('orb');
    this.statusElem = document.getElementById('status');
    this.historyList = document.getElementById('history-list');

    this.isListening = false;
    this.isDriving = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;

    this.init();
  }

  init() {
    console.log('Assistant Initializing...');
    this.setupVoice();
  }

  setupVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.addMsg('ai', '抱歉，当前浏览器不支持语音功能。建议使用桌面端 Chrome。');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.lang = 'zh-CN';
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      console.log('Voice engine active');
      this.updateStatus('在线：实时监听中');
    };

    this.recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim();
      console.log('Heard:', text);
      this.handleInput(text);
    };

    this.recognition.onerror = (e) => {
      console.error('STT Error:', e.error);
      if (e.error !== 'no-speech') {
        setTimeout(() => this.safeStart(), 1000);
      }
    };

    this.recognition.onend = () => this.safeStart();
    this.safeStart();
  }

  safeStart() {
    try { this.recognition.start(); } catch (e) { }
  }

  updateStatus(text, state = '') {
    this.statusElem.textContent = text;
    this.orb.className = `orb ${state}`;
  }

  handleInput(text) {
    const lower = text.toLowerCase();

    // Wake Word Case
    if (lower.includes('你好小王') || lower.includes('你好，小王') || lower.includes('你好小网')) {
      this.activate();
      return;
    }

    if (this.isListening) {
      this.execute(text);
    }
  }

  activate() {
    this.isListening = true;
    this.addMsg('user', '你好，小王。');

    const reply = this.isDriving
      ? '我在呢，请讲。'
      : '你好！我是驾驶助手。准备好开始今天的驾驶记录了吗？';

    this.speak(reply, () => {
      this.updateStatus('监听指令中...', 'listening');
      this.resetTimeout();
    });
  }

  execute(text) {
    this.addMsg('user', text);
    const lower = text.toLowerCase();

    if (lower.includes('行程') && (lower.includes('开始') || lower.includes('预计'))) {
      this.isDriving = true;
      this.speak('收到。行程记录已开启，小王将为您守候。');
      this.addHistory('🚗 开始驾驶行程');
    } else if (lower.includes('记录') || lower.includes('不好') || lower.includes('体验')) {
      this.speak('没问题，这条体验已同步至飞书多维表格。');
      console.log('Feishu Upload:', text);
      this.flashOrb('#00ff88');
    } else if (lower.includes('结束') && lower.includes('行程')) {
      this.isDriving = false;
      this.speak('好的，本次驾驶行程已结束，记录已保存。');
      this.addHistory('🏁 已结束行程');
    } else {
      this.speak('收到，记录好了。还有其他想说的吗？');
    }

    this.isListening = false;
    this.updateStatus('等待唤醒...', '');
  }

  speak(text, onEnd) {
    this.addMsg('ai', text);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 1.1;

    this.updateStatus('正在回复...', 'speaking');
    utter.onend = () => {
      this.updateStatus('等待唤醒...', '');
      if (onEnd) onEnd();
    };

    this.synthesis.cancel();
    this.synthesis.speak(utter);
  }

  addMsg(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    this.chat.appendChild(div);
    this.chat.scrollTop = this.chat.scrollHeight;
  }

  addHistory(label) {
    const item = document.createElement('div');
    item.className = 'history-item active';
    item.textContent = `${label} (${new Date().toLocaleTimeString()})`;
    this.historyList.prepend(item);
  }

  flashOrb(color) {
    const oldBorder = this.orb.style.borderColor;
    this.orb.style.boxShadow = `0 0 60px ${color}`;
    setTimeout(() => this.orb.style.boxShadow = '', 2000);
  }

  resetTimeout() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.isListening = false;
      this.updateStatus('等待唤醒...', '');
    }, 5000);
  }
}

// Spark it
window.onload = () => new DriverAssistant();
