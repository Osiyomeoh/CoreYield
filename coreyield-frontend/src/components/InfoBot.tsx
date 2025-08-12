import React, { useState, useRef, useEffect } from 'react'

interface InfoBotProps {
  onClose?: () => void
}

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface QuickQuestion {
  id: string
  question: string
  category: string
}

export const InfoBot: React.FC<InfoBotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm CoreYield's AI assistant. I can help you understand yield farming, explain how our protocol works, calculate APY, and answer any questions about DeFi strategies. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickQuestions: QuickQuestion[] = [
    { id: '1', question: 'How does CoreYield work?', category: 'protocol' },
    { id: '2', question: 'What is the difference between APY and APR?', category: 'education' },
    { id: '3', question: 'How do I calculate my yield earnings?', category: 'calculator' },
    { id: '4', question: 'What are the risks of yield farming?', category: 'risk' },
    { id: '5', question: 'How do I get started with CoreYield?', category: 'getting-started' },
    { id: '6', question: 'What are SY tokens?', category: 'protocol' }
  ]

  const botResponses: Record<string, string> = {
    'how does coreyield work': `CoreYield is a yield tokenization protocol that allows you to:

• **Deposit yield-bearing assets** (like stCORE, lstBTC, dualCORE)
• **Receive SY tokens** that represent your future yield
• **Trade or leverage** your yield positions
• **Earn compound interest** automatically

The protocol uses smart contracts to:
- Track your deposited assets
- Calculate accumulated yield in real-time
- Distribute yield proportionally to SY token holders
- Provide instant liquidity for your positions

Think of SY tokens as "yield futures" - you can trade them, use them as collateral, or hold them to collect yield.`,
    
    'what is the difference between apy and apr': `**APR vs APY** - Here's the key difference:

**APR (Annual Percentage Rate):**
• Simple interest rate
• No compounding effect
• Example: 10% APR = $100 becomes $110 after 1 year

**APY (Annual Percentage Yield):**
• Includes compound interest
• Interest earns interest
• Example: 10% APY = $100 becomes $110.47 after 1 year (compounded daily)

**Why it matters:**
• APY is always higher than APR for the same rate
• APY shows your actual earnings potential
• CoreYield displays APY to show true yield potential

**Formula:** APY = (1 + APR/n)^n - 1
Where n = number of compounding periods per year`,
    
    'how do i calculate my yield earnings': `Here's how to calculate your yield earnings:

**Simple Calculation:**
Daily Yield = Principal × APY ÷ 365
Monthly Yield = Principal × APY ÷ 12
Annual Yield = Principal × APY

**Example:**
If you deposit $10,000 at 15% APY:
• Daily: $10,000 × 0.15 ÷ 365 = $4.11
• Monthly: $10,000 × 0.15 ÷ 12 = $125
• Annual: $10,000 × 0.15 = $1,500

**Compound Effect:**
With daily compounding, your actual earnings will be slightly higher due to interest earning interest.

**Use our Calculator:**
Try our built-in calculator tool for precise calculations with different timeframes and compound frequencies!`,
    
    'what are the risks of yield farming': `**Yield Farming Risks** - Important to understand:

**Smart Contract Risk:**
• Bugs or exploits in protocol code
• Mitigation: Use audited protocols like CoreYield

**Impermanent Loss:**
• Loss from providing liquidity to volatile assets
• Mitigation: Choose stable asset pairs

**Market Risk:**
• Asset prices can decrease
• Mitigation: Diversify your portfolio

**Liquidity Risk:**
• Difficulty withdrawing during market stress
• Mitigation: Ensure sufficient liquidity

**APY Volatility:**
• Yield rates can change over time
• Mitigation: Monitor and adjust strategies

**Best Practices:**
• Never invest more than you can afford to lose
• Diversify across multiple protocols
• Start with small amounts
• Monitor your positions regularly`,
    
    'how do i get started with coreyield': `**Getting Started with CoreYield** - Step by step:

**1. Connect Wallet:**
• Use MetaMask or any Web3 wallet
• Ensure you're on Core Testnet2

**2. Get Test Tokens:**
• Use our "Mint Test Tokens" feature
• Get 1,000 tokens of each asset for testing

**3. Approve Tokens:**
• Approve the protocol to use your tokens
• This is a one-time transaction per asset

**4. Deposit & Earn:**
• Choose your asset (stCORE, lstBTC, dualCORE)
• Enter amount and click "Deposit"
• Receive SY tokens representing your yield

**5. Monitor & Claim:**
• Track your accumulated yield
• Claim yield anytime
• Withdraw your principal when needed

**Pro Tips:**
• Start with small amounts to learn
• Use our calculator to estimate earnings
• Check our education section for detailed guides`,
    
    'what are sy tokens': `**SY Tokens (Standardized Yield Tokens)** - Explained:

**What are SY Tokens?**
SY tokens are ERC-20 tokens that represent your yield-bearing position in the CoreYield protocol.

**Key Features:**
• **Yield Representation**: Each SY token represents future yield from your deposited assets
• **Tradeable**: You can trade SY tokens on DEXs or use them as collateral
• **Composable**: Use SY tokens in other DeFi protocols
• **Liquid**: Convert back to underlying assets anytime

**How they work:**
1. Deposit assets → Receive SY tokens
2. SY tokens accumulate yield over time
3. Claim yield or trade SY tokens
4. Burn SY tokens to withdraw underlying assets

**Example:**
• Deposit 100 stCORE → Receive 100 SY-stCORE
• SY tokens earn yield automatically
• Trade SY tokens or claim yield
• Burn SY tokens to get back stCORE + accumulated yield

**Benefits:**
• Instant liquidity for yield positions
• No need to wait for yield to mature
• Can leverage yield positions
• Access to yield without selling underlying assets`
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    
    for (const [key, response] of Object.entries(botResponses)) {
      if (lowerMessage.includes(key)) {
        return response
      }
    }
    
    if (lowerMessage.includes('apy') || lowerMessage.includes('yield')) {
      return botResponses['how do i calculate my yield earnings']
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('safe')) {
      return botResponses['what are the risks of yield farming']
    }
    
    if (lowerMessage.includes('start') || lowerMessage.includes('begin')) {
      return botResponses['how do i get started with coreyield']
    }
    
    if (lowerMessage.includes('sy') || lowerMessage.includes('token')) {
      return botResponses['what are sy tokens']
    }
    
    return `I understand you're asking about "${userMessage}". Let me help you with that!

For specific questions about CoreYield, try asking about:
• How the protocol works
• APY vs APR differences
• Yield calculations
• Risk management
• Getting started
• SY tokens

Or use the quick questions below for instant answers!`
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateBotResponse(content)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
  }

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">CoreYield Info Bot</h2>
              <p className="text-gray-400 text-sm">AI-powered assistance for all your questions</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-400 text-sm">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="p-4 border-t border-gray-700">
          <h4 className="text-white font-medium text-sm mb-3">Quick Questions:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuickQuestion(q.question)}
                className="text-left p-3 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 transition-colors"
              >
                <div className="text-white text-sm font-medium">{q.question}</div>
                <div className="text-gray-400 text-xs mt-1">{q.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask me anything about CoreYield..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 